import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Briefcase, Wifi, ArrowRight, Users, TrendingUp, Gavel, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import BidModal from "./BidModal.jsx";
import WinChanceIndicator from "./WinChanceIndicator.jsx";
import CountdownBadge from "./CountdownBadge.jsx";

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



export default function JobCard({ job }) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [bidCount, setBidCount] = useState(0);

  const catColor = categoryColors[job.category] || categoryColors.other;
  const catLabel = categoryLabels[job.category] || job.category;
  const postedAgo = job.created_date ? formatDistanceToNow(new Date(job.created_date), { addSuffix: true }) : null;

  useEffect(() => {
    const refresh = () => {
      // Count bids from DB via bidSubmitted event (actual count tracked in MyBids/MyProjects)
      // For the card, we rely on the count passed up or default to 0 until bid is submitted
    };
    window.addEventListener("bidSubmitted", refresh);
    return () => window.removeEventListener("bidSubmitted", refresh);
  }, [job.id]);

  return (
    <>
      <div className="group bg-card border border-border/70 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/6 hover:border-primary/30">

        <div className="p-5 pb-3">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {job.status === "open" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Open for bids
                  </span>
                )}
                <Badge variant="outline" className={`text-[11px] font-medium ${catColor}`}>{catLabel}</Badge>
                {job.remote && (
                  <Badge variant="secondary" className="text-[11px] font-normal gap-1">
                    <Wifi className="h-3 w-3" />Remote
                  </Badge>
                )}
                {job._user_posted && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">Just Posted</span>
                )}
              </div>

              <Link to={`/projects/${job.id}`}>
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug hover:underline underline-offset-2">
                  {job.title}
                </h3>
              </Link>
              {job.services?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {job.services.map(svc => (
                    <span key={svc} className="px-2 py-0.5 rounded-md bg-primary/8 border border-primary/20 text-primary text-[10px] font-semibold">
                      {SERVICE_LABELS[svc] || svc}
                    </span>
                  ))}
                </div>
              )}
              {job.company_name && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Briefcase className="h-3 w-3 shrink-0" />{job.company_name}
                </p>
              )}
            </div>

            <div className="shrink-0 text-right">
              {job.starting_bid ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 min-w-[110px]">
                  <p className="text-[9px] text-emerald-700 font-semibold uppercase tracking-widest mb-0.5">Open bids from</p>
                  <div className="text-base font-extrabold text-emerald-700 leading-none">
                    £{job.starting_bid.toLocaleString()}
                  </div>
                </div>
              ) : job.budget_amount ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 min-w-[90px]">
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">Budget from</p>
                  <div className="text-base font-extrabold text-primary leading-none">
                    £{job.budget_amount.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="bg-secondary rounded-xl px-3 py-2 min-w-[80px]">
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">Budget</p>
                  <div className="text-sm font-bold text-foreground">Open bids</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <WinChanceIndicator bidCount={bidCount} />
            {job.bidding_deadline && <CountdownBadge deadline={job.bidding_deadline} compact={true} />}
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
            onClick={() => setShowBidModal(true)}
            className="rounded-lg text-xs h-8 font-semibold gap-1.5 shrink-0 bg-gradient-to-r from-violet-600 to-primary border-0"
          >
            <Gavel className="h-3.5 w-3.5" />
            Submit Your Quote
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showBidModal && <BidModal job={job} bidCount={bidCount} onClose={() => setShowBidModal(false)} />}
    </>
  );
}