import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Loader2, ArrowLeft, ArrowRight, CheckCircle2, User, Briefcase, Star, Eye, EyeOff, Lock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AiBioGenerator from "@/components/createProfile/AiBioGenerator";

const QUALIFICATIONS = ["ACA", "ACCA", "CTA", "ATT", "AAT", "CIMA", "CIPFA", "FCA", "FCCA"];
const SOFTWARE = ["Xero", "QuickBooks", "Sage", "FreeAgent", "Kashflow", "IRIS", "TaxCalc", "CCH", "Dext", "AutoEntry", "Hubdoc", "Excel"];
const SPECIALISATIONS = [
  "Self Assessment", "Corporation Tax", "VAT", "Payroll", "Bookkeeping",
  "Audit", "Tax Planning", "R&D Tax Credits", "Capital Gains", "Inheritance Tax",
  "Making Tax Digital", "Company Formation", "Annual Accounts", "Management Accounts",
  "Crypto Tax", "Landlord Tax", "CIS Returns", "HMRC Investigations",
];

const STEPS = [
  { id: 1, label: "Basic info",   icon: User },
  { id: 2, label: "Credentials", icon: Star },
  { id: 3, label: "Bio & rate",  icon: Briefcase },
];

export default function CreateProfile() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedProfile, setPublishedProfile] = useState(null);
  const [form, setForm] = useState({
    full_name: "", title: "", bio: "", location: "",
    hourly_rate: "", years_experience: "", linkedin_url: "",
    remote_work: true, availability: "available", visibility: "public",
    qualifications: [], specialisations: [], software_expertise: [],
  });

  const toggleItem = (field, item) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.title.trim()) {
      toast.error("Please fill in your name and title before publishing.");
      return;
    }
    if (form.qualifications.length === 0) {
      toast.error("Please select at least one qualification.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...form,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
        years_experience: form.years_experience ? Number(form.years_experience) : undefined,
      };
      const response = await base44.functions.invoke("createProfile", data);
      const profile = response?.data?.profile || data;
      localStorage.setItem("my_profile", JSON.stringify(profile));
      base44.analytics.track({ eventName: "publish_profile" });
      setPublishedProfile(profile);
      setPublished(true);
    } catch (err) {
      toast.error(err?.message || "Failed to publish profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvanceStep1 = form.full_name.trim() && form.title.trim();
  const canAdvanceStep2 = form.qualifications.length > 0;

  if (published && publishedProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your profile is now live!</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Clients can now find and contact you. You'll start receiving matched opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Button className="w-full h-11 rounded-xl font-semibold gap-2" onClick={() => navigate("/my-profile")}>
              <User className="h-4 w-4" /> Go to My Profile
            </Button>
            {publishedProfile.id && (
              <Button variant="outline" className="w-full h-11 rounded-xl gap-2" onClick={() => navigate(`/professionals/${publishedProfile.id}`)}>
                <ExternalLink className="h-4 w-4" /> View Public Profile
              </Button>
            )}
            <Button variant="ghost" className="w-full h-11 rounded-xl gap-2" onClick={() => navigate("/jobs")}>
              <Briefcase className="h-4 w-4" /> Browse Projects
            </Button>
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
          <div className="text-sm font-semibold text-muted-foreground">Step {step} of 3</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                  step === s.id ? "text-primary" : step > s.id ? "text-emerald-600 cursor-pointer" : "text-muted-foreground cursor-default"
                }`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step > s.id ? "bg-emerald-500 border-emerald-500 text-white" :
                  step === s.id ? "bg-primary border-primary text-primary-foreground" :
                  "border-border text-muted-foreground"
                }`}>
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-colors ${step > s.id ? "bg-emerald-400" : "bg-border"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Basic info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Let's set up your profile</h1>
              <p className="mt-1 text-muted-foreground text-sm">Basic details first — we'll use your credentials to generate a great bio in step 3.</p>
            </div>
            <div className="flex flex-wrap items-center gap-0 rounded-2xl border-2 border-emerald-400 bg-emerald-500 overflow-hidden shadow-md shadow-emerald-200">
              {[
                { check: "✓", label: "Join Free" },
                { check: "✓", label: "Bid Free" },
                { check: "✓", label: "No Commission" },
              ].map((item, i) => (
                <span key={item.label} className={`flex items-center gap-2 px-5 py-3 text-white font-black text-sm sm:text-base flex-1 justify-center ${i < 2 ? "border-r border-emerald-400" : ""}`}>
                  <span className="text-emerald-200 text-lg leading-none">{item.check}</span>
                  {item.label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" placeholder="Sarah Mitchell" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Professional title *</Label>
                <Input id="title" placeholder="e.g. CTA Tax Adviser · R&D Specialist" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="London / Remote" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of experience</Label>
                <Input id="years_experience" type="number" placeholder="e.g. 8" value={form.years_experience}
                  onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn (optional)</Label>
              <Input id="linkedin_url" placeholder="linkedin.com/in/yourname" value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
            </div>
            <Button onClick={() => setStep(2)} disabled={!canAdvanceStep1} className="w-full h-11 rounded-xl font-semibold gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2 — Credentials */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Qualifications & services</h1>
              <p className="mt-1 text-muted-foreground text-sm">Your credentials are the main trust signal clients look for.</p>
            </div>

            <div className="space-y-3">
              <Label>Your qualifications *</Label>
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
              {form.qualifications.length === 0 && (
                <p className="text-xs text-amber-600">Select at least one qualification to continue.</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Services you offer</Label>
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

            <div className="space-y-3">
              <Label>Software & tools you use</Label>
              <div className="flex flex-wrap gap-2">
                {SOFTWARE.map((s) => (
                  <Badge key={s}
                    variant={form.software_expertise.includes(s) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1.5 px-3 select-none"
                    onClick={() => toggleItem("software_expertise", s)}>
                    {s}
                    {form.software_expertise.includes(s) && <X className="h-3 w-3 ml-1.5" />}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canAdvanceStep2} className="flex-1 h-11 rounded-xl font-semibold gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Bio, rate & availability */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Your bio & preferences</h1>
              <p className="mt-1 text-muted-foreground text-sm">We've generated a bio draft from your credentials. Edit it to make it yours.</p>
            </div>

            {/* AI Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio">Professional bio</Label>
                <AiBioGenerator form={form} onBioGenerated={(bio) => setForm({ ...form, bio })} autoGenerate />
              </div>
              <Textarea id="bio"
                placeholder="Generating your bio from your credentials…"
                value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="h-32 resize-none" />
              <p className="text-xs text-muted-foreground">Generated from your qualifications and specialisations. Edit freely or refine with AI again.</p>
            </div>

            {/* Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly rate (£)</Label>
              <Input id="hourly_rate" type="number" placeholder="e.g. 95" value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
              <p className="text-xs text-muted-foreground">Leave blank to show "Rate on request"</p>
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available now</SelectItem>
                  <SelectItem value="limited">Limited availability</SelectItem>
                  <SelectItem value="unavailable">Not taking new clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remote */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-secondary/30">
              <Switch checked={form.remote_work} onCheckedChange={(v) => setForm({ ...form, remote_work: v })} />
              <div>
                <Label className="cursor-pointer">Available for remote work</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Most clients on TaxPro UK prefer remote-first professionals.</p>
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-3">
              <Label>Profile visibility</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: "public", icon: Eye, label: "Public", desc: "Visible in search & directory" },
                  { value: "hidden", icon: EyeOff, label: "Hidden", desc: "Not in search, AI-matchable" },
                  { value: "private", icon: Lock, label: "Private", desc: "Fully private, invite only" },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button key={value} type="button"
                    onClick={() => setForm({ ...form, visibility: value })}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                      form.visibility === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 text-foreground"
                    }`}>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground leading-snug">{desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Hidden profiles can still receive AI-matched opportunities from clients.</p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-1.5">
              <p className="font-semibold text-foreground">Profile summary</p>
              <p className="text-muted-foreground"><span className="text-foreground font-medium">{form.full_name}</span> · {form.title}</p>
              {form.qualifications.length > 0 && <p className="text-muted-foreground">Qualifications: {form.qualifications.join(", ")}</p>}
              {form.hourly_rate && <p className="text-muted-foreground">Rate: £{form.hourly_rate}/hr</p>}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl">
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl font-semibold text-base gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Publish Profile Free
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">Your profile goes live immediately. You can edit it any time.</p>
          </form>
        )}
      </div>
    </div>
  );
}