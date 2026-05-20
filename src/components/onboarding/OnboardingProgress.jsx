import React from "react";
import { cn } from "@/lib/utils";
import { getOnboardingProgressPercent } from "@/lib/onboardingUX";

export default function OnboardingProgress({
  steps = [],
  currentStep = 1,
  role = "professional",
}) {
  const total = steps.length || 1;
  const active = steps[currentStep - 1];
  const percent = getOnboardingProgressPercent(currentStep, role);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Step {currentStep} of {total}
        </span>
        <span className="text-primary font-semibold">{percent}% complete</span>
      </div>
      {active?.title && (
        <div>
          <p className="text-sm font-bold text-foreground">{active.title}</p>
          {active.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{active.subtitle}</p>
          )}
        </div>
      )}
      <div className="flex gap-1.5">
        {steps.map((step) => (
          <div
            key={step.id}
            title={step.label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              step.id <= currentStep ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

