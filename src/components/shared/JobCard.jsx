import React, { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Briefcase, Wifi, ArrowRight, Users, TrendingUp, Gavel, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import BidModal from "./BidModal.jsx";
import WinChanceIndicator from "./WinChanceIndicator.jsx";
import CountdownBadge from "./CountdownBadge.jsx";
import { useBiddingCountdown } from "@/hooks/useBiddingCountdown";
import { resolveDeadline } from "@/lib/countdownUtils";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";
import { getBidCountForProject } from "@/lib/bidStore";
import { cn } from "@/lib/utils";

const SERVICE_LABELS = {
  self_assessment: "Self Assessment", vat_return: "VAT Return",
  corporation_tax: "Corporation Tax", rd_claim: "R&D Tax Claim",
  payroll: "Payroll", bookkeeping: "Bookkeeping",
  tax_investigation: "Tax Investigation", capital_gains: "Capital Gains",
  inheritance_tax: "Inheritance Tax", other: "Advisory",
};

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
  one_off: "One-off", short_term: "1–3 months", long_term: "3+ months", ongoing: "Ongoing",
};

const urgencyLabels = {
  negotiable: "Negotiable",
  flexible: "Negotiable",
  standard: "Standard",
  within_month: "Within 1 month",
  within_2weeks: "Within 2 weeks",
  within_week: "Within 1 week",
  urgent: "Urgent",
  asap: "ASAP",
};

function cleanDisplayTitle(title = "") {
  const cleaned = title
    .replace(/\s+[—-]\s*(simple|medium|complex)\s+complexity$/i, "")
    .replace(/\b(simple|medium|complex)\s+complexity\b/gi, "")
    .replace(/\bcomplexity\b/gi, "")
    .replace(/\s+[—-]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || title;
}

function formatCurrency(value) {
  return `£${Math.round(value).toLocaleString()}`;
}

function getBudgetDisplay(job, marketplaceScore) {
  if (job.starting_bid) {
    return {
      label: "Starting from",
      value: formatCurrency(job.starting_bid),
      tone: "emerald",
    };
  }

  if (job.budget_amount) {
    return {
      label: "Budget from",
      value: formatCurrency(job.budget_amount),
      tone: "primary",
    };
  }

  const range = marketplaceScore?.recommendedBudgetRange;
  if (range?.min && range?.max) {
    return {
      label: "Estimated budget",
      value: `${formatCurrency(range.min)}-${formatCurrency(range.max)}`,
      tone: "violet",
    };
  }

  return {
    label: "Estimated budget",
    value: "Pricing pending",
    tone: "muted",
  };
}

const budgetToneClasses = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  primary: "bg-primary/5 border-primary/20 text-primary",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
  muted: "bg-secondary border-border text-foreground",
};



export default function JobCard({ job }) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [bidCount, setBidCount] = useState(() => getBidCountForProject(job.id));
  const { isClosed: biddingClosed, isOpen: biddingOpen, hasDeadline } = useBiddingCountdown(job, {
    startDate: job.created_date,
    biddingPeriod: job.bidding_period,
  });
  const deadline = resolveDeadline(job);

  const catColor = categoryColors[job.category] || categoryColors.other;
  const catLabel = categoryLabels[job.category] || job.category;
  const postedAgo = job.created_date ? formatDistanceToNow(new Date(job.created_date), { addSuffix: true }) : null;
  const marketplaceScore = useMemo(() => scoreMarketplaceProject({
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
  }), [job]);
  const budgetDisplay = getBudgetDisplay(job, marketplaceScore);
  const displayTitle = cleanDisplayTitle(job.title);

  useEffect(() => {
    const refresh = () => {
      setBidCount(getBidCountForProject(job.id));
    };
    window.addEventListener("bidSubmitted", refresh);
    refresh();
    return () => window.removeEventListener("bidSubmitted", refresh);
  }, [job.id]);

  return (
    <>
      <div
        className={cn(
          "group bg-card border border-border/70 rounded-2xl overflow-hidden transition-all duration-200",
          biddingClosed
            ? "opacity-[0.72] hover:shadow-none hover:border-border/70"
            : "hover:shadow-lg hover:shadow-primary/6 hover:border-primary/30",
        )}
      >

        <div className="p-4 sm:p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/projects/${job.id}`} className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug hover:underline underline-offset-2">
                    {displayTitle}
                  </h3>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {biddingOpen && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Open for bids
                  </span>
                )}
                {!biddingOpen && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
                    Bidding closed
                  </span>
                )}
                <Badge variant="outline" className={`text-[11px] font-medium ${catColor}`}>{catLabel}</Badge>
                {job.remote && (
                  <Badge variant="secondary" className="text-[11px] font-normal gap-1">
                    <Wifi className="h-3 w-3" />Remote
                  </Badge>
                )}
                {job.urgency && (
                  <Badge variant="secondary" className="text-[11px] font-normal">
                    {urgencyLabels[job.urgency] || job.urgency}
                  </Badge>
                )}
                {job._user_posted && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">Just Posted</span>
                )}
              </div>
              {job.company_name && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Briefcase className="h-3 w-3 shrink-0" />{job.company_name}
                </p>
              )}
            </div>

            <div className="shrink-0 sm:text-right">
              <div className={cn("rounded-xl px-3 py-2 min-w-[132px] border", budgetToneClasses[budgetDisplay.tone])}>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5 opacity-75">{budgetDisplay.label}</p>
                <div className="text-base font-extrabold leading-none whitespace-nowrap">
                  {budgetDisplay.value}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {hasDeadline && biddingOpen && (
              <CountdownBadge
                deadline={deadline}
                startDate={job.created_date}
                biddingPeriod={job.bidding_period}
                showDeadlineHint={false}
              />
            )}
            <WinChanceIndicator bidCount={bidCount} />
            {job.services?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.services.map(svc => (
                  <span key={svc} className="px-2 py-0.5 rounded-md bg-secondary/70 border border-border/60 text-muted-foreground text-[10px] font-semibold">
                    {SERVICE_LABELS[svc] || svc}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-secondary/50 border-border/50 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {postedAgo ? <span>Posted {postedAgo}</span> : <span>Recently posted</span>}
              <div className="h-3 w-px bg-border/60" />
              <span>{durationLabels[job.duration] || "One-off"}</span>
              {job.remote && <>
                <div className="h-3 w-px bg-border/60" />
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />Remote</span>
              </>}
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-3 space-y-3 border-t border-border/40 pt-3">
                {job.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
                )}
                {job.required_qualifications?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-muted-foreground">Requires:</span>
                    {job.required_qualifications.map((q) => (
                      <span key={q} className="px-2 py-0.5 rounded-md bg-primary/8 text-primary border border-primary/20 text-xs font-semibold">{q}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong className="text-foreground">{bidCount >= 6 ? "High" : bidCount >= 3 ? "Active" : "Early"} competition</strong>
                    {" · "}{durationLabels[job.duration] || "One-off"}
                    {postedAgo && <>{" · "}Posted {postedAgo}</>}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border/40 bg-secondary/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Hide details" : "View details"}
            </button>
            <Link to={`/projects/${job.id}`} className="text-xs text-primary font-semibold hover:underline underline-offset-2 flex items-center gap-0.5">
              Full view <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Button
            size="sm"
            disabled={biddingClosed}
            onClick={() => !biddingClosed && setShowBidModal(true)}
            className={cn(
              "rounded-lg text-xs h-8 font-semibold gap-1.5 shrink-0 border-0",
              biddingClosed
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-violet-600 to-primary",
            )}
          >
            <Gavel className="h-3.5 w-3.5" />
            {biddingClosed ? "Bidding Closed" : "Submit Your Quote"}
            {!biddingClosed && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {showBidModal && <BidModal job={job} bidCount={bidCount} onClose={() => setShowBidModal(false)} />}
    </>
  );
}