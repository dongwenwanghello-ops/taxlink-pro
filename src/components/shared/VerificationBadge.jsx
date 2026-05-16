import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";

const BADGE_STYLES = {
  ACA:   { bg: "bg-blue-50 border-blue-200",   text: "text-blue-700",   dot: "bg-blue-500" },
  ACCA:  { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  CTA:   { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  ATT:   { bg: "bg-amber-50 border-amber-200",  text: "text-amber-700",  dot: "bg-amber-500" },
  AAT:   { bg: "bg-sky-50 border-sky-200",      text: "text-sky-700",    dot: "bg-sky-500" },
  CIMA:  { bg: "bg-rose-50 border-rose-200",    text: "text-rose-700",   dot: "bg-rose-500" },
  CIPFA: { bg: "bg-orange-50 border-orange-200",text: "text-orange-700", dot: "bg-orange-500" },
  FCA:   { bg: "bg-indigo-50 border-indigo-200",text: "text-indigo-700", dot: "bg-indigo-500" },
  FCCA:  { bg: "bg-purple-50 border-purple-200",text: "text-purple-700", dot: "bg-purple-500" },
};

const BADGE_DESCRIPTIONS = {
  ACA:   "Associate Chartered Accountant — ICAEW",
  ACCA:  "Association of Chartered Certified Accountants",
  CTA:   "Chartered Tax Adviser — CIOT",
  ATT:   "Association of Taxation Technicians",
  AAT:   "Association of Accounting Technicians",
  CIMA:  "Chartered Institute of Management Accountants",
  CIPFA: "Chartered Institute of Public Finance & Accountancy",
  FCA:   "Fellow Chartered Accountant — ICAEW",
  FCCA:  "Fellow Chartered Certified Accountant",
};

export default function VerificationBadge({ qualification, size = "sm" }) {
  const style = BADGE_STYLES[qualification] || {
    bg: "bg-secondary border-border", text: "text-secondary-foreground", dot: "bg-muted-foreground"
  };
  const description = BADGE_DESCRIPTIONS[qualification];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold cursor-default select-none ${style.bg} ${style.text} ${size === "lg" ? "px-3 py-1 text-sm" : ""}`}>
            <ShieldCheck className={`${size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} shrink-0`} />
            {qualification}
          </span>
        </TooltipTrigger>
        {description && (
          <TooltipContent side="top" className="text-xs max-w-48 text-center">
            <p className="font-medium">{qualification}</p>
            <p className="text-muted-foreground mt-0.5">{description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}