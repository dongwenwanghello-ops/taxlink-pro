import React, { useState } from "react";
import { TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PROGRESS_MILESTONES } from "@/lib/workspaceStore";
import { formatDistanceToNow } from "date-fns";

export default function WorkspaceProgressPanel({
  progressUpdates = [],
  userRole,
  onAddProgress,
  disabled,
}) {
  const [milestoneId, setMilestoneId] = useState(PROGRESS_MILESTONES[0]?.id || "");
  const [note, setNote] = useState("");

  if (userRole !== "professional") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          Work progress
        </h3>
        {progressUpdates.length === 0 ? (
          <p className="text-xs text-slate-500">Your accountant will post progress updates here.</p>
        ) : (
          <ul className="space-y-2">
            {progressUpdates.map((u) => (
              <li key={u.id} className="text-xs border-l-2 border-teal-400 pl-3 py-1">
                <p className="font-semibold text-slate-800">{u.label}</p>
                {u.note && <p className="text-slate-500 mt-0.5">{u.note}</p>}
                <p className="text-[10px] text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const handleAdd = () => {
    if (!milestoneId || disabled) return;
    onAddProgress?.(milestoneId, note);
    setNote("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-teal-600" />
        Update progress
      </h3>
      {!disabled && (
        <div className="space-y-2">
          <select
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 text-sm px-2"
          >
            {PROGRESS_MILESTONES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the client…"
            rows={2}
            className="text-sm resize-none"
          />
          <Button size="sm" className="w-full gap-1.5" onClick={handleAdd} disabled={disabled}>
            <Plus className="h-3.5 w-3.5" />
            Post progress update
          </Button>
        </div>
      )}
      {progressUpdates.length > 0 && (
        <ul className="space-y-2 pt-2 border-t border-slate-100">
          {[...progressUpdates].reverse().map((u) => (
            <li key={u.id} className="text-xs border-l-2 border-teal-400 pl-3 py-1">
              <p className="font-semibold text-slate-800">{u.label}</p>
              {u.note && <p className="text-slate-500 mt-0.5">{u.note}</p>}
              <p className="text-[10px] text-slate-400 mt-1">
                {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
