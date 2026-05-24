/**
 * Guided pricing — professional marketplace psychology (not lowest-price wins).
 */
import { computeFairMarketRange } from "@/lib/marketplaceIntelligence";
import { getMarketBudgetGuidance } from "@/lib/projectBiddingUX";
import { scoreProfessionalMatch } from "@/lib/expertiseMatching";

const COMPLEXITY_LEVELS = {
  basic: {
    emoji: "🟢",
    label: "Basic",
    tone: "emerald",
    description: "Straightforward scope with limited moving parts",
  },
  moderate: {
    emoji: "🟠",
    label: "Moderate",
    tone: "amber",
    description: "Standard UK business work with some variables to confirm",
  },
  complex: {
    emoji: "🔴",
    label: "Complex",
    tone: "rose",
    description: "Higher workload — allow time for records, scope, and review",
  },
};

function parseTransactionVolume(job = {}) {
  const raw = job.transaction_volume || job.estimated_workload || "";
  const match = String(raw).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

/** Score project complexity from scope signals (not competitor data). */
export function analyzeProjectComplexity(job = {}) {
  let score = 0;
  const factors = [];

  const category = job.category || "other";
  const declared = job.complexity || "medium";

  if (declared === "simple") score += 0;
  else if (declared === "complex") score += 3;
  else score += 1;

  if (job.missing_records) {
    score += 2;
    factors.push("Records need tidying or gathering");
  }
  if (job.multiple_income_sources) {
    score += 1;
    factors.push("Multiple income sources");
  }
  if (job.international_tax_issues) {
    score += 2;
    factors.push("International tax considerations");
  }

  const tx = parseTransactionVolume(job);
  if (tx && tx > 200) {
    score += 2;
    factors.push(`Higher transaction volume (~${tx}/month)`);
  } else if (tx && tx > 80) {
    score += 1;
    factors.push("Moderate transaction volume");
  }

  if (category === "payroll" || job.includes_payroll) {
    score += 1;
    factors.push("Payroll involvement");
  }
  if (category === "vat" || category === "vat_return") {
    score += 1;
    factors.push("VAT reporting complexity");
  }
  if (category === "corporation_tax" || category === "audit") {
    score += 2;
    factors.push("Corporate / compliance depth");
  }

  const urgency = job.urgency || "negotiable";
  if (urgency === "urgent" || urgency === "asap" || urgency === "within_week") {
    score += 1;
    factors.push("Tighter deadline");
  }

  const descLen = (job.description || "").trim().length;
  if (descLen < 60) {
    score += 1;
    factors.push("Limited project detail so far");
  } else if (descLen >= 200) {
    factors.push("Clear written scope");
  }

  if (job.software || category === "bookkeeping" || category === "vat") {
    factors.push(`Software: ${job.software || "Xero / cloud books"}`);
  }

  if (job.business_type?.toLowerCase?.().includes("ltd") || job.company_name) {
    factors.push("UK limited company structure");
  }

  const level = score <= 2 ? "basic" : score <= 5 ? "moderate" : "complex";
  const meta = COMPLEXITY_LEVELS[level];

  const marketRange = computeFairMarketRange(
    category,
    level === "basic" ? "simple" : level === "complex" ? "complex" : "medium",
    urgency,
    {
      budgetAmount: job.budget_amount,
      missingRecords: job.missing_records,
      internationalTaxIssues: job.international_tax_issues,
      estimatedWorkload: job.estimated_workload,
    },
  );

  return {
    level,
    score,
    ...meta,
    factors: factors.slice(0, 6),
    pricingRange: {
      min: marketRange.min,
      max: marketRange.max,
      label: `Typical range £${marketRange.min.toLocaleString()}–£${marketRange.max.toLocaleString()}`,
    },
  };
}

/** Recurring relationship signals for professionals. */
export function getRecurringWorkSignals(job = {}) {
  const category = job.category || "other";
  const duration = job.duration || "one_off";
  const signals = [];

  if (category === "bookkeeping" || category === "vat" || category === "payroll") {
    signals.push({
      label: "Potential ongoing bookkeeping or compliance support",
      tone: "emerald",
    });
  }
  if (category === "vat" || category === "vat_return") {
    signals.push({ label: "Quarterly VAT work may continue", tone: "blue" });
  }
  if (category === "corporation_tax" || category === "tax_return") {
    signals.push({ label: "Annual accounts or tax return relationship likely", tone: "violet" });
  }
  if (duration === "ongoing" || duration === "long_term") {
    signals.push({ label: "Client indicated longer-term engagement", tone: "teal" });
  } else if (duration === "short_term") {
    signals.push({ label: "Possible follow-on work after initial delivery", tone: "slate" });
  }
  if (job.company_name) {
    signals.push({ label: "Established business — relationship-building opportunity", tone: "amber" });
  }

  return signals.length
    ? signals
    : [{ label: "One-off project — clarify if ongoing support is needed", tone: "slate" }];
}

export function getGuidedMarketGuidance(job = {}, marketplaceScore = null) {
  const guidance = getMarketBudgetGuidance(job, marketplaceScore);
  const complexity = analyzeProjectComplexity(job);
  return {
    ...guidance,
    complexity,
    selectionTip: "Price for scope and expertise — not to undercut blindly.",
    philosophy: "TaxPro UK is a guided professional matching marketplace. Other professionals' quotes are confidential.",
  };
}

/** Client-side ranking: value-based, never cheapest-first. */
export function scoreBidForClientReview(bid = {}) {
  let score = 0;
  const quals = bid.qualifications || bid.bidder_quals || bid.professional_credentials?.qualifications || [];
  if (bid.bidder_qual) quals.push(bid.bidder_qual);

  score += Math.min(quals.length, 4) * 18;
  score += Math.min((bid.proposal || "").trim().length, 400) * 0.08;

  const rating = Number(bid.bidder_rating || bid.rating || 0);
  if (rating > 0) score += rating * 12;

  const jobs = Number(bid.completed_jobs || bid.completedJobs || 0);
  score += Math.min(jobs, 25) * 1.5;

  const onTime = Number(bid.on_time_completion_rate || bid.onTimeCompletionRate || 0);
  if (onTime > 0) score += (onTime > 1 ? onTime : onTime * 100) * 0.15;

  const exp = bid.years_experience || bid.experience_label || "";
  const yearsMatch = String(exp).match(/(\d+)/);
  if (yearsMatch) score += Math.min(Number(yearsMatch[1]), 15) * 1.2;

  if (bid.status === "shortlisted") score += 25;
  if (bid.status === "accepted" || bid.awarded) score += 100;

  const headline = bid.bidder_headline || bid.professional_credentials?.headline;
  if (headline) score += 8;

  const { score: expertiseScore } = scoreProfessionalMatch(
    {
      bidder_primary_specialisms: bid.bidder_primary_specialisms,
      bidder_secondary_specialisms: bid.bidder_secondary_specialisms,
      specialisations: bid.bidder_specialisms,
      professional_credentials: bid.professional_credentials,
      qualification_status: bid.professional_credentials?.qualification_status,
      professional_level: bid.professional_credentials?.professional_level,
      years_experience_numeric: bid.professional_credentials?.years_experience_numeric,
      years_experience: bid.years_experience,
    },
    { category: bid.project_category, title: bid.project_title },
  );
  score += Math.min(expertiseScore * 12, 36);

  return Math.round(score);
}

export function sortBidsForClientReview(bids = []) {
  return [...bids].sort((a, b) => scoreBidForClientReview(b) - scoreBidForClientReview(a));
}

export function getQuoteAlignmentSignal(amount, job = {}, marketplaceScore = null) {
  const num = Number(amount);
  if (!num || num <= 0) return null;

  const range =
    marketplaceScore?.recommendedBudgetRange
    || computeFairMarketRange(job.category || "other", job.complexity || "medium", job.urgency || "negotiable", {
      budgetAmount: job.budget_amount,
      missingRecords: job.missing_records,
      internationalTaxIssues: job.international_tax_issues,
    });

  if (num < range.min * 0.7) {
    return {
      tone: "warning",
      label: "Below typical market range",
      detail: "Ensure your quote reflects realistic workload — underpricing can hurt delivery quality.",
    };
  }
  if (num <= range.max * 1.1) {
    return {
      tone: "positive",
      label: "Aligned with market expectations",
      detail: "Your quote sits within the typical range for this type of work.",
    };
  }
  return {
    tone: "neutral",
    label: "Premium positioning",
    detail: "Your quote is above typical range — emphasise expertise and outcomes in your proposal.",
  };
}
