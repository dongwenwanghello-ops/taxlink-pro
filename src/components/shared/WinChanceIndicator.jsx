/**
 * WinChanceIndicator — Market context indicator for job cards
 * Shows competition level and early-mover signal based on real bid count
 */
import React from "react";
import { Users, Zap, TrendingUp } from "lucide-react";

export default function WinChanceIndicator({ bidCount = 0 }) {
  const isEarly  = bidCount === 0;
  const isLow    = bidCount >= 1 && bidCount <= 2;
  const isMedium = bidCount >= 3 && bidCount <= 6;

  const bgColor   = isEarly  ? "bg-emerald-50 border-emerald-200"
                  : isLow    ? "bg-emerald-50 border-emerald-200"
                  : isMedium ? "bg-amber-50 border-amber-200"
                  :            "bg-secondary border-border";
  const textColor = isEarly  ? "text-emerald-700"
                  : isLow    ? "text-emerald-700"
                  : isMedium ? "text-amber-700"
                  :            "text-muted-foreground";
  const Icon      = isEarly ? Zap : isLow ? TrendingUp : Users;
  const label     = isEarly  ? "First mover advantage — no bids yet"
                  : isLow    ? `${bidCount} bid${bidCount > 1 ? "s" : ""} so far — low competition`
                  : isMedium ? `${bidCount} bids — actively competitive`
                  :            `${bidCount} bids — high competition`;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor}`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${textColor}`} />
      <p className={`text-xs font-semibold ${textColor}`}>{label}</p>
    </div>
  );
}