import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gavel, CheckCircle2, Clock, PoundSterling, FileText, Loader2, TrendingUp, AlertCircle, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import BidIntelligence from "@/components/shared/BidIntelligence";
import { DemoBadge } from "@/lib/demoModeDetector.jsx";
import { getMinimumIncrement, validateBidIncrement } from "@/lib/biddingIncrementEngine";
import { useToast } from "@/components/ui/use-toast";

const TIMELINE_OPTIONS = [
  { value: "24h", label: "Within 24 hours", hint: "Best chance for urgent projects", urgency: "high" },
  { value: "3d", label: "2–3 days", hint: "Great for most short projects", urgency: "high" },
  { value: "1w", label: "Within 1 week", hint: "Balanced workload & delivery", urgency: "medium" },
  { value: "2w", label: "1–2 weeks", hint: "Suited for complex work", urgency: "medium" },
  { value: "1m", label: "Within a month", hint: "For detailed, multi-stage projects", urgency: "low" },
];

const TIMELINE_LABELS = {
  "24h": "Within 24 hours", "3d": "2–3 days", "1w": "Within 1 week",
  "2w": "1–2 weeks", "1m": "Within a month",
};

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
  const [touched, setTouched] = useState({ amount: false, timeline: false, proposal: false });
  const [savedBid, setSavedBid] = useState(null);
  const [existingBids, setExistingBids] = useState([]);
  const [incrementValidation, setIncrementValidation] = useState(null);

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
  const canSubmit = missingFields.length === 0 && (!incrementValidation || incrementValidation.valid);
  const signal = useMemo(() => getCompetitiveSignal(amount, job.budget_amount), [amount, job.budget_amount]);
  const proposalLength = proposal.trim().length;
  const proposalOk = proposalLength >= 20;

  const handleSubmit = async () => {
    setTouched({ amount: true, timeline: true, proposal: true });
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let bidderName = "";
      let bidderQual = "";
      try {
        const user = await base44.auth.me();
        bidderName = user?.full_name || user?.email || "";
        // Try to get qual from saved profile
        const stored = localStorage.getItem("my_profile");
        if (stored) {
          const profile = JSON.parse(stored);
          bidderQual = profile?.qualifications?.[0] || "";
        }
      } catch {}

      const bid = await base44.entities.Bid.create({
        project_id: job.id,
        project_title: job.title,
        amount: Number(amount),
        timeline,
        timeline_label: TIMELINE_LABELS[timeline] || timeline,
        proposal,
        bidder_name: bidderName,
        bidder_qual: bidderQual,
        status: "pending",
      });
      setSavedBid(bid);
       window.dispatchEvent(new CustomEvent("bidSubmitted", { detail: bid }));
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
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
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
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
                          : "Open for competitive bids"}
                      </p>
                      {existingBids.length > 0 && (
                        <p className="text-violet-600 text-[11px]">
                          Minimum bid change: £{getMinimumIncrement(Math.min(...existingBids.map(b => b.amount)))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <PoundSterling className="h-3.5 w-3.5 text-primary" />Your Quote (£)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">£</span>
                      <Input type="number" placeholder="e.g. 250" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, amount: true }))}
                        className={`pl-7 font-semibold text-base ${touched.amount && (!amount || Number(amount) <= 0) ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
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
                    {touched.amount && (!amount || Number(amount) <= 0) && (
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
                    {touched.timeline && !timeline && (
                      <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Please select a delivery timeline</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />Short Proposal
                    </Label>
                    <Textarea placeholder="Briefly explain your approach, relevant experience, and why you're the right fit…"
                      value={proposal} onChange={e => setProposal(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, proposal: true }))}
                      className={`h-24 resize-none text-sm ${touched.proposal && !proposalOk ? "border-rose-400 focus-visible:ring-rose-400" : ""}`}
                    />
                    <div className="flex items-center justify-between">
                      {touched.proposal && !proposalOk ? (
                        <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{20 - proposalLength} more chars needed</p>
                      ) : proposalOk ? (
                        <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Looks good</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
                      )}
                      <span className={`text-xs tabular-nums ${proposalOk ? "text-emerald-600" : "text-muted-foreground"}`}>{proposalLength}/20+</span>
                    </div>
                  </div>

                  <BidIntelligence
                    amount={amount}
                    budgetAmount={job.budget_amount}
                    category={job.category}
                    timeline={timeline}
                    qualifications={[]}
                    proposal={proposal}
                    bidCount={bidCount || 4}
                    completedJobs={0}
                    rating={0}
                    complexity="medium"
                  />

                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 space-y-1">
                    <p className="font-bold flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Your marketplace commitment:</p>
                    <p>• Commit to deliver by the stated deadline</p>
                    <p>• Late delivery affects your on-time completion rate</p>
                    <p>• Your reputation score influences future bid visibility</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button onClick={handleSubmit} disabled={submitting}
                      className="w-full h-12 rounded-xl font-semibold gap-2 bg-gradient-to-r from-violet-600 to-primary border-0 text-sm">
                      {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing Bid…</> : <><Gavel className="h-4 w-4" /> Submit Bid</>}
                    </Button>
                    {!canSubmit && touched.amount && touched.timeline && touched.proposal && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-600 text-center flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3" />Still missing: {missingFields.join(" · ")}
                      </motion.p>
                    )}
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-xl text-muted-foreground text-sm h-9">Cancel</Button>
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}