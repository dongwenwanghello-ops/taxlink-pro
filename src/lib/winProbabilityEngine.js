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
  negotiable: 0.95,
  flexible: 0.95,
  standard: 1.0,
  within_month: 1.0,
  within_2weeks: 1.08,
  within_week: 1.12,
  urgent: 1.15,
  asap: 1.25,
};

const CATEGORY_KEYWORDS = {
  tax_return: /tax return|self assessment|hmrc|utr|income tax/i,
  vat: /vat|making tax digital|mtd|quarterly return/i,
  vat_return: /vat|making tax digital|mtd|quarterly return/i,
  corporation_tax: /corporation tax|ct600|company tax|limited company/i,
  rd_claim: /r&d|research and development|rd claim|innovation/i,
  payroll: /payroll|paye|pension|auto.?enrol/i,
  bookkeeping: /bookkeeping|xero|quickbooks|bank reconciliation|records/i,
  tax_investigation: /investigation|enquiry|hmrc dispute|compliance check/i,
  capital_gains: /capital gains|cgt|property disposal|asset sale/i,
  inheritance_tax: /inheritance|iht|estate|probate/i,
  advisory: /advisory|planning|forecast|strategy|consult/i,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalisePercent(value, fallback = 70) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return clamp(n > 1 ? n : n * 100, 0, 100);
}

function getCompetitivenessBand(score) {
  if (score >= 84) {
    return {
      min: 75,
      max: 90,
      label: "Strong market fit",
      marketFitLabel: "Strong market fit",
      marketFitDetail: "Well aligned with similar successful bids on TaxLink.",
      tone: "high",
      summary: "Scope, pricing, and profile signals align well with this project.",
    };
  }
  if (score >= 70) {
    return {
      min: 60,
      max: 75,
      label: "Strong market fit",
      marketFitLabel: "Strong market fit",
      marketFitDetail: "Well aligned with similar successful bids on TaxLink.",
      tone: "strong",
      summary: "A clear, professional quote should compete well here.",
    };
  }
  if (score >= 54) {
    return {
      min: 45,
      max: 60,
      label: "Good fit",
      marketFitLabel: "Good fit",
      marketFitDetail: "Comparable to typical winning quotes for this type of work.",
      tone: "competitive",
      summary: "Strengthen your proposal or pricing to stand out.",
    };
  }
  if (score >= 36) {
    return {
      min: 30,
      max: 45,
      label: "Worth a considered quote",
      marketFitLabel: "Worth a considered quote",
      marketFitDetail: "Review scope and pricing before submitting.",
      tone: "watch",
      summary: "A few factors may need attention before you quote.",
    };
  }
  return {
    min: 20,
    max: 35,
    label: "Review before quoting",
    marketFitLabel: "Review before quoting",
    marketFitDetail: "Pricing or proposal detail may need adjustment for this project.",
    tone: "low",
    summary: "Check budget, scope, and your approach before committing time.",
  };
}

/** Human-readable market fit — no percentage ranges in primary UI */
export function getMarketFitPresentation(result) {
  if (!result) return null;
  const band = result.probabilityRange || {};
  return {
    label: band.marketFitLabel || result.label || "Market fit",
    detail: band.marketFitDetail || result.summary,
    tone: band.tone || "competitive",
  };
}

function scorePriceCompetitiveness(bidAmount, budgetAmount, complexity = "medium") {
  if (!bidAmount || Number(bidAmount) <= 0) {
    return {
      score: 0,
      insight: { type: "warning", text: "Add a quote amount to estimate competitiveness." },
      ratio: null,
      marketAverage: null,
    };
  }

  if (!budgetAmount || Number(budgetAmount) <= 0) {
    return {
      score: 58,
      insight: { type: "neutral", text: "No opening budget is available, so pricing is scored against market signals only." },
      ratio: null,
      marketAverage: null,
    };
  }

  const bid = Number(bidAmount);
  const budget = Number(budgetAmount);
  const ratio = bid / budget;
  const tolerance = complexity === "complex" ? 0.12 : complexity === "simple" ? 0.04 : 0.08;
  const marketAverage = Math.round(budget * (0.9 + tolerance / 2));

  if (ratio >= 0.78 && ratio <= 1.02 + tolerance) {
    return {
      score: ratio <= 0.95 ? 90 : 78,
      insight: { type: "positive", text: ratio <= 0.95 ? "Fair pricing is slightly below the opening budget." : "Pricing is within the expected marketplace range." },
      ratio,
      marketAverage,
    };
  }
  if (ratio < 0.6) {
    return {
      score: 42,
      insight: { type: "warning", text: "Your pricing is very low, which can reduce trust for professional work." },
      ratio,
      marketAverage,
    };
  }
  if (ratio < 0.78) {
    return {
      score: 68,
      insight: { type: "neutral", text: "Your pricing is competitive, but the proposal should reassure the client on quality." },
      ratio,
      marketAverage,
    };
  }
  if (ratio <= 1.25 + tolerance) {
    return {
      score: 48,
      insight: { type: "warning", text: "Your pricing is above the marketplace average for this opening budget." },
      ratio,
      marketAverage,
    };
  }
  return {
    score: 24,
    insight: { type: "negative", text: "Your pricing is well above the marketplace average and may reduce shortlist likelihood." },
    ratio,
    marketAverage,
  };
}

function scoreProposalQuality(proposal = "", category = "other") {
  const text = proposal.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const categoryMatch = CATEGORY_KEYWORDS[category]?.test(text) || false;
  const hasApproach = /approach|process|review|prepare|submit|reconcile|check|deliver|file/i.test(text);
  const hasCredentials = /acca|aca|cta|att|aat|qualified|specialist|experience|years?/i.test(text);
  const hasTiming = /today|24 hours|day|week|deadline|turnaround|complete|deliver/i.test(text);
  const hasSpecifics = categoryMatch || hasApproach || hasCredentials || hasTiming;

  let score = words >= 90 ? 92 : words >= 55 ? 82 : words >= 30 ? 68 : words >= 15 ? 48 : words > 0 ? 28 : 0;
  score += (categoryMatch ? 8 : 0) + (hasApproach ? 8 : 0) + (hasCredentials ? 7 : 0) + (hasTiming ? 5 : 0);
  if (text && /^hi\b|^hello\b|^i can help\b/i.test(text) && !hasSpecifics) score -= 18;
  score = clamp(score, 0, 100);

  const insights = [];
  if (!text) insights.push({ type: "warning", text: "Add a proposal so the client can judge fit and approach." });
  else if (score >= 75) insights.push({ type: "positive", text: "Strong proposal quality detected from detail, approach, and relevant signals." });
  else if (words < 30) insights.push({ type: "warning", text: "A short proposal limits trust. Add approach, experience, and expected turnaround." });
  else insights.push({ type: "neutral", text: "Proposal is reasonable, but more project-specific detail would improve your position." });
  if (categoryMatch) insights.push({ type: "positive", text: "Strong specialist/category match detected in the proposal." });
  if (!hasCredentials && text) insights.push({ type: "neutral", text: "Mention qualifications or relevant experience to improve client confidence." });

  return { score, insights, words, categoryMatch };
}

const DELIVERY_TIMELINE_PROFILES = {
  "24h": {
    speed: 96,
    urgencyFit: { asap: 94, urgent: 88, standard: 58, negotiable: 48, flexible: 48 },
    realism: { simple: 88, medium: 58, complex: 30 },
    label: "Within 24 hours",
  },
  "3d": {
    speed: 84,
    urgencyFit: { asap: 82, urgent: 90, standard: 74, negotiable: 66, flexible: 66 },
    realism: { simple: 86, medium: 84, complex: 58 },
    label: "2-3 days",
  },
  "1w": {
    speed: 68,
    urgencyFit: { asap: 42, urgent: 62, standard: 88, negotiable: 84, flexible: 84 },
    realism: { simple: 70, medium: 90, complex: 80 },
    label: "Within 1 week",
  },
  "2w": {
    speed: 50,
    urgencyFit: { asap: 24, urgent: 42, standard: 76, negotiable: 88, flexible: 88 },
    realism: { simple: 48, medium: 78, complex: 92 },
    label: "1-2 weeks",
  },
  "1m": {
    speed: 32,
    urgencyFit: { asap: 16, urgent: 28, standard: 52, negotiable: 78, flexible: 78 },
    realism: { simple: 28, medium: 52, complex: 82 },
    label: "Within a month",
  },
};

function scoreDeliveryTiming({ timeline, responseSpeed, submittedAt, projectCreatedAt, urgency, complexity }) {
  const profile = DELIVERY_TIMELINE_PROFILES[timeline];
  let speedScore = normalisePercent(responseSpeed, null);

  if (!profile) {
    const fallback = speedScore ?? 55;
    return {
      score: fallback,
      speedScore: fallback,
      urgencyFitScore: 55,
      realismScore: 55,
      label: "Timeline not selected",
      insight: { type: "neutral", text: "Select a delivery timeline to improve competitiveness scoring." },
    };
  }

  if (speedScore === null) {
    speedScore = profile.speed;
  }

  const normalisedUrgency = urgency || "negotiable";
  const normalisedComplexity = complexity || "medium";
  const urgencyFitScore = profile.urgencyFit[normalisedUrgency] ?? profile.urgencyFit.standard;
  const realismScore = profile.realism[normalisedComplexity] ?? profile.realism.medium;

  if (submittedAt && projectCreatedAt) {
    const elapsedHours = (new Date(submittedAt) - new Date(projectCreatedAt)) / 36e5;
    if (Number.isFinite(elapsedHours)) {
      if (elapsedHours <= 2) speedScore += 10;
      else if (elapsedHours <= 8) speedScore += 6;
      else if (elapsedHours >= 48) speedScore -= 8;
    }
  }

  let score = speedScore * 0.2 + urgencyFitScore * 0.43 + realismScore * 0.37;
  if (normalisedComplexity === "complex" && timeline === "24h") score -= 12;
  if (normalisedComplexity === "complex" && (timeline === "1w" || timeline === "2w")) score += 4;
  if ((normalisedUrgency === "asap" || normalisedUrgency === "urgent") && (timeline === "24h" || timeline === "3d")) score += 5;
  score = clamp(score, 0, 100);

  let insight;
  if (normalisedComplexity === "complex" && timeline === "24h") {
    insight = { type: "warning", text: "Very short timelines on complex work may reduce trust unless your proposal explains delivery clearly." };
  } else if ((normalisedUrgency === "asap" || normalisedUrgency === "urgent") && (timeline === "24h" || timeline === "3d")) {
    insight = { type: "positive", text: "Your delivery timeline matches the client urgency well." };
  } else if ((normalisedUrgency === "asap" || normalisedUrgency === "urgent") && (timeline === "2w" || timeline === "1m")) {
    insight = { type: "warning", text: "Faster delivery may improve competitiveness for this urgent project." };
  } else if (normalisedComplexity === "complex" && (timeline === "1w" || timeline === "2w")) {
    insight = { type: "positive", text: "Timeline appears realistic for the project complexity." };
  } else if (score >= 76) {
    insight = { type: "positive", text: "Delivery timing is commercially believable for this project." };
  } else if (score < 48) {
    insight = { type: "warning", text: "Delivery timing weakens urgency fit or client attractiveness." };
  } else {
    insight = { type: "neutral", text: "Delivery timing is acceptable, but not a major advantage." };
  }

  return {
    score,
    speedScore: clamp(speedScore, 0, 100),
    urgencyFitScore,
    realismScore,
    label: profile.label,
    insight,
  };
}

function scoreCompetition(bidCount = 0, urgency = "negotiable") {
  const count = Math.max(0, Number(bidCount) || 0);
  const urgencyPressure = urgency === "asap" ? 1 : urgency === "urgent" ? 0.8 : urgency === "standard" ? 0.35 : 0;
  const score = clamp(92 - count * 7 + urgencyPressure * 6, 18, 96);
  return {
    score,
    level: count <= 1 ? "Low competition" : count <= 4 ? "Active competition" : count <= 8 ? "Crowded field" : "Highly competitive",
    insight: count <= 1
      ? { type: "positive", text: "Low competitor count gives you an early visibility advantage." }
      : count >= 8
        ? { type: "warning", text: "Many competitors are bidding, so proposal quality and pricing matter more." }
        : { type: "neutral", text: `${count} competing bid${count === 1 ? "" : "s"} creates a normal marketplace challenge.` },
  };
}

function scoreSpecialistMatch({ category, qualifications = [], requiredQualifications = [], proposal = "", categoryMatch }) {
  const upperQuals = qualifications.map((q) => String(q).toUpperCase());
  const upperRequired = requiredQualifications.map((q) => String(q).toUpperCase());
  const requiredMatch = upperRequired.length > 0 && upperRequired.some((q) => upperQuals.includes(q));
  const specialistQual = upperQuals.some((q) => ["CTA", "ACA", "ACCA", "ATT", "AAT", "ICAEW"].includes(q));
  const keywordMatch = categoryMatch || CATEGORY_KEYWORDS[category]?.test(proposal || "");

  let score = 46;
  if (specialistQual) score += 24;
  if (requiredMatch) score += 18;
  if (keywordMatch) score += 12;
  score = clamp(score, 0, 100);

  return {
    score,
    insight: requiredMatch || keywordMatch || specialistQual
      ? { type: "positive", text: "Strong specialist match detected." }
      : { type: "neutral", text: "Specialist fit is unclear. Mention relevant category experience." },
  };
}

function normaliseExperienceScore(yearsExperience) {
  if (!yearsExperience) return 0;
  const text = String(yearsExperience).toLowerCase();
  if (/10\+|10\s*years|1[0-9]|2[0-9]/.test(text)) return 92;
  if (/5\s*-\s*10|5.?10|[5-9]\s*years?/.test(text)) return 78;
  if (/3\s*-\s*5|3.?5|[3-4]\s*years?/.test(text)) return 62;
  if (/1\s*-\s*3|1.?3|[1-2]\s*years?/.test(text)) return 44;
  const numeric = Number(text.match(/\d+/)?.[0]);
  if (!Number.isFinite(numeric)) return 0;
  return numeric >= 10 ? 92 : numeric >= 5 ? 78 : numeric >= 3 ? 62 : numeric >= 1 ? 44 : 0;
}

/**
 * computeBidCompetitiveness - transparent marketplace bid scoring.
 *
 * Returns a realistic probability band instead of a precise claim. The internal
 * score is deterministic and updates as price, proposal, competition, timing,
 * reputation, and trust inputs change.
 */
export function computeBidCompetitiveness({
  amount,
  budgetAmount,
  proposal = "",
  timeline,
  bidCount = 0,
  urgency = "negotiable",
  category = "other",
  complexity = "medium",
  qualifications = [],
  requiredQualifications = [],
  rating = 0,
  completedJobs = 0,
  yearsExperience,
  reputationScore,
  onTimeCompletionRate = 0.8,
  clientTrustScore = 0.85,
  responseSpeed,
  submittedAt,
  projectCreatedAt,
} = {}) {
  if (!amount || Number(amount) <= 0) return null;

  const price = scorePriceCompetitiveness(amount, budgetAmount, complexity);
  const proposalQuality = scoreProposalQuality(proposal, category);
  const response = scoreDeliveryTiming({ timeline, responseSpeed, submittedAt, projectCreatedAt, urgency, complexity });
  const competition = scoreCompetition(bidCount, urgency);
  const specialist = scoreSpecialistMatch({
    category,
    qualifications,
    requiredQualifications,
    proposal,
    categoryMatch: proposalQuality.categoryMatch,
  });

  const ratingScore = normalisePercent(rating ? Number(rating) / 5 : undefined, 58);
  const completionScore = clamp(Math.log1p(Number(completedJobs) || 0) / Math.log1p(25) * 100, 0, 100);
  const experienceScore = normaliseExperienceScore(yearsExperience);
  const suppliedReputation = reputationScore === undefined ? null : normalisePercent(reputationScore, 58);
  const reputation = suppliedReputation ?? clamp(ratingScore * 0.52 + completionScore * 0.28 + experienceScore * 0.20, 0, 100);
  const onTime = normalisePercent(onTimeCompletionRate, 80);
  const clientTrust = normalisePercent(clientTrustScore, 85);

  const weights = {
    price: 0.24,
    proposal: 0.18,
    response: 0.12,
    competition: 0.15,
    specialist: 0.11,
    reputation: 0.10,
    onTime: 0.06,
    clientTrust: 0.04,
  };

  let score =
    price.score * weights.price +
    proposalQuality.score * weights.proposal +
    response.score * weights.response +
    competition.score * weights.competition +
    specialist.score * weights.specialist +
    reputation * weights.reputation +
    onTime * weights.onTime +
    clientTrust * weights.clientTrust;

  if ((urgency === "urgent" || urgency === "asap") && response.score >= 78) score += 4;
  if (complexity === "complex" && timeline === "24h") score -= 3;
  if (complexity === "complex" && (timeline === "1w" || timeline === "2w")) score += 2;
  if (competition.score < 35 && proposalQuality.score < 50) score -= 6;
  score = Math.round(clamp(score, 15, 92));

  const band = getCompetitivenessBand(score);
  const insights = [
    price.insight,
    proposalQuality.insights[0],
    response.insight,
    competition.insight,
    specialist.insight,
  ].filter(Boolean);

  if (reputation >= 76) insights.push({ type: "positive", text: "Reputation score supports a stronger shortlist position." });
  else if (reputation < 45) insights.push({ type: "warning", text: "Limited reputation history reduces client confidence." });
  if (experienceScore >= 78) insights.push({ type: "positive", text: "Senior experience improves trust for professional comparison." });
  if (onTime >= 90) insights.push({ type: "positive", text: "High on-time completion rate improves client trust." });
  if (clientTrust < 60) insights.push({ type: "neutral", text: "Client trust signals are still developing, so outcomes may be less predictable." });

  return {
    score,
    probabilityRange: band,
    displayRange: null,
    marketFitLabel: band.marketFitLabel,
    marketFitDetail: band.marketFitDetail,
    label: band.label,
    summary: band.summary,
    factors: {
      price: price.score,
      proposal: proposalQuality.score,
      response: response.score,
      competition: competition.score,
      specialist: specialist.score,
      reputation,
      onTime,
      clientTrust,
      urgencyFit: response.urgencyFitScore,
      timelineRealism: response.realismScore,
    },
    insights,
    market: {
      pricingRatio: price.ratio,
      marketAverage: price.marketAverage,
      competitionLevel: competition.level,
      proposalWords: proposalQuality.words,
      deliveryTimeline: response.label,
      urgencyFitScore: response.urgencyFitScore,
      timelineRealismScore: response.realismScore,
    },
  };
}

/**
 * computeWinProbability - Calculate bid win chance (0-100)
 * 
 * @param {object} params
 * @param {number} params.bidAmount - User's quoted amount
 * @param {number} params.budgetAmount - Project starting budget
 * @param {string} params.category - Project category
 * @param {string} params.complexity - simple | medium | complex
 * @param {string} params.urgency - negotiable | standard | urgent | asap
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
  urgency = "negotiable",
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