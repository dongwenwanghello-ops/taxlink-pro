import React from "react";
import { Activity, Users, MapPin, TrendingUp } from "lucide-react";
import { MARKETPLACE_ACTIVITY_SIGNALS } from "@/lib/onboardingUX";

const ICONS = [Users, TrendingUp, MapPin, Activity];

export default function OnboardingActivityStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {MARKETPLACE_ACTIVITY_SIGNALS.map((signal, index) => {
        const Icon = ICONS[index % ICONS.length];
        return (
          <div
            key={signal.id}
            className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2.5"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground leading-snug">{signal.text}</p>
          </div>
        );
      })}
    </div>
  );
}

