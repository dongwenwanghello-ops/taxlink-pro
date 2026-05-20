import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getPostedProjects, mergeProjectSources } from "@/lib/projectStore";
import { getBiddingState } from "@/lib/biddingState";
import { getAllBids, toggleBidShortlist } from "@/lib/bidStore";
import { executeProjectAward } from "@/lib/awardWorkflow";
import { sortBidsForClientReview } from "@/lib/guidedPricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, Plus, ChevronDown, ChevronUp, Gavel, LayoutGrid, ListChecks,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import MyProjectsDemo from "@/components/emptyStates/MyProjectsDemo";
import ProjectActivityFeed from "@/components/shared/ProjectActivityFeed";
import { IdentityRevealNotice } from "@/components/shared/ProtectedProfessionalIdentity";
import { navigateToBidderProfile } from "@/lib/bidderPublicProfile";
import ClientDecisionGuidance from "@/components/shared/ClientDecisionGuidance";
import ClientBidCard from "@/components/shared/ClientBidCard";
import {
  enrichBidIdentity,
  getRevealedFullName,
} from "@/lib/professionalIdentity";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";
import { getClientEvaluationProgress } from "@/lib/clientBidEvaluation";
import AwardConfirmDialog from "@/components/shared/AwardConfirmDialog";
import { useToast } from "@/components/ui/use-toast";

const STATUS_CONFIG = {
  open:        { label: "Open for Bids", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  reviewing:   { label: "Reviewing Bids", color: "bg-amber-100 text-amber-700 border-amber-200" },
  awarded:     { label: "Awarded",        color: "bg-violet-100 text-violet-700 border-violet-200" },
  in_progress: { label: "In Progress",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed:   { label: "Completed",     color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed:      { label: "Closed",        color: "bg-secondary text-muted-foreground border-border" },
};

const URGENCY_LABELS = {
  negotiable: "Negotiable",
  flexible: "Negotiable",
  standard: "Standard",
  within_month: "Within a month",
  within_2weeks: "Within 2 weeks",
  within_week: "Within 1 week",
  urgent: "Urgent",
  asap: "ASAP",
};

function ProjectRow({ project, bids, onAwardBid, onToggleShortlist, onOpenComparison, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const [compareShortlisted, setCompareShortlisted] = useState(false);
  const [viewedProfileIds, setViewedProfileIds] = useState(() => new Set());
  const projectBids = sortBidsForClientReview(bids.filter(b => b.project_id === project.id));
  const shortlistedCount = projectBids.filter((b) => b.status === "shortlisted").length;
  const displayedBids = compareShortlisted
    ? projectBids.filter((b) => b.status === "shortlisted")
    : projectBids;
  const showShortlistFilterEmpty = compareShortlisted && projectBids.length > 0 && displayedBids.length === 0;
  const displayStatus = project.lifecycle_state === "awarded" ? "awarded" : project.status;
  const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.open;
  const postedAgo = project.created_date ? formatDistanceToNow(new Date(project.created_date), { addSuffix: true }) : null;
  const hasAwardedBid = projectBids.some((bid) => bid.status === "accepted" || bid.awarded);
  const canAward = !hasAwardedBid && !["in_progress", "awarded", "completed", "closed"].includes(project.status);

  useEffect(() => {
    if (!canAward && compareShortlisted) setCompareShortlisted(false);
  }, [canAward, compareShortlisted]);
  const hasWorkspace = hasAwardedBid || project.lifecycle_state === "awarded" || project.status === "in_progress";

  const marketplaceScore = useMemo(
    () => scoreMarketplaceProject({
      category: project.category,
      complexity: project.complexity || "medium",
      urgency: project.urgency || "negotiable",
      biddingPeriod: project.bidding_period,
      biddingDeadline: project.bidding_deadline,
      budgetAmount: project.budget_amount,
      remote: project.remote,
      missingRecords: project.missing_records,
      multipleIncomeSources: project.multiple_income_sources,
      internationalTaxIssues: project.international_tax_issues,
      estimatedWorkload: project.estimated_workload,
      deadlinePressure: project.deadline_pressure,
      descriptionLength: project.description?.length || 0,
    }),
    [project],
  );

  const evaluationStep = getClientEvaluationProgress({
    bidCount: projectBids.length,
    shortlistedCount,
    profilesViewedCount: viewedProfileIds.size,
  });

  const openProfile = (bid) => {
    setViewedProfileIds((prev) => new Set(prev).add(bid.id));
    navigateToBidderProfile(navigate, bid, project);
  };

  return (
    <div className="bg-card border border-border/70 rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              {project.category && (
                <Badge variant="outline" className="text-xs">{project.category.replace("_", " ")}</Badge>
              )}
              {project.urgency && (
                <Badge variant="secondary" className="text-xs">{URGENCY_LABELS[project.urgency] || project.urgency}</Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground leading-snug">{project.title}</h3>
            {postedAgo && <p className="text-xs text-muted-foreground mt-1">Posted {postedAgo}</p>}
          </div>
          <div className="shrink-0 text-right">
            {project.budget_amount && (
              <p className="font-extrabold text-primary text-lg">£{project.budget_amount.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground">{projectBids.length} bid{projectBids.length !== 1 ? "s" : ""} received</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline underline-offset-2"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Hide quick view" : `Quick view · ${projectBids.length} bid${projectBids.length !== 1 ? "s" : ""}`}
          </button>
          {projectBids.length > 0 ? (
            <Link
              to={`/my-projects/${project.id}`}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
            >
              Compare bids →
            </Link>
          ) : (
            <Link to={`/projects/${project.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View project →
            </Link>
          )}
          {hasWorkspace && (
            <Link
              to={`/workspace/${project.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg hover:bg-teal-100"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Continue in workspace
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
         {expanded && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="overflow-hidden"
           >
             <div className="border-t border-border/40 px-5 py-4 space-y-4">
               {/* Activity Feed */}
               <ProjectActivityFeed bids={projectBids} />

               {/* Bids List */}
               <div className="space-y-3">
                 {projectBids.length === 0 ? (
                   <div className="text-center py-6">
                     <Gavel className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">No bids yet — professionals will bid soon.</p>
                   </div>
                 ) : (
                   <>
                    {canAward && (
                      <ClientDecisionGuidance
                        activeStep={evaluationStep}
                        shortlistedCount={shortlistedCount}
                        totalBids={projectBids.length}
                        className="mx-1"
                      />
                    )}
                    <div className="rounded-lg border border-teal-100 bg-teal-50/60 px-3 py-2 mx-1">
                      <IdentityRevealNotice />
                    </div>
                    <p className="text-[11px] text-muted-foreground px-1">
                      Sorted by expertise and fit — not by price. Other quotes stay confidential.
                    </p>
                    {canAward && shortlistedCount > 0 && (
                      <Button
                        type="button"
                        variant={compareShortlisted ? "default" : "outline"}
                        size="sm"
                        className="h-8 rounded-lg text-xs gap-1.5 mx-1"
                        onClick={() => setCompareShortlisted((v) => !v)}
                      >
                        <ListChecks className="h-3.5 w-3.5" />
                        {compareShortlisted ? "Show all professionals" : `Compare shortlisted (${shortlistedCount})`}
                      </Button>
                    )}
                    {showShortlistFilterEmpty ? (
                      <div className="rounded-lg border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm text-violet-900">
                        <p className="font-semibold">No shortlisted professionals</p>
                        <p className="text-xs mt-1 text-violet-800">
                          Shortlist one or more bids to compare, or show all {projectBids.length} bid{projectBids.length !== 1 ? "s" : ""}.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-8 rounded-lg text-xs"
                          onClick={() => setCompareShortlisted(false)}
                        >
                          Show all bids
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayedBids.map((bid) => (
                          <ClientBidCard
                            key={bid.id}
                            bid={bid}
                            project={project}
                            marketplaceScore={marketplaceScore}
                            canAward={canAward}
                            profileViewed={viewedProfileIds.has(bid.id)}
                            onViewProfile={openProfile}
                            onToggleShortlist={onToggleShortlist}
                            onAward={(proj, enriched, meta) => onAwardBid(proj, enriched, {
                              profileViewed: viewedProfileIds.has(enriched.id),
                              shortlistedCount,
                              totalBids: projectBids.length,
                              ...meta,
                            })}
                          />
                        ))}
                      </div>
                    )}
                   </>
                 )}
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

    </div>
  );
}

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [bids, setBids] = useState([]);
  const [awardConfirm, setAwardConfirm] = useState(null);
  const [awarding, setAwarding] = useState(false);
  const { toast } = useToast();

  const loadProjects = async () => {
    const localProjects = getPostedProjects();
    try {
      const user = await base44.auth.me();
      const results = await base44.entities.JobPost.filter({ created_by: user.email }, "-created_date", 100);
      setProjects(mergeProjectSources(results, localProjects));
    } catch {
      setProjects(localProjects);
    }
  };

  const loadBids = async () => {
    try {
      const results = await base44.entities.Bid.list("-created_date", 200);
      const localBids = getAllBids();
      const resultIds = new Set((results || []).map((bid) => bid.id));
      setBids([...(results || []), ...localBids.filter((bid) => !resultIds.has(bid.id))]);
    } catch {
      setBids(getAllBids());
    }
  };

  const handleToggleShortlist = async (bid) => {
    const updated = toggleBidShortlist(bid.id);
    if (!updated) return;
    setBids((current) => current.map((item) => (item.id === bid.id ? { ...item, ...updated } : item)));
    try {
      await base44.entities.Bid.update(bid.id, { status: updated.status });
    } catch {
      /* local saved */
    }
    toast({
      title: updated.status === "shortlisted" ? "Added to shortlist" : "Removed from shortlist",
      description: updated.status === "shortlisted"
        ? "Compare shortlisted professionals side by side before awarding."
        : "Professional removed from your shortlist.",
    });
  };

  const handleAwardBid = (project, bid, meta = {}) => {
    const professionalLabel = getRevealedFullName(enrichBidIdentity(bid));
    setAwardConfirm({ project, bid, meta, professionalLabel });
  };

  const executeAward = async () => {
    if (!awardConfirm) return;
    const { project, bid, meta } = awardConfirm;
    const professionalLabel = awardConfirm.professionalLabel;

    setAwarding(true);
    try {
      let clientEmail = project.created_by;
      try {
        const user = await base44.auth.me();
        clientEmail = user?.email || clientEmail;
      } catch { /* demo */ }

      const { project: awardedProject, bid: enrichedBid, workspace } = executeProjectAward({
        project,
        winningBid: bid,
        clientEmail,
      });

      setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, ...awardedProject } : item)));
      setBids((current) => current.map((item) => {
        if (item.project_id !== project.id) return item;
        const won = item.id === enrichedBid.id;
        return {
          ...item,
          status: won ? "accepted" : "rejected",
          awarded: won,
          identity_revealed: won,
          rejection_reason: won ? undefined : "Another professional was selected",
        };
      }));

      try {
        await base44.entities.JobPost.update(project.id, {
          status: "in_progress",
          lifecycle_state: "awarded",
          awarded_bid_id: enrichedBid.id,
          accepting_bids: false,
        });
      } catch (err) {
        console.warn("Failed to update project award in backend; local state saved.", err);
      }

      await Promise.allSettled(
        bids
          .filter((item) => item.project_id === project.id)
          .map((item) => base44.entities.Bid.update(item.id, {
            status: item.id === enrichedBid.id ? "accepted" : "rejected",
            awarded: item.id === enrichedBid.id,
            identity_revealed: item.id === enrichedBid.id,
          })),
      );

      toast({
        title: "Project awarded",
        description: workspace
          ? `Workspace opened for ${professionalLabel}. Bidding is now closed.`
          : `Full identity unlocked for ${professionalLabel}.`,
        duration: 5000,
      });
      setAwardConfirm(null);
      navigate(`/workspace/${project.id}`);
    } finally {
      setAwarding(false);
    }
  };

  useEffect(() => {
    loadProjects();
    loadBids();
    const refresh = () => { loadProjects(); loadBids(); };
    window.addEventListener("projectPosted", refresh);
    window.addEventListener("bidSubmitted", loadBids);
    window.addEventListener("bidUpdated", refresh);
    window.addEventListener("projectAwarded", refresh);
    window.addEventListener("projectCompleted", refresh);
    return () => {
      window.removeEventListener("projectPosted", refresh);
      window.removeEventListener("bidSubmitted", loadBids);
      window.removeEventListener("bidUpdated", refresh);
      window.removeEventListener("projectAwarded", refresh);
      window.removeEventListener("projectCompleted", refresh);
    };
  }, []);

  const totalBids = bids.filter(b => projects.some(p => p.id === b.project_id)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground">My Projects</h1>
                <p className="text-sm text-muted-foreground">Review professionals by expertise and fit — not price alone</p>
              </div>
            </div>
            <Link to="/post-job">
              <Button className="rounded-xl gap-2 shrink-0"><Plus className="h-4 w-4" />Post Project</Button>
            </Link>
          </div>

          {projects.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Active Projects", value: projects.filter(p => getBiddingState(p).isOpen).length, color: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-100" },
                { label: "Total Bids Received", value: totalBids, color: "text-primary", bg: "bg-primary/5 border border-primary/10" },
                { label: "Projects Posted", value: projects.length, color: "text-foreground", bg: "bg-secondary/50" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl px-3 py-2.5 text-center ${s.bg}`}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {projects.length === 0 ? (
          <MyProjectsDemo />
        ) : (
          <div className="space-y-4">
            {[...projects].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((project, i) => (
              <motion.div key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.25) }}>
                <ProjectRow
                  project={project}
                  bids={bids}
                  navigate={navigate}
                  onAwardBid={handleAwardBid}
                  onToggleShortlist={handleToggleShortlist}
                  onOpenComparison={(id) => navigate(`/my-projects/${id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
            ? () => navigateToBidderProfile(navigate, awardConfirm.bid, awardConfirm.project)
            : undefined
        }
      />
    </div>
  );
}

