import React from "react";
import { Clock, Timer, AlertTriangle } from "lucide-react";
import { useBiddingCountdown } from "@/hooks/useBiddingCountdown";
import { formatDeadline } from "@/lib/countdownUtils";
import { getQuoteCountdownPsychology } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

const URGENCY_STYLES = {
  comfortable: {
    wrap: "bg-white border-emerald-200/70 text-emerald-800",
    bar: "bg-gradient-to-r from-emerald-400 to-emerald-500",
    glow: "shadow-[0_0_14px_rgba(16,185,129,0.25)]",
    icon: Clock,
    ring: "ring-emerald-500/10",
  },
  urgent: {
    wrap: "bg-white border-amber-200/80 text-amber-800",
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
    glow: "shadow-[0_0_14px_rgba(245,158,11,0.28)]",
    icon: Timer,
    ring: "ring-amber-500/15",
  },
  critical: {
    wrap: "bg-white border-red-200/90 text-red-800",
    bar: "bg-gradient-to-r from-red-500 to-rose-600",
    glow: "shadow-[0_0_16px_rgba(239,68,68,0.32)]",
    icon: AlertTriangle,
    ring: "ring-red-500/20",
  },
  expired: {
    wrap: "bg-white border-slate-200 text-slate-600",
    bar: "bg-slate-400",
    glow: "",
    icon: Clock,
    ring: "ring-slate-300/15",
  },
};

export default function CountdownBadge({
  deadline,
  startDate,
  biddingPeriod,
  compact = false,
  className,
  showProgress = true,
  showDeadlineHint = false,
}) {
  const { hasDeadline, timeRemaining, urgency, progress, isClosed, label, shortLabel } =
    useBiddingCountdown(deadline, { startDate, biddingPeriod });

  if (!hasDeadline || !timeRemaining || !urgency) return null;

  const styles = URGENCY_STYLES[urgency] || URGENCY_STYLES.comfortable;
  const Icon = styles.icon;
  const psychology = !isClosed ? getQuoteCountdownPsychology(deadline) : null;
  const displayLabel = isClosed
    ? "Bidding Closed"
    : psychology
      ? `${psychology.emoji} ${psychology.message}`
      : compact
        ? shortLabel || label
        : label;

  const elapsedPct =
    progress != null ? Math.round(progress * 100) : urgency === "critical" ? 92 : urgency === "urgent" ? 75 : 40;
  const remainingPct = Math.max(4, Math.min(100, 100 - elapsedPct));

  const deadlineHint = showDeadlineHint && deadline ? formatDeadline(deadline) : null;

  return (
    <div
      className={cn(
        "w-full rounded-xl border overflow-hidden transition-all duration-300",
        styles.wrap,
        styles.ring,
        "ring-1",
        urgency === "critical" && !isClosed && "shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-3 py-2 min-w-0">
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary/60",
            urgency === "critical" && !isClosed && "animate-pulse",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70 leading-none mb-0.5">
            {isClosed ? "Status" : urgency === "critical" ? "Ending soon" : "Bidding deadline"}
          </p>
          <p className="text-xs font-semibold leading-tight truncate">{displayLabel}</p>
          {deadlineHint && !isClosed && (
            <p className="text-[10px] opacity-70 mt-0.5 truncate">Closes {deadlineHint}</p>
          )}
        </div>

        {!isClosed && !compact && timeRemaining.days === 0 && (
          <div className="hidden sm:flex flex-col items-end shrink-0 tabular-nums">
            <span className="text-sm font-extrabold leading-none">
              {String(timeRemaining.hours).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-semibold uppercase opacity-70">hrs</span>
          </div>
        )}
      </div>

      {showProgress && !isClosed && (
        <div className="px-3 pb-2">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-200/70">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", styles.bar, styles.glow)}
              style={{ width: `${remainingPct}%` }}
              role="progressbar"
              aria-valuenow={remainingPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-[pulse_2.8s_ease-in-out_infinite]" />
          </div>
        </div>
      )}
    </div>
  );
}
