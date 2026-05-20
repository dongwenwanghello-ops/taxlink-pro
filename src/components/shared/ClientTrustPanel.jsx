import React from "react";
import { CheckCircle2, Star } from "lucide-react";
import { getClientTrustProfile } from "@/lib/projectBiddingUX";
import { cn } from "@/lib/utils";

export default function ClientTrustPanel({ job, className }) {
  const profile = getClientTrustProfile(job);
  const verifiedCount = profile.verifications.filter((v) => v.verified).length;

  return (
    <div className={cn("rounded-xl border border-border/60 bg-card p-4 space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Client</p>
          <p className="text-base font-bold text-foreground">{profile.clientName}</p>
        </div>
        <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold shrink-0">
          <Star className="h-4 w-4 fill-current" />
          {profile.rating}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {verifiedCount >= 2 ? "Verified client" : "Client verification in progress"}
        {" · "}
        {profile.activity.label}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {profile.verifications.filter((v) => v.verified).map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
          >
            <CheckCircle2 className="h-3 w-3 text-teal-600" />
            {item.label.replace(" verified", "")}
          </span>
        ))}
      </div>
    </div>
  );
}
