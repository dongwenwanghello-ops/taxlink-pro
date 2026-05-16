/**
 * MarketplaceIntelligence — Client-facing project health widget.
 *
 * Shows: fair market range, bidder interest prediction, budget health,
 * supply/demand signals, seasonal factors. Does NOT show competitor data.
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Users, Clock, AlertCircle, CheckCircle2, Sparkles, BarChart3, ShieldCheck, Info } from "lucide-react";
import { predictBidderInterest } from "@/lib/marketplaceIntelligence";

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthBar({ value, colorClass }) {
  return (
    <div className="h-2 rounded-full bg-secondary overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

function StatPill({ label, value, color = "text-foreground", bg = "bg-secondary/60" }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${bg} text-center`}>
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-extrabold ${color} leading-snug`}>{value}</p>
    </div>
  );
}

function BudgetHealthBadge({ level, label }) {
  const styles = {
    good:    "bg-emerald-50 border-emerald-200 text-emerald-700",
    neutral: "bg-amber-50 border-amber-200 text-amber-700",
    warning: "bg-orange-50 border-orange-200 text-orange-700",
    danger:  "bg-rose-50 border-rose-200 text-rose-700",
  };
  const icons = {
    good:    <CheckCircle2 className="h-3 w-3 shrink-0" />,
    neutral: <Info className="h-3 w-3 shrink-0" />,
    warning: <AlertCircle className="h-3 w-3 shrink-0" />,
    danger:  <AlertCircle className="h-3 w-3 shrink-0" />,
  };
  const style = styles[level] || styles.neutral;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${style}`}>
      {icons[level]}{label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketplaceIntelligence({
  category,
  complexity = "medium",
  urgency = "negotiable",
  biddingPeriod,
  biddingDeadline,
  budgetAmount,
  remote = true,
  missingRecords = false,
  multipleIncomeSources = false,
  internationalTaxIssues = false,
  estimatedWorkload,
  deadlinePressure,
  descriptionLength = 0,
  compact = false,
}) {
  if (!category) return null;

  const interest = predictBidderInterest({
    category,
    complexity,
    urgency,
    biddingPeriod,
    biddingDeadline,
    budgetAmount,
    remote,
    missingRecords,
    multipleIncomeSources,
    internationalTaxIssues,
    estimatedWorkload,
    deadlinePressure,
    hasDescription: descriptionLength > 30,
    descriptionLength,
  });

  const { marketRange } = interest;

  const colorMap = {
    emerald: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    amber:   { bar: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
    rose:    { bar: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
  };
  const colors = colorMap[interest.interestColor] || colorMap.amber;
  const pressureTone = interest.pricingPressureScore >= 85 ? "rose" : interest.pricingPressureScore >= 70 ? "amber" : interest.pricingPressureScore >= 50 ? "violet" : "emerald";
  const pressureStyles = {
    rose: { bar: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
    amber: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    violet: { bar: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
    emerald: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  }[pressureTone];

  // Budget vs market range visual
  const budgetPct = budgetAmount
    ? Math.min(120, Math.round((budgetAmount / marketRange.max) * 100))
    : null;
  const marketMinPct = Math.round((marketRange.min / marketRange.max) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-violet-100 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-600 shrink-0" />
          <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Typical Bid Behaviour</span>
        </div>
        <p className="text-xs text-violet-600">How professionals typically open their bids on similar projects</p>
      </div>

      <div className="px-4 pb-4 pt-3 space-y-4">

        {/* Fair Market Range */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-violet-600" />
              Common Opening Bid Range
            </p>
            <span className="text-sm font-extrabold text-violet-800">
              £{marketRange.min.toLocaleString()}–£{marketRange.max.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-violet-600">Recommended range reflects complexity, urgency, workload, delivery model, and market conditions.</p>

          {/* Visual range bar */}
          <div className="relative h-5 bg-secondary rounded-full overflow-hidden">
            {/* Market range band */}
            <div
              className="absolute h-full bg-violet-200 rounded-full"
              style={{ left: `${marketMinPct}%`, width: `${100 - marketMinPct}%` }}
            />
            {/* Budget indicator */}
            {budgetPct !== null && (
              <motion.div
                className={`absolute h-full w-1 rounded-full ${
                  interest.budgetHealthLevel === "good" ? "bg-emerald-500" :
                  interest.budgetHealthLevel === "danger" ? "bg-rose-500" : "bg-amber-500"
                }`}
                initial={{ left: 0 }}
                animate={{ left: `${Math.min(99, budgetPct)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <span className="text-[9px] text-muted-foreground font-medium">Floor</span>
              <span className="text-[9px] text-muted-foreground font-medium">Market max</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Floor: £{marketRange.floor.toLocaleString()}</span>
            <span>Midpoint: £{marketRange.midpoint.toLocaleString()}</span>
            {budgetAmount && <BudgetHealthBadge level={interest.budgetHealthLevel} label={interest.budgetHealthLabel} />}
          </div>
        </div>

        {/* Budget suggestion */}
        <AnimatePresence>
          {interest.budgetSuggestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-xl border px-3 py-2.5 text-xs ${
                interest.budgetHealthLevel === "danger"
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              <div className="flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{interest.budgetSuggestion}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bidder Interest Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              Bidder Interest
            </p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${colors.text} ${colors.bg} border`}>
              {interest.interestLevel}
            </span>
          </div>
          <HealthBar value={interest.interestScore} colorClass={colors.bar} />
          <p className="text-[11px] text-muted-foreground">{interest.qualityLabel}</p>
        </div>

        {!compact && (
          <div className="rounded-xl border border-border/60 bg-white/70 px-3 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bidder Interest Volume</p>
                <p className="text-xs text-muted-foreground">How many professionals are likely to want this project.</p>
              </div>
              <span className={`text-lg font-extrabold ${colors.text}`}>{interest.interestScore}%</span>
            </div>
            <HealthBar value={interest.interestScore} colorClass={colors.bar} />
          </div>
        )}

        {!compact && (
          <div className={`rounded-xl border px-3 py-3 space-y-2 ${pressureStyles.bg}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Expected Pricing Pressure</p>
                <p className="text-xs opacity-80">How strongly conditions push professional quotes upward.</p>
              </div>
              <span className={`text-lg font-extrabold ${pressureStyles.text}`}>{interest.pricingPressureLevel}</span>
            </div>
            <HealthBar value={interest.pricingPressureScore} colorClass={pressureStyles.bar} />
          </div>
        )}

        {/* Stats grid */}
        {!compact && (
          <div className="grid grid-cols-3 gap-2">
            <StatPill
              label="Expected bids"
              value={`${interest.expectedMin}–${interest.expectedMax}`}
              color={colors.text}
              bg={`${colors.bg} border`}
            />
            <StatPill label="First bid in" value={interest.estimatedResponseSpeed} color="text-foreground" />
            <StatPill
              label="Bid quality"
              value={interest.bidQuality}
              color="text-foreground"
            />
          </div>
        )}

        {!compact && (
          <div className="grid grid-cols-2 gap-2">
            <StatPill label="Expected bidder type" value={interest.expectedBidderType} color="text-primary" />
            <StatPill label="Market activity" value={interest.marketActivityLevel} color={colors.text} bg={`${colors.bg} border`} />
            <StatPill label="Recommended bidding" value={interest.recommendedBiddingDuration.label} color="text-primary" />
          </div>
        )}

        {/* Supply & Demand signal */}
        {!compact && (
          <div className="rounded-xl bg-secondary/40 border border-border/60 px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Supply & Demand</p>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">{marketRange.supplyDemand.note}</span>
            </div>
            {marketRange.seasonality.label && (
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-amber-700 font-semibold">{marketRange.seasonality.label}:</span>
                <span className="text-muted-foreground">{marketRange.seasonality.note}</span>
              </div>
            )}
          </div>
        )}

        {/* Marketplace quality note */}
        {!compact && budgetAmount && interest.budgetHealthLevel === "good" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Your budget is within fair market range — you should attract qualified, experienced professionals.</span>
          </div>
        )}

        {!compact && interest.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recommendations</p>
            {interest.recommendations.slice(0, 4).map((rec, i) => (
              <div
                key={`${rec.text}-${i}`}
                className={`flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                  rec.type === "positive"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : rec.type === "danger"
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
              >
                {rec.type === "positive" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}