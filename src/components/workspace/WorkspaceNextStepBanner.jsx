import React from "react";
import { ArrowRight, Upload, MessageSquare, CheckCircle2, Star, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextStepGuidance } from "@/lib/workspaceGuidance";
import { cn } from "@/lib/utils";

const toneStyles = {
  teal: "bg-teal-50 border-teal-200 text-teal-900",
  blue: "bg-blue-50 border-blue-200 text-blue-900",
  amber: "bg-amber-50 border-amber-200 text-amber-900",
  violet: "bg-violet-50 border-violet-200 text-violet-900",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  slate: "bg-slate-50 border-slate-200 text-slate-800",
};

export default function WorkspaceNextStepBanner({ workspace, userRole, onAction }) {
  const guidance = getNextStepGuidance(workspace, userRole);
  if (!guidance) return null;

  const icons = {
    upload: Upload,
    message: MessageSquare,
    confirm_completion: CheckCircle2,
    review: Star,
    recurring: Repeat,
    progress: ArrowRight,
    mark_complete: CheckCircle2,
    request_docs: Upload,
  };
  const Icon = icons[guidance.action] || ArrowRight;

  return (
    <div className={cn("rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4", toneStyles[guidance.tone] || toneStyles.slate)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-white/80 border border-current/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">Your next step</p>
          <p className="text-sm font-bold mt-0.5">{guidance.title}</p>
          <p className="text-xs mt-1 opacity-90 leading-relaxed">{guidance.description}</p>
        </div>
      </div>
      {guidance.action && onAction && (
        <Button size="sm" className="shrink-0 rounded-lg gap-1.5" onClick={() => onAction(guidance.action)}>
          Take action
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
