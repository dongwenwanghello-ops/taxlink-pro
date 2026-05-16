/**
 * BidIntelligence — Professional-facing bid analysis widget.
 *
 * Replaces WinProbability with a richer, market-aware intelligence panel.
 *
 * HIDDEN BID SYSTEM:
 * - Professionals see: bidder count, competition level, avg experience, demand score
 * - Professionals do NOT see: competitor prices, competitor proposals
 *
 * Shows: price health vs market, fair pricing guidance, competition intelligence,
 * bid quality score, anti-underpricing warnings.
 */
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, AlertCircle, CheckCircle2, Users, ShieldCheck, Clock,
  Info, Zap, EyeOff
} from "lucide-react";
import {
  analyseBidHealth,
  getCompetitionIntelligence,
} from "@/lib/marketplaceIntelligence";
import { computeBidCompetitiveness } from "@/lib/winProbabilityEngine";

// ─── Sub-components ───────────────────────────────────────────────────────────

function FactorTag({ text, type }) {
  const styles = {
    positive: "bg-emerald-50 border-emerald-200 text-emerald-700",
    negative: "bg-rose-50 border-rose-200 text-rose-600",
    warning:  "bg-amber-50 border-amber-200 text-amber-700",
    neutral:  "bg-secondary border-border text-muted-foreground",
  };
  const icons = {
    positive: <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />,
    negative: <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />,
    warning:  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />,
    neutral:  <Info className="h-3 w-3 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex items-start gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 ${styles[type]}`}>
      {icons[type]}{text}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BidIntelligence({
  amount,
  budgetAmount,
  category,
  timeline,
  qualifications = [],
  proposal = "",
  bidCount = 0,
  completedJobs = 0,
  yearsExperience,
  rating = 0,
  onTimeCompletionRate = 0.8,
  clientTrustScore = 0.85,
  complexity = "medium",
  urgency = "negotiable",
  biddingPeriod,
  remote = true,
  missingRecords = false,
  multipleIncomeSources = false,
  internationalTaxIssues = false,
  estimatedWorkload,
  deadlinePressure,
}) {
  const bidHealth = useMemo(
    () => analyseBidHealth({
      amount,
      category,
      budgetAmount,
      complexity,
      urgency,
      remote,
      missingRecords,
      multipleIncomeSources,
      internationalTaxIssues,
      estimatedWorkload,
      deadlinePressure,
    }),
    [amount, category, budgetAmount, complexity, urgency, remote, missingRecords, multipleIncomeSources, internationalTaxIssues, estimatedWorkload, deadlinePressure]
  );

  const competition = useMemo(
    () => getCompetitionIntelligence({
      bidCount,
      category,
      budgetAmount,
      complexity,
      urgency,
      biddingPeriod,
      remote,
      missingRecords,
      multipleIncomeSources,
      internationalTaxIssues,
      estimatedWorkload,
      deadlinePressure,
    }),
    [bidCount, category, budgetAmount, complexity, urgency, biddingPeriod, remote, missingRecords, multipleIncomeSources, internationalTaxIssues, estimatedWorkload, deadlinePressure]
  );

  const competitiveness = useMemo(
    () => computeBidCompetitiveness({
      amount,
      budgetAmount,
      proposal,
      timeline,
      bidCount,
      urgency,
      category,
      complexity,
      qualifications,
      completedJobs,
      yearsExperience,
      rating,
      onTimeCompletionRate,
      clientTrustScore,
    }),
    [amount, budgetAmount, proposal, timeline, bidCount, urgency, category, complexity, qualifications, completedJobs, yearsExperience, rating, onTimeCompletionRate, clientTrustScore]
  );

  if (!bidHealth) return null;

  const healthStyles = {
    good:    { badge: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: CheckCircle2 },
    neutral: { badge: "bg-amber-50 border-amber-200 text-amber-700",       icon: Info },
    warning: { badge: "bg-amber-50 border-amber-200 text-amber-700",       icon: AlertCircle },
    danger:  { badge: "bg-rose-50 border-rose-200 text-rose-700",          icon: AlertCircle },
  };
  const hs = healthStyles[bidHealth.healthLevel] || healthStyles.neutral;
  const HealthIcon = hs.icon;
  const competitivenessStyles = {
    high: "bg-emerald-50 border-emerald-200 text-emerald-700",
    strong: "bg-emerald-50 border-emerald-200 text-emerald-700",
    competitive: "bg-blue-50 border-blue-200 text-blue-700",
    watch: "bg-amber-50 border-amber-200 text-amber-700",
    low: "bg-rose-50 border-rose-200 text-rose-700",
  };
  const timelineInsight = competitiveness?.insights.find((insight) =>
    /timeline|delivery|urgent|urgency|complex/i.test(insight.text)
  );

  // Proposal quality tips (no fake score — just actionable advice)
  const proposalTips = [];
  const pLen = proposal.trim().length;
  const pWords = proposal.trim().split(/\s+/).filter(Boolean).length;
  if (pLen > 0 && pWords < 20) proposalTips.push({ type: "warning", text: "Add more detail — a longer proposal significantly increases response rates" });
  if (pLen > 0 && !/acca|aca|cta|att|aat|qualified|experience|year|specialist/i.test(proposal)) proposalTips.push({ type: "warning", text: "Mention your qualifications and relevant experience" });
  if (pLen > 0 && !/week|day|hour|deadline|complete|deliver|turnaround/i.test(proposal)) proposalTips.push({ type: "neutral", text: "Consider stating your expected delivery timeframe" });
  if (pWords >= 30 && /experience|qualified|deliver/i.test(proposal)) proposalTips.push({ type: "positive", text: "Proposal covers the key points clients look for" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-card overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-border/40">
        <TrendingUp className="h-3.5 w-3.5 text-violet-600 shrink-0" />
        <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Market Intelligence</span>
      </div>

      <div className="px-4 pb-4 pt-3 space-y-3">

        {/* Price health vs market */}
        {competitiveness && (
          <div className={`rounded-xl border px-3 py-2.5 space-y-2 ${competitivenessStyles[competitiveness.probabilityRange.tone] || competitivenessStyles.competitive}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>{competitiveness.label}</span>
              </div>
              <span className="text-sm font-black tabular-nums">{competitiveness.displayRange}</span>
            </div>
            <p className="text-[11px] opacity-90">{competitiveness.summary}</p>
            <div className="space-y-1.5">
              {competitiveness.insights.slice(0, 3).map((insight, i) => (
                <FactorTag key={i} text={insight.text} type={insight.type} />
              ))}
            </div>
          </div>
        )}

        {competitiveness && timeline && (
          <div className="rounded-xl bg-secondary/30 border border-border/50 px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" />
                Delivery fit
              </p>
              <span className="text-[11px] font-bold text-foreground">{competitiveness.market.deliveryTimeline}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-card border border-border/50 px-2 py-1.5">
                <p className="text-muted-foreground">Urgency fit</p>
                <p className="font-bold text-foreground">{Math.round(competitiveness.factors.urgencyFit)} / 100</p>
              </div>
              <div className="rounded-lg bg-card border border-border/50 px-2 py-1.5">
                <p className="text-muted-foreground">Realism</p>
                <p className="font-bold text-foreground">{Math.round(competitiveness.factors.timelineRealism)} / 100</p>
              </div>
            </div>
            {timelineInsight && <FactorTag text={timelineInsight.text} type={timelineInsight.type} />}
          </div>
        )}

        {/* Price health vs market */}
        <div className={`rounded-xl border px-3 py-2.5 space-y-1 ${hs.badge}`}>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <HealthIcon className="h-3.5 w-3.5 shrink-0" />
            {bidHealth.healthLabel}
            {bidHealth.warningType === "underpriced" && (
              <span className="ml-auto text-[10px] font-black uppercase tracking-wide opacity-80">⚠ Fair pricing alert</span>
            )}
          </div>
          <p className="text-[11px] opacity-90">{bidHealth.advice}</p>
        </div>

        {/* Market range grid */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg bg-secondary/60 px-2 py-2">
            <p className="text-muted-foreground text-[10px] mb-0.5">UK market range</p>
            <p className="font-bold text-foreground text-[11px]">
              £{bidHealth.marketRange.min.toLocaleString()}–£{bidHealth.marketRange.max.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/60 px-2 py-2">
            <p className="text-muted-foreground text-[10px] mb-0.5">Your quote</p>
            <p className={`font-bold text-sm ${amount && Number(amount) < bidHealth.marketRange.floor ? "text-rose-600" : "text-emerald-600"}`}>
              {amount && Number(amount) > 0 ? `£${Number(amount).toLocaleString()}` : "—"}
            </p>
          </div>
        </div>

        {/* Budget signal */}
        {bidHealth.budgetSignal && (
          <FactorTag text={bidHealth.budgetSignal.text} type={bidHealth.budgetSignal.type} />
        )}

        {/* Competition */}
        <div className="rounded-xl bg-secondary/30 border border-border/50 px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Competition</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3 shrink-0 text-violet-500" />
              <span>{competition.competitionLevel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="h-3 w-3 shrink-0 text-amber-500" />
              <span>{competition.opportunityWindow}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-500" />
              <span>Shortlist odds: {competition.shortlistOdds}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <Info className="h-3 w-3 shrink-0 text-primary" />
              <span>Expected quality: {competition.expectedBidQuality}</span>
            </div>
          </div>
        </div>

        {/* Proposal tips */}
        {proposalTips.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proposal tips</p>
            {proposalTips.map((tip, i) => <FactorTag key={i} text={tip.text} type={tip.type} />)}
          </div>
        )}

        {/* Fair bidding notice */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border/50 text-[11px] text-muted-foreground">
          <EyeOff className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
          <span><strong className="text-foreground">Fair bidding:</strong> Competitor prices are confidential. You see competition level only — not exact quotes.</span>
        </div>
      </div>
    </motion.div>
  );
}