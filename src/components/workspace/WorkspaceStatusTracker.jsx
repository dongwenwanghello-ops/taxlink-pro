import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { WORKFLOW_STATUSES } from "@/lib/workspaceStore";
import { normalizeWorkflowStatus } from "@/lib/workspaceGuidance";
import { cn } from "@/lib/utils";

export default function WorkspaceStatusTracker({ currentStatus, onStatusChange, canUpdate }) {
  const normalized = normalizeWorkflowStatus(currentStatus);
  const currentIndex = WORKFLOW_STATUSES.findIndex((s) => s.id === normalized);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3">Project workflow</h3>
      <div className="space-y-2">
        {WORKFLOW_STATUSES.map((status, index) => {
          const done = index < currentIndex || normalized === "completed";
          const active = status.id === normalized;
          const upcoming = index > currentIndex && normalized !== "completed";

          return (
            <button
              key={status.id}
              type="button"
              disabled={!canUpdate || upcoming}
              onClick={() => canUpdate && onStatusChange?.(status.id)}
              className={cn(
                "w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                active && "bg-teal-50 border border-teal-200",
                done && !active && "opacity-80",
                canUpdate && !upcoming && "hover:bg-slate-50",
                (!canUpdate || upcoming) && "cursor-default",
              )}
            >
              {done || active ? (
                <CheckCircle2 className={cn("h-4 w-4 shrink-0 mt-0.5", active ? "text-teal-600" : "text-emerald-500")} />
              ) : (
                <Circle className="h-4 w-4 shrink-0 mt-0.5 text-slate-300" />
              )}
              <div>
                <p className={cn("text-sm font-semibold", active ? "text-teal-800" : "text-slate-800")}>
                  {status.label}
                </p>
                <p className="text-xs text-slate-500">{status.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
