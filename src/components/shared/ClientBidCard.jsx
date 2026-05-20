import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { navigateToBidderProfile } from "@/lib/bidderPublicProfile";
import {
  Award, ShieldCheck, Clock, User, ListChecks, Eye,
} from "lucide-react";
import ProtectedProfessionalIdentity from "@/components/shared/ProtectedProfessionalIdentity";
import ProfessionalFitReasons from "@/components/shared/ProfessionalFitReasons";
import { buildDetailedMatchReasons, getMatchStrengthLabel } from "@/lib/bidderComparison";
import { enrichBidIdentity, isBidIdentityRevealed } from "@/lib/professionalIdentity";
import { cn } from "@/lib/utils";

import { getBidStatusUI, normalizeBidStatus } from "@/lib/awardWorkflow";
import { BID_NOT_SELECTED_REASON } from "@/lib/clientBidEvaluation";

const BID_STATUS_FALLBACK = {
  pending:     { label: "Pending Review", color: "bg-amber-50 text-amber-800" },
  shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700" },
  selected:    { label: "Selected",    color: "bg-emerald-100 text-emerald-800" },
  accepted:    { label: "Selected",    color: "bg-emerald-100 text-emerald-800" },
  rejected:    { label: "Not Selected",    color: "bg-rose-100 text-rose-600" },
};

export default function ClientBidCard({
  bid,
  project,
  marketplaceScore,
  canAward,
  profileViewed,
  onViewProfile,
  onToggleShortlist,
  onAward,
}) {
  const navigate = useNavigate();
  const enrichedBid = enrichBidIdentity(bid);

  const handleViewProfile = () => {
    if (project?.id) {
      navigateToBidderProfile(navigate, enrichedBid, project);
      return;
    }
    onViewProfile?.(enrichedBid);
  };
  const bidKey = normalizeBidStatus(enrichedBid.status, enrichedBid);
  const bCfg = BID_STATUS_FALLBACK[bidKey] || getBidStatusUI(enrichedBid);
  const statusColor = bCfg.color || bCfg.badgeClass || BID_STATUS_FALLBACK.pending.color;
  const revealed = isBidIdentityRevealed(enrichedBid, project);
  const isShortlisted = enrichedBid.status === "shortlisted";
  const isAccepted = enrichedBid.status === "accepted" || enrichedBid.awarded;
  const isRejected = enrichedBid.status === "rejected";
  const canAct = canAward && !isRejected && !isAccepted;

  const fitReasons = useMemo(
    () => buildDetailedMatchReasons(enrichedBid, project, marketplaceScore),
    [enrichedBid, project, marketplaceScore],
  );

  const matchStrength = useMemo(
    () => getMatchStrengthLabel(enrichedBid, project),
    [enrichedBid, project],
  );

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3",
        isAccepted
          ? "bg-emerald-50/80 border-emerald-200"
          : isShortlisted
            ? "bg-violet-50/60 border-violet-200 ring-1 ring-violet-100"
            : "bg-card border-border/60",
      )}
    >
      {isShortlisted && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700">
          Shortlisted for comparison
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {isAccepted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                <Award className="h-3 w-3" /> Selected professional
              </span>
            )}
            {revealed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                <ShieldCheck className="h-3 w-3" /> Identity revealed
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
              {bCfg.label}
            </span>
            {isRejected && (
              <span className="text-[10px] text-rose-700 font-medium">
                {enrichedBid.rejection_reason || BID_NOT_SELECTED_REASON}
              </span>
            )}
          </div>

          <ProtectedProfessionalIdentity
            bid={enrichedBid}
            project={project}
            compact
            showRevealNotice={false}
          />

          <ProfessionalFitReasons
            reasons={fitReasons}
            title={matchStrength.label}
            compact
          />

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {enrichedBid.timeline_label || enrichedBid.timeline || "Timeline on profile"}
            </span>
            <span className="text-border">|</span>
            <span>
              Proposed fee{" "}
              <span className="font-semibold text-foreground tabular-nums">
                £{enrichedBid.amount?.toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        <div className="lg:w-44 shrink-0 flex flex-col gap-2 border-t lg:border-t-0 lg:border-l border-border/50 pt-3 lg:pt-0 lg:pl-4">
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-lg text-xs gap-1.5 w-full bg-teal-700 hover:bg-teal-800 text-white"
            onClick={handleViewProfile}
          >
            <User className="h-3.5 w-3.5" />
            View full profile
          </Button>
          <p className="text-[10px] text-center text-teal-800 font-medium leading-snug">
            Recommended before awarding
          </p>
          {profileViewed && (
            <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" />
              Profile reviewed
            </p>
          )}

          {canAct && (
            <>
              <Button
                type="button"
                size="sm"
                variant={isShortlisted ? "secondary" : "outline"}
                className="h-8 rounded-lg text-xs gap-1.5 w-full"
                onClick={() => onToggleShortlist(enrichedBid)}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs gap-1.5 w-full border-violet-200 text-violet-800 hover:bg-violet-50"
                onClick={() => onAward(project, enrichedBid)}
              >
                <Award className="h-3.5 w-3.5" />
                Award project
              </Button>
              <p className="text-[10px] text-center text-muted-foreground leading-snug">
                Compare experience &amp; fit — not price alone
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
