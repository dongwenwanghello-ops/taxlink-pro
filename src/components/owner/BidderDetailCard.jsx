import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { navigateToBidderProfile } from "@/lib/bidderPublicProfile";
import { Badge } from "@/components/ui/badge";
import {
  Award, Star, MapPin, Clock, ShieldCheck, CheckCircle2, XCircle,
  MessageCircle, ListChecks, Calendar, User,
} from "lucide-react";
import {
  enrichBidIdentity,
  getProtectedDisplayName,
  getProfessionalTrustMetrics,
} from "@/lib/professionalIdentity";
import {
  buildDetailedMatchReasons,
  getMatchStrengthLabel,
  getBidderComparisonMetrics,
  getBidderTrustVerifications,
  buildProposalSections,
} from "@/lib/bidderComparison";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";
import { cn } from "@/lib/utils";

const MATCH_TONE = {
  strong: "bg-teal-50 border-teal-200 text-teal-900",
  good: "bg-emerald-50 border-emerald-200 text-emerald-900",
  neutral: "bg-muted/50 border-border text-foreground",
};

export default function BidderDetailCard({
  bid,
  project,
  tags = [],
  canAward,
  isShortlisted,
  isAccepted,
  onContact,
  onRequestInfo,
  onShortlist,
  onAward,
  highlighted,
}) {
  const navigate = useNavigate();
  const enriched = enrichBidIdentity(bid);
  const metrics = useMemo(() => getBidderComparisonMetrics(enriched), [enriched]);
  const verifications = useMemo(() => getBidderTrustVerifications(enriched), [enriched]);
  const trustMetrics = useMemo(() => getProfessionalTrustMetrics(enriched), [enriched]);

  const marketplaceScore = useMemo(
    () => (project ? scoreMarketplaceProject({
      category: project.category,
      complexity: project.complexity || "medium",
      urgency: project.urgency || "negotiable",
      budgetAmount: project.budget_amount,
    }) : null),
    [project],
  );

  const matchReasons = useMemo(
    () => buildDetailedMatchReasons(enriched, project, marketplaceScore),
    [enriched, project, marketplaceScore],
  );
  const matchStrength = useMemo(() => getMatchStrengthLabel(enriched, project), [enriched, project]);
  const proposal = useMemo(() => buildProposalSections(enriched, project), [enriched, project]);

  const displayName = getProtectedDisplayName(enriched);
  const firm = enriched.bidder_firm_name;
  const quals = enriched.qualifications || [];
  const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <article
      id={`bidder-${bid.id}`}
      className={cn(
        "rounded-2xl border bg-card transition-shadow scroll-mt-24",
        highlighted || isShortlisted
          ? "border-teal-300 shadow-md shadow-teal-500/5 ring-1 ring-teal-100"
          : "border-border/60",
        isAccepted && "border-emerald-300 bg-emerald-50/30",
      )}
    >
      <div className="p-5 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-primary/15 border border-teal-200/80 flex items-center justify-center shrink-0 text-teal-800 font-bold">
            {initials || <User className="h-6 w-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {isAccepted && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                  <Award className="h-3 w-3" /> Selected
                </Badge>
              )}
              {isShortlisted && !isAccepted && (
                <Badge className="bg-violet-100 text-violet-800 border-violet-200">Shortlisted</Badge>
              )}
              {tags.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-[10px] font-semibold">
                  {t.label}
                </Badge>
              ))}
            </div>
            <h3 className="text-lg font-bold text-foreground leading-snug">{displayName}</h3>
            {firm && <p className="text-sm text-muted-foreground">{firm}</p>}
            {enriched.bidder_headline && (
              <p className="text-sm text-foreground/80 mt-1">{enriched.bidder_headline}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {quals.length > 0 && (
                <span className="font-medium text-foreground">{quals.join(" · ")}</span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {metrics.location}
              </span>
              {metrics.yearsExperience && (
                <span>{metrics.yearsExperience} experience</span>
              )}
            </div>
          </div>
          <div className="sm:text-right shrink-0 space-y-1">
            <p className="text-2xl font-extrabold text-primary tabular-nums">
              £{Number(enriched.amount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1">
              <Calendar className="h-3 w-3" />
              {proposal.timeline}
            </p>
            <p className="text-[11px] text-muted-foreground">{metrics.availability}</p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {metrics.rating != null && (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Rating</p>
              <p className="flex items-center gap-1 font-bold text-foreground">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                {metrics.rating.toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground">({metrics.reviewCount})</span>
              </p>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Response</p>
            <p className="font-bold text-foreground text-sm">~{metrics.responseHours}h</p>
            <p className="text-[10px] text-muted-foreground">{metrics.responsePct}% response rate</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">On-time</p>
            <p className="font-bold text-foreground text-sm">{metrics.onTimePct}%</p>
            <p className="text-[10px] text-muted-foreground">completion rate</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Trust</p>
            <p className="font-bold text-foreground text-sm">{metrics.trustScore}/99</p>
            <p className="text-[10px] text-muted-foreground">{metrics.completedProjects}+ projects</p>
          </div>
        </div>

        {/* Match explanation */}
        <div className={cn("rounded-xl border px-4 py-3 space-y-2", MATCH_TONE[matchStrength.tone])}>
          <p className="text-sm font-semibold">{matchStrength.label}</p>
          <ul className="space-y-1 text-xs leading-relaxed opacity-90">
            {matchReasons.map((r) => (
              <li key={r.id} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Proposal */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bid proposal</h4>
          <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1">Cover message</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{proposal.coverMessage}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-900 mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Included in scope
              </p>
              <ul className="text-xs text-emerald-950/90 space-y-1">
                {proposal.included.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span className="text-emerald-600">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Not included unless agreed
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {proposal.excluded.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <span>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Estimated delivery: <span className="font-medium text-foreground">{proposal.timeline}</span>
          </p>
        </div>

        {/* Trust & verification */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trust & verification</h4>
          <div className="flex flex-wrap gap-2">
            {verifications.map((v) => (
              <span
                key={v.id}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border",
                  v.verified
                    ? "bg-teal-50 text-teal-800 border-teal-200"
                    : "bg-muted text-muted-foreground border-border",
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                {v.label}
                {v.detail && <span className="opacity-75">({v.detail})</span>}
              </span>
            ))}
          </div>
          {trustMetrics.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {trustMetrics.map((m) => m.label).join(" · ")}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground italic">
            ICAEW/ACCA membership checks and professional insurance verification — coming soon.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2 border-teal-200 text-teal-800 hover:bg-teal-50"
            onClick={() => navigateToBidderProfile(navigate, enriched, project)}
          >
            <User className="h-4 w-4" />
            View full profile
          </Button>
        </div>

        {canAward && !isAccepted && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
            <Button type="button" className="rounded-xl gap-2 bg-teal-700 hover:bg-teal-800" onClick={onContact}>
              <MessageCircle className="h-4 w-4" />
              Contact bidder
            </Button>
            <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={onRequestInfo}>
              Request more info
            </Button>
            <Button
              type="button"
              variant={isShortlisted ? "secondary" : "outline"}
              className="rounded-xl gap-2"
              onClick={onShortlist}
            >
              <ListChecks className="h-4 w-4" />
              {isShortlisted ? "Remove from shortlist" : "Shortlist"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 border-violet-200 text-violet-800 hover:bg-violet-50"
              onClick={onAward}
            >
              <Award className="h-4 w-4" />
              Award project
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" disabled title="Coming soon">
              <Calendar className="h-4 w-4 mr-1" />
              Schedule consultation
            </Button>
          </div>
        )}
        {isAccepted && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => navigateToBidderProfile(navigate, enriched, project)}
            >
              <User className="h-4 w-4" />
              View full profile
            </Button>
            <Button type="button" className="rounded-xl gap-2" onClick={onContact}>
              <MessageCircle className="h-4 w-4" />
              Message in workspace
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
