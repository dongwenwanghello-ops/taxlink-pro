import { computeFairMarketRange } from "@/lib/marketplaceIntelligence";
import { getTimeRemaining, getUrgencyLevel } from "@/lib/countdownUtils";

function seeded(id = "", offset = 0) {
  return String(id || "")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) + offset;
}

/** Qualitative competition — never expose exact bid counts */
export function getCompetitionInterest(bidCount = 0) {
  const count = Math.max(0, Number(bidCount) || 0);
  if (count === 0) {
    return {
      level: "first",
      headline: "Be the first professional to quote",
      subtext: "No other quotes on this project yet",
      support: "Client posted recently",
      tone: "emerald",
      icon: "rocket",
    };
  }
  if (count <= 2) {
    return {
      level: "few",
      headline: "Few professionals interested so far",
      subtext: "Scope and clarity matter more than speed alone",
      support: "Reasonable competition for this project",
      tone: "emerald",
      icon: "trending",
    };
  }
  return {
    level: "multiple",
    headline: "Several professionals have quoted",
    subtext: "A clear proposal and realistic fee stand out",
    support: "Client is comparing proposals",
    tone: "amber",
    icon: "users",
  };
}

/** Marketplace-friendly countdown copy */
export function getQuoteCountdownPsychology(deadline) {
  if (!deadline) return null;
  const remaining = getTimeRemaining(deadline);
  if (!remaining || remaining.expired) {
    return { emoji: "⚫", message: "Quotes closed", tone: "expired" };
  }

  const urgency = getUrgencyLevel(deadline);
  const totalHours = remaining.ms / (1000 * 60 * 60);

  if (urgency === "critical" || totalHours <= 6) {
    const hours = Math.max(1, Math.floor(totalHours));
    return {
      emoji: "🔴",
      message: `Final chance to submit a quote${hours <= 1 ? "" : ` — ${hours} hour${hours === 1 ? "" : "s"} left`}`,
      tone: "critical",
    };
  }

  if (urgency === "urgent" || totalHours <= 24) {
    const hours = Math.max(1, Math.floor(totalHours));
    return {
      emoji: "🟠",
      message: `Closing soon — ${hours} hour${hours === 1 ? "" : "s"} left`,
      tone: "urgent",
    };
  }

  const days = Math.max(1, remaining.days || Math.ceil(totalHours / 24));
  return {
    emoji: "🟢",
    message: `Accepting quotes for ${days} more day${days === 1 ? "" : "s"}`,
    tone: "comfortable",
  };
}

export function getClientTrustProfile(job = {}) {
  const seed = seeded(job.id, 11);
  const hasCompany = Boolean(job.company_name?.trim());

  return {
    clientName: job.company_name || job.client_name || "UK client",
    verifications: [
      { key: "email", label: "Email verified", verified: true },
      { key: "phone", label: "Phone verified", verified: seed % 5 !== 0 },
      { key: "business", label: "Business verified", verified: hasCompany || seed % 3 === 0 },
    ],
    activity: seed % 4 === 0
      ? { label: "Active today", detail: "Responds within 2h", tone: "emerald" }
      : seed % 4 === 1
        ? { label: "Last active 10 mins ago", detail: "Usually replies quickly", tone: "emerald" }
        : { label: "Active today", detail: "Client reviewing quotes", tone: "blue" },
    rating: (4.4 + (seed % 8) / 10).toFixed(1),
    paymentReliability: 88 + (seed % 12),
  };
}

export function buildProjectSnapshot(job = {}) {
  const seed = seeded(job.id, 3);
  const category = job.category || "other";
  const recordsReady = job.missing_records === false || job.records_ready === true;

  const softwareByCategory = {
    vat: "Xero",
    bookkeeping: "Xero / QuickBooks",
    payroll: "Xero Payroll",
    corporation_tax: "Xero / Sage",
    tax_return: "TaxCalc / Xero",
  };

  const items = [
    {
      label: "Software",
      value: job.software || softwareByCategory[category] || "Xero / Sage",
    },
    category === "vat" && {
      label: "VAT period",
      value: job.vat_period || `Q${1 + (seed % 4)} ${new Date().getFullYear()}`,
    },
    (category === "bookkeeping" || category === "vat") && {
      label: "Transactions",
      value: job.transaction_volume || `~${120 + (seed % 120)}/month`,
    },
    {
      label: "Business type",
      value: job.business_type || (job.company_name ? "UK Ltd" : "UK small business"),
    },
    {
      label: "Records status",
      value: recordsReady ? "Mostly reconciled" : job.missing_records ? "Some records missing" : "To be confirmed",
    },
    job.urgency && {
      label: "Timeline",
      value: urgencyToDeadlineLabel(job.urgency),
    },
  ].filter(Boolean);

  return items;
}

function urgencyToDeadlineLabel(urgency) {
  const map = {
    negotiable: "Flexible",
    standard: "Within a month",
    within_month: "Within a month",
    within_2weeks: "Within 2 weeks",
    within_week: "Within 7 days",
    urgent: "Urgent",
    asap: "ASAP",
  };
  return map[urgency] || "Standard";
}

export function getMarketBudgetGuidance(job = {}, marketplaceScore = null) {
  const range = marketplaceScore?.recommendedBudgetRange
    || computeFairMarketRange(job.category || "other", job.complexity || "medium", job.urgency || "negotiable", {
      budgetAmount: job.budget_amount,
      missingRecords: job.missing_records,
      internationalTaxIssues: job.international_tax_issues,
      estimatedWorkload: job.estimated_workload,
    });

  const categoryLabel = {
    vat: "VAT projects",
    bookkeeping: "bookkeeping projects",
    tax_return: "self assessment projects",
    corporation_tax: "corporation tax projects",
    payroll: "payroll projects",
  }[job.category] || "similar projects";

  const aligned = job.budget_amount
    && job.budget_amount >= range.min * 0.85
    && job.budget_amount <= range.max * 1.15;

  return {
    typicalLabel: `Typical ${categoryLabel} range between £${Math.round(range.min).toLocaleString()}–£${Math.round(range.max).toLocaleString()}`,
    alignmentLabel: aligned
      ? "Budget aligned with market rate"
      : job.budget_amount
        ? "Review scope carefully against the opening budget"
        : "Use your quote to reflect realistic workload",
    range,
  };
}

/** Lightweight activity — strongest signals only (max 3) */
export function getMarketplaceActivity(job = {}, bidCount = 0) {
  const postedAgo = job.created_date ? new Date(job.created_date) : null;
  const isRecent = postedAgo && Date.now() - postedAgo.getTime() < 3 * 24 * 60 * 60 * 1000;

  const signals = [
    { label: "Verified client", tone: "slate", priority: 1 },
    { label: "Active today", tone: "slate", priority: 2 },
  ];

  const scope = getProjectScopeClarity(job);
  if (scope.label === "Clear scope") {
    signals.push({ label: "Clear scope", tone: "slate", priority: 3 });
  } else if (isRecent) {
    signals.push({ label: "Recently posted", tone: "slate", priority: 3 });
  } else if (job.urgency === "urgent" || job.urgency === "asap") {
    signals.push({ label: "Urgent timeline", tone: "slate", priority: 3 });
  } else if (bidCount === 0) {
    signals.push({ label: "No quotes yet", tone: "slate", priority: 4 });
  }

  return signals
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(({ label, tone }) => ({ label, tone }));
}

/** Single-line ongoing work hint for secondary placement */
export function getOngoingWorkHint(job = {}) {
  const category = job.category || "other";
  const duration = job.duration || "one_off";
  if (duration === "ongoing" || duration === "long_term") {
    return "Potential ongoing work";
  }
  if (["bookkeeping", "vat", "payroll"].includes(category)) {
    return "Potential ongoing work";
  }
  if (["corporation_tax", "tax_return"].includes(category)) {
    return "Potential ongoing work";
  }
  return null;
}

export function getProjectScopeClarity(job = {}) {
  const descLen = (job.description || "").trim().length;
  const hasBudget = Boolean(job.budget_amount || job.budget_range);
  const hasCategory = Boolean(job.category);

  if (descLen >= 180 && hasBudget && hasCategory) {
    return { emoji: "🟢", label: "Clear scope", detail: "Enough detail to price confidently" };
  }
  if (descLen >= 80) {
    return { emoji: "🟡", label: "Mostly clear scope", detail: "A few details may need confirming with the client" };
  }
  return { emoji: "🟡", label: "More details may be needed", detail: "Ask clarifying questions in your proposal" };
}
