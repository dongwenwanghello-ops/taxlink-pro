import React from "react";
import { Repeat } from "lucide-react";
import { getRecurringSuggestions } from "@/lib/workspaceGuidance";
import { cn } from "@/lib/utils";

const toneStyles = {
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
  blue: "bg-blue-50 border-blue-100 text-blue-800",
  violet: "bg-violet-50 border-violet-100 text-violet-800",
  teal: "bg-teal-50 border-teal-100 text-teal-800",
  amber: "bg-amber-50 border-amber-100 text-amber-800",
  slate: "bg-slate-50 border-slate-200 text-slate-700",
};

export default function RecurringWorkSuggestions({ workspace }) {
  const signals = getRecurringSuggestions(workspace);
  if (!signals?.length) return null;

  const isComplete =
    workspace?.completion_phase === "completed" || workspace?.workflow_status === "completed";

  if (!isComplete) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Repeat className="h-4 w-4 text-teal-600" />
        Ongoing collaboration opportunities
      </p>
      <p className="text-xs text-slate-500">
        Many client relationships continue beyond a single project. Discuss recurring support directly.
      </p>
      <div className="flex flex-wrap gap-2">
        {signals.map((s) => (
          <span
            key={s.label}
            className={cn("text-[11px] font-medium rounded-full border px-2.5 py-1", toneStyles[s.tone] || toneStyles.slate)}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
