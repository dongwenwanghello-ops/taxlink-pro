import React from "react";
import { buildComparisonRow } from "@/lib/bidderComparison";
import { getProtectedDisplayName } from "@/lib/professionalIdentity";
import { cn } from "@/lib/utils";

export default function BidComparisonTable({ bids = [], project, tagsById = {}, onSelectBid, selectedBidId }) {
  if (bids.length < 2) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">Quick comparison</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Compare trust, experience, price, and responsiveness at a glance</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
              <th className="px-4 py-3">Bidder</th>
              <th className="px-3 py-3">Trust</th>
              <th className="px-3 py-3">Experience</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Response</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => {
              const row = buildComparisonRow(bid, project);
              const tags = tagsById[bid.id] || [];
              const selected = selectedBidId === bid.id;
              return (
                <tr
                  key={bid.id}
                  className={cn(
                    "border-b border-border/40 last:border-0 cursor-pointer transition-colors",
                    selected ? "bg-teal-50/80" : "hover:bg-muted/40",
                  )}
                  onClick={() => onSelectBid?.(bid.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground leading-snug">{getProtectedDisplayName(bid)}</p>
                    {row.name && row.name !== getProtectedDisplayName(bid) && (
                      <p className="text-[11px] text-muted-foreground">{row.name}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tags.slice(0, 2).map((t) => (
                          <span
                            key={t.id}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-medium"
                          >
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums font-semibold text-foreground">{row.trust}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs max-w-[120px]">{row.experience}</td>
                  <td className="px-3 py-3 font-semibold text-primary tabular-nums">{row.price}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{row.response}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
