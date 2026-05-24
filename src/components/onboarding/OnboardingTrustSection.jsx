import React from "react";
import { Star, ShieldCheck, Briefcase, BadgeCheck } from "lucide-react";

const PROOF_ITEMS = [
  { icon: Briefcase, label: "Real projects" },
  { icon: BadgeCheck, label: "Verified professionals" },
  { icon: ShieldCheck, label: "Secure platform" },
];

export default function OnboardingTrustSection() {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/30 px-6 py-8 text-center space-y-4">
      <p className="text-sm font-semibold text-foreground">
        Trusted by UK tax professionals and clients
      </p>
      <div className="flex items-center justify-center gap-0.5 text-amber-500" aria-label="5 star rating">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {PROOF_ITEMS.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
