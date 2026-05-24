import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_CARD_CONFIG } from "@/lib/onboardingUX";

const CARD_META = {
  professional: { Icon: Briefcase, accent: "from-blue-500/10 to-primary/5" },
  client: { Icon: Search, accent: "from-sky-500/10 to-primary/5" },
};

export default function OnboardingRoleCards({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Object.values(ROLE_CARD_CONFIG).map((role) => {
        const selected = value === role.value;
        const { Icon, accent } = CARD_META[role.value];

        return (
          <motion.button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            whileHover={{ scale: selected ? 1.02 : 1.01 }}
            whileTap={{ scale: 0.99 }}
            animate={{ scale: selected ? 1.02 : 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "rounded-2xl border p-8 text-left transition-all duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selected
                ? cn(
                    "border-primary bg-gradient-to-br shadow-md shadow-primary/10 ring-1 ring-primary/25",
                    accent,
                  )
                : "border-border bg-card hover:border-primary/35 hover:shadow-sm",
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
                  selected ? "bg-primary text-white" : "bg-secondary text-primary",
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-lg font-bold text-foreground">{role.title}</p>
                <p className="text-sm text-muted-foreground">{role.subtitle}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {role.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2 text-sm text-foreground/90"
                >
                  <Check className={cn("h-4 w-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                  {benefit}
                </li>
              ))}
            </ul>
          </motion.button>
        );
      })}
    </div>
  );
}
