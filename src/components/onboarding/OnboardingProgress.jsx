import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getOnboardingProgressPercent, getOnboardingEffortMessage } from "@/lib/onboardingUX";

export default function OnboardingProgress({
  steps = [],
  currentStep = 1,
  role = "professional",
}) {
  const total = steps.length || 1;
  const active = steps[currentStep - 1];
  const percent = getOnboardingProgressPercent(currentStep, role);
  const effortMessage = getOnboardingEffortMessage(currentStep, role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <span>
          Step {currentStep} of {total}
        </span>
        <span className="text-foreground/80 text-right">{effortMessage}</span>
      </div>
      {active?.title && currentStep > 1 && (
        <motion.div
          key={`${role}-${currentStep}-title`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-sm font-bold text-foreground">{active.title}</p>
          {active.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{active.subtitle}</p>
          )}
        </motion.div>
      )}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      <div className="flex gap-1.5">
        {steps.map((step) => (
          <div
            key={step.id}
            title={step.label}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              step.id <= currentStep ? "bg-primary/40" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
