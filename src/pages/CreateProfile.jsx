import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  X, Loader2, ArrowLeft, ArrowRight, CheckCircle2, Mail, Briefcase, Sparkles, Users,
  ShieldCheck, Zap, Lock, ChevronDown, ChevronUp, Eye, EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AiBioGenerator from "@/components/createProfile/AiBioGenerator";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingRoleCards from "@/components/onboarding/OnboardingRoleCards";
import OnboardingTrustSection from "@/components/onboarding/OnboardingTrustSection";
import ExpertisePicker from "@/components/onboarding/ExpertisePicker";
import QualificationSection from "@/components/onboarding/QualificationSection";
import { normalizeExpertise } from "@/lib/expertiseMatching";
import {
  EMPTY_PROFESSIONAL_CREDENTIALS,
  buildMatchingProfilePayload,
  PROFESSIONAL_LEVEL_OPTIONS,
} from "@/lib/professionalProfileModel";
import { advisorUrl } from "@/lib/advisorProfiles";
import { syncMarketplaceAfterProfileSave } from "@/lib/marketplaceIntegrations";
import {
  EMAIL_TRUST_INDICATORS,
  ONBOARDING_HERO,
  getOnboardingSteps,
  getStepOneCtaLabel,
  TOP_SERVICES,
  MORE_SERVICES,
  VISIBILITY_OPTIONS,
  CLIENT_TYPES,
  PROJECT_INTERESTS,
  LEGAL_NAME_HELPER,
  EXPERIENCE_OPTIONS,
  resolvePublicDisplayName,
} from "@/lib/onboardingUX";

const EARLY_ACCESS_KEY = "taxprouk_early_access_signups";

function getStoredSignups() {
  try {
    const signups = JSON.parse(localStorage.getItem(EARLY_ACCESS_KEY) || "[]");
    return Array.isArray(signups) ? signups : [];
  } catch {
    return [];
  }
}

function saveEarlyAccessSignup(signup) {
  const saved = {
    id: `early_${Date.now()}`,
    signup_date: new Date().toISOString(),
    signup_source: "create-profile-early-access",
    ...signup,
  };
  const existing = getStoredSignups();
  const next = [saved, ...existing.filter((item) => item.email?.toLowerCase() !== saved.email.toLowerCase())];
  localStorage.setItem(EARLY_ACCESS_KEY, JSON.stringify(next));
  localStorage.setItem("early_access_signup", JSON.stringify(saved));
  window.dispatchEvent(new CustomEvent("earlyAccessSignup", { detail: saved }));
  return saved;
}

const INITIAL_FORM = {
  email: "",
  user_role: "professional",
  legal_name: "",
  display_name: "",
  years_experience: "",
  availability: "available",
  qualifications: [],
  primary_expertise: [],
  secondary_expertise: [],
  specialisations: [],
  visibility: "private",
  reveal_contact_after_award: true,
  client_type: "",
  project_interests: [],
  bio: "",
  bio_notes: "",
  ...EMPTY_PROFESSIONAL_CREDENTIALS,
};

export default function CreateProfile() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bioGenerating, setBioGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedSignup, setSavedSignup] = useState(null);
  const [showMoreQualifications, setShowMoreQualifications] = useState(false);
  const [showMoreServices, setShowMoreServices] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const steps = useMemo(() => getOnboardingSteps(form.user_role), [form.user_role]);
  const totalSteps = steps.length;
  const isProfessional = form.user_role === "professional";
  const hero = ONBOARDING_HERO[form.user_role] || ONBOARDING_HERO.professional;
  const stepOneCta = getStepOneCtaLabel(form.user_role);
  const isLastStep = step >= totalSteps;

  useEffect(() => {
    setStep((current) => Math.min(current, getOnboardingSteps(form.user_role).length));
  }, [form.user_role]);

  /** Resume / edit — hydrate from saved profile */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("my_profile");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.email) return;
      setForm((prev) => ({
        ...prev,
        email: saved.email || prev.email,
        user_role: saved.user_role || prev.user_role,
        legal_name: saved.legal_name || saved.full_name || prev.legal_name,
        display_name: saved.display_name || prev.display_name,
        years_experience: saved.years_experience || prev.years_experience,
        availability: saved.availability || prev.availability,
        qualifications: saved.qualifications || prev.qualifications,
        primary_expertise: saved.primary_expertise || saved.specialisations || prev.primary_expertise,
        secondary_expertise: saved.secondary_expertise || prev.secondary_expertise,
        visibility: saved.visibility || prev.visibility,
        bio: saved.bio || prev.bio,
        qualification_status: saved.qualification_status || prev.qualification_status,
        qualification_body: saved.qualification_body || prev.qualification_body,
        qualification_year_obtained: saved.qualification_year_obtained || prev.qualification_year_obtained,
        qualification_progress_papers: saved.qualification_progress_papers || prev.qualification_progress_papers,
        qualification_progress_pct: saved.qualification_progress_pct || prev.qualification_progress_pct,
        qualification_expected_completion: saved.qualification_expected_completion || prev.qualification_expected_completion,
        years_experience_numeric: saved.years_experience_numeric || prev.years_experience_numeric,
        previous_employer: saved.previous_employer || prev.previous_employer,
        professional_background: saved.professional_background || prev.professional_background,
        professional_level: saved.professional_level || prev.professional_level,
      }));
    } catch {
      /* ignore */
    }
  }, []);

  const expertise = useMemo(() => normalizeExpertise(form), [form]);

  const aiBioForm = useMemo(() => ({
    ...form,
    full_name: form.legal_name,
    qualifications: form.qualifications,
    qualification_status: form.qualification_status,
    qualification_body: form.qualification_body,
    professional_level: form.professional_level,
    specialisations: expertise.all,
    primary_expertise: expertise.primary,
    secondary_expertise: expertise.secondary,
    title: "UK tax and accounting professional",
    headline: "UK tax and accounting professional",
    location: "UK",
    remote_work: true,
    software_expertise: [],
  }), [form, expertise]);

  const toggleItem = (field, item, maxItems) => {
    setForm((prev) => {
      const has = prev[field].includes(item);
      if (!has && maxItems && prev[field].length >= maxItems) {
        toast.message(`You can select up to ${maxItems} items here.`);
        return prev;
      }
      return {
        ...prev,
        [field]: has ? prev[field].filter((i) => i !== item) : [...prev[field], item],
      };
    });
  };

  const validateStep = (stepNum) => {
    if (stepNum === 1) {
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        toast.error("Please enter a valid email address.");
        return false;
      }
      if (!form.user_role) {
        toast.error("Please choose how you'll use TaxLink.");
        return false;
      }
    }
    if (isProfessional && stepNum === 2) {
      const parts = form.legal_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        toast.error("Please enter your legal name (first and last) for verification.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    if (isProfessional) {
      const parts = form.legal_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        toast.error("Please complete your legal name in step 2.");
        setStep(2);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const publicDisplayName = isProfessional
        ? resolvePublicDisplayName(form.legal_name, form.display_name)
        : "";
      const isPublic = form.visibility === "public";

      const signup = {
        email: form.email.trim(),
        role: form.user_role,
        legal_name: isProfessional ? form.legal_name.trim() : "",
        full_name: isProfessional ? form.legal_name.trim() : "",
        display_name: publicDisplayName,
        profile_public: isPublic,
        visible_to_clients: isPublic,
        visibility: form.visibility,
        reveal_contact_after_award: form.reveal_contact_after_award,
        profile_visibility_setup_pending: false,
        specialties: isProfessional ? expertise.primary : form.project_interests,
        primary_expertise: isProfessional ? expertise.primary : [],
        secondary_expertise: isProfessional ? expertise.secondary : [],
        primary_services: isProfessional ? expertise.primary : [],
        secondary_services: isProfessional ? expertise.secondary : [],
        qualification_status: isProfessional ? form.qualification_status : "",
        qualification_body: isProfessional ? form.qualification_body : "",
        qualification_year_obtained: isProfessional ? form.qualification_year_obtained : "",
        qualification_progress_papers: isProfessional ? form.qualification_progress_papers : "",
        qualification_progress_pct: isProfessional ? form.qualification_progress_pct : "",
        qualification_expected_completion: isProfessional ? form.qualification_expected_completion : "",
        years_experience_numeric: isProfessional ? form.years_experience_numeric : "",
        previous_employer: isProfessional ? form.previous_employer : "",
        professional_background: isProfessional ? form.professional_background : "",
        professional_level: isProfessional ? form.professional_level : "",
        qualifications: isProfessional ? form.qualifications : [],
        matching_profile: isProfessional ? buildMatchingProfilePayload({ ...form, ...expertise }) : null,
        years_experience: isProfessional ? form.years_experience : "",
        availability: isProfessional ? form.availability : "",
        client_type: !isProfessional ? form.client_type : "",
        project_interests: !isProfessional ? form.project_interests : [],
        bio: isProfessional ? form.bio.trim() : "",
        signup_source: "early-access-onboarding",
        onboarding_completed_steps: totalSteps,
      };

      const saved = saveEarlyAccessSignup(signup);
      localStorage.setItem("user_role", signup.role);

      if (!isProfessional) {
        syncMarketplaceAfterProfileSave({ email: signup.email, user_role: signup.role });
      }

      if (isProfessional) {
        const myProfile = {
          id: signup.id || `profile_${Date.now()}`,
          slug: signup.id?.replace(/^early_/, "advisor-") || `advisor-${Date.now()}`,
          user_role: "professional",
          email: signup.email,
          full_name: signup.full_name,
          legal_name: signup.legal_name,
          display_name: signup.display_name,
          profile_public: isPublic,
          visible_to_clients: isPublic,
          visibility: form.visibility,
          reveal_contact_after_award: form.reveal_contact_after_award,
          profile_visibility_setup_pending: false,
          qualifications: signup.qualifications,
          specialisations: signup.specialties,
          primary_expertise: signup.primary_expertise,
          secondary_expertise: signup.secondary_expertise,
          primary_services: signup.primary_services,
          secondary_services: signup.secondary_services,
          qualification_status: signup.qualification_status,
          qualification_body: signup.qualification_body,
          qualification_year_obtained: signup.qualification_year_obtained,
          qualification_progress_papers: signup.qualification_progress_papers,
          qualification_progress_pct: signup.qualification_progress_pct,
          qualification_expected_completion: signup.qualification_expected_completion,
          years_experience_numeric: signup.years_experience_numeric,
          previous_employer: signup.previous_employer,
          professional_background: signup.professional_background,
          professional_level: signup.professional_level,
          matching_profile: signup.matching_profile,
          years_experience: signup.years_experience,
          availability: signup.availability,
          bio: signup.bio,
          headline: signup.qualifications.length
            ? `${signup.qualifications.slice(0, 2).join(" / ")} Tax Professional`
            : "UK Tax & Accounting Professional",
        };
        localStorage.setItem("my_profile", JSON.stringify(myProfile));
        syncMarketplaceAfterProfileSave(myProfile);
      }

      base44.analytics.track({
        eventName: "early_access_signup",
        properties: { role: signup.role, steps: totalSteps },
      });
      setSavedSignup({
        ...saved,
        advisorSlug: isProfessional
          ? JSON.parse(localStorage.getItem("my_profile") || "{}").slug
          : null,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.message || "Could not save your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-10">
          <OnboardingRoleCards
            value={form.user_role}
            onChange={(user_role) => setForm({ ...form, user_role })}
          />

          <div className="space-y-3">
            <Label htmlFor="email">Email address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-9 h-12 rounded-xl"
              />
            </div>
            <ul className="space-y-1.5 pt-1">
              {EMAIL_TRUST_INDICATORS.map((text) => (
                <li key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (!isProfessional) {
      return (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Almost there — tell us a little about your needs so we can match you faster. Everything here is optional.
          </p>
          <div className="space-y-2">
            <Label>Client / company type (optional)</Label>
            <Select value={form.client_type} onValueChange={(v) => setForm({ ...form, client_type: v })}>
              <SelectTrigger><SelectValue placeholder="Choose the closest fit" /></SelectTrigger>
              <SelectContent>
                {CLIENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>What help might you need? (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_INTERESTS.map((interest) => (
                <Badge
                  key={interest}
                  variant={form.project_interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3 select-none"
                  onClick={() => toggleItem("project_interests", interest, 3)}
                >
                  {interest}
                  {form.project_interests.includes(interest) && <X className="h-3 w-3 ml-1.5" />}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Pick up to 3 — refine later when posting a project.</p>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Start with the essentials. You&apos;ll add expertise and visibility in the next steps.
          </p>
          <div className="space-y-2">
            <Label htmlFor="display_name" className="flex items-center gap-2">
              Public display name
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="display_name"
              placeholder="e.g. David W. — how clients see you before award"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal_name" className="flex items-center gap-2">
              Legal / verification name *
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </Label>
            <Input
              id="legal_name"
              placeholder="Full legal name (kept private until project award)"
              value={form.legal_name}
              onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{LEGAL_NAME_HELPER}</p>
          </div>
          <div className="space-y-2">
            <Label>Professional level</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROFESSIONAL_LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      professional_level: form.professional_level === opt.value ? "" : opt.value,
                    })
                  }
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    form.professional_level === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Years of experience (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPERIENCE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setForm({ ...form, years_experience: form.years_experience === option ? "" : option })}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    form.years_experience === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      const visibleServices = showMoreServices
        ? [...TOP_SERVICES, ...MORE_SERVICES]
        : TOP_SERVICES;

      return (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Tell us your qualification path, then choose up to <strong>3 primary</strong> and{" "}
            <strong>10 secondary</strong> expertise areas. Primary matches score highest; secondary at lower weight.
          </p>
          <QualificationSection
            form={form}
            setForm={setForm}
            showMoreQualifications={showMoreQualifications}
            onToggleShowMore={() => setShowMoreQualifications((v) => !v)}
          />
          <ExpertisePicker
            form={form}
            setForm={setForm}
            visibleServices={visibleServices}
            showMoreServices={showMoreServices}
            onToggleShowMore={() => setShowMoreServices((v) => !v)}
            onLimitMessage={(msg) => toast.warning(msg)}
          />
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Choose how you want to appear on TaxLink. You can change this anytime from your profile.
          </p>
          <div className="space-y-3">
            <Label>Profile visibility</Label>
            {VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                  form.visibility === option.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={form.visibility === option.value}
                  onChange={() => setForm({ ...form, visibility: option.value })}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {option.value === "public" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.reveal_contact_after_award}
              onChange={(e) => setForm({ ...form, reveal_contact_after_award: e.target.checked })}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">Reveal contact details only after project award</span>
              <span className="block text-xs text-muted-foreground mt-1">
                Recommended — protects your privacy during bidding while building client trust.
              </span>
            </span>
          </label>
          <div className="space-y-2">
            <Label>Availability (optional)</Label>
            <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available now</SelectItem>
                <SelectItem value="limited">Limited availability</SelectItem>
                <SelectItem value="unavailable">Not taking new clients yet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-5">
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
            <p className="text-sm font-semibold text-violet-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Enhance your professional profile with AI
            </p>
            <p className="text-xs text-violet-800 mt-1">
              Optional final step — generate a polished bio from your qualifications and services. Skip if you prefer to add this later.
            </p>
          </div>
          <div className="flex justify-end">
            <AiBioGenerator
              form={aiBioForm}
              onBioGenerated={(bio) => setForm((current) => ({ ...current, bio }))}
              onLoadingChange={setBioGenerating}
            />
          </div>
          <Textarea
            placeholder="Optional notes for AI, e.g. specialist in landlord tax and CGT"
            value={form.bio_notes}
            onChange={(e) => setForm({ ...form, bio_notes: e.target.value })}
            className="h-20 resize-none"
          />
          <Textarea
            placeholder={bioGenerating ? "Generating your professional bio…" : "Your bio appears here — edit freely or skip for now"}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="h-28 resize-none"
          />
        </div>
      );
    }

    return null;
  };

  if (submitted && savedSignup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to the marketplace</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              You&apos;re in. We&apos;ll notify you when{" "}
              {savedSignup.role === "professional"
                ? "matching UK tax projects go live"
                : "you can post projects and compare quotes"}
              .
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-800">
            <p className="font-semibold">Profile saved</p>
            <p className="mt-1">Email: {savedSignup.email}</p>
            <p>Role: {savedSignup.role === "professional" ? "Tax professional" : "Client"}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {savedSignup.role === "professional" && (
              <Link to={advisorUrl({ slug: savedSignup.advisorSlug || "my-profile", id: savedSignup.advisorSlug })}>
                <Button className="w-full h-11 rounded-xl font-semibold gap-2">
                  <Users className="h-4 w-4" /> View your adviser profile
                </Button>
              </Link>
            )}
            <Link to={savedSignup.role === "professional" ? "/jobs" : "/post-job"}>
              <Button
                variant={savedSignup.role === "professional" ? "outline" : "default"}
                className="w-full h-11 rounded-xl font-semibold gap-2"
              >
                <Briefcase className="h-4 w-4" />
                {savedSignup.role === "professional" ? "Browse live projects" : "Post a project"}
              </Button>
            </Link>
            {savedSignup.role === "professional" && (
              <Link to="/workspaces">
                <Button variant="outline" className="w-full h-11 rounded-xl gap-2">
                  <Briefcase className="h-4 w-4" /> Your workspaces
                </Button>
              </Link>
            )}
            <Link to="/professionals">
              <Button variant="ghost" className="w-full h-11 rounded-xl gap-2">
                <Users className="h-4 w-4" /> Browse professionals
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <div className="max-w-[560px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <motion.div
          className="space-y-4 mb-10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <Badge variant="outline" className="w-fit gap-1.5 bg-teal-50 text-teal-700 border-teal-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            UK tax & accounting marketplace
          </Badge>
          {step === 1 ? (
            <>
              <h1 className="text-3xl sm:text-[2rem] font-bold text-foreground tracking-tight leading-tight">
                {hero.headline}
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                {hero.subheadline}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <Zap className="h-3.5 w-3.5" />
                No password required
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Building your {isProfessional ? "professional" : "client"} profile — you can refine details anytime.
            </p>
          )}
        </motion.div>

        <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm space-y-8">
          <OnboardingProgress steps={steps} currentStep={step} role={form.user_role} />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isLastStep) handleSubmit();
              else handleNext();
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step}-${form.user_role}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            <div className={`flex flex-col gap-3 mt-10 pt-8 border-t border-border/60 ${step > 1 ? "sm:flex-row" : ""}`}>
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} className="h-12 rounded-xl flex-1 gap-2 transition-transform active:scale-[0.98]">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : null}
              {isLastStep ? (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 rounded-xl w-full font-semibold gap-2 transition-all hover:shadow-md active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isProfessional ? "Join marketplace" : "Join marketplace"}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="h-12 rounded-xl w-full font-semibold gap-2 transition-all hover:shadow-md active:scale-[0.98]"
                >
                  {stepOneCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isLastStep && isProfessional && step === 5 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full mt-2 text-xs text-muted-foreground"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Skip bio and finish
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground mt-4">
              Free to explore · No subscription · Progress saved when you finish
            </p>
          </form>
        </div>

        {step === 1 && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <OnboardingTrustSection />
          </motion.div>
        )}
      </div>
    </div>
  );
}

