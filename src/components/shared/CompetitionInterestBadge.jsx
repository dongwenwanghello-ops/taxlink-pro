import React from "react";
import { getCompetitionInterest } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

/** Inline competition line — avoid large coloured panels */
export default function CompetitionInterestBadge({ bidCount = 0, compact = true, className }) {
  const interest = getCompetitionInterest(bidCount);

  return (
    <p className={cn("text-sm text-foreground", className)}>
      <span className="font-semibold">{interest.headline}</span>
      {!compact && interest.subtext && (
        <span className="text-muted-foreground"> — {interest.subtext}</span>
      )}
    </p>
  );
}
