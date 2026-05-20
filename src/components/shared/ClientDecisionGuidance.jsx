import React from "react";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import {
  CLIENT_COMPARE_CRITERIA,
  CLIENT_EVALUATION_STEPS,
  getShortlistGuidance,
} from "@/lib/clientBidEvaluation";
import { cn } from "@/lib/utils";

export default function ClientDecisionGuidance({
  activeStep = 0,
  shortlistedCount = 0,
  totalBids = 0,
  className,
}) {
  const shortlistHint = getShortlistGuidance(shortlistedCount, totalBids);

  return (
    <div className={cn("rounded-xl border border-border/60 bg-secondary/25 px-4 py-3.5 space-y-3", className)}>
      <div>
        <p className="text-sm font-semibold text-foreground">How to choose the right professional</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You are buying trust and expertise — compare fit before you compare price.
        </p>
      </div>

      <ul className="space-y-1.5">
        {CLIENT_COMPARE_CRITERIA.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-xs">
            {item.positive ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <span className={item.positive ? "text-foreground" : "text-muted-foreground font-medium"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-1 text-[11px] pt-1 border-t border-border/50">
        {CLIENT_EVALUATION_STEPS.map((step, i) => (
          <span key={step.id} className="flex items-center gap-1">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            <span
              className={cn(
                "font-medium",
                i <= activeStep ? "text-teal-800" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </span>
        ))}
      </div>

      {shortlistHint && (
        <p className="text-xs text-violet-800 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-2">
          {shortlistHint}
        </p>
      )}
    </div>
  );
}
