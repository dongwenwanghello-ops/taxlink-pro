/**
 * WinChanceIndicator — Qualitative competition signal for job cards
 * Never exposes exact bid counts to reduce conversion friction
 */
import React from "react";
import { Rocket, TrendingUp, Users } from "lucide-react";
import { getCompetitionInterest } from "@/lib/projectBiddingUX";

export default function WinChanceIndicator({ bidCount = 0 }) {
  const interest = getCompetitionInterest(bidCount);
  const Icon = interest.icon === "rocket" ? Rocket : interest.icon === "trending" ? TrendingUp : Users;

  const bgColor = interest.tone === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <p className="text-xs font-semibold leading-snug">
        {interest.level === "first" ? "🚀 " : ""}{interest.headline}
      </p>
    </div>
  );
}
