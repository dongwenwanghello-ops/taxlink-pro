import React from "react";
import { getQuoteCountdownPsychology, getClientTrustProfile, getProjectScopeClarity } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

const chipBase = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold";

export default function ProjectBiddingTopBar({ job, deadline, biddingOpen = true, className }) {
  const countdown = getQuoteCountdownPsychology(deadline);
  const trust = getClientTrustProfile(job);
  const scope = getProjectScopeClarity(job);
  const verifiedCount = trust.verifications.filter((v) => v.verified).length;

  const chips = [
    biddingOpen && {
      label: "🟢 Open for quotes",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    countdown && !countdown.tone?.includes("expired") && {
      label: `⏰ ${countdown.message.replace(/^🟢 |^🟠 |^🔴 /, "")}`,
      className:
        countdown.tone === "critical"
          ? "bg-rose-50 text-rose-800 border-rose-200"
          : countdown.tone === "urgent"
            ? "bg-amber-50 text-amber-800 border-amber-200"
            : "bg-slate-50 text-slate-700 border-slate-200",
    },
    {
      label: "🚀 Early quotes more likely to be reviewed",
      className: "bg-violet-50 text-violet-800 border-violet-200",
    },
    verifiedCount >= 2 && {
      label: "✅ Verified client",
      className: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      label: `⚡ ${trust.activity.label}`,
      className: "bg-teal-50 text-teal-800 border-teal-200",
    },
    {
      label: `${scope.emoji} ${scope.label}`,
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
  ].filter(Boolean);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <span key={chip.label} className={cn(chipBase, chip.className)}>
          {chip.label}
        </span>
      ))}
    </div>
  );
}
