import React from "react";
import { Badge } from "@/components/ui/badge";
import { normalizeExpertise } from "@/lib/expertiseMatching";

/**
 * Primary / secondary expertise blocks for profile cards.
 */
export default function ProfessionalExpertiseDisplay({ profile, compact = false }) {
  const { primary, secondary } = normalizeExpertise(profile);
  if (!primary.length && !secondary.length) return null;

  if (compact) {
    return (
      <div className="space-y-1.5">
        {primary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {primary.slice(0, 3).map((s) => (
              <Badge key={s} className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                {s}
              </Badge>
            ))}
          </div>
        )}
        {secondary.length > 0 && (
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            Also: {secondary.slice(0, 4).join(", ")}
            {secondary.length > 4 ? ` +${secondary.length - 4}` : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 text-xs">
      {primary.length > 0 && (
        <div>
          <p className="font-semibold text-foreground mb-1">Primary</p>
          <div className="flex flex-wrap gap-1.5">
            {primary.map((s) => (
              <Badge key={s} className="bg-primary/10 text-primary border-primary/20 font-medium">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {secondary.length > 0 && (
        <div>
          <p className="font-semibold text-muted-foreground mb-1">Secondary</p>
          <div className="flex flex-wrap gap-1.5">
            {secondary.map((s) => (
              <Badge key={s} variant="secondary" className="font-normal bg-violet-50 text-violet-900 border-violet-100">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
