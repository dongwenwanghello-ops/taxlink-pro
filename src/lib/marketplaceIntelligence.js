/**
 * Marketplace Intelligence Engine
 *
 * Provides fair-market pricing, bidder interest modelling, supply/demand signals,
 * and economic health metrics for both clients and professionals.
 *
 * Philosophy: The goal is NOT lowest price wins.
 * The system guides both sides toward mutually sustainable, fair-market pricing.
 */

// ─── Fair Market Price Database ──────────────────────────────────────────────
// Unified pricing model — synchronized with PricingEstimate SERVICE_BASE_PRICES
// Represents what professionals typically charge based on complexity and scope
// Format: { min, max, label, level }
export const FAIR_MARKET_PRICES = {
  self_assessment:   { min: 80,  max: 250,  label: "Self Assessment",    level: 2 },
  vat_return:        { min: 120, max: 350,  label: "VAT Return",         level: 3 },
  corporation_tax:   { min: 300, max: 900,  label: "Corporation Tax",    level: 4 },
  rd_claim:          { min: 500, max: 2000, label: "R&D Tax Claim",      level: 5 },
  payroll:           { min: 80,  max: 300,  label: "Payroll",            level: 2 },
  bookkeeping:       { min: 150, max: 500,  label: "Bookkeeping",        level: 2 },
  tax_investigation: { min: 400, max: 1500, label: "Tax Investigation",  level: 5 },
  capital_gains:     { min: 200, max: 600,  label: "Capital Gains",      level: 4 },
  inheritance_tax:   { min: 300, max: 900,  label: "Inheritance Tax",    level: 5 },
  advisory:          { min: 150, max: 600,  label: "Advisory",           level: 3 },
  other:             { min: 150, max: 600,  label: "Other",              level: 3 },
  // JobPost category aliases
  tax_return:        { min: 80,  max: 250,  label: "Tax Return",         level: 2 },
  vat:               { min: 120, max: 350,  label: "VAT",                level: 3 },
  audit:             { min: 600, max: 2000, label: "Audit",              level: 4 },
};

// ─── Supply & Demand Profiles ─────────────────────────────────────────────────
// How competitive is this category right now?
// Higher supply = more professionals available = lower pricing pressure
// Higher demand = more projects = higher pricing pressure
const SUPPLY_DEMAND = {
  self_assessment:   { supply: 85, demand: 90, note: "High demand during Jan–Feb HMRC deadline season" },
  vat_return:        { supply: 70, demand: 75, note: "Steady quarterly demand" },
  corporation_tax:   { supply: 65, demand: 80, note: "Year-round demand, specialist knowledge required" },
  rd_claim:          { supply: 30, demand: 70, note: "Specialist niche — fewer qualified professionals available" },
  payroll:           { supply: 75, demand: 65, note: "Good professional supply, moderate demand" },
  bookkeeping:       { supply: 80, demand: 85, note: "High volume service with good supply" },
  tax_investigation: { supply: 20, demand: 55, note: "Rare specialists — ex-HMRC experience commands premium" },
  capital_gains:     { supply: 50, demand: 60, note: "Specialist knowledge, moderate supply" },
  inheritance_tax:   { supply: 35, demand: 50, note: "Estate planning specialists are limited" },
  advisory:          { supply: 55, demand: 65, note: "Advisory work requires experienced practitioners" },
  other:             { supply: 60, demand: 60, note: "General accounting services" },
  tax_return:        { supply: 85, demand: 90, note: "High demand during tax return season" },
  vat:               { supply: 70, demand: 75, note: "Steady quarterly demand" },
  audit:             { supply: 40, demand: 60, note: "Regulated work — fewer qualified auditors" },
};

// ─── Seasonality Engine ───────────────────────────────────────────────────────
// UK tax year runs April–March. Key deadlines affect demand curves.
function getSeasonalityFactor(category) {
  const now = new Date();
  const month = now.getMonth(); // 0=Jan, 11=Dec
  
  // Self Assessment peak: Oct–Jan (31 Jan deadline)
  if ((category === "self_assessment" || category === "tax_return") && (month >= 9 || month <= 0)) {
    return { factor: 1.25, label: "Peak season", note: "Self Assessment deadline approaching — professionals in high demand" };
  }
  // Corporation tax filing peaks: after April year-end (Jul–Sep)
  if ((category === "corporation_tax") && (month >= 6 && month <= 8)) {
    return { factor: 1.15, label: "High season", note: "Post year-end corporation tax filing season" };
  }
  // VAT quarter ends: Mar, Jun, Sep, Dec
  if ((category === "vat" || category === "vat_return") && (month === 2 || month === 5 || month === 8 || month === 11)) {
    return { factor: 1.1, label: "Quarter end", note: "VAT quarter-end period — availability slightly reduced" };
  }
  return { factor: 1.0, label: null, note: null };
}

// ─── Complexity Multipliers ───────────────────────────────────────────────────
const COMPLEXITY_FACTORS = {
  simple:  { priceMultiplier: 0.75, bidderMultiplier: 1.18, label: "Simple" },
  medium:  { priceMultiplier: 1.0,  bidderMultiplier: 1.0, label: "Medium" },
  complex: { priceMultiplier: 1.62, bidderMultiplier: 0.72, label: "Complex" },
};

const URGENCY_FACTORS = {
  negotiable:   { priceMultiplier: 0.95, bidderMultiplier: 1.08 },
  flexible:     { priceMultiplier: 0.95, bidderMultiplier: 1.08 },
  standard:     { priceMultiplier: 1.0,  bidderMultiplier: 1.0 },
  within_month: { priceMultiplier: 1.0,  bidderMultiplier: 1.0 },
  within_2weeks:{ priceMultiplier: 1.18, bidderMultiplier: 0.88 },
  within_week:  { priceMultiplier: 1.35, bidderMultiplier: 0.76 },
  urgent:       { priceMultiplier: 1.35, bidderMultiplier: 0.76, note: "Urgent projects attract fewer bids but at higher rates" },
  asap:         { priceMultiplier: 1.55, bidderMultiplier: 0.64, note: "ASAP projects attract fewer bids but at premium rates" },
};

const URGENCY_BUCKETS = {
  negotiable: "negotiable",
  flexible: "negotiable",
  standard: "standard",
  within_month: "standard",
  within_2weeks: "standard",
  within_week: "urgent",
  urgent: "urgent",
  asap: "asap",
};

const COMPLEXITY_URGENCY_MATRIX = {
  simple: {
    negotiable: {
      interestScore: 90,
      volume: [8, 16],
      qualityScore: 48,
      response: "< 2 hours",
      pricingPressure: 30,
      activity: "Broad high-volume interest",
      summary: "Very high bidder interest - simple scope and negotiable timing make this easy to schedule and low risk.",
      bidderType: "Broad bidder pool",
    },
    standard: {
      interestScore: 82,
      volume: [6, 12],
      qualityScore: 50,
      response: "2-6 hours",
      pricingPressure: 38,
      activity: "Healthy broad competition",
      summary: "High interest - simple work with a reasonable deadline attracts many eligible professionals.",
      bidderType: "Cost-effective qualified bidders",
    },
    urgent: {
      interestScore: 68,
      volume: [4, 8],
      qualityScore: 54,
      response: "2-6 hours",
      pricingPressure: 54,
      activity: "Fast broad response",
      summary: "Moderate to high interest - low complexity keeps the pool broad, with a modest urgency premium.",
      bidderType: "Fast-turnaround generalists",
    },
    asap: {
      interestScore: 58,
      volume: [3, 7],
      qualityScore: 52,
      response: "< 2 hours",
      pricingPressure: 62,
      activity: "Immediate but price-sensitive",
      summary: "Moderate interest - simple work is accessible, but ASAP pressure reduces comfort and adds a premium.",
      bidderType: "Available fast-response bidders",
    },
  },
  medium: {
    negotiable: {
      interestScore: 76,
      volume: [5, 10],
      qualityScore: 62,
      response: "2-6 hours",
      pricingPressure: 42,
      activity: "Comfortable healthy interest",
      summary: "High interest - meaningful work with flexible timing is easy for professionals to plan.",
      bidderType: "Qualified mid-level professionals",
    },
    standard: {
      interestScore: 78,
      volume: [6, 12],
      qualityScore: 68,
      response: "2-6 hours",
      pricingPressure: 55,
      activity: "Healthy competition",
      summary: "High interest - this is the healthiest marketplace pattern.",
      bidderType: "Qualified professionals",
    },
    urgent: {
      interestScore: 62,
      volume: [3, 7],
      qualityScore: 76,
      response: "< 2 hours",
      pricingPressure: 72,
      activity: "Selective premium response",
      summary: "Moderate interest - urgency narrows the pool, but remaining bidders tend to be experienced.",
      bidderType: "Experienced professionals",
    },
    asap: {
      interestScore: 48,
      volume: [2, 5],
      qualityScore: 82,
      response: "< 2 hours",
      pricingPressure: 86,
      activity: "Premium rush",
      summary: "Lower bidder volume - ASAP pressure filters for senior fast-response professionals.",
      bidderType: "Senior fast-response professionals",
    },
  },
  complex: {
    negotiable: {
      interestScore: 54,
      volume: [2, 6],
      qualityScore: 82,
      response: "6-24 hours",
      pricingPressure: 62,
      activity: "Selective specialist",
      summary: "Moderate specialist interest - flexible timing helps, but complexity keeps the pool smaller.",
      bidderType: "Senior specialists",
    },
    standard: {
      interestScore: 48,
      volume: [2, 5],
      qualityScore: 88,
      response: "2-6 hours",
      pricingPressure: 76,
      activity: "Specialist selective demand",
      summary: "Moderate interest - complex work attracts specialists, not broad bidder volume.",
      bidderType: "Senior tax/accounting specialists",
    },
    urgent: {
      interestScore: 34,
      volume: [1, 4],
      qualityScore: 92,
      response: "< 2 hours",
      pricingPressure: 90,
      activity: "Premium specialist demand",
      summary: "Low bidder volume - urgent complex work needs senior specialists and commands premium pricing.",
      bidderType: "Senior specialists",
    },
    asap: {
      interestScore: 24,
      volume: [0, 3],
      qualityScore: 96,
      response: "< 2 hours",
      pricingPressure: 98,
      activity: "Scarce premium capacity",
      summary: "Very low bidder volume but very high-value senior specialist bids.",
      bidderType: "Scarce senior specialists",
    },
  },
};

const BIDDING_WINDOW_FACTORS = {
  "24h": { days: 1, bidderMultiplier: 0.92, label: "24 hours" },
  "3d":  { days: 3, bidderMultiplier: 0.96, label: "3 days" },
  "5d":  { days: 5, bidderMultiplier: 0.99, label: "5 days" },
  "7d":  { days: 7, bidderMultiplier: 1.0,  label: "7 days" },
  "10d": { days: 10, bidderMultiplier: 1.03, label: "10 days" },
};

const WORKLOAD_FACTORS = {
  light: { priceMultiplier: 0.85, bidderMultiplier: 1.1, label: "Light workload" },
  standard: { priceMultiplier: 1.0, bidderMultiplier: 1.0, label: "Standard workload" },
  heavy: { priceMultiplier: 1.32, bidderMultiplier: 0.82, label: "Heavy workload" },
  specialist: { priceMultiplier: 1.62, bidderMultiplier: 0.64, label: "Specialist workload" },
};

const round50 = (n) => Math.max(50, Math.round(n / 50) * 50);

function normalizeBiddingDays(biddingPeriod, biddingDeadline) {
  if (BIDDING_WINDOW_FACTORS[biddingPeriod]) return BIDDING_WINDOW_FACTORS[biddingPeriod].days;
  if (biddingDeadline) {
    const days = Math.ceil((new Date(biddingDeadline).getTime() - Date.now()) / 86400000);
    if (Number.isFinite(days) && days > 0) return days;
  }
  return 7;
}

function getBiddingWindowFactor(days) {
  if (days <= 1) return 0.92;
  if (days <= 3) return 0.96;
  if (days <= 5) return 0.99;
  if (days <= 7) return 1.0;
  if (days <= 10) return 1.03;
  return 1.04;
}

function inferWorkload({ estimatedWorkload, missingRecords, multipleIncomeSources, internationalTaxIssues, complexity }) {
  if (estimatedWorkload) return estimatedWorkload;
  if (internationalTaxIssues || complexity === "complex") return "specialist";
  if (missingRecords || multipleIncomeSources) return "heavy";
  if (complexity === "simple") return "light";
  return "standard";
}

function getConditionFactors({
  remote = true,
  missingRecords = false,
  multipleIncomeSources = false,
  internationalTaxIssues = false,
  estimatedWorkload,
  complexity = "medium",
}) {
  const workload = inferWorkload({ estimatedWorkload, missingRecords, multipleIncomeSources, internationalTaxIssues, complexity });
  const wf = WORKLOAD_FACTORS[workload] || WORKLOAD_FACTORS.standard;
  const factors = [];
  let priceMultiplier = wf.priceMultiplier;
  let bidderMultiplier = wf.bidderMultiplier;
  let qualityMultiplier = 1;

  if (remote) {
    bidderMultiplier *= 1.25;
    factors.push({ type: "positive", text: "Remote delivery increases professional reach and expected bidder volume." });
  } else {
    priceMultiplier *= 1.12;
    bidderMultiplier *= 0.72;
    factors.push({ type: "warning", text: "On-site work narrows the bidder pool and usually increases pricing." });
  }

  if (missingRecords) {
    priceMultiplier *= 1.15;
    bidderMultiplier *= 0.86;
    factors.push({ type: "warning", text: "Missing records increase preparation time and reduce bidder volume." });
  }
  if (multipleIncomeSources) {
    priceMultiplier *= 1.12;
    bidderMultiplier *= 0.9;
    qualityMultiplier *= 1.06;
    factors.push({ type: "neutral", text: "Multiple income sources increase scope and favour more experienced bidders." });
  }
  if (internationalTaxIssues) {
    priceMultiplier *= 1.32;
    bidderMultiplier *= 0.72;
    qualityMultiplier *= 1.14;
    factors.push({ type: "warning", text: "International tax issues require specialist expertise, raising pricing and reducing bidder volume." });
  }

  return { priceMultiplier, bidderMultiplier, qualityMultiplier, workload, workloadLabel: wf.label, factors };
}

function normalizeUrgency(urgency) {
  if (urgency === "flexible") return "negotiable";
  if (urgency === "within_month" || urgency === "within_2weeks") return "standard";
  if (urgency === "within_week") return "urgent";
  return urgency;
}

function getUrgencyBucket(urgency) {
  return URGENCY_BUCKETS[normalizeUrgency(urgency)] || "standard";
}

function getMatrixOutcome(complexity = "medium", urgency = "negotiable") {
  const normalizedComplexity = COMPLEXITY_URGENCY_MATRIX[complexity] ? complexity : "medium";
  const bucket = getUrgencyBucket(urgency);
  return {
    complexity: normalizedComplexity,
    urgencyBucket: bucket,
    ...COMPLEXITY_URGENCY_MATRIX[normalizedComplexity][bucket],
  };
}

function getRecommendedBiddingDuration({ complexity = "medium", urgency = "negotiable", internationalTaxIssues = false, missingRecords = false }) {
  const normalizedUrgency = normalizeUrgency(urgency);
  if (normalizedUrgency === "asap") return { min: 1, max: 3, label: "1-3 days" };
  if (normalizedUrgency === "urgent") return { min: 3, max: 5, label: "3-5 days" };
  if (internationalTaxIssues || complexity === "complex") return { min: 7, max: 10, label: "7-10 days" };
  if (missingRecords) return { min: 5, max: 7, label: "5-7 days" };
  return { min: 5, max: 7, label: "5-7 days" };
}

// ─── Core Fair Market Range Calculator ───────────────────────────────────────

export function computeFairMarketRange(category, complexity = "medium", urgency = "negotiable", options = {}) {
  const normalizedUrgency = normalizeUrgency(urgency);
  const base = FAIR_MARKET_PRICES[category] || FAIR_MARKET_PRICES.other;
  const cf = COMPLEXITY_FACTORS[complexity] || COMPLEXITY_FACTORS.medium;
  const uf = URGENCY_FACTORS[normalizedUrgency] || URGENCY_FACTORS.negotiable;
  const seasonality = getSeasonalityFactor(category);
  const sd = SUPPLY_DEMAND[category] || SUPPLY_DEMAND.other;
  const condition = getConditionFactors({ ...options, complexity });

  const totalMultiplier = cf.priceMultiplier * uf.priceMultiplier * seasonality.factor * condition.priceMultiplier;

  const adjustedMin = round50(base.min * totalMultiplier);
  const adjustedMax = round50(base.max * totalMultiplier);
  const midpoint = round50((adjustedMin + adjustedMax) / 2);

  // Pricing pressure: high supply + low demand = lower pressure
  const pricingPressure = Math.round((sd.demand / sd.supply) * 100);

  return {
    min: adjustedMin,
    max: adjustedMax,
    midpoint,
    floor: round50(base.min * 0.7),  // ~70% of min = conservative opening bid floor
    warningThreshold: round50(base.min * 0.85),
    seasonality,
    pricingPressure,
    supplyDemand: sd,
    label: base.label,
    condition,
    recommendedBudget: {
      min: adjustedMin,
      max: adjustedMax,
      midpoint,
    },
  };
}

export function scoreMarketplaceProject({
  category,
  complexity = "medium",
  urgency = "negotiable",
  biddingPeriod,
  biddingDeadline,
  budgetAmount,
  remote = true,
  missingRecords = false,
  multipleIncomeSources = false,
  internationalTaxIssues = false,
  estimatedWorkload,
  deadlinePressure,
  hasDescription = true,
  descriptionLength = 200,
  hasDeadline = false,
  requiresTopQual = false,
} = {}) {
  const biddingDays = normalizeBiddingDays(biddingPeriod, biddingDeadline);
  const normalizedUrgency = normalizeUrgency(urgency);
  const biddingWindowMultiplier = getBiddingWindowFactor(biddingDays);
  const recommendedBiddingDuration = getRecommendedBiddingDuration({ complexity, urgency: normalizedUrgency, internationalTaxIssues, missingRecords });
  const marketRange = computeFairMarketRange(category, complexity, normalizedUrgency, {
    remote,
    missingRecords,
    multipleIncomeSources,
    internationalTaxIssues,
    estimatedWorkload,
  });
  const sd = SUPPLY_DEMAND[category] || SUPPLY_DEMAND.other;
  const condition = marketRange.condition;
  const matrix = getMatrixOutcome(complexity, normalizedUrgency);
  const pressure = deadlinePressure || (normalizedUrgency === "asap" ? "critical" : normalizedUrgency === "urgent" ? "high" : "normal");
  const pressurePriceMultiplier = pressure === "critical" ? 1.18 : pressure === "high" ? 1.1 : 1;
  const pressureBidderMultiplier = pressure === "critical" ? 0.9 : pressure === "high" ? 0.95 : 1;
  marketRange.min = round50(marketRange.min * pressurePriceMultiplier);
  marketRange.max = round50(marketRange.max * pressurePriceMultiplier);
  marketRange.midpoint = round50(marketRange.midpoint * pressurePriceMultiplier);
  marketRange.recommendedBudget = {
    min: marketRange.min,
    max: marketRange.max,
    midpoint: marketRange.midpoint,
  };

  let budgetScore = 58;
  let budgetHealthLabel = "No budget set";
  let budgetHealthLevel = "neutral";
  let budgetSuggestion = null;
  const budgetRatio = budgetAmount && budgetAmount > 0 ? budgetAmount / marketRange.midpoint : null;

  if (budgetRatio) {
    if (budgetRatio >= 1.2) {
      budgetScore = 96;
      budgetHealthLabel = "Premium budget";
      budgetHealthLevel = "good";
    } else if (budgetRatio >= 0.95) {
      budgetScore = 88;
      budgetHealthLabel = "Fair market rate";
      budgetHealthLevel = "good";
    } else if (budgetRatio >= 0.78) {
      budgetScore = 70;
      budgetHealthLabel = "Slightly below market";
      budgetHealthLevel = "neutral";
      budgetSuggestion = `Budget may be slightly low for selected complexity. Consider £${marketRange.midpoint.toLocaleString()} as a stronger target.`;
    } else if (budgetRatio >= 0.58) {
      budgetScore = 45;
      budgetHealthLabel = "Below market rate";
      budgetHealthLevel = "warning";
      budgetSuggestion = `Budget may be too low for selected complexity. Recommended range: £${marketRange.min.toLocaleString()}-${marketRange.max.toLocaleString()}.`;
    } else if (budgetRatio >= 0.38) {
      budgetScore = 22;
      budgetHealthLabel = "Significantly below market";
      budgetHealthLevel = "danger";
      budgetSuggestion = `Budget is significantly below the recommended range of £${marketRange.min.toLocaleString()}-${marketRange.max.toLocaleString()}.`;
    } else {
      budgetScore = 6;
      budgetHealthLabel = "Critical underprice";
      budgetHealthLevel = "danger";
      budgetSuggestion = `Budget is far below market expectations for this project. Recommended range: £${marketRange.min.toLocaleString()}-${marketRange.max.toLocaleString()}.`;
    }
  }

  const clarityScore = hasDescription ? Math.min(12, Math.max(-8, (descriptionLength - 120) / 28)) : -12;
  const baseDemand = sd.supply * 0.45 + sd.demand * 0.55;
  const isDifficult = complexity === "complex" || condition.workload === "specialist" || internationalTaxIssues;
  const isPressured = matrix.urgencyBucket === "urgent" || matrix.urgencyBucket === "asap" || pressure !== "normal";
  const lowBudgetForDifficultWork = Boolean(budgetRatio && budgetRatio < 0.78 && isDifficult && isPressured);
  const premiumBudget = Boolean(budgetRatio && budgetRatio >= 1.15);
  const fairBudget = Boolean(budgetRatio && budgetRatio >= 0.95 && budgetRatio < 1.15);
  const budgetAdjustment = Math.max(-28, Math.min(24, (budgetScore - 70) * 0.55));
  const budgetComplexityAdjustment =
    lowBudgetForDifficultWork ? -18 :
    premiumBudget && isDifficult ? 14 :
    premiumBudget ? 9 :
    fairBudget && isPressured ? 5 :
    0;
  const marketAdjustment = Math.max(-6, Math.min(6, (baseDemand - 70) / 5));
  const conditionAdjustment = Math.max(-12, Math.min(8, (condition.bidderMultiplier - 1) * 20));
  const biddingWindowAdjustment = Math.max(-4, Math.min(3, (biddingWindowMultiplier - 1) * 20));
  const pressureAdjustment = Math.max(-8, Math.min(2, (pressureBidderMultiplier - 1) * 25));
  const qualificationPenalty = requiresTopQual ? 6 : 0;
  const interestScore = Math.round(Math.min(100, Math.max(2,
    matrix.interestScore
    + clarityScore
    + budgetAdjustment
    + budgetComplexityAdjustment
    + marketAdjustment
    + conditionAdjustment
    + biddingWindowAdjustment
    + pressureAdjustment
    - qualificationPenalty
  )));

  const volumeMultiplier = Math.max(0.35, Math.min(1.55,
    (0.48 + (budgetScore / 145))
    * (hasDescription ? 1 : 0.75)
    * (0.96 + ((biddingWindowMultiplier - 1) * 0.35))
    * (remote ? 1.08 : 0.82)
    * (requiresTopQual ? 0.82 : 1)
    * (lowBudgetForDifficultWork ? 0.62 : 1)
    * (premiumBudget && isDifficult ? 1.18 : premiumBudget ? 1.1 : 1)
  ));
  const [matrixMin, matrixMax] = matrix.volume;
  const expectedMin = Math.max(0, Math.floor(matrixMin * volumeMultiplier));
  const expectedMax = Math.max(expectedMin + 1, Math.ceil(matrixMax * volumeMultiplier));
  const seniorityScore = Math.min(100, Math.round((matrix.qualityScore * 0.45) + (budgetScore * 0.4) + (condition.qualityMultiplier * 15)));
  const bidQuality = seniorityScore >= 88 ? "Senior specialists" : seniorityScore >= 72 ? "Experienced professionals" : seniorityScore >= 56 ? "Qualified professionals" : "Mixed experience";
  const hoursToFirstBid =
    budgetScore >= 88 && interestScore >= 46 ? "< 2 hours" :
    lowBudgetForDifficultWork ? "24+ hours" :
    budgetScore >= 70 && interestScore >= 40 ? "2-6 hours" :
    interestScore >= 35 ? "6-24 hours" :
    "24+ hours";

  const interestLevel = interestScore >= 82 ? "Very High" : interestScore >= 66 ? "High" : interestScore >= 46 ? "Medium" : interestScore >= 30 ? "Low" : "Very Low";
  const interestColor = interestScore >= 58 ? "emerald" : interestScore >= 22 ? "amber" : "rose";
  const qualityLabel = matrix.summary;
  const pricingPressureScore = Math.min(100, Math.max(5, Math.round(
    matrix.pricingPressure
    + ((100 - budgetScore) * 0.25)
    + (pressure === "critical" ? 10 : pressure === "high" ? 5 : 0)
    + (condition.priceMultiplier - 1) * 18
  )));
  const pricingPressureLevel = pricingPressureScore >= 85 ? "Extreme" : pricingPressureScore >= 70 ? "High" : pricingPressureScore >= 50 ? "Moderate" : "Low";

  const recommendations = [
    budgetSuggestion && { type: budgetHealthLevel === "danger" ? "danger" : "warning", text: budgetSuggestion },
    lowBudgetForDifficultWork && { type: "danger", text: "This budget may be too low for an urgent complex project." },
    premiumBudget && { type: "positive", text: "Higher starting budgets usually attract more experienced professionals." },
    fairBudget && { type: "positive", text: "Competitive pricing may improve bidder response speed." },
    biddingDays < recommendedBiddingDuration.min && { type: "warning", text: `Recommended bidding duration: ${recommendedBiddingDuration.label}. Short windows reduce bidder volume.` },
    complexity === "complex" && { type: "neutral", text: "High complexity projects usually receive fewer but higher quality bids." },
    (normalizedUrgency === "urgent" || normalizedUrgency === "asap") && { type: "warning", text: "Urgent projects increase expected pricing and reduce available bidder volume." },
    pressure !== "normal" && { type: "warning", text: "Deadline pressure increases expected pricing and reduces available bidder volume." },
    matrix.urgencyBucket === "asap" && complexity === "complex" && { type: "warning", text: "Complex ASAP projects usually receive very few bids, but those bids are senior and premium-priced." },
    matrix.urgencyBucket === "standard" && complexity === "medium" && { type: "positive", text: "Medium complexity with standard urgency often attracts the healthiest competition." },
    matrix.urgencyBucket === "negotiable" && { type: "positive", text: "Negotiable timelines improve bidder comfort and increase willingness to bid." },
    remote && { type: "positive", text: "Remote delivery expands reach and improves expected bidder volume." },
    ...condition.factors,
  ].filter(Boolean);

  return {
    interestLevel,
    interestColor,
    qualityLabel,
    expectedMin,
    expectedMax,
    expectedBids: { min: expectedMin, max: expectedMax },
    budgetScore,
    interestScore,
    budgetHealthLabel,
    budgetHealthLevel,
    budgetSuggestion,
    hoursToFirstBid,
    estimatedResponseSpeed: hoursToFirstBid,
    bidQuality,
    expectedBidQuality: bidQuality,
    expectedBidderType: matrix.bidderType,
    marketActivityLevel: matrix.activity,
    pricingPressureScore,
    pricingPressureLevel,
    marketRange,
    recommendedBudgetRange: marketRange.recommendedBudget,
    recommendedBiddingDuration,
    biddingDays,
    rawScore: interestScore,
    recommendations,
    signals: {
      baseDemand: Math.round(baseDemand),
      matrix,
      biddingWindowMultiplier,
      remote,
      workload: condition.workload,
      workloadLabel: condition.workloadLabel,
      conditionPriceMultiplier: Math.round(condition.priceMultiplier * 100) / 100,
      conditionBidderMultiplier: Math.round(condition.bidderMultiplier * 100) / 100,
      deadlinePressure: pressure,
      budgetRatio: budgetRatio ? Math.round(budgetRatio * 100) / 100 : null,
      lowBudgetForDifficultWork,
      premiumBudget,
    },
  };
}

// ─── Bidder Interest Predictor ────────────────────────────────────────────────
/**
 * Predicts how many professionals are likely to bid on a project.
 * Returns a scored model with expected range and quality prediction.
 */
export function predictBidderInterest({
  category,
  complexity = "medium",
  urgency = "negotiable",
  biddingPeriod,
  biddingDeadline,
  budgetAmount,
  remote = true,
  missingRecords = false,
  multipleIncomeSources = false,
  internationalTaxIssues = false,
  estimatedWorkload,
  deadlinePressure,
  hasDescription = true,
  descriptionLength = 200,
  hasDeadline = false,
  requiresTopQual = false,
}) {
  return scoreMarketplaceProject({
    category,
    complexity,
    urgency,
    biddingPeriod,
    biddingDeadline,
    budgetAmount,
    remote,
    missingRecords,
    multipleIncomeSources,
    internationalTaxIssues,
    estimatedWorkload,
    deadlinePressure,
    hasDescription,
    descriptionLength,
    hasDeadline,
    requiresTopQual,
  });
}

// ─── Professional Bid Health Check ───────────────────────────────────────────
/**
 * Analyses a professional's bid amount against market norms.
 * Enforces fair pricing — warns against destructive underpricing.
 */
export function analyseBidHealth({
  amount,
  category,
  budgetAmount,
  complexity = "medium",
  urgency = "negotiable",
  remote = true,
  missingRecords = false,
  multipleIncomeSources = false,
  internationalTaxIssues = false,
  estimatedWorkload,
  deadlinePressure,
}) {
  if (!amount || Number(amount) <= 0) return null;

  const bid = Number(amount);
  const marketRange = computeFairMarketRange(category, complexity, urgency, {
    remote,
    missingRecords,
    multipleIncomeSources,
    internationalTaxIssues,
    estimatedWorkload,
    deadlinePressure,
  });

  let healthLevel = "good";
  let healthLabel = "Market rate bid";
  let advice = null;
  let warningType = null; // "underpriced" | "overpriced" | null

  const ratioToFloor = bid / marketRange.floor;
  const ratioToMin = bid / marketRange.min;
  const ratioToMidpoint = bid / marketRange.midpoint;

  if (ratioToFloor < 0.6) {
    healthLevel = "danger";
    healthLabel = "Critically underpriced";
    warningType = "underpriced";
    advice = `Your quote (£${bid.toLocaleString()}) is far below what qualified professionals typically charge for this work. Very low pricing may cause clients to question your qualifications or the quality of delivery. Market floor is £${marketRange.floor.toLocaleString()}.`;
  } else if (ratioToMin < 0.75) {
    healthLevel = "warning";
    healthLabel = "Below market floor";
    warningType = "underpriced";
    advice = `Your quote is below the minimum professionals typically charge for this service. While competitive, ensure you can deliver quality at this rate. Consider raising to at least £${marketRange.min.toLocaleString()}.`;
  } else if (ratioToMin < 0.9) {
    healthLevel = "neutral";
    healthLabel = "Competitively priced";
    advice = `Your quote is in the competitive range. Slightly below average market pricing — a strong proposal will help you stand out.`;
  } else if (ratioToMidpoint <= 1.1) {
    healthLevel = "good";
    healthLabel = "Fair market rate";
    advice = `Your quote reflects fair market pricing for this type of work. This positions you as a credible professional.`;
  } else if (ratioToMidpoint <= 1.4) {
    healthLevel = "good";
    healthLabel = "Premium rate";
    advice = `Your quote is above average market rate. Ensure your proposal clearly demonstrates the added value of your expertise.`;
  } else {
    healthLevel = "warning";
    healthLabel = "Above premium range";
    warningType = "overpriced";
    advice = `Your quote is significantly above market rates. While possible for highly specialist work, clients may compare against market norms of £${marketRange.min.toLocaleString()}–£${marketRange.max.toLocaleString()}.`;
  }

  // Also check against client budget (secondary signal, not primary)
  let budgetSignal = null;
  if (budgetAmount && budgetAmount > 0) {
    const budgetRatio = bid / budgetAmount;
    if (budgetRatio < 0.7) {
      budgetSignal = { type: "positive", text: `Well below client's budget of £${budgetAmount.toLocaleString()} — strong price signal` };
    } else if (budgetRatio <= 1.05) {
      budgetSignal = { type: "neutral", text: `Within client's stated budget of £${budgetAmount.toLocaleString()}` };
    } else {
      budgetSignal = { type: "warning", text: `${Math.round((budgetRatio - 1) * 100)}% above client's stated budget of £${budgetAmount.toLocaleString()}` };
    }
  }

  return {
    healthLevel,
    healthLabel,
    advice,
    warningType,
    budgetSignal,
    marketRange,
    bid,
  };
}

// ─── Competition Intelligence (no price reveal) ───────────────────────────────
/**
 * Returns competition context WITHOUT revealing competitor prices.
 * Professionals see: bidder count, experience level, demand score.
 * They do NOT see: exact prices, proposal text.
 */
export function getCompetitionIntelligence({
  bidCount = 0,
  category,
  budgetAmount,
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
  const count = Math.max(0, bidCount);
  const market = scoreMarketplaceProject({
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
  });

  // Demand score: how sought-after is this project?
  const demandScore = market.interestScore;

  // Average experience level of typical bidder pool (not price, just seniority)
  const avgExperience =
    count >= 12 ? "Mixed (junior–senior)" :
    count >= 8  ? "Predominantly mid-level" :
    count >= 4  ? "Mid to senior level" :
    count >= 2  ? "Experienced professionals" :
    count >= 1  ? "Senior specialist" : "No bids yet";

  const competitionLevel =
    count >= 15 ? "Highly competitive" :
    count >= 10 ? "Very competitive" :
    count >= 6  ? "Competitive" :
    count >= 3  ? "Moderate" :
    count >= 1  ? "Low competition" : "No competition yet";

  const shortlistOdds =
    count === 0 ? "Very high (first mover advantage)" :
    count <= 2  ? "High" :
    count <= 5  ? "Good" :
    count <= 9  ? "Moderate" :
    count <= 14 ? "Lower" : "Competitive";

  // Window of opportunity label
  const opportunityWindow =
    count === 0 ? "🟢 First bid advantage" :
    count <= 3  ? "🟢 Early bidder advantage" :
    count <= 7  ? "🟡 Active bidding" :
    "🔴 Highly contested";

  return {
    count,
    competitionLevel,
    avgExperience,
    shortlistOdds,
    opportunityWindow,
    demandScore,
    // Supply note for this category
    supplyNote: market.marketRange.supplyDemand.note,
    recommendedBiddingDuration: market.recommendedBiddingDuration,
    expectedBidQuality: market.expectedBidQuality,
    // NEVER include: competitor prices, competitor proposal text
  };
}

// ─── Win Probability (for professionals) ─────────────────────────────────────
// Re-exported from the intelligence engine so BidIntelligence can use it directly.
// Weights: price(25) + trust(30) + proposal(15) + competition(20) + speed(10)

const MARKET_AVG_RATIO = 0.92;

export function computeWinProbability({
  amount,
  budgetAmount,
  timeline,
  qualifications = [],
  proposal = "",
  bidCount = 4,
  completedJobs = 0,
  rating = 0,
}) {
  if (!amount || Number(amount) <= 0) return null;
  const bid = Number(amount);
  const factors = [];
  const strongFactors = [];
  const weakFactors = [];

  // 1. PRICE COMPETITIVENESS (weight 25)
  let priceScore100 = 50;
  let priceFeedback = null;
  let avgMarketBid = null;

  if (budgetAmount && budgetAmount > 0) {
    avgMarketBid = Math.round(budgetAmount * MARKET_AVG_RATIO);
    const ratio = bid / budgetAmount;
    if (ratio < 0.5) {
      priceScore100 = 30;
      priceFeedback = { type: "warning", text: `Your bid (£${bid.toLocaleString()}) is more than 50% below budget. Clients may question quality at this price.` };
      weakFactors.push("Bid price unusually low — may reduce client trust");
    } else if (ratio < 0.65) {
      priceScore100 = 52;
      priceFeedback = { type: "neutral", text: "Your bid is significantly below average. Competitive, but ensure your proposal justifies the quality." };
    } else if (ratio <= 0.82) {
      priceScore100 = 92;
      priceFeedback = { type: "positive", text: "Your bid is in the optimal range — competitive without being suspiciously cheap." };
      strongFactors.push("Bid price in optimal competitive range");
    } else if (ratio <= 0.95) {
      priceScore100 = 82;
      priceFeedback = { type: "positive", text: "Your bid is slightly below the project budget — strong value signal to the client." };
      strongFactors.push("Bid price slightly below client budget");
    } else if (ratio <= 1.08) {
      priceScore100 = 65;
      priceFeedback = { type: "neutral", text: "Your bid is near the project budget. Ensure your proposal emphasises value." };
    } else if (ratio <= 1.25) {
      priceScore100 = 42;
      priceFeedback = { type: "warning", text: `Your bid is ${Math.round((ratio - 1) * 100)}% above the project budget.` };
      weakFactors.push(`Bid £${(bid - budgetAmount).toLocaleString()} above client budget`);
    } else {
      priceScore100 = 18;
      priceFeedback = { type: "negative", text: `Your bid is ${Math.round((ratio - 1) * 100)}% above budget — significantly reduces shortlist probability.` };
      weakFactors.push("Bid price well above project budget");
    }
  }
  const priceWeighted = (priceScore100 / 100) * 25;

  // 2. PROFESSIONAL TRUST (weight 30)
  const TOP_QUALS = ["CTA", "ACA", "ICAEW", "FCA", "FCCA"];
  const MID_QUALS = ["ACCA", "ATT", "AAT", "CIMA", "CIPFA"];
  const hasTopQual = qualifications.some(q => TOP_QUALS.includes(q));
  const hasMidQual = qualifications.some(q => MID_QUALS.includes(q));
  const qualCount = qualifications.length;
  const isNewAccount = completedJobs === 0 && rating === 0;
  let qualTrust = hasTopQual ? 40 : hasMidQual ? 32 : qualCount > 0 ? 22 : 10;
  const ratingNorm = Math.min(5, Math.max(0, rating));
  const ratingTrust = ratingNorm >= 4.8 ? 35 : ratingNorm >= 4.5 ? 30 : ratingNorm >= 4.0 ? 24 : ratingNorm >= 3.5 ? 17 : ratingNorm > 0 ? 10 : 0;
  const jobsTrust = completedJobs >= 50 ? 25 : completedJobs >= 20 ? 21 : completedJobs >= 10 ? 17 : completedJobs >= 5 ? 13 : completedJobs >= 1 ? 8 : 0;
  let trustRaw100 = qualTrust + ratingTrust + jobsTrust;
  if (isNewAccount) { trustRaw100 = Math.min(trustRaw100, 55); weakFactors.push("New account — limited track record reduces trust ceiling"); }
  const trustScore100 = Math.min(100, trustRaw100);
  const trustWeighted = (trustScore100 / 100) * 30;
  if (hasTopQual) strongFactors.push(`${qualifications.filter(q => TOP_QUALS.includes(q)).join(", ")} — highest trust tier qualification`);
  else if (hasMidQual) strongFactors.push(`${qualifications.filter(q => MID_QUALS.includes(q)).join(", ")} qualification adds credibility`);
  else if (qualCount === 0) weakFactors.push("No qualifications listed — reduces trust score");
  if (ratingNorm >= 4.5) strongFactors.push(`Strong rating (${ratingNorm.toFixed(1)}★)`);
  if (completedJobs >= 10) strongFactors.push(`${completedJobs} completed projects`);
  else if (completedJobs === 0) weakFactors.push("No completed projects yet");

  // 3. PROPOSAL QUALITY (weight 15)
  const pLen = proposal.trim().length;
  const pWords = proposal.trim().split(/\s+/).filter(Boolean).length;
  const hasProjectRef  = /vat|self.assessment|corporation|payroll|bookkeeping|r&d|capital.gains|inherit/i.test(proposal);
  const hasApproach    = /approach|process|method|deliver|complete|review|check|prepare|submit/i.test(proposal);
  const hasCredentials = /acca|aca|cta|att|aat|qualified|experience|year|specialist/i.test(proposal);
  const hasTimeline    = /week|day|hour|deadline|complete|deliver|turnaround/i.test(proposal);
  const isGeneric      = pLen < 30 || /^(hi|hello|dear|i can|i will|i am able)/i.test(proposal.trim());
  let proposalScore100 = 0;
  if (isGeneric && pLen < 40) {
    proposalScore100 = 8;
    weakFactors.push("Proposal is too generic — personalise it to the project details");
  } else {
    const lenScore = pWords >= 80 ? 30 : pWords >= 50 ? 24 : pWords >= 25 ? 18 : pWords >= 10 ? 12 : 6;
    proposalScore100 = Math.min(100, lenScore + (hasProjectRef ? 17 : 0) + (hasApproach ? 17 : 0) + (hasCredentials ? 18 : 0) + (hasTimeline ? 18 : 0));
  }
  const proposalWeighted = (proposalScore100 / 100) * 15;
  if (proposalScore100 >= 70) strongFactors.push("Proposal demonstrates relevant expertise");
  else if (proposalScore100 >= 40) factors.push({ type: "neutral", text: "Proposal is adequate — adding project specifics would improve score" });
  else if (!isGeneric) weakFactors.push("Proposal lacks specifics — mention approach, timeline, and qualifications");

  // 4. COMPETITION DIFFICULTY (weight 20)
  const count = Math.max(1, bidCount || 3);
  const avgCompetitorTrust = count >= 10 ? 72 : count >= 6 ? 65 : count >= 3 ? 55 : 45;
  const compLevel = count >= 12 ? "Very High" : count >= 8 ? "High" : count >= 4 ? "Moderate" : count >= 2 ? "Low" : "Very Low";
  const relativeEdge = trustScore100 - avgCompetitorTrust;
  const baseCompScore = count >= 15 ? 20 : count >= 10 ? 32 : count >= 6 ? 48 : count >= 3 ? 65 : count >= 2 ? 78 : 90;
  const competitionScore100 = Math.min(100, Math.max(5, baseCompScore + Math.max(-20, Math.min(20, relativeEdge * 0.4))));
  const competitionWeighted = (competitionScore100 / 100) * 20;
  if (count >= 8) weakFactors.push(`${count} professionals bidding — competitive pool`);
  else if (count <= 2) strongFactors.push(`Only ${count} bidder${count > 1 ? "s" : ""} so far — low competition`);
  else factors.push({ type: "neutral", text: `${count} bidders — moderate competition` });

  // 5. RESPONSE SPEED (weight 10)
  const speedScore100 = timeline === "24h" ? 95 : timeline === "3d" ? 80 : timeline === "1w" ? 62 : timeline === "2w" ? 44 : timeline === "1m" ? 28 : 50;
  const speedWeighted = (speedScore100 / 100) * 10;
  if (timeline === "24h" || timeline === "3d") strongFactors.push("Fast delivery commitment valued by clients");
  else if (timeline === "1m") weakFactors.push("Longer timeline reduces competitive edge");

  const rawScore = priceWeighted + trustWeighted + proposalWeighted + competitionWeighted + speedWeighted;
  const ceiling = count >= 10 ? 72 : count >= 6 ? 78 : 85;
  const percent = Math.round(Math.min(ceiling, Math.max(5, rawScore)));
  const percentileRank = Math.min(99, Math.max(1, Math.round(50 + (trustScore100 - avgCompetitorTrust) * 0.5 + (priceScore100 - 60) * 0.2)));

  return {
    percent, priceScore100, trustScore100, proposalScore100, competitionScore100, speedScore100,
    priceWeighted, trustWeighted, proposalWeighted, competitionWeighted, speedWeighted,
    strongFactors, weakFactors, neutralFactors: factors, priceFeedback,
    avgMarketBid, competition: { count, avgCompetitorTrust, level: compLevel }, percentileRank,
  };
}

// ─── Marketplace Health Score ─────────────────────────────────────────────────
/**
 * Overall project health from the client's perspective.
 * Combines budget health + project clarity + market conditions.
 */
export function getProjectHealthScore({
  category,
  budgetAmount,
  complexity,
  hasDescription,
  descriptionLength,
  urgency,
  biddingPeriod,
  remote,
  missingRecords,
  multipleIncomeSources,
  internationalTaxIssues,
  estimatedWorkload,
  deadlinePressure,
}) {
  const interest = predictBidderInterest({
    category,
    complexity,
    urgency,
    biddingPeriod,
    budgetAmount,
    remote,
    missingRecords,
    multipleIncomeSources,
    internationalTaxIssues,
    estimatedWorkload,
    deadlinePressure,
    hasDescription,
    descriptionLength,
  });
  
  const score = Math.round(
    (interest.budgetScore * 0.5) +
    (Math.min(100, descriptionLength / 4) * 0.3) +
    (interest.marketRange.seasonality.factor * 20)
  );

  const clamped = Math.min(100, Math.max(5, score));

  return {
    score: clamped,
    interest,
    grade: clamped >= 80 ? "A" : clamped >= 65 ? "B" : clamped >= 50 ? "C" : clamped >= 35 ? "D" : "F",
    summary:
      clamped >= 80 ? "Excellent project attractiveness" :
      clamped >= 65 ? "Good project attractiveness" :
      clamped >= 50 ? "Fair attractiveness — improvements recommended" :
      clamped >= 35 ? "Below average — budget revision needed" :
      "Poor attractiveness — significant changes required",
  };
}