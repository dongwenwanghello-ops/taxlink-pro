import React from "react";
import { buildQualificationSummaryLines } from "@/lib/professionalProfileModel";

export default function ProfessionalQualificationLines({ profile, className = "" }) {
  const lines = buildQualificationSummaryLines(profile);
  if (!lines.length) return null;

  return (
    <ul className={`space-y-0.5 text-xs text-muted-foreground ${className}`}>
      {lines.map((line) => (
        <li key={line} className="leading-snug">
          {line}
        </li>
      ))}
    </ul>
  );
}
