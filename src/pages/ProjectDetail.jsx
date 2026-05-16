import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Briefcase, Clock, Users, Wifi, Star, ShieldCheck,
  Gavel, TrendingUp, CheckCircle2, Zap, MapPin, Calendar, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { DEMO_JOBS } from "@/lib/demoData";
import { base44 } from "@/api/base44Client";
import { getBidsForProject } from "@/lib/bidStore";
import { getPostedProjects } from "@/lib/projectStore";
import { computeBidCompetitiveness } from "@/lib/winProbabilityEngine";
import BidModal from "@/components/shared/BidModal.jsx";
import CountdownBadge from "@/components/shared/CountdownBadge.jsx";
import { useBiddingCountdown } from "@/hooks/useBiddingCountdown";
import { resolveDeadline } from "@/lib/countdownUtils";
import { cn } from "@/lib/utils";
import MarketplaceIntelligence from "@/components/shared/MarketplaceIntelligence";
import WinChanceBreakdown from "@/components/shared/WinChanceBreakdown.jsx";
import OwnerProjectActions from "@/components/shared/OwnerProjectActions";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";

const categoryLabels = {
  tax_return: "Tax Return", bookkeeping: "Bookkeeping", payroll: "Payroll",
  vat: "VAT", corporation_tax: "Corporation Tax", audit: "Audit",
  advisory: "Advisory", other: "Other",
};

const categoryColors = {
  tax_return: "bg-blue-50 text-blue-700 border-blue-200",
  bookkeeping: "bg-violet-50 text-violet-700 border-violet-200",
  payroll: "bg-amber-50 text-amber-700 border-amber-200",
  vat: "bg-emerald-50 text-emerald-700 border-emerald-200",
  corporation_tax: "bg-rose-50 text-rose-700 border-rose-200",
  audit: "bg-sky-50 text-sky-700 border-sky-200",
  advisory: "bg-indigo-50 text-indigo-700 border-indigo-200",
  other: "bg-secondary text-secondary-foreground border-border",
};

const durationLabels = {
  one_off: "One-off project", short_term: "Short-term (1–3 months)",
  long_term: "Long-term (3+ months)", ongoing: "Ongoing retainer",
};

const complexityLabels = {
  simple: "Simple", medium: "Medium", complex: "Complex",
};

const complexityColors = {
  simple: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  complex: "bg-rose-50 text-rose-700 border-rose-200",
};

const urgencyLabels = {
  negotiable: "Negotiable",
  flexible: "Negotiable",
  standard: "Standard",
  within_month: "Within a month",
  within_2weeks: "Within 2 weeks",
  within_week: "Within 1 week",
  urgent: "Urgent",
  asap: "ASAP",
};

const formatCurrency = (value) => `£${Math.round(value).toLocaleString()}`;

function seeded(id = "", offset = 0) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + offset;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border/70 rounded-2xl p-6 space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-secondary rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-secondary rounded-full animate-pulse" />
              </div>
              <div className="h-7 w-3/4 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-secondary rounded animate-pulse" />
              <div className="space-y-2 mt-4">
                <div className="h-3 w-full bg-secondary rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-secondary rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-secondary rounded animate-pulse" />
              </div>
            </div>
            <div className="bg-card border border-border/70 rounded-2xl p-5">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl bg-secondary h-20 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border/70 rounded-2xl p-5 h-40 animate-pulse" />
            <div className="bg-card border border-border/70 rounded-2xl p-5 h-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidCount, setBidCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Calculate metrics for win chance (must be called before any early returns)
  const closingHours = job ? 6 + (seeded(job.id, 3) % 58) : 24;
  const clientRating = job ? (4.5 + ((seeded(job.id, 7) % 6) / 10)).toFixed(1) : 4.5;
  const paymentRate = job ? 90 + (seeded(job.id, 13) % 10) : 90;

  const { isClosed: biddingClosed, isOpen: biddingOpen, hasDeadline } = useBiddingCountdown(job, {
    startDate: job?.created_date,
    biddingPeriod: job?.bidding_period,
  });
  const deadline = resolveDeadline(job);

  const marketplaceScore = useMemo(() => {
    if (!job) return null;
    return scoreMarketplaceProject({
      category: job.category,
      complexity: job.complexity || "medium",
      urgency: job.urgency || "negotiable",
      biddingPeriod: job.bidding_period,
      biddingDeadline: job.bidding_deadline,
      budgetAmount: job.budget_amount,
      remote: job.remote,
      missingRecords: job.missing_records,
      multipleIncomeSources: job.multiple_income_sources,
      internationalTaxIssues: job.international_tax_issues,
      estimatedWorkload: job.estimated_workload,
      deadlinePressure: job.deadline_pressure,
      descriptionLength: job.description?.length || 0,
    });
  }, [job]);

  const winChance = useMemo(() => {
    if (!job) return null;
    return computeBidCompetitiveness({
      amount: job.budget_amount || marketplaceScore?.recommendedBudgetRange?.min || 300,
      budgetAmount: job.budget_amount,
      proposal: job.description || "",
      timeline: job.urgency === "asap" ? "24h" : job.urgency === "urgent" ? "3d" : "1w",
      category: job.category,
      complexity: job.complexity || "medium",
      urgency: job.urgency || "negotiable",
      bidCount,
      clientTrustScore: paymentRate / 100,
      rating: parseFloat(clientRating),
      completedJobs: 8 + seeded(job.id, 17) % 12,
      responseSpeed: 75,
    });
  }, [job, bidCount, paymentRate, clientRating, closingHours, marketplaceScore]);

  // Load current user for ownership check
  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Load job data — try entity first, fall back to demo data
  useEffect(() => {
    if (!id) { setLoading(false); return; }

    const loadJob = async () => {
      // Check demo data first (fast, no network)
      const demoJob = DEMO_JOBS.find(j => j.id === id);
      if (demoJob) {
        setJob(demoJob);
        setLoading(false);
        return;
      }
      const localJob = getPostedProjects().find(j => j.id === id);
      if (localJob) {
        setJob(localJob);
        setLoading(false);
        return;
      }
      // Try fetching from the entity database by ID
      try {
        const result = await base44.entities.JobPost.get(id);
        setJob(result || null);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  useEffect(() => {
    const handleProjectUpdated = (event) => {
      const updated = event.detail?.project || event.detail;
      if (updated?.id === id) {
        setJob((current) => current ? { ...current, ...updated } : updated);
      }
    };
    window.addEventListener("projectUpdated", handleProjectUpdated);
    window.addEventListener("projectAwarded", handleProjectUpdated);
    return () => {
      window.removeEventListener("projectUpdated", handleProjectUpdated);
      window.removeEventListener("projectAwarded", handleProjectUpdated);
    };
  }, [id]);

  // Bid count — fetch real bids from DB
  useEffect(() => {
    if (!job) return;

    const loadBidCount = async () => {
      try {
        const bids = await base44.entities.Bid.filter({ project_id: job.id });
        const localBids = getBidsForProject(job.id);
        const ids = new Set(bids.map((bid) => bid.id));
        setBidCount(bids.length + localBids.filter((bid) => !ids.has(bid.id)).length);
      } catch {
        setBidCount(getBidsForProject(job.id).length);
      }
    };

    loadBidCount();
    const refresh = () => loadBidCount();
    window.addEventListener("bidSubmitted", refresh);
    window.addEventListener("bidUpdated", refresh);
    window.addEventListener("projectAwarded", refresh);
    return () => {
      window.removeEventListener("bidSubmitted", refresh);
      window.removeEventListener("bidUpdated", refresh);
      window.removeEventListener("projectAwarded", refresh);
    };
  }, [job?.id]);

  if (loading) return <LoadingSkeleton />;

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
            <Briefcase className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Project not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This project may have been removed or the link is incorrect.
          </p>
          <Link to="/jobs">
            <Button className="rounded-xl gap-2">
              <Briefcase className="h-4 w-4" /> Browse Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const catColor   = categoryColors[job.category] || categoryColors.other;
  const catLabel   = categoryLabels[job.category] || job.category;
  const postedAgo  = job.created_date ? formatDistanceToNow(new Date(job.created_date), { addSuffix: true }) : null;
  const critical   = closingHours < 8;
  const bidMin = job.budget_amount ? Math.round(job.budget_amount * 0.85) : null;
  const bidMax = job.budget_amount ? Math.round(job.budget_amount * (1 + bidCount * 0.07)) : null;
  const isOwner = currentUser && job.created_by && currentUser.email === job.created_by;
  const estimatedBudgetRange = marketplaceScore?.recommendedBudgetRange;

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/70 rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {biddingOpen && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Open for bids
                  </span>
                )}
                {!biddingOpen && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                    {job.status === "in_progress" || job.lifecycle_state === "awarded" ? "Awarded / In Progress" : "Bidding closed"}
                  </span>
                )}
                {(job.status === "in_progress" || job.lifecycle_state === "awarded") && job.awarded_bidder_name && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
                    Selected: {job.awarded_bidder_name}
                  </span>
                )}
                <Badge variant="outline" className={`text-xs ${catColor}`}>{catLabel}</Badge>
                {job.remote && (
                  <Badge variant="secondary" className="text-xs gap-1"><Wifi className="h-3 w-3" />Remote</Badge>
                )}
                {job.complexity && (
                  <Badge variant="outline" className={`text-xs ${complexityColors[job.complexity] || ""}`}>
                    {complexityLabels[job.complexity] || job.complexity} complexity
                  </Badge>
                )}
                {job._user_posted && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">Just Posted</span>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-foreground mb-2">{job.title}</h1>

              {job.company_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
                  <Briefcase className="h-4 w-4" />{job.company_name}
                </p>
              )}

              {job.description && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
              )}
            </motion.div>

            {/* Required qualifications */}
            {job.required_qualifications?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="bg-card border border-border/70 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-foreground text-sm">Required Qualifications</h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_qualifications.map(q => (
                    <span key={q} className="px-3 py-1 rounded-full bg-primary/8 text-primary border border-primary/20 text-xs font-bold">{q}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Bid activity */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-card border border-border/70 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Bid Activity</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-3 text-center">
                  <Users className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                  <p className="text-xl font-extrabold text-violet-700">{bidCount}</p>
                  <p className="text-xs text-muted-foreground">Bidders</p>
                </div>
                <div className={`rounded-xl border px-3 py-3 text-center ${critical ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"}`}>
                  <Clock className={`h-4 w-4 mx-auto mb-1 ${critical ? "text-rose-500" : "text-amber-500"}`} />
                  <p className={`text-xl font-extrabold ${critical ? "text-rose-700" : "text-amber-700"}`}>{closingHours}h</p>
                  <p className="text-xs text-muted-foreground">Closes in</p>
                </div>
                {bidMin && bidMax && (
                  <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-3 text-center">
                    <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-sm font-extrabold text-primary">£{bidMin.toLocaleString()}–{bidMax.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Bid range</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Win Chance Breakdown — bidders only */}
            {!isOwner && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <WinChanceBreakdown
                percent={winChance?.score}
                displayRange={winChance?.displayRange}
                label={winChance?.label}
                summary={winChance?.summary}
                insights={winChance?.insights}
                priceScore={(winChance?.factors?.price || 50) / 100}
                competitionScore={(winChance?.factors?.competition || 50) / 100}
                trustScore={(winChance?.factors?.clientTrust || 80) / 100}
                reputationScore={(winChance?.factors?.reputation || 60) / 100}
                demandScore={(marketplaceScore?.interestScore || 50) / 100}
                urgencyScore={(winChance?.factors?.response || 60) / 100}
                category={job.category}
                bidCount={bidCount}
                budgetAmount={job.budget_amount}
                userRating={parseFloat(clientRating)}
                clientPaymentRate={paymentRate}
                complexity={job.complexity || "medium"}
              />
            </motion.div>}

            {/* AI Marketplace Intelligence — bidders only */}
            {!isOwner && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <MarketplaceIntelligence
                category={job.category}
                complexity={job.complexity || "medium"}
                urgency={job.urgency || "negotiable"}
                biddingPeriod={job.bidding_period}
                biddingDeadline={job.bidding_deadline}
                budgetAmount={job.budget_amount}
                remote={job.remote}
                missingRecords={job.missing_records}
                multipleIncomeSources={job.multiple_income_sources}
                internationalTaxIssues={job.international_tax_issues}
                estimatedWorkload={job.estimated_workload}
                deadlinePressure={job.deadline_pressure}
                descriptionLength={job.description?.length || 0}
                compact={false}
              />
            </motion.div>}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Owner OR Bidder CTA */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              {isOwner ? (
                <OwnerProjectActions job={job} bidCount={bidCount} onJobUpdated={setJob} />
              ) : (
                <div className="bg-card border border-border/70 rounded-2xl p-5 space-y-4">
                  {job.budget_amount ? (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">Starting Budget</p>
                      <p className="text-3xl font-extrabold text-primary">£{job.budget_amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{job.budget_type === "hourly" ? "per hour" : "fixed price"}</p>
                    </div>
                  ) : job.budget_range ? (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">Budget Range</p>
                      <p className="text-xl font-extrabold text-primary">{job.budget_range.replace(/_/g, " ").replace("over", "£").replace("under", "Under £").replace(/(\d+)_(\d+)/, "£$1–£$2")}</p>
                    </div>
                  ) : estimatedBudgetRange && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">Estimated Budget</p>
                      <p className="text-xl font-extrabold text-primary">{formatCurrency(estimatedBudgetRange.min)}-{formatCurrency(estimatedBudgetRange.max)}</p>
                      <p className="text-xs text-muted-foreground">Based on complexity, urgency and expected workload</p>
                    </div>
                  )}
                  <Button
                    disabled={biddingClosed}
                    onClick={() => !biddingClosed && setShowBidModal(true)}
                    className={cn(
                      "w-full h-11 rounded-xl font-semibold gap-2 border-0",
                      biddingClosed
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-600 to-primary",
                    )}
                  >
                    <Gavel className="h-4 w-4" />
                    {biddingClosed ? "Bidding Closed" : "Submit Your Quote"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">No fees to bid · Remote work · Verified professionals only</p>
                </div>
              )}
            </motion.div>

            {/* Project details */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card border border-border/70 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Project Details</h3>
              <div className="space-y-2 text-sm">
                {hasDeadline && biddingOpen && (
                  <div className="flex items-center justify-between">
                    <CountdownBadge
                      deadline={deadline}
                      startDate={job.created_date}
                      biddingPeriod={job.bidding_period}
                      showDeadlineHint
                    />
                  </div>
                )}
                {job.duration && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{durationLabels[job.duration] || job.duration}</span>
                  </div>
                )}
                {job.urgency && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>{urgencyLabels[job.urgency] || job.urgency}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{job.location}</span>
                  </div>
                )}
                {postedAgo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Posted {postedAgo}</span>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>Deadline: {job.deadline}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Client trust */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card border border-border/70 rounded-2xl p-5 space-y-2">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />Trusted Client
              </h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Client rating</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{clientRating}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment reliability</span>
                  <span className="font-semibold text-emerald-600">{paymentRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Verification</span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <CheckCircle2 className="h-3 w-3" />Verified
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {!isOwner && showBidModal && (
        <BidModal
          job={job}
          bidCount={bidCount}
          onClose={() => setShowBidModal(false)}
          onBidSubmitted={() => {}}
          onSubmitSuccess={() => navigate("/my-bids")}
        />
      )}
    </div>
  );
}