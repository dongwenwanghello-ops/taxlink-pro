import React from "react";
import { ShieldCheck } from "lucide-react";

const bodies = [
  { name: "ICAEW", full: "Institute of Chartered Accountants in England & Wales" },
  { name: "ACCA",  full: "Association of Chartered Certified Accountants" },
  { name: "CIOT",  full: "Chartered Institute of Taxation" },
  { name: "ATT",   full: "Association of Taxation Technicians" },
  { name: "AAT",   full: "Association of Accounting Technicians" },
  { name: "CIMA",  full: "Chartered Institute of Management Accountants" },
];

export default function TrustBanner() {
  return (
    <div className="border-y border-border/60 bg-card py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Professionals verified against:
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {bodies.map((b) => (
              <div key={b.name} title={b.full}
                className="px-3 py-1 rounded-lg border border-border/70 bg-background text-xs font-bold text-foreground tracking-wide hover:border-primary/40 transition-colors cursor-default">
                {b.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}