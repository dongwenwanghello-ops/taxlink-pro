import React from "react";
import { Activity, FileUp, MessageSquare, CheckCircle2, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ICONS = {
  award: Award,
  workspace_ready: CheckCircle2,
  status_change: CheckCircle2,
  message: MessageSquare,
  file_upload: FileUp,
  default: Activity,
};

export default function WorkspaceTimeline({ activities = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-bold text-slate-900">Activity timeline</h3>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">Activity will appear here as you collaborate.</p>
        ) : (
          activities.map((item) => {
            const Icon = ICONS[item.type] || ICONS.default;
            return (
              <div key={item.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0 flex-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <p className="text-sm text-slate-800">{item.message}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.actor_name}
                    {item.created_at && (
                      <> · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
