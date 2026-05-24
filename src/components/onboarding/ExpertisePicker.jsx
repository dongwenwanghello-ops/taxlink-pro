import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAX_PRIMARY_EXPERTISE,
  MAX_SECONDARY_EXPERTISE,
  normalizeExpertise,
  togglePrimaryExpertise,
  toggleSecondaryExpertise,
} from "@/lib/expertiseMatching";

export default function ExpertisePicker({
  form,
  setForm,
  onLimitMessage,
  visibleServices,
  showMoreServices,
  onToggleShowMore,
}) {
  const { primary, secondary } = normalizeExpertise(form);

  const handlePrimary = (service) => {
    const { next, message } = togglePrimaryExpertise(form, service);
    setForm(next);
    if (message) onLimitMessage?.(message);
  };

  const handleSecondary = (service) => {
    const { next, message } = toggleSecondaryExpertise(form, service);
    setForm(next);
    if (message) onLimitMessage?.(message);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Primary expertise</strong> (max {MAX_PRIMARY_EXPERTISE}) —
        strongest match weight ({1.0}).{" "}
        <strong className="text-foreground">Secondary expertise</strong> (max {MAX_SECONDARY_EXPERTISE}) —
        lighter weight ({0.4}). Select only what you truly offer.
      </div>

      <div className="space-y-3">
        <Label>
          Primary expertise ({primary.length}/{MAX_PRIMARY_EXPERTISE})
        </Label>
        <p className="text-xs text-muted-foreground -mt-1">
          Your core services — shown first to clients and weighted highest in matching.
        </p>
        <div className="flex flex-wrap gap-2">
          {visibleServices.map((s) => {
            const isPrimary = primary.includes(s);
            const atPrimaryCap = primary.length >= MAX_PRIMARY_EXPERTISE && !isPrimary;
            return (
              <Badge
                key={`p-${s}`}
                variant={isPrimary ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-sm py-1.5 px-3 select-none transition-all duration-200",
                  isPrimary && "ring-1 ring-primary/30",
                  atPrimaryCap && !isPrimary && "opacity-40 cursor-not-allowed",
                )}
                onClick={() => !atPrimaryCap && handlePrimary(s)}
              >
                {s}
                {isPrimary && <X className="h-3 w-3 ml-1.5" />}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <Label>
          Secondary expertise ({secondary.length}/{MAX_SECONDARY_EXPERTISE})
        </Label>
        <p className="text-xs text-muted-foreground -mt-1">
          Additional areas you can support — lower matching weight than primary.
        </p>
        <div className="flex flex-wrap gap-2">
          {visibleServices.map((s) => {
            const isSecondary = secondary.includes(s);
            const isPrimary = primary.includes(s);
            const atSecondaryCap = secondary.length >= MAX_SECONDARY_EXPERTISE && !isSecondary;
            const disabled = isPrimary || (atSecondaryCap && !isSecondary);

            return (
              <Badge
                key={`s-${s}`}
                variant={isSecondary ? "secondary" : "outline"}
                className={cn(
                  "cursor-pointer text-sm py-1.5 px-3 select-none transition-all duration-200",
                  isSecondary && "bg-violet-100 text-violet-900 border-violet-200 hover:bg-violet-100",
                  isPrimary && "opacity-35 cursor-not-allowed",
                  disabled && !isPrimary && !isSecondary && "opacity-40 cursor-not-allowed",
                )}
                onClick={() => !disabled && handleSecondary(s)}
              >
                {s}
                {isSecondary && <X className="h-3 w-3 ml-1.5" />}
              </Badge>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleShowMore}
        className="text-xs font-semibold text-primary flex items-center gap-1"
      >
        {showMoreServices ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {showMoreServices ? "Show fewer expertise options" : "Show more expertise options"}
      </button>
    </div>
  );
}
