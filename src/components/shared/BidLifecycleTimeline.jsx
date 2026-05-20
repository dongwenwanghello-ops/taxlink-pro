import React from "react";
import { CheckCircle2, Circle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BidLifecycleTimeline({ steps = [], compact = false }) {
  if (!steps.length) return null;

  return (
    <div className={cn("w-full", compact ? "py-1" : "py-2")}>
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[4.5rem] shrink-0">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border",
                  step.state === "done" && "bg-emerald-100 border-emerald-300 text-emerald-700",
                  step.state === "current" && "bg-teal-100 border-teal-400 text-teal-800 ring-2 ring-teal-200",
                  step.state === "upcoming" && "bg-muted border-border text-muted-foreground",
                  step.state === "skipped" && "bg-rose-50 border-rose-200 text-rose-400",
                )}
              >
                {step.state === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : step.state === "skipped" ? (
                  <Minus className="h-3 w-3" />
                ) : (
                  <Circle className={cn("h-3 w-3", step.state === "current" && "fill-teal-600/30")} />
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] mt-1 text-center leading-tight max-w-[5rem]",
                  step.state === "current" ? "font-bold text-teal-800" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-[8px] rounded-full mb-4",
                  step.state === "done" ? "bg-emerald-300" : "bg-border",
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
