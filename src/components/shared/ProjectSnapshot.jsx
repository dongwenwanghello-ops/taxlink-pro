import React from "react";
import { ClipboardList } from "lucide-react";
import { buildProjectSnapshot } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

export default function ProjectSnapshot({ job, className }) {
  const items = buildProjectSnapshot(job);
  if (!items.length) return null;

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-slate-50/60 p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-bold text-slate-900">Project snapshot</h3>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-3 sm:block">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className="text-sm font-semibold text-slate-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
