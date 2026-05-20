import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspaceCompletionPanel({
  workspace,
  userRole,
  onProfessionalComplete,
  onClientConfirm,
  disabled,
}) {
  const phase = workspace?.completion_phase || "active";
  const isFullyComplete = phase === "completed" || workspace?.workflow_status === "completed";

  if (isFullyComplete) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-900">Project completed</p>
          <p className="text-xs text-emerald-800 mt-0.5">Both parties confirmed satisfactory completion.</p>
        </div>
      </div>
    );
  }

  if (phase === "awaiting_client_confirmation") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="h-6 w-6 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Awaiting client confirmation</p>
            <p className="text-xs text-amber-800 mt-1">
              {workspace.professional_name} marked work as complete
              {workspace.professional_completed_at && (
                <> · {new Date(workspace.professional_completed_at).toLocaleDateString("en-GB")}</>
              )}
            </p>
          </div>
        </div>
        {userRole === "client" && !disabled && (
          <Button className="w-full rounded-lg gap-2" onClick={onClientConfirm}>
            <CheckCircle2 className="h-4 w-4" />
            Confirm satisfactory completion
          </Button>
        )}
        {userRole === "professional" && (
          <p className="text-xs text-amber-700">The client will confirm when they are satisfied with the deliverables.</p>
        )}
      </div>
    );
  }

  if (userRole === "professional" && !disabled) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-slate-900">Complete this project</p>
        <p className="text-xs text-slate-500">
          When deliverables are ready, mark work complete. The client will then confirm satisfactory completion.
        </p>
        <Button variant="outline" className="w-full rounded-lg gap-2" onClick={onProfessionalComplete}>
          <CheckCircle2 className="h-4 w-4" />
          Mark work as completed
        </Button>
      </div>
    );
  }

  return null;
}
