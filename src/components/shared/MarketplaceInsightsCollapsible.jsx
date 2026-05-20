import React, { useState } from "react";
import { ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import WinChanceBreakdown from "@/components/shared/WinChanceBreakdown";
import MarketplaceIntelligence from "@/components/shared/MarketplaceIntelligence";
import GuidedPricingPanel from "@/components/shared/GuidedPricingPanel";

/**
 * Advanced marketplace analytics — collapsed by default to reduce cognitive load.
 */
export default function MarketplaceInsightsCollapsible({
  job,
  marketplaceScore,
  winChance,
  bidCount,
  clientRating,
  clientPaymentRate,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!job) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Marketplace insights</p>
            <p className="text-[11px] text-muted-foreground truncate">
              Pricing context, demand signals, and detailed fit analysis
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border/50">
          <GuidedPricingPanel job={job} marketplaceScore={marketplaceScore} insightsMode />

          {winChance && (
            <WinChanceBreakdown
              percent={winChance.score}
              displayRange={winChance.displayRange}
              label={winChance.marketFitLabel || winChance.label}
              summary={winChance.marketFitDetail || winChance.summary}
              insights={winChance.insights}
              priceScore={(winChance.factors?.price || 50) / 100}
              competitionScore={(winChance.factors?.competition || 50) / 100}
              trustScore={(winChance.factors?.clientTrust || 80) / 100}
              reputationScore={(winChance.factors?.reputation || 60) / 100}
              demandScore={(marketplaceScore?.interestScore || 50) / 100}
              urgencyScore={(winChance.factors?.response || 60) / 100}
              category={job.category}
              bidCount={bidCount}
              budgetAmount={job.budget_amount}
              userRating={parseFloat(clientRating)}
              clientPaymentRate={clientPaymentRate}
              complexity={job.complexity || "medium"}
              detailed
            />
          )}

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
        </div>
      )}
    </div>
  );
}
