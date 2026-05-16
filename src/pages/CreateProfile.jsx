import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, ArrowLeft, CheckCircle2, Mail, Briefcase, Sparkles, Users, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AiBioGenerator from "@/components/createProfile/AiBioGenerator";

const ROLE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Get notified about matching UK tax projects" },
  { value: "client", label: "Client", desc: "Get early access when you need tax/accounting help" },
];
const QUALIFICATIONS = ["ACA", "ACCA", "CTA", "ATT", "AAT", "AATQB", "ICAEW", "ICAS", "CIMA", "CIPFA", "FCA", "FCCA"];
const SPECIALISATIONS = [
  "Self Assessment", "Corporation Tax", "VAT", "VAT Specialist", "Payroll", "Payroll Specialist", "Bookkeeping",
  "Audit", "Tax Planning", "R&D Tax Credits", "Capital Gains", "Inheritance Tax",
  "Property Tax", "Tax Adviser", "Making Tax Digital", "Company Formation", "Annual Accounts", "Management Accounts",
  "Crypto Tax", "Landlord Tax", "CIS Returns", "HMRC Investigations",
];

const CLIENT_TYPES = ["Individual", "Sole trader", "Limited company", "Landlord", "Startup", "Accounting practice", "Other"];
const PROJECT_INTERESTS = ["Self Assessment", "VAT Return", "Corporation Tax", "Bookkeeping", "Payroll", "Capital Gains", "R&D Tax Credits", "HMRC Enquiry", "General Tax Advice"];
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

function getDisplayName(fullName, preference = "full") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (preference === "first") return parts[0];
  if (preference === "initial" && parts.length > 1) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  return parts.join(" ");
}

export default function CreateProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bioGenerating, setBioGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedSignup, setSavedSignup] = useState(null);
  const [form, setForm] = useState({
    email: "",
    user_role: "professional",
    full_name: "",
    display_name_preference: "full",
    profile_public: false,
    visible_to_clients: true,
    years_experience: "",
    availability: "available",
    qualifications: [],
    specialisations: [],
    client_type: "",
    project_interests: [],
    bio: "",
    bio_notes: "",
  });

  const aiBioForm = useMemo(() => ({
    ...form,
    title: "UK tax and accounting professional",
    headline: "UK tax and accounting professional",
    location: "UK",
    remote_work: true,
    software_expertise: [],
  }), [form]);

  const toggleItem = (field, item) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (form.user_role === "professional" && form.full_name.trim().split(/\s+/).filter(Boolean).length < 2) {
      toast.error("Please enter your real full name. You can control how it appears publicly.");
      return;
    }

    setIsSubmitting(true);
    try {
      const signup = {
        email: form.email.trim(),
        role: form.user_role,
        full_name: form.user_role === "professional" ? form.full_name.trim() : "",
        display_name_preference: form.user_role === "professional" ? "full" : "",
        display_name: form.user_role === "professional" ? getDisplayName(form.full_name, "full") : "",
        profile_public: form.user_role === "professional" ? form.profile_public : false,
        visible_to_clients: form.user_role === "professional" ? form.visible_to_clients : false,
        specialties: form.user_role === "professional" ? form.specialisations : form.project_interests,
        qualifications: form.user_role === "professional" ? form.qualifications : [],
        years_experience: form.user_role === "professional" ? form.years_experience : "",
        availability: form.user_role === "professional" ? form.availability : "",
        client_type: form.user_role === "client" ? form.client_type : "",
        project_interests: form.user_role === "client" ? form.project_interests : [],
        bio: form.user_role === "professional" ? form.bio.trim() : "",
        signup_source: "early-access-onboarding",
      };
      const saved = saveEarlyAccessSignup(signup);
      localStorage.setItem("user_role", signup.role);

      if (signup.role === "professional") {
        localStorage.setItem("my_profile", JSON.stringify({
          user_role: "professional",
          email: signup.email,
          full_name: signup.full_name,
          display_name: signup.display_name,
          display_name_preference: signup.display_name_preference,
          profile_public: signup.profile_public,
          visible_to_clients: signup.visible_to_clients,
          qualifications: signup.qualifications,
          specialisations: signup.specialties,
          years_experience: signup.years_experience,
          availability: signup.availability,
          bio: signup.bio,
          headline: signup.qualifications.length
            ? `${signup.qualifications.slice(0, 2).join(" / ")} Tax Professional`
            : "UK Tax & Accounting Professional",
        }));
      }

      base44.analytics.track({ eventName: "early_access_signup", properties: { role: signup.role, source: signup.signup_source } });
      setSavedSignup(saved);
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.message || "Could not save your early access request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-2xl font-bold text-foreground">You're on the early access list</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              We'll notify you when the marketplace opens up for {savedSignup.role === "professional" ? "matching UK tax projects" : "new client project posting"}.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-800">
            <p className="font-semibold">Saved for MVP validation</p>
            <p className="mt-1">Email: {savedSignup.email}</p>
            <p>Role: {savedSignup.role === "professional" ? "Professional" : "Client"}</p>
            {savedSignup.role === "professional" && savedSignup.display_name && (
              <p>Public name: {savedSignup.display_name}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/jobs">
              <Button className="w-full h-11 rounded-xl font-semibold gap-2">
                <Briefcase className="h-4 w-4" /> Browse Projects
              </Button>
            </Link>
            <Link to="/professionals">
              <Button variant="outline" className="w-full h-11 rounded-xl gap-2">
                <Users className="h-4 w-4" /> Browse Professionals
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="text-sm font-semibold text-muted-foreground">No password required</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-3 mb-8">
          <Badge variant="outline" className="w-fit gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            MVP early access
          </Badge>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Join the UK tax marketplace waitlist</h1>
          <p className="text-muted-foreground">
            Get notified when matching projects, professionals, and beta access become available. Browse freely now, leave your email only if you're interested.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2.5 py-1 rounded-full bg-secondary border border-border">No password</span>
            <span className="px-2.5 py-1 rounded-full bg-secondary border border-border">No verification</span>
            <span className="px-2.5 py-1 rounded-full bg-secondary border border-border">No full account yet</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border/70 bg-card p-5 sm:p-7 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-9 h-11"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>I am a...</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setForm({ ...form, user_role: role.value })}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    form.user_role === role.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 text-foreground"
                  }`}
                >
                  <p className="text-sm font-bold">{role.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {form.user_role === "professional" ? (
            <>
              <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Real full name *</Label>
                  <Input
                    id="full_name"
                    placeholder="David Wang"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your real name is used to build trust, verification, and professional credibility on the platform.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Profile visibility</Label>
                  <label className="flex items-start gap-3 rounded-xl border border-border bg-white/80 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.profile_public}
                      onChange={(e) => setForm({ ...form, profile_public: e.target.checked })}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">Public profile</span>
                      <span className="block text-xs text-muted-foreground">Allow your marketplace profile to be publicly discoverable during beta.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-border bg-white/80 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.visible_to_clients}
                      onChange={(e) => setForm({ ...form, visible_to_clients: e.target.checked })}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">Visible to clients</span>
                      <span className="block text-xs text-muted-foreground">Let clients see your profile in shortlist/search-style marketplace surfaces.</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years experience (optional)</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    placeholder="e.g. 5"
                    value={form.years_experience}
                    onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
                  />
                </div>
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

              <div className="space-y-3">
                <Label>Qualifications (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {QUALIFICATIONS.map((q) => (
                    <Badge key={q}
                      variant={form.qualifications.includes(q) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-1.5 px-3 select-none"
                      onClick={() => toggleItem("qualifications", q)}>
                      {q}
                      {form.qualifications.includes(q) && <X className="h-3 w-3 ml-1.5" />}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Specialties/services (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALISATIONS.map((s) => (
                    <Badge key={s}
                      variant={form.specialisations.includes(s) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-1.5 px-3 select-none"
                      onClick={() => toggleItem("specialisations", s)}>
                      {s}
                      {form.specialisations.includes(s) && <X className="h-3 w-3 ml-1.5" />}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="bio_notes" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    Optional AI bio
                  </Label>
                  <AiBioGenerator
                    form={aiBioForm}
                    onBioGenerated={(bio) => setForm((current) => ({ ...current, bio }))}
                    onLoadingChange={setBioGenerating}
                  />
                </div>
                <Textarea
                  id="bio_notes"
                  placeholder="Optional notes for the AI bio, e.g. I am very experienced in CGT and property tax."
                  value={form.bio_notes}
                  onChange={(e) => setForm({ ...form, bio_notes: e.target.value })}
                  className="h-20 resize-none bg-white"
                />
                <Textarea
                  placeholder={bioGenerating ? "Generating professional bio..." : "Generated bio appears here. You can edit it before joining early access."}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="h-28 resize-none bg-white"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Client/company type (optional)</Label>
                <Select value={form.client_type} onValueChange={(v) => setForm({ ...form, client_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose the closest fit" /></SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Project category interest (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_INTERESTS.map((interest) => (
                    <Badge key={interest}
                      variant={form.project_interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-1.5 px-3 select-none"
                      onClick={() => toggleItem("project_interests", interest)}>
                      {interest}
                      {form.project_interests.includes(interest) && <X className="h-3 w-3 ml-1.5" />}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-semibold text-base gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {form.user_role === "professional" ? "Get notified about matching projects" : "Join early access"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            We’ll only use this for launch updates, beta access, and relevant project notifications. No account or password needed.
          </p>
        </form>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/jobs">
            <Button variant="outline" className="w-full rounded-xl">Browse projects without signup</Button>
          </Link>
          <Link to="/professionals">
            <Button variant="outline" className="w-full rounded-xl">Browse professionals</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}