import React from "react";
import { Info } from "lucide-react";
import {
  analyzeProjectComplexity,
  getGuidedMarketGuidance,
} from "@/lib/guidedPricing";
import { getOngoingWorkHint } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

export default function GuidedPricingPanel({
  job,
  marketplaceScore = null,
  compact = false,
  insightsMode = false,
}) {
  if (!job) return null;

  const guidance = getGuidedMarketGuidance(job, marketplaceScore);
  const complexity = guidance.complexity || analyzeProjectComplexity(job);
  const ongoing = getOngoingWorkHint(job);

  if (compact) {
    return (
      <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5 text-sm space-y-1">
        <p className="font-medium text-foreground">{guidance.typicalLabel}</p>
        <p className="text-xs text-muted-foreground">{guidance.alignmentLabel}</p>
        {ongoing && (
          <p className="text-xs text-muted-foreground">{ongoing}</p>
        )}
      </div>
    );
  }

  if (insightsMode) {
    return (
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2 text-sm">
        <p className="font-semibold text-foreground">Pricing guidance</p>
        <p className="text-foreground">{guidance.typicalLabel}</p>
        <p className="text-xs text-muted-foreground">{guidance.alignmentLabel}</p>
        <p className="text-xs text-muted-foreground">
          {complexity.label} complexity · {complexity.pricingRange?.label || complexity.description}
        </p>
        {ongoing && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3 shrink-0" />
            {ongoing}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2">
      <p className="text-sm font-semibold text-foreground">{guidance.typicalLabel}</p>
      <p className="text-xs text-muted-foreground">{guidance.alignmentLabel}</p>
      {ongoing && (
        <p className="text-xs text-muted-foreground">{ongoing}</p>
      )}
    </div>
  );
}
