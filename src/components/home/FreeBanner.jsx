import React from "react";
import { CheckCircle2 } from "lucide-react";

const ITEMS = [
  "Free to join — always",
  "Free to post projects",
  "Free to bid on any project",
  "Zero commission on completed work",
];

export default function FreeBanner() {
  return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4">
      <p className="text-sm font-black text-emerald-800 mb-2.5">✓ TaxLink Pro is free to join, bid, and post projects</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6">
        {ITEMS.map(item => (
          <span key={item} className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}