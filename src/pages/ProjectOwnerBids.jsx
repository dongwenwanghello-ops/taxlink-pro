import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getPostedProjects } from "@/lib/projectStore";
import { getBidsForProject, toggleBidShortlist } from "@/lib/bidStore";
import { executeProjectAward } from "@/lib/awardWorkflow";
import { sortBidsForClientReview } from "@/lib/guidedPricing";
import { assignRecommendationTags } from "@/lib/bidderComparison";
import { enrichBidIdentity, getProtectedDisplayName, getRevealedFullName } from "@/lib/professionalIdentity";
import AwardConfirmDialog from "@/components/shared/AwardConfirmDialog";
import { navigateToBidderProfile } from "@/lib/bidderPublicProfile";
import { getBiddingState } from "@/lib/biddingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BidderDetailCard from "@/components/owner/BidderDetailCard";
import BidComparisonTable from "@/components/owner/BidComparisonTable";
import ContactBidderDialog from "@/components/owner/ContactBidderDialog";
import ClientDecisionGuidance from "@/components/shared/ClientDecisionGuidance";
import { getClientEvaluationProgress } from "@/lib/clientBidEvaluation";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft, Briefcase, Gavel, ListChecks, ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ProjectOwnerBids() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareShortlistedOnly, setCompareShortlistedOnly] = useState(false);
  const [highlightedBidId, setHighlightedBidId] = useState(null);
  const [contactState, setContactState] = useState({ open: false, bid: null, type: "contact" });
  const [awardConfirm, setAwardConfirm] = useState(null);
  const [awarding, setAwarding] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let proj = getPostedProjects().find((p) => p.id === projectId);
    if (!proj) {
      try {
        proj = await base44.entities.JobPost.get(projectId);
      } catch {
        proj = null;
      }
    }
    setProject(proj || null);

    let projectBids = getBidsForProject(projectId);
    try {
      const remote = await base44.entities.Bid.filter({ project_id: projectId }, "-created_date", 50);
      const ids = new Set((remote || []).map((b) => b.id));
      projectBids = [...(remote || []), ...projectBids.filter((b) => !ids.has(b.id))];
    } catch {
      /* local only */
    }
    setBids(sortBidsForClientReview(projectBids));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadData();
    const refresh = () => loadData();
    window.addEventListener("bidSubmitted", refresh);
    window.addEventListener("bidUpdated", refresh);
    window.addEventListener("projectAwarded", refresh);
    return () => {
      window.removeEventListener("bidSubmitted", refresh);
      window.removeEventListener("bidUpdated", refresh);
      window.removeEventListener("projectAwarded", refresh);
    };
  }, [loadData]);

  const tagsById = useMemo(
    () => assignRecommendationTags(bids, project),
    [bids, project],
  );

  const shortlistedCount = bids.filter((b) => b.status === "shortlisted").length;
  const hasAwardedBid = bids.some((b) => b.status === "accepted" || b.awarded);
  const canAward = project && !hasAwardedBid && !["in_progress", "awarded", "completed", "closed"].includes(project.status);
  const biddingState = project ? getBiddingState(project) : { isOpen: false };

  const displayedBids = compareShortlistedOnly
    ? bids.filter((b) => b.status === "shortlisted")
    : bids;

  const evaluationStep = getClientEvaluationProgress({
    bidCount: bids.length,
    shortlistedCount,
    profilesViewedCount: bids.length,
  });

  const handleToggleShortlist = async (bid) => {
    const updated = toggleBidShortlist(bid.id);
    if (!updated) return;
    setBids((current) => current.map((item) => (item.id === bid.id ? { ...item, ...updated } : item)));
    try {
      await base44.entities.Bid.update(bid.id, { status: updated.status });
    } catch { /* local */ }
    toast({
      title: updated.status === "shortlisted" ? "Shortlisted" : "Removed from shortlist",
      description: updated.status === "shortlisted"
        ? "Use the comparison table to review side by side."
        : "Bidder removed from your shortlist.",
    });
  };

  const handleAwardBid = (bid) => {
    const professionalLabel = getRevealedFullName(enrichBidIdentity(bid));
    setAwardConfirm({ bid, professionalLabel });
  };

  const executeAward = async () => {
    if (!awardConfirm || !project) return;
    const { bid } = awardConfirm;
    const professionalLabel = awardConfirm.professionalLabel;

    setAwarding(true);
    try {
      let clientEmail = project.created_by;
      try {
        const user = await base44.auth.me();
        clientEmail = user?.email || clientEmail;
      } catch { /* demo */ }

      const { project: awardedProject } = executeProjectAward({
        project,
        winningBid: bid,
        clientEmail,
      });

      setProject((p) => (p ? { ...p, ...awardedProject } : p));
      setBids((current) =>
        current.map((item) => {
          const won = item.id === bid.id;
          return {
            ...item,
            status: won ? "accepted" : "rejected",
            awarded: won,
            identity_revealed: won,
            rejection_reason: won ? undefined : "Another professional was selected",
          };
        }),
      );

      try {
        await base44.entities.JobPost.update(project.id, {
          status: "in_progress",
          lifecycle_state: "awarded",
          awarded_bid_id: bid.id,
          accepting_bids: false,
        });
      } catch { /* local */ }

      toast({
        title: "Project awarded",
        description: `${professionalLabel} selected — workspace is ready. Bidding is now closed.`,
      });
      setAwardConfirm(null);
      navigate(`/workspace/${project.id}`);
    } finally {
      setAwarding(false);
    }
  };

  const openContact = (bid, type = "contact") => {
    setContactState({ open: true, bid, type });
  };

  const scrollToBid = (bidId) => {
    setHighlightedBidId(bidId);
    document.getElementById(`bidder-${bidId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setHighlightedBidId(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading bids…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <Briefcase className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-foreground font-semibold">Project not found</p>
        <Link to="/my-projects">
          <Button className="rounded-xl">Back to My Projects</Button>
        </Link>
      </div>
    );
  }

  const postedAgo = project.created_date
    ? formatDistanceToNow(new Date(project.created_date), { addSuffix: true })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <Link
            to="/my-projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            My projects
          </Link>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 text-teal-800 border-teal-200 bg-teal-50">
                <Gavel className="h-3 w-3" />
                {biddingState.isOpen ? "Bidding open" : "Compare & decide"}
              </Badge>
              <Badge variant="secondary">{bids.length} bid{bids.length !== 1 ? "s" : ""}</Badge>
              {shortlistedCount > 0 && (
                <Badge className="bg-violet-100 text-violet-800 border-violet-200">
                  {shortlistedCount} shortlisted
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Compare professionals for your project
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
              Review who bid, why they fit, and what&apos;s included — then contact, shortlist, or award.
              {postedAgo && <span className="block mt-1 text-xs">Posted {postedAgo}</span>}
            </p>
            <p className="text-sm font-medium text-foreground">{project.title}</p>
          </div>

          {canAward && bids.length > 0 && (
            <ClientDecisionGuidance
              activeStep={evaluationStep}
              shortlistedCount={shortlistedCount}
              totalBids={bids.length}
            />
          )}

          {bids.length >= 2 && (
            <div className="flex flex-wrap gap-2">
              {canAward && shortlistedCount > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant={compareShortlistedOnly ? "default" : "outline"}
                  className="rounded-xl gap-1.5"
                  onClick={() => setCompareShortlistedOnly((v) => !v)}
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  {compareShortlistedOnly ? "Show all bidders" : `Shortlisted only (${shortlistedCount})`}
                </Button>
              )}
              <Link to={`/projects/${project.id}`}>
                <Button type="button" size="sm" variant="ghost" className="rounded-xl text-muted-foreground">
                  Project brief
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {bids.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
            <Gavel className="h-10 w-10 text-muted-foreground/25 mx-auto mb-3" />
            <h2 className="font-semibold text-foreground">No bids yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Professionals will appear here when they submit quotes. You&apos;ll get trust signals, proposals, and comparison tools.
            </p>
            <Link to={`/projects/${project.id}`} className="inline-block mt-4">
              <Button variant="outline" className="rounded-xl">View project brief</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3 flex items-start gap-2 text-sm text-teal-900">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Quotes are confidential between you and each bidder. Compare on trust and fit — not price alone.
              </p>
            </div>

            <BidComparisonTable
              bids={displayedBids}
              project={project}
              tagsById={tagsById}
              selectedBidId={highlightedBidId}
              onSelectBid={scrollToBid}
            />

            <div className="space-y-8">
              {displayedBids.map((bid) => (
                <BidderDetailCard
                  key={bid.id}
                  bid={bid}
                  project={project}
                  tags={tagsById[bid.id] || []}
                  canAward={canAward}
                  isShortlisted={bid.status === "shortlisted"}
                  isAccepted={bid.status === "accepted" || bid.awarded}
                  highlighted={highlightedBidId === bid.id}
                  onContact={() => openContact(bid, "contact")}
                  onRequestInfo={() => openContact(bid, "more_info")}
                  onShortlist={() => handleToggleShortlist(bid)}
                  onAward={() => handleAwardBid(bid)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ContactBidderDialog
        open={contactState.open}
        onOpenChange={(open) => setContactState((s) => ({ ...s, open }))}
        project={project}
        bid={contactState.bid}
        bidderLabel={contactState.bid ? getProtectedDisplayName(contactState.bid) : ""}
        type={contactState.type}
        onSubmitted={() => {
          toast({
            title: "Message saved",
            description: "We'll connect in-app messaging soon. Your note is stored on this project.",
          });
        }}
      />

      <AwardConfirmDialog
        open={Boolean(awardConfirm)}
        onOpenChange={(open) => {
          if (!open && !awarding) setAwardConfirm(null);
        }}
        professionalLabel={awardConfirm?.professionalLabel}
        confirming={awarding}
        onConfirm={executeAward}
        onReviewProfile={
          awardConfirm
            ? () => navigateToBidderProfile(navigate, awardConfirm.bid, project)
            : undefined
        }
      />
    </div>
  );
}
