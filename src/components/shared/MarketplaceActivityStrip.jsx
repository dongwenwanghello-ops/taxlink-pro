import React from "react";
import { getMarketplaceActivity } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

/** Minimal activity pills — prefer ProjectQuickSignals on project detail */
export default function MarketplaceActivityStrip({ job, bidCount = 0, className }) {
  const signals = getMarketplaceActivity(job, bidCount);
  if (!signals.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {signals.map((signal) => (
        <span
          key={signal.label}
          className="text-[11px] font-medium rounded-md border border-border/70 bg-secondary/40 text-foreground px-2 py-1"
        >
          {signal.label}
        </span>
      ))}
    </div>
  );
}
