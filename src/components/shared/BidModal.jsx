import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gavel, CheckCircle2, Clock, PoundSterling, FileText, Loader2, TrendingUp, AlertCircle, Zap, ShieldCheck, ArrowRight, ChevronDown, Award, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { saveBid } from "@/lib/bidStore";
import BidIntelligence from "@/components/shared/BidIntelligence";
import { DemoBadge } from "@/lib/demoModeDetector.jsx";
import { getMinimumIncrement, validateBidIncrement } from "@/lib/biddingIncrementEngine";
import { useBiddingCountdown } from "@/hooks/useBiddingCountdown";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";
import { useToast } from "@/components/ui/use-toast";

const TIMELINE_OPTIONS = [
  { value: "24h", label: "Within 24 hours", hint: "Best for urgent/simple requests", urgency: "high" },
  { value: "3d", label: "2-3 days", hint: "Strong for time-sensitive work", urgency: "high" },
  { value: "1w", label: "Within 1 week", hint: "Balanced delivery & quality", urgency: "medium" },
  { value: "2w", label: "1-2 weeks", hint: "Suitable for detailed or specialist work", urgency: "medium" },
  { value: "1m", label: "Within a month", hint: "Best for multi-stage engagements", urgency: "low" },
];

const TIMELINE_LABELS = {
  "24h": "Within 24 hours", "3d": "2-3 days", "1w": "Within 1 week",
  "2w": "1-2 weeks", "1m": "Within a month",
};

const QUALIFICATION_OPTIONS = [
  "ACA", "ACCA", "CTA", "ATT", "AAT", "ICAEW", "ICAS", "CIMA", "FCCA",
  "Bookkeeper", "Tax Adviser", "Payroll Specialist", "VAT Specialist",
];

const EXPERIENCE_OPTIONS = ["1-3 years", "3-5 years", "5-10 years", "10+ years"];

const CATEGORY_LABELS = {
  tax_return: "Self Assessment Tax",
  self_assessment: "Self Assessment Tax",
  vat: "VAT",
  vat_return: "VAT",
  corporation_tax: "Corporation Tax",
  rd_claim: "R&D Tax Relief",
  payroll: "Payroll",
  bookkeeping: "Bookkeeping",
  tax_investigation: "HMRC Enquiry",
  capital_gains: "Capital Gains Tax",
  inheritance_tax: "Inheritance Tax",
  advisory: "Tax Advisory",
  other: "UK tax and accounting",
};

function cleanProposalText(value) {
  return String(value || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^proposal:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFallbackProposal({ proposal, job, qualifications, yearsExperience, mode }) {
  const category = CATEGORY_LABELS[job.category] || CATEGORY_LABELS.other;
  const credentialText = [
    qualifications.length ? `${qualifications.join(" and ")}-qualified` : "",
    yearsExperience ? `with ${yearsExperience} of experience` : "",
  ].filter(Boolean).join(" ");
  const intro = credentialText
    ? `I am a ${credentialText} tax and accounting professional`
    : "I am a UK tax and accounting professional";
  const projectLine = `I can support this ${category} project with a clear, practical approach and keep you updated throughout.`;
  const source = cleanProposalText(proposal);
  const note = source
    ? `Based on your notes, I will focus on ${source.replace(/\.$/, "")}.`
    : "I will review the information provided, confirm the scope, and agree the next steps before starting.";
  const urgencyLine = job.urgency === "asap" || job.urgency === "urgent"
    ? "I can prioritise a prompt turnaround and flag any issues early."
    : "I would be happy to agree a sensible timeline and deliver the work carefully.";
  const base = `${intro}. ${projectLine} ${note} ${urgencyLine}`;

  if (mode === "shorten") return `${intro}. I can assist with this ${category} project and provide clear, practical support within the agreed timeline.`;
  if (mode === "friendlier") return `${intro}. I would be very happy to help with this ${category} project, explain the process clearly, and provide practical support from start to finish.`;
  return base;
}

function getProposalQuality({ proposal, qualifications, yearsExperience, amount, budgetAmount }) {
  const text = proposal.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const hasCredentials = qualifications.length > 0 || Boolean(yearsExperience) || /acca|aca|cta|att|aat|qualified|experience|specialist/i.test(text);
  const hasApproach = /review|prepare|submit|file|reconcile|check|advise|approach|support|deliver/i.test(text);
  const hasSpecificTax = /vat|tax|capital gains|cgt|corporation|payroll|bookkeeping|hmrc|self assessment|inheritance/i.test(text);
  const priceRatio = amount && budgetAmount ? Number(amount) / Number(budgetAmount) : null;
  const tips = [];

  if (!text) return { label: "Add a proposal", tone: "neutral", tips: ["Briefly explain your fit, approach, and expected support."] };
  if (words < 20) tips.push("Add more project-specific detail.");
  if (!hasCredentials) tips.push("Mention relevant experience or select credentials.");
  if (!hasApproach) tips.push("Add a short line on how you would approach the work.");
  if (!hasSpecificTax) tips.push("Reference the relevant tax or accounting area.");
  if (priceRatio && priceRatio > 1.15) tips.push("Pricing is above the opening budget, so explain the added value.");

  if (words >= 35 && hasCredentials && hasApproach && hasSpecificTax) {
    return { label: "Strong proposal", tone: "positive", tips: ["Clear, credible and relevant for client review."] };
  }
  if (tips.length <= 2 && words >= 20) {
    return { label: "Good foundation", tone: "warning", tips };
  }
  return { label: "Needs more detail", tone: "neutral", tips };
}

const formatCurrency = (value) => `£${Math.round(value).toLocaleString()}`;

function getCompetitiveSignal(amount, budgetAmount) {
  if (!amount || Number(amount) <= 0) return null;
  const n = Number(amount);
  if (!budgetAmount) return { label: "Competitive bid — no budget cap set", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: TrendingUp, winChance: "Medium", advice: "Add a strong proposal to stand out." };
  const ratio = n / budgetAmount;
  if (ratio <= 0.85) return { label: "Very competitive quote — high chance to win", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: TrendingUp, winChance: "High", advice: "Your price is well below the starting budget — strong position." };
  if (ratio <= 1.0)  return { label: "Competitive quote — within expected range",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",    icon: TrendingUp, winChance: "Good", advice: "Competitive price. A clear proposal will secure the win." };
  if (ratio <= 1.3)  return { label: "Slightly above market — strong proposal needed", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertCircle, winChance: "Medium", advice: "Justify your rate with specific experience and fast delivery." };
  return { label: "High quote — your proposal must lead on value", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: AlertCircle, winChance: "Lower", advice: "Emphasise your qualifications and delivery speed to compete." };
}

function getMissingFields(amount, timeline, proposal) {
  const missing = [];
  if (!amount || Number(amount) <= 0) missing.push("quote amount");
  if (!timeline) missing.push("delivery timeline");
  if (proposal.trim().length < 20) {
    const needed = 20 - proposal.trim().length;
    missing.push(`proposal (${needed} more character${needed !== 1 ? "s" : ""} needed)`);
  }
  return missing;
}

export default function BidModal({ job, onClose, onBidSubmitted, onSubmitSuccess, bidCount = 4 }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState("form");
  const [amount, setAmount] = useState(job.budget_amount ? String(job.budget_amount) : "");
  const [timeline, setTimeline] = useState("");
  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({ amount: false, timeline: false, proposal: false });
  const [savedBid, setSavedBid] = useState(null);
  const [existingBids, setExistingBids] = useState([]);
  const [incrementValidation, setIncrementValidation] = useState(null);
  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [selectedQualifications, setSelectedQualifications] = useState([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [enhancingProposal, setEnhancingProposal] = useState(false);
  const [proposalSuggestion, setProposalSuggestion] = useState("");
  const [proposalSuggestionMode, setProposalSuggestionMode] = useState("");
  const { isOpen: biddingOpen } = useBiddingCountdown(job, {
    startDate: job.created_date,
    biddingPeriod: job.bidding_period,
  });

  // Load existing bids to check increment validation
  useEffect(() => {
    const loadBids = async () => {
      try {
        const bids = await base44.entities.Bid.filter({ project_id: job.id }, "-amount", 100);
        setExistingBids(bids || []);
      } catch {
        setExistingBids([]);
      }
    };
    loadBids();
  }, [job.id]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("my_profile");
      const profile = stored ? JSON.parse(stored) : null;
      setProfessionalProfile(profile);
      const savedQualifications = Array.isArray(profile?.qualifications) ? profile.qualifications : [];
      setSelectedQualifications(savedQualifications.filter(Boolean));
      setYearsExperience(
        profile?.years_experience ||
        profile?.yearsExperience ||
        profile?.experience_years ||
        ""
      );
    } catch {
      setProfessionalProfile(null);
    }
  }, []);

  // Validate bid increment whenever amount changes
  useEffect(() => {
    if (!amount || Number(amount) <= 0) {
      setIncrementValidation(null);
      return;
    }
    
    const lowestExistingBid = existingBids.length > 0 ? Math.min(...existingBids.map(b => b.amount)) : null;
    
    if (lowestExistingBid) {
      const validation = validateBidIncrement(Number(amount), lowestExistingBid);
      setIncrementValidation(validation);
    } else {
      setIncrementValidation(null);
    }
  }, [amount, existingBids]);

  const missingFields = getMissingFields(amount, timeline, proposal);
  const canSubmit = biddingOpen && missingFields.length === 0 && (!incrementValidation || incrementValidation.valid);
  const signal = useMemo(() => getCompetitiveSignal(amount, job.budget_amount), [amount, job.budget_amount]);
  const estimatedBudgetRange = useMemo(() => scoreMarketplaceProject({
    category: job.category,
    complexity: job.complexity || "medium",
    urgency: job.urgency || "negotiable",
    biddingPeriod: job.bidding_period,
    biddingDeadline: job.bidding_deadline,
    remote: job.remote,
    missingRecords: job.missing_records,
    multipleIncomeSources: job.multiple_income_sources,
    internationalTaxIssues: job.international_tax_issues,
    estimatedWorkload: job.estimated_workload,
    deadlinePressure: job.deadline_pressure,
    descriptionLength: job.description?.length || 0,
  }).recommendedBudgetRange, [job]);
  const proposalLength = proposal.trim().length;
  const proposalOk = proposalLength >= 20;

  const showAmountError = submitAttempted || touched.amount;
  const showTimelineError = submitAttempted || touched.timeline;
  const showProposalError = submitAttempted || touched.proposal;
  const proposalQuality = useMemo(() => getProposalQuality({
    proposal,
    qualifications: selectedQualifications,
    yearsExperience,
    amount,
    budgetAmount: job.budget_amount,
  }), [proposal, selectedQualifications, yearsExperience, amount, job.budget_amount]);
  const credentialsSummary = [
    ...selectedQualifications,
    yearsExperience ? `${yearsExperience} experience` : null,
  ].filter(Boolean);

  const toggleQualification = (qualification) => {
    setSelectedQualifications((current) =>
      current.includes(qualification)
        ? current.filter((item) => item !== qualification)
        : [...current, qualification]
    );
  };

  const handleEnhanceProposal = async (mode = "professional") => {
    setEnhancingProposal(true);
    setProposalSuggestionMode(mode);

    const fallback = buildFallbackProposal({
      proposal,
      job,
      qualifications: selectedQualifications,
      yearsExperience,
      mode,
    });

    try {
      const prompt = [
        "Rewrite the bid proposal below for a UK tax/accounting marketplace.",
        "Return only the finished proposal text. No heading, no bullet list, no explanation.",
        "Keep it concise, human-written, commercially realistic, and professional.",
        "Improve grammar, sentence flow, readability, and confidence without sounding robotic.",
        "Naturally incorporate credentials and experience if supplied.",
        "Do not overpromise. Do not invent qualifications, certifications, client outcomes, fees, or availability.",
        mode === "shorten" ? "Make it shorter, around 45-65 words." : "",
        mode === "friendlier" ? "Make it warmer and approachable while still professional." : "",
        mode === "more_professional" ? "Make the tone more senior and polished." : "",
        "",
        `Project title: ${job.title || "Untitled project"}`,
        `Project category: ${CATEGORY_LABELS[job.category] || job.category || "UK tax/accounting"}`,
        `Project complexity: ${job.complexity || "medium"}`,
        `Project urgency: ${job.urgency || "standard"}`,
        `Selected credentials: ${selectedQualifications.length ? selectedQualifications.join(", ") : "None selected"}`,
        `Experience: ${yearsExperience || "Not provided"}`,
        `Current rough proposal/notes: ${proposal || "No notes provided"}`,
      ].filter(Boolean).join("\n");

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = cleanProposalText(typeof result === "string" ? result : result?.text || result?.content || "");
      setProposalSuggestion(text || fallback);
    } catch (err) {
      console.warn("[BidModal] proposal enhancement failed, using fallback", err);
      setProposalSuggestion(fallback);
    } finally {
      setEnhancingProposal(false);
    }
  };

  const applyProposalSuggestion = () => {
    if (!proposalSuggestion) return;
    setProposal(proposalSuggestion);
    setProposalSuggestion("");
    setTouched((current) => ({ ...current, proposal: true }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    console.debug("[BidModal] submit triggered", {
      projectId: job.id,
      amount,
      timeline,
      proposalLength,
      biddingOpen,
      missingFields,
      incrementValidation,
    });
    setSubmitAttempted(true);
    setTouched({ amount: true, timeline: true, proposal: true });
    if (!canSubmit) {
      console.warn("[BidModal] validation blocked submission", {
        missingFields,
        biddingOpen,
        incrementValidation,
      });
      return;
    }
    setSubmitting(true);
    try {
      let bidderName = "";
      try {
        const user = await base44.auth.me();
        bidderName = user?.full_name || user?.email || "";
      } catch {}

      const professionalCredentials = {
        qualifications: selectedQualifications,
        years_experience: yearsExperience,
        headline: professionalProfile?.headline || professionalProfile?.title || "",
        specialisations: professionalProfile?.specialisations || [],
        user_role: professionalProfile?.user_role || localStorage.getItem("user_role") || "professional",
      };
      const bidPayload = {
        project_id: job.id,
        project_title: job.title,
        amount: Number(amount),
        timeline,
        timeline_label: TIMELINE_LABELS[timeline] || timeline,
        proposal,
        bidder_name: bidderName,
        bidder_headline: professionalProfile?.headline || professionalProfile?.title || "",
        bidder_bio: professionalProfile?.bio || "",
        bidder_specialisms: professionalProfile?.specialisations || [],
        bidder_role: professionalProfile?.user_role || localStorage.getItem("user_role") || "professional",
        bidder_qual: selectedQualifications[0] || "",
        bidder_quals: selectedQualifications,
        qualifications: selectedQualifications,
        years_experience: yearsExperience,
        experience_label: yearsExperience,
        professional_credentials: professionalCredentials,
        bidding_deadline: job.bidding_deadline,
        budget_amount: job.budget_amount,
        project_category: job.category,
        category: job.category,
        urgency: job.urgency,
        complexity: job.complexity,
        project_created_date: job.created_date,
        bidder_rating: professionalProfile?.rating || 0,
        completed_jobs: professionalProfile?.completed_jobs || professionalProfile?.completedJobs || 0,
        on_time_completion_rate: professionalProfile?.on_time_completion_rate || professionalProfile?.onTimeCompletionRate || 0.8,
        status: "pending",
      };
      console.debug("[BidModal] creating bid", bidPayload);
      let bid;
      try {
        bid = await base44.entities.Bid.create(bidPayload);
        window.dispatchEvent(new CustomEvent("bidSubmitted", { detail: bid }));
      } catch (err) {
        console.warn("[BidModal] backend bid create failed, saving locally", err);
        bid = saveBid(bidPayload);
      }
      setSavedBid(bid);
      console.debug("[BidModal] bid submitted successfully", bid);
      setStep("success");
      if (onBidSubmitted) onBidSubmitted(bid);

       // Show success toast with auto-dismiss
       toast({
         title: "✓ Bid Submitted Successfully",
         description: `Your quote of £${Number(amount).toLocaleString()} is now visible to the project owner.`,
         duration: 3000,
       });
    } catch (err) {
      console.error("Failed to submit bid:", err);
      toast({
        title: "Bid could not be submitted",
        description: "Please check the form and try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 z-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-[1] w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Gavel className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                 Submit Your Quote
                 {job._user_posted === false && <DemoBadge />}
               </p>
                <p className="text-xs text-muted-foreground truncate max-w-[260px]">{job.title}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="p-5 space-y-5">
                  {job._user_posted === false && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Demo Mode Preview
                      </p>
                      <p>This is a demo project. Your bid submission is fully functional and will be saved to the database.</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
                    <div className="text-violet-700 font-medium space-y-1">
                      <p>
                        {job.budget_amount
                          ? `Starting bid: £${job.budget_amount.toLocaleString()}`
                          : `Estimated budget: ${formatCurrency(estimatedBudgetRange.min)}-${formatCurrency(estimatedBudgetRange.max)}`}
                      </p>
                      {existingBids.length > 0 && (
                        <p className="text-violet-600 text-[11px]">
                          Minimum bid change: £{getMinimumIncrement(Math.min(...existingBids.map(b => b.amount)))}
                        </p>
                      )}
                    </div>
                  </div>
                  {!biddingOpen && (
                    <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 text-xs text-slate-700">
                      <p className="font-bold">Bidding is closed for this project.</p>
                      <p className="mt-1">Quotes can only be submitted while the project is open and accepting bids.</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <PoundSterling className="h-3.5 w-3.5 text-primary" />Your Quote (£)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">£</span>
                      <Input type="number" placeholder="e.g. 250" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, amount: true }))}
                        className={`pl-7 font-semibold text-base ${showAmountError && (!amount || Number(amount) <= 0) ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                      />
                    </div>
                    {incrementValidation && existingBids.length > 0 && !incrementValidation.valid && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">{incrementValidation.message}</p>
                          <p className="text-[11px] opacity-80 mt-0.5">
                            Current: £{incrementValidation.nextValidRange.current.toLocaleString()} · Next valid bids: £{incrementValidation.nextValidRange.min.toLocaleString()} or £{incrementValidation.nextValidRange.max.toLocaleString()}+
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {signal && amount && Number(amount) > 0 && (!incrementValidation || incrementValidation.valid) && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${signal.bg} ${signal.color}`}>
                        <signal.icon className="h-3.5 w-3.5 shrink-0" />{signal.label}
                      </motion.div>
                    )}
                    {showAmountError && (!amount || Number(amount) <= 0) && (
                      <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Please enter your quote amount</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />Delivery Timeline
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {TIMELINE_OPTIONS.map(opt => (
                        <button key={opt.value}
                          type="button"
                          onClick={() => { setTimeline(opt.value); setTouched(t => ({ ...t, timeline: true })); }}
                          className={`px-3 py-2.5 rounded-xl border-2 text-left transition-all ${timeline === opt.value ? "border-primary bg-primary/8" : "border-border hover:border-primary/40"}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${timeline === opt.value ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
                            {opt.urgency === "high" && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Zap className="h-2.5 w-2.5" />Fast</span>}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{opt.hint}</p>
                        </button>
                      ))}
                    </div>
                    {showTimelineError && !timeline && (
                      <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Please select a delivery timeline</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />Short Proposal
                    </Label>
                    <Textarea placeholder="Briefly explain your approach, relevant experience, and why you're the right fit…"
                      value={proposal} onChange={e => { setProposal(e.target.value); setProposalSuggestion(""); }}
                      onBlur={() => setTouched(t => ({ ...t, proposal: true }))}
                      className={`h-24 resize-none text-sm ${showProposalError && !proposalOk ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                    />
                    <div className="flex items-center justify-between gap-3">
                      {showProposalError && !proposalOk ? (
                        <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{20 - proposalLength} more chars needed</p>
                      ) : proposalOk ? (
                        <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Looks good</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
                      )}
                      <span className={`text-xs tabular-nums ${proposalOk ? "text-emerald-600" : "text-muted-foreground"}`}>{proposalLength}/20+</span>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-2 text-xs ${
                      proposalQuality.tone === "positive"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : proposalQuality.tone === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-secondary/50 border-border text-muted-foreground"
                    }`}>
                      <div className="flex items-start gap-1.5">
                        {proposalQuality.tone === "positive" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-bold text-foreground">{proposalQuality.label}</p>
                          <p className="mt-0.5">{proposalQuality.tips[0]}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnhanceProposal("professional")}
                        disabled={enhancingProposal}
                        className="h-8 rounded-lg text-xs gap-1.5"
                      >
                        {enhancingProposal && proposalSuggestionMode === "professional" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                        Improve Proposal
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEnhanceProposal("more_professional")}
                        disabled={enhancingProposal}
                        className="h-8 rounded-lg text-xs gap-1.5"
                      >
                        <Sparkles className="h-3 w-3" />
                        More Professional
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEnhanceProposal("shorten")}
                        disabled={enhancingProposal}
                        className="h-8 rounded-lg text-xs"
                      >
                        Shorten
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEnhanceProposal("friendlier")}
                        disabled={enhancingProposal}
                        className="h-8 rounded-lg text-xs"
                      >
                        Friendlier
                      </Button>
                    </div>

                    <AnimatePresence initial={false}>
                      {proposalSuggestion && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="rounded-xl border border-violet-200 bg-violet-50 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3" />
                              AI suggestion
                            </p>
                            <button type="button" onClick={() => setProposalSuggestion("")} className="text-[11px] text-violet-700 hover:underline">
                              Dismiss
                            </button>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{proposalSuggestion}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" onClick={applyProposalSuggestion} className="h-8 rounded-lg text-xs">
                              Use this version
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleEnhanceProposal(proposalSuggestionMode || "professional")} disabled={enhancingProposal} className="h-8 rounded-lg text-xs">
                              {enhancingProposal ? "Refining..." : "Regenerate"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCredentialsOpen((open) => !open)}
                      className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Award className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">Professional Credentials <span className="text-muted-foreground font-medium">(optional)</span></p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {credentialsSummary.length > 0 ? credentialsSummary.join(" · ") : "Add qualifications or experience in a few taps"}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${credentialsOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {credentialsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/50 pt-3">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Qualifications</p>
                              <div className="flex flex-wrap gap-1.5">
                                {QUALIFICATION_OPTIONS.map((qualification) => {
                                  const selected = selectedQualifications.includes(qualification);
                                  return (
                                    <button
                                      key={qualification}
                                      type="button"
                                      onClick={() => toggleQualification(qualification)}
                                      className={`px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                                        selected
                                          ? "bg-primary text-primary-foreground border-primary"
                                          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                      }`}
                                    >
                                      {qualification}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Years of Experience</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {EXPERIENCE_OPTIONS.map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => setYearsExperience(yearsExperience === option ? "" : option)}
                                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                                      yearsExperience === option
                                        ? "bg-violet-50 text-violet-700 border-violet-200"
                                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                    }`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                              <Input
                                value={yearsExperience}
                                onChange={(e) => setYearsExperience(e.target.value)}
                                placeholder="Or enter custom experience, e.g. 12 years"
                                className="h-9 text-xs"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <BidIntelligence
                    amount={amount}
                    budgetAmount={job.budget_amount}
                    category={job.category}
                    timeline={timeline}
                    qualifications={selectedQualifications}
                    proposal={proposal}
                    bidCount={bidCount || 4}
                    completedJobs={professionalProfile?.completed_jobs || professionalProfile?.completedJobs || 0}
                    yearsExperience={yearsExperience}
                    rating={professionalProfile?.rating || 0}
                    onTimeCompletionRate={professionalProfile?.on_time_completion_rate || professionalProfile?.onTimeCompletionRate || 0.8}
                    complexity={job.complexity || "medium"}
                    urgency={job.urgency || "negotiable"}
                    biddingPeriod={job.bidding_period}
                    remote={job.remote}
                    missingRecords={job.missing_records}
                    multipleIncomeSources={job.multiple_income_sources}
                    internationalTaxIssues={job.international_tax_issues}
                    estimatedWorkload={job.estimated_workload}
                    deadlinePressure={job.deadline_pressure}
                  />

                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 space-y-1">
                    <p className="font-bold flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Your marketplace commitment:</p>
                    <p>• Commit to deliver by the stated deadline</p>
                    <p>• Late delivery affects your on-time completion rate</p>
                    <p>• Your reputation score influences future bid visibility</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button
                      type="submit"
                      onClick={() => console.debug("[BidModal] submit button clicked")}
                      disabled={submitting || !biddingOpen}
                      className="w-full h-12 rounded-xl font-semibold gap-2 bg-gradient-to-r from-violet-600 to-primary border-0 text-sm">
                      {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing Bid…</> : <><Gavel className="h-4 w-4" /> {biddingOpen ? "Submit Bid" : "Bidding Closed"}</>}
                    </Button>
                    {!canSubmit && submitAttempted && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-600 text-center flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3" />{!biddingOpen ? "Bidding is closed for this project." : `Still missing: ${missingFields.join(" · ") || incrementValidation?.message || "valid bid details"}`}
                      </motion.p>
                    )}
                    <Button type="button" variant="ghost" onClick={onClose} className="w-full rounded-xl text-muted-foreground text-sm h-9">Cancel</Button>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="p-6 space-y-4">
                  <div className="text-center space-y-3">
                    <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="h-16 w-16 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Bid Submitted & Saved</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your quote of <strong className="text-primary">£{Number(amount).toLocaleString()}</strong> is now visible to the project owner.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 space-y-2">
                    <p className="text-xs font-black text-violet-700 uppercase tracking-widest">Bid Details</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg px-3 py-2 border border-violet-100">
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-extrabold text-primary text-base">£{Number(amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 border border-violet-100">
                        <p className="text-muted-foreground">Timeline</p>
                        <p className="font-bold text-foreground">{TIMELINE_LABELS[timeline]}</p>
                      </div>
                    </div>
                    {credentialsSummary.length > 0 && (
                      <div className="bg-white rounded-lg px-3 py-2 border border-violet-100">
                        <p className="text-muted-foreground text-xs mb-1">Credentials shared</p>
                        <div className="flex flex-wrap gap-1">
                          {credentialsSummary.map((item) => (
                            <span key={item} className="px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15 text-[10px] font-bold">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 pt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Status: <strong>Pending review</strong>
                    </div>
                  </div>

                  {signal && (
                    <div className={`rounded-xl border px-3 py-2.5 space-y-1 ${signal.bg} ${signal.color}`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <signal.icon className="h-3.5 w-3.5 shrink-0" />{signal.label}
                      </div>
                      <p className="text-[11px] opacity-80">{signal.advice}</p>
                    </div>
                  )}

                  <div className="text-xs space-y-1.5 bg-secondary/40 rounded-xl p-3.5 border border-border/40">
                    <p className="font-bold text-foreground">What happens next:</p>
                    {[
                      "Project owner reviews all bids and proposals",
                      "They may shortlist your bid for further review",
                      "You'll be notified when your bid is accepted or rejected",
                      "On acceptance, deliver the work by the agreed deadline",
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>

                  {job._user_posted === false && (
                    <div className="text-center rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                      <p className="text-xs text-muted-foreground">✓ <span className="font-semibold text-primary">Demo submission saved</span> — ready for testing</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate("/my-bids");
                      }} 
                      className="w-full rounded-xl h-11 font-semibold bg-gradient-to-r from-violet-600 to-primary border-0 gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      View My Bid
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate("/jobs");
                      }} 
                      variant="outline" 
                      className="w-full rounded-xl h-11 font-semibold gap-2">
                      <Gavel className="h-4 w-4" />
                      Browse Open Projects
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}