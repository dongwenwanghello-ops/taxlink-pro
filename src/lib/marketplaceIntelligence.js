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
  simple:  { priceMultiplier: 0.75, bidderMultiplier: 1.4, label: "Simple" },
  medium:  { priceMultiplier: 1.0,  bidderMultiplier: 1.0, label: "Medium" },
  complex: { priceMultiplier: 1.5,  bidderMultiplier: 0.65, label: "Complex" },
};

const URGENCY_FACTORS = {
  flexible:     { priceMultiplier: 0.95, bidderMultiplier: 1.1 },
  within_month: { priceMultiplier: 1.0,  bidderMultiplier: 1.0 },
  urgent:       { priceMultiplier: 1.3,  bidderMultiplier: 0.8, note: "Urgent projects attract fewer bids but at higher rates" },
};

// ─── Core Fair Market Range Calculator ───────────────────────────────────────

export function computeFairMarketRange(category, complexity = "medium", urgency = "flexible") {
  const base = FAIR_MARKET_PRICES[category] || FAIR_MARKET_PRICES.other;
  const cf = COMPLEXITY_FACTORS[complexity] || COMPLEXITY_FACTORS.medium;
  const uf = URGENCY_FACTORS[urgency] || URGENCY_FACTORS.flexible;
  const seasonality = getSeasonalityFactor(category);
  const sd = SUPPLY_DEMAND[category] || SUPPLY_DEMAND.other;

  const totalMultiplier = cf.priceMultiplier * uf.priceMultiplier * seasonality.factor;

  const round50 = (n) => Math.round(n / 50) * 50;
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
  urgency = "flexible",
  budgetAmount,
  hasDescription = true,
  descriptionLength = 200,
  hasDeadline = false,
  requiresTopQual = false,
}) {
  const marketRange = computeFairMarketRange(category, complexity, urgency);
  const sd = SUPPLY_DEMAND[category] || SUPPLY_DEMAND.other;
  const cf = COMPLEXITY_FACTORS[complexity] || COMPLEXITY_FACTORS.medium;
  const uf = URGENCY_FACTORS[urgency] || URGENCY_FACTORS.flexible;

  // Base interest from supply level (0–100 → interest in professionals)
  let baseInterest = sd.supply * 0.12; // ~0–12

  // Budget attractiveness: how close is the budget to fair market?
  let budgetScore = 50; // neutral if no budget
  let budgetHealthLabel = "Unknown";
  let budgetHealthLevel = "neutral"; // good | warning | danger
  let budgetSuggestion = null;

  if (budgetAmount && budgetAmount > 0) {
    const ratio = budgetAmount / marketRange.midpoint;

    if (ratio >= 1.15) {
      budgetScore = 95;
      budgetHealthLabel = "Premium budget";
      budgetHealthLevel = "good";
    } else if (ratio >= 0.9) {
      budgetScore = 85;
      budgetHealthLabel = "Fair market rate";
      budgetHealthLevel = "good";
    } else if (ratio >= 0.75) {
      budgetScore = 68;
      budgetHealthLabel = "Slightly below market";
      budgetHealthLevel = "neutral";
      budgetSuggestion = `Consider raising to £${marketRange.midpoint.toLocaleString()} to attract more bids.`;
    } else if (ratio >= 0.55) {
      budgetScore = 40;
      budgetHealthLabel = "Below market rate";
      budgetHealthLevel = "warning";
      budgetSuggestion = `Your budget is below the typical market range of £${marketRange.min.toLocaleString()}–£${marketRange.max.toLocaleString()}. You may receive fewer qualified bids.`;
    } else if (ratio >= 0.35) {
      budgetScore = 18;
      budgetHealthLabel = "Significantly below market";
      budgetHealthLevel = "danger";
      budgetSuggestion = `Your budget is significantly below what qualified professionals typically charge (£${marketRange.min.toLocaleString()}–£${marketRange.max.toLocaleString()}). Strongly consider revising upward.`;
    } else {
      budgetScore = 5;
      budgetHealthLabel = "Critical underprice";
      budgetHealthLevel = "danger";
      budgetSuggestion = `Budget is far below market expectations. Professionals are unlikely to bid. Market range is £${marketRange.min.toLocaleString()}–£${marketRange.max.toLocaleString()}.`;
    }
  }

  // Project quality signals
  const descScore = descriptionLength > 300 ? 20 : descriptionLength > 150 ? 15 : descriptionLength > 60 ? 8 : 3;
  const deadlineBonus = hasDeadline ? 5 : 0;
  const qualPenalty = requiresTopQual ? -8 : 0; // fewer can qualify

  // Complexity: complex projects attract fewer but higher-quality bids
  const complexityBidderFactor = cf.bidderMultiplier;
  const urgencyBidderFactor = uf.bidderMultiplier;

  // Raw interest score
  const rawScore = (baseInterest * (budgetScore / 100)) + descScore + deadlineBonus + qualPenalty;
  const adjustedScore = rawScore * complexityBidderFactor * urgencyBidderFactor * marketRange.seasonality.factor;

  // Translate score to expected bidder range
  let expectedMin, expectedMax, interestLevel, interestColor, qualityLabel;

  const s = Math.max(0, adjustedScore);

  if (s >= 9) {
    expectedMin = 10; expectedMax = 18;
    interestLevel = "Very High"; interestColor = "emerald";
    qualityLabel = "Excellent bidder interest expected";
  } else if (s >= 6) {
    expectedMin = 6; expectedMax = 12;
    interestLevel = "High"; interestColor = "emerald";
    qualityLabel = "Strong bidder interest expected";
  } else if (s >= 4) {
    expectedMin = 4; expectedMax = 8;
    interestLevel = "Moderate"; interestColor = "amber";
    qualityLabel = "Good number of bids expected";
  } else if (s >= 2.5) {
    expectedMin = 2; expectedMax = 5;
    interestLevel = "Low"; interestColor = "amber";
    qualityLabel = "Limited bidder interest — consider adjusting budget";
  } else if (s >= 1) {
    expectedMin = 1; expectedMax = 3;
    interestLevel = "Very Low"; interestColor = "rose";
    qualityLabel = "Few bids expected — budget may need revision";
  } else {
    expectedMin = 0; expectedMax = 1;
    interestLevel = "Critical"; interestColor = "rose";
    qualityLabel = "Project unlikely to attract qualified bids at this budget";
  }

  // Time to first bid estimate
  const hoursToFirstBid = budgetScore >= 80 ? "< 2 hours" : budgetScore >= 60 ? "2–6 hours" : budgetScore >= 40 ? "6–24 hours" : "24+ hours";

  // Quality of expected bids
  const bidQuality = budgetScore >= 80 ? "Senior specialists" : budgetScore >= 60 ? "Qualified professionals" : budgetScore >= 40 ? "Mixed experience" : "Entry-level or less qualified";

  return {
    interestLevel,
    interestColor,
    qualityLabel,
    expectedMin,
    expectedMax,
    budgetScore,
    budgetHealthLabel,
    budgetHealthLevel,
    budgetSuggestion,
    hoursToFirstBid,
    bidQuality,
    marketRange,
    rawScore: Math.round(s * 10) / 10,
  };
}

// ─── Professional Bid Health Check ───────────────────────────────────────────
/**
 * Analyses a professional's bid amount against market norms.
 * Enforces fair pricing — warns against destructive underpricing.
 */
export function analyseBidHealth({ amount, category, budgetAmount, complexity = "medium" }) {
  if (!amount || Number(amount) <= 0) return null;

  const bid = Number(amount);
  const marketRange = computeFairMarketRange(category, complexity);

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
export function getCompetitionIntelligence({ bidCount = 0, category, budgetAmount }) {
  const count = Math.max(0, bidCount);
  const sd = SUPPLY_DEMAND[category] || SUPPLY_DEMAND.other;

  // Demand score: how sought-after is this project?
  const demandScore = Math.round((sd.demand + (budgetAmount > 0 ? Math.min(30, budgetAmount / 100) : 15)) / 2);

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
    supplyNote: sd.note,
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
export function getProjectHealthScore({ category, budgetAmount, complexity, hasDescription, descriptionLength, urgency }) {
  const interest = predictBidderInterest({ category, complexity, urgency, budgetAmount, hasDescription, descriptionLength });
  
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