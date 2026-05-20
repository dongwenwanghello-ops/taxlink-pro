/**
 * WinChanceBreakdown — Detailed fit analysis (inside Marketplace insights only).
 */
import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, AlertCircle, CheckCircle2, EyeOff, BarChart3, Users,
  ShieldCheck, Clock, Flame,
} from "lucide-react";
import { getCompetitionInterest } from "@/lib/projectBiddingUX";

function FactorRow({ label, score, maxScore = 100, icon: Icon, isPositive, detail }) {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          <span className="font-medium">{label}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${isPositive ? "text-emerald-600" : "text-muted-foreground"}`}>
          {isPositive ? "Strong" : "Review"}
        </span>
      </div>
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${isPositive ? "bg-teal-500/70" : "bg-slate-300"}`}
        />
      </div>
      {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

export default function WinChanceBreakdown({
  percent,
  displayRange,
  label,
  summary,
  insights = [],
  priceScore,
  competitionScore,
  trustScore,
  reputationScore,
  demandScore,
  urgencyScore,
  category,
  bidCount,
  budgetAmount,
  userRating,
  clientPaymentRate,
  complexity,
  detailed = false,
}) {
  if (!percent || typeof percent !== "number" || !detailed) return null;

  const competitionInterest = getCompetitionInterest(bidCount);
  const fitLabel = label || "Market fit";

  const factors = [
    {
      label: "Pricing vs budget",
      score: Math.round(priceScore * 25),
      icon: BarChart3,
      isPositive: priceScore >= 0.75,
      detail: budgetAmount ? "Compared with opening budget" : "Market range only",
    },
    {
      label: "Competition",
      score: Math.round(competitionScore * 20),
      icon: Users,
      isPositive: competitionScore >= 0.75,
      detail: competitionInterest.headline,
    },
    {
      label: "Client reliability",
      score: Math.round(trustScore * 18),
      icon: ShieldCheck,
      isPositive: trustScore >= 0.85,
      detail: `${clientPaymentRate}% payment history`,
    },
    {
      label: "Your reputation",
      score: Math.round(reputationScore * 15),
      icon: TrendingUp,
      isPositive: reputationScore >= 0.70,
      detail: `${userRating} rating from past work`,
    },
    {
      label: "Project demand",
      score: Math.round(demandScore * 10),
      icon: Flame,
      isPositive: demandScore >= 0.70,
      detail: "Interest from other professionals",
    },
    {
      label: "Timeline fit",
      score: Math.round(urgencyScore * 9),
      icon: Clock,
      isPositive: urgencyScore >= 0.65,
      detail: "Delivery timing vs client urgency",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-4"
    >
      <div>
        <p className="text-sm font-bold text-foreground">{fitLabel}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {summary || "Based on scope, budget, competition, and your profile — not a guaranteed outcome."}
        </p>
      </div>

      {insights.length > 0 && (
        <div className="space-y-1.5">
          {insights.slice(0, 3).map((insight, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-teal-600" />
              {insight.text}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2.5 pt-1 border-t border-border/50">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Factor overview</p>
        {factors.map((factor, i) => (
          <FactorRow
            key={i}
            label={factor.label}
            score={factor.score}
            maxScore={25}
            icon={factor.icon}
            isPositive={factor.isPositive}
            detail={factor.detail}
          />
        ))}
      </div>

      <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
        <EyeOff className="h-3 w-3 shrink-0 mt-0.5" />
        <span>Competitor pricing stays confidential. Use this as guidance, not a prediction.</span>
      </div>
    </motion.div>
  );
}
