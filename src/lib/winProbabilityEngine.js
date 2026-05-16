/**
 * Win Probability Engine — Calculates realistic bid success chance
 * based on market factors, bidder competition, and professional metrics
 */

const CATEGORY_BASE_RATES = {
  tax_return: 0.55,
  vat_return: 0.52,
  corporation_tax: 0.58,
  rd_claim: 0.62,
  payroll: 0.50,
  bookkeeping: 0.54,
  tax_investigation: 0.68,
  capital_gains: 0.60,
  inheritance_tax: 0.65,
  advisory: 0.56,
  other: 0.50,
};

const COMPLEXITY_FACTORS = {
  simple: { priceRange: [0.85, 1.15], avgBidders: 4, demand: 0.8 },
  medium: { priceRange: [0.8, 1.3], avgBidders: 6, demand: 1.0 },
  complex: { priceRange: [0.75, 1.5], avgBidders: 8, demand: 1.2 },
};

const URGENCY_MULTIPLIERS = {
  flexible: 0.95,
  within_month: 1.0,
  urgent: 1.15,
};

/**
 * computeWinProbability - Calculate bid win chance (0-100)
 * 
 * @param {object} params
 * @param {number} params.bidAmount - User's quoted amount
 * @param {number} params.budgetAmount - Project starting budget
 * @param {string} params.category - Project category
 * @param {string} params.complexity - simple | medium | complex
 * @param {string} params.urgency - flexible | within_month | urgent
 * @param {number} params.bidCount - Current number of bidders
 * @param {number} params.clientPaymentRate - 0-100 client reliability
 * @param {number} params.userRating - 0-5 user star rating
 * @param {number} params.userCompletedJobs - Number of completed jobs
 * @param {number} params.responseSpeed - 0-100 how quickly user responds (from calendar)
 * @param {number} params.projectViewers - Current viewers (fake data)
 * @param {number} params.hoursUntilDeadline - Hours until bid closes
 * @returns {number} Win probability 0-100
 */
export function computeWinProbability({
  bidAmount,
  budgetAmount,
  category = "other",
  complexity = "medium",
  urgency = "flexible",
  bidCount = 4,
  clientPaymentRate = 85,
  userRating = 3.5,
  userCompletedJobs = 0,
  responseSpeed = 50,
  projectViewers = 2,
  hoursUntilDeadline = 24,
} = {}) {
  if (!bidAmount || bidAmount <= 0) return 0;

  let score = 0;
  const weights = {
    price: 0.28,
    competition: 0.20,
    trust: 0.18,
    reputation: 0.15,
    demand: 0.10,
    urgency: 0.09,
  };

  // ─── Price Competitiveness (28 points) ────────────────────────────────────
  const priceScore = computePriceScore(bidAmount, budgetAmount, complexity);
  score += priceScore * weights.price;

  // ─── Competition Level (20 points) ─────────────────────────────────────────
  const competitionScore = computeCompetitionScore(bidCount, complexity, urgency);
  score += competitionScore * weights.competition;

  // ─── Client Trust & Payment Reliability (18 points) ───────────────────────
  const trustScore = computeTrustScore(clientPaymentRate);
  score += trustScore * weights.trust;

  // ─── Professional Reputation (15 points) ──────────────────────────────────
  const reputationScore = computeReputationScore(userRating, userCompletedJobs);
  score += reputationScore * weights.reputation;

  // ─── Project Demand (10 points) ────────────────────────────────────────────
  const demandScore = computeDemandScore(projectViewers, bidCount, complexity, urgency);
  score += demandScore * weights.demand;

  // ─── Urgency & Response Speed (9 points) ──────────────────────────────────
  const urgencyScore = computeUrgencyScore(urgency, responseSpeed, hoursUntilDeadline);
  score += urgencyScore * weights.urgency;

  // Apply category base rate (overall market success rate for this work type)
  const categoryBoost = CATEGORY_BASE_RATES[category] || 0.55;
  const finalScore = Math.min(95, Math.max(5, score * 100 * categoryBoost));

  return Math.round(finalScore);
}

/**
 * Price competitiveness: Are we within market range? Better = lower score
 */
function computePriceScore(bidAmount, budgetAmount, complexity) {
  if (!budgetAmount || budgetAmount <= 0) return 0.5; // Neutral when no budget set

  const { priceRange } = COMPLEXITY_FACTORS[complexity] || COMPLEXITY_FACTORS.medium;
  const [minRatio, maxRatio] = priceRange;

  const ratio = bidAmount / budgetAmount;
  const minPrice = budgetAmount * minRatio;
  const maxPrice = budgetAmount * maxRatio;

  // Sweet spot: 85–100% of budget
  if (ratio >= 0.85 && ratio <= 1.0) return 0.95;
  // Good: 75–85% (undercut but reasonable)
  if (ratio >= 0.75 && ratio < 0.85) return 0.85;
  // Fair: 100–120% (slight premium)
  if (ratio > 1.0 && ratio <= 1.2) return 0.75;
  // Marginal: 120–150% (significant premium)
  if (ratio > 1.2 && ratio <= 1.5) return 0.50;
  // Poor: 150%+ (too expensive)
  if (ratio > 1.5) return 0.25;
  // Undercut: <75% (suspiciously low)
  return 0.60;
}

/**
 * Competition score: More bidders = harder to win
 */
function computeCompetitionScore(bidCount, complexity, urgency) {
  const { avgBidders } = COMPLEXITY_FACTORS[complexity] || COMPLEXITY_FACTORS.medium;
  const urgencyMult = URGENCY_MULTIPLIERS[urgency] || 1.0;

  // Adjust expected bidders by urgency
  const adjustedExpected = avgBidders * urgencyMult;

  // Fewer bidders = better odds
  if (bidCount <= 1) return 1.0;
  if (bidCount <= adjustedExpected * 0.5) return 0.90;
  if (bidCount <= adjustedExpected) return 0.75;
  if (bidCount <= adjustedExpected * 1.5) return 0.55;
  if (bidCount <= adjustedExpected * 2) return 0.35;
  return Math.max(0.1, 0.35 - (bidCount - adjustedExpected * 2) * 0.05);
}

/**
 * Trust score: Client payment reliability
 */
function computeTrustScore(clientPaymentRate) {
  if (clientPaymentRate >= 95) return 0.95;
  if (clientPaymentRate >= 85) return 0.85;
  if (clientPaymentRate >= 75) return 0.70;
  if (clientPaymentRate >= 60) return 0.50;
  return 0.30;
}

/**
 * Reputation score: User star rating + completed jobs
 */
function computeReputationScore(userRating, completedJobs) {
  // Star rating (0-5)
  const ratingScore = Math.min(userRating / 5, 1.0);

  // Job completion bonus (logarithmic — early jobs matter more)
  const jobBonus = Math.min(Math.log1p(completedJobs) / Math.log1p(20), 1.0);

  // Weight: 70% rating, 30% job history
  return ratingScore * 0.7 + jobBonus * 0.3;
}

/**
 * Demand score: Project attractiveness to bidders
 */
function computeDemandScore(projectViewers, bidCount, complexity, urgency) {
  const { demand: demandMult } = COMPLEXITY_FACTORS[complexity] || COMPLEXITY_FACTORS.medium;
  const urgencyMult = URGENCY_MULTIPLIERS[urgency] || 1.0;

  // Viewing activity (early viewers = high demand)
  const viewScore = Math.min(projectViewers / 10, 1.0);

  // Bidder velocity (high bids early = hot project)
  const bidVelocity = Math.min(bidCount / 6, 1.0);

  // Combine: 60% views, 40% bids
  const demandScore = viewScore * 0.6 + bidVelocity * 0.4;

  // Apply category demand multiplier (some work is naturally more competitive)
  return Math.min(demandScore * demandMult * urgencyMult, 1.0);
}

/**
 * Urgency & response speed: Fast responses to urgent projects win more
 */
function computeUrgencyScore(urgency, responseSpeed = 50, hoursUntilDeadline = 24) {
  const urgencyMult = URGENCY_MULTIPLIERS[urgency] || 1.0;

  // Response speed (0-100, where 100 = immediate)
  const speedScore = Math.min(responseSpeed / 100, 1.0);

  // Time pressure: projects closing soon benefit responsive pros
  const timeBonus = Math.max(0, 1.0 - Math.min(hoursUntilDeadline / 24, 1.0));

  // Combine: 70% speed, 30% time bonus
  const combined = speedScore * 0.7 + timeBonus * 0.3;

  return Math.min(combined * urgencyMult, 1.0);
}

/**
 * Helper: Get probability tier + actionable feedback
 */
export function getProbabilityTier(percent) {
  if (percent >= 70) return { tier: "high", label: "High opportunity", emoji: "🔥" };
  if (percent >= 50) return { tier: "medium", label: "Moderate chance", emoji: "⚡" };
  if (percent >= 30) return { tier: "low", label: "Challenging", emoji: "⚠️" };
  return { tier: "very-low", label: "Very difficult", emoji: "❌" };
}