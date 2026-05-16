import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { getTimeRemaining, getUrgencyLevel } from "@/lib/countdownUtils";
import { cn } from "@/lib/utils";

export default function CountdownBadge({ deadline, compact = false }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [urgency, setUrgency] = useState("normal");

  useEffect(() => {
    const updateCountdown = () => {
      const time = getTimeRemaining(deadline);
      if (time) {
        setTimeRemaining(time);
        setUrgency(getUrgencyLevel(deadline));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeRemaining) return null;

  const urgencyStyles = {
    expired: "bg-slate-100 text-slate-700 border-slate-300",
    critical: "bg-red-100 text-red-700 border-red-300 animate-pulse",
    high: "bg-orange-100 text-orange-700 border-orange-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    normal: "bg-slate-100 text-slate-700 border-slate-300",
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold",
      urgencyStyles[urgency]
    )}>
      <Clock className="h-3 w-3" />
      <span>{compact ? timeRemaining.text : `Bidding ${timeRemaining.text}`}</span>
    </div>
  );
}