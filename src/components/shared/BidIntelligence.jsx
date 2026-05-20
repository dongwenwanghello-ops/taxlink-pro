/**
 * Practical quote checklist while bidding — collapsed by default, no AI fit language.
 */
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, CheckCircle2, Users, Info, ChevronDown, EyeOff,
} from "lucide-react";
import { analyseBidHealth, getCompetitionIntelligence } from "@/lib/marketplaceIntelligence";

function FactorTag({ text, type }) {
  const styles = {
    positive: "bg-secondary border-border text-foreground",
    negative: "bg-secondary border-border text-muted-foreground",
    warning:  "bg-secondary border-border text-foreground",
    neutral:  "bg-secondary border-border text-muted-foreground",
  };
  return (
    <p className={`text-xs border rounded-lg px-2.5 py-1.5 ${styles[type] || styles.neutral}`}>
      {text}
    </p>
  );
}

export default function BidIntelligence({
  amount,
  budgetAmount,
  category,
  timeline,
  qualifications = [],
  proposal = "",
  bidCount = 0,
  complexity = "medium",
  urgency = "negotiable",
  biddingPeriod,
  remote = true,
  missingRecords = false,
  multipleIncomeSources = false,
  internationalTaxIssues = false,
  estimatedWorkload,
  deadlinePressure,
}) {
  const [open, setOpen] = useState(false);

  const bidHealth = useMemo(
    () => analyseBidHealth({
      amount,
      category,
      budgetAmount,
      complexity,
      urgency,
      remote,
      missingRecords,
      multipleIncomeSources,
      internationalTaxIssues,
      estimatedWorkload,
      deadlinePressure,
    }),
    [amount, category, budgetAmount, complexity, urgency, remote, missingRecords, multipleIncomeSources, internationalTaxIssues, estimatedWorkload, deadlinePressure]
  );

  const competition = useMemo(
    () => getCompetitionIntelligence({
      bidCount,
      category,
      budgetAmount,
      complexity,
      urgency,
      biddingPeriod,
      remote,
      missingRecords,
      multipleIncomeSources,
      internationalTaxIssues,
      estimatedWorkload,
      deadlinePressure,
    }),
    [bidCount, category, budgetAmount, complexity, urgency, biddingPeriod, remote, missingRecords, multipleIncomeSources, internationalTaxIssues, estimatedWorkload, deadlinePressure]
  );

  if (!bidHealth) return null;

  const HealthIcon = bidHealth.healthLevel === "good" ? CheckCircle2 : Info;

  const proposalTips = [];
  const pLen = proposal.trim().length;
  const pWords = proposal.trim().split(/\s+/).filter(Boolean).length;
  if (pLen > 0 && pWords < 20) proposalTips.push({ type: "warning", text: "Add a bit more detail to your proposal" });
  if (pLen > 0 && !/acca|aca|cta|att|aat|qualified|experience|year|specialist/i.test(proposal)) {
    proposalTips.push({ type: "neutral", text: "Mention relevant qualifications and experience" });
  }
  if (pWords >= 30 && /experience|qualified|deliver/i.test(proposal)) {
    proposalTips.push({ type: "positive", text: "Proposal covers the basics clients look for" });
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <span className="text-xs font-semibold text-foreground">Before you submit (optional)</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="px-3.5 pb-3.5 pt-2.5 space-y-3 text-xs">
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <HealthIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{bidHealth.healthLabel}</p>
                  <p className="mt-0.5">{bidHealth.advice}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-secondary/50 px-2 py-2">
                  <p className="text-[10px] text-muted-foreground">Typical UK range</p>
                  <p className="font-bold text-foreground text-[11px]">
                    £{bidHealth.marketRange.min.toLocaleString()}–£{bidHealth.marketRange.max.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 px-2 py-2">
                  <p className="text-[10px] text-muted-foreground">Your quote</p>
                  <p className="font-bold text-sm text-foreground">
                    {amount && Number(amount) > 0 ? `£${Number(amount).toLocaleString()}` : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {competition.competitionLevel}
                </p>
                <p>{competition.opportunityWindow}</p>
              </div>

              {proposalTips.length > 0 && (
                <div className="space-y-1">
                  {proposalTips.map((tip, i) => <FactorTag key={i} text={tip.text} type={tip.type} />)}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <EyeOff className="h-3 w-3 shrink-0" />
                Other professionals&apos; quotes stay confidential.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
