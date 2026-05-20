import React from "react";
import { CheckCircle2 } from "lucide-react";
import { getCompetitionInterest, getMarketplaceActivity, getOngoingWorkHint } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

/**
 * Practical trust + activity signals for bidders — no AI fit language.
 */
export default function ProjectQuickSignals({
  job,
  bidCount = 0,
  className,
}) {
  const competition = getCompetitionInterest(bidCount);
  const activity = getMarketplaceActivity(job, bidCount);
  const ongoing = getOngoingWorkHint(job);

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {activity.map((signal) => (
          <span
            key={signal.label}
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/40 px-2 py-1 font-medium text-foreground"
          >
            {signal.label === "Verified client" && <CheckCircle2 className="h-3 w-3 text-teal-600" />}
            {signal.label}
          </span>
        ))}
        {ongoing && (
          <span className="text-muted-foreground">· {ongoing}</span>
        )}
      </div>

      <p className="text-sm text-foreground">
        <span className="font-semibold">{competition.headline}</span>
        {competition.subtext && (
          <span className="text-muted-foreground"> — {competition.subtext}</span>
        )}
      </p>
    </div>
  );
}
