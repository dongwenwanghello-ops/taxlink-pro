/**
 * WinChanceBreakdown — Detailed win probability analysis for project detail page
 * Shows factors affecting win chance and actionable recommendations
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, AlertCircle, CheckCircle2, PieChart, Zap,
  EyeOff, BarChart3, Users, ShieldCheck, Clock, Flame
} from "lucide-react";

function FactorRow({ label, score, maxScore = 100, icon: Icon, isPositive, detail }) {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          <span className="font-medium">{label}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
          {isPositive ? "+" : "−"}{Math.abs(score)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}
        />
      </div>
      {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

export default function WinChanceBreakdown({
  percent,
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
}) {
  if (!percent || typeof percent !== "number") return null;

  const isHigh = percent >= 70;
  const isMedium = percent >= 40 && percent < 70;

  const bgColor = isHigh ? "border-emerald-200 bg-emerald-50" : isMedium ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50";
  const textColor = isHigh ? "text-emerald-700" : isMedium ? "text-amber-700" : "text-rose-700";
  const labelText = isHigh ? "High opportunity" : isMedium ? "Moderate chance" : "Challenging";
  const emoji = isHigh ? "🔥" : isMedium ? "⚡" : "⚠️";

  // Prepare factors for breakdown
  const factors = [
    {
      label: "Price Competitiveness",
      score: Math.round(priceScore * 25),
      icon: BarChart3,
      isPositive: priceScore >= 0.75,
      detail: budgetAmount ? `Your bid vs market rate` : "No budget set",
    },
    {
      label: "Competition Level",
      score: Math.round(competitionScore * 20),
      icon: Users,
      isPositive: competitionScore >= 0.75,
      detail: `${bidCount} bidder${bidCount !== 1 ? "s" : ""} competing`,
    },
    {
      label: "Client Reliability",
      score: Math.round(trustScore * 18),
      icon: ShieldCheck,
      isPositive: trustScore >= 0.85,
      detail: `${clientPaymentRate}% payment history`,
    },
    {
      label: "Your Reputation",
      score: Math.round(reputationScore * 15),
      icon: TrendingUp,
      isPositive: reputationScore >= 0.70,
      detail: `${userRating} rating from past work`,
    },
    {
      label: "Project Demand",
      score: Math.round(demandScore * 10),
      icon: Flame,
      isPositive: demandScore >= 0.70,
      detail: "Market interest level",
    },
    {
      label: "Urgency & Speed",
      score: Math.round(urgencyScore * 9),
      icon: Clock,
      isPositive: urgencyScore >= 0.65,
      detail: "Your response speed vs deadline",
    },
  ];

  const positiveFactors = factors.filter(f => f.isPositive);
  const concernFactors = factors.filter(f => !f.isPositive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${bgColor} p-5 space-y-5`}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{emoji}</span>
            <p className={`font-bold text-sm ${textColor}`}>{labelText}</p>
          </div>
          <p className={`text-3xl font-black tabular-nums ${textColor}`}>{percent}% Win Chance</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isHigh
              ? "Strong position. Your bid, reputation, and market timing align well."
              : isMedium
                ? "Competitive. Strengthen your proposal or response speed to stand out."
                : "Difficult. Consider reviewing your pricing or waiting for less competitive projects."}
          </p>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Score breakdown</p>
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

      {/* Strengths & concerns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-current border-opacity-15">
        {positiveFactors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
            </p>
            <ul className="space-y-1">
              {positiveFactors.slice(0, 2).map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground">+ {f.label}</li>
              ))}
            </ul>
          </div>
        )}
        {concernFactors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-rose-700 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Areas to improve
            </p>
            <ul className="space-y-1">
              {concernFactors.slice(0, 2).map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground">− {f.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-black/5 border border-border/40 text-[10px] text-muted-foreground">
        <EyeOff className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
        <span>
          <strong className="text-foreground">Fair bidding:</strong> Competitor pricing is confidential. You see market factors only.
        </span>
      </div>
    </motion.div>
  );
}