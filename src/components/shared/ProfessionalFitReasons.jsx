import React from "react";
import { cn } from "@/lib/utils";

export default function ProfessionalFitReasons({
  reasons = [],
  title = "Relevant experience",
  compact = false,
  className,
}) {
  if (!reasons.length) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className={cn(
        "font-semibold text-foreground",
        compact ? "text-[11px]" : "text-xs",
      )}>
        {title}
      </p>
      <ul className={cn("space-y-1", compact ? "text-[11px]" : "text-xs")}>
        {reasons.map((reason) => (
          <li key={reason.id} className="text-muted-foreground flex items-start gap-1.5">
            <span className="text-teal-600 shrink-0">·</span>
            <span>{reason.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
