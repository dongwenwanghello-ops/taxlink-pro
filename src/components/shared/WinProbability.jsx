import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertCircle, CheckCircle2, Users, ShieldCheck, FileText, Clock, Info } from "lucide-react";

// ─── Market reference data ────────────────────────────────────────────────────
// Market average multipliers per category (vs budget).
// Represent typical winning bid as fraction of posted budget.
const MARKET_AVG_RATIO = 0.92; // Winning bids typically land ~8% below budget

// Simulated competition pool: derived deterministically from project id
function getCompetitionProfile(bidCount) {
  // bidCount is real or seeded fake count
  const count = Math.max(1, bidCount || 3);
  // Average competitor trust: assumes a mix of mid-tier professionals
  const avgCompetitorTrust = count >= 10 ? 72 : count >= 6 ? 65 : count >= 3 ? 55 : 45;
  const level =
    count >= 12 ? "Very High" :
    count >= 8  ? "High" :
    count >= 4  ? "Moderate" :
    count >= 2  ? "Low" : "Very Low";
  return { count, avgCompetitorTrust, level };
}

// ─── Core scoring engine ──────────────────────────────────────────────────────

/**
 * computeWinProbability
 *
 * All scores are on 0–100 scale internally, then weighted.
 * Weights: price(25) + trust(30) + proposal(15) + competition(20) + responseSpeed(10) = 100
 * Final probability clamped 5–85% (never 0 or 100).
 */
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

  // ── 1. PRICE COMPETITIVENESS (weight 25) ──────────────────────────────────
  // Market average is treated as MARKET_AVG_RATIO * budget
  // Optimal zone: 5–20% below budget (trust-maximising + value)
  // Penalty zone low: >35% below budget (suspiciously cheap)
  // Penalty zone high: >25% above budget (too expensive)

  let priceScore100 = 50; // baseline if no budget given
  let priceFeedback = null;
  let avgMarketBid = null;

  if (budgetAmount && budgetAmount > 0) {
    avgMarketBid = Math.round(budgetAmount * MARKET_AVG_RATIO);
    const ratio = bid / budgetAmount; // 1.0 = at budget

    if (ratio < 0.5) {
      // Suspiciously cheap — red flag
      priceScore100 = 30;
      priceFeedback = { type: "warning", text: `Your bid (£${bid.toLocaleString()}) is more than 50% below the project budget. Clients may question quality or reliability at this price.` };
      weakFactors.push("Bid price unusually low — may reduce client trust");
    } else if (ratio < 0.65) {
      priceScore100 = 52;
      priceFeedback = { type: "neutral", text: `Your bid is significantly below average. Competitive, but ensure your proposal justifies the quality.` };
    } else if (ratio <= 0.82) {
      // Sweet spot — slightly below market average
      priceScore100 = 92;
      priceFeedback = { type: "positive", text: `Your bid is in the optimal range — competitive without being suspiciously cheap.` };
      strongFactors.push("Bid price in optimal competitive range");
    } else if (ratio <= 0.95) {
      priceScore100 = 82;
      priceFeedback = { type: "positive", text: `Your bid is slightly below the project budget — strong value signal to the client.` };
      strongFactors.push("Bid price slightly below client budget");
    } else if (ratio <= 1.08) {
      priceScore100 = 65;
      priceFeedback = { type: "neutral", text: `Your bid is near the project budget. Acceptable, but ensure your proposal emphasises value.` };
    } else if (ratio <= 1.25) {
      priceScore100 = 42;
      priceFeedback = { type: "warning", text: `Your bid is ${Math.round((ratio - 1) * 100)}% above the project budget. Clients typically prefer bids within or below budget.` };
      weakFactors.push(`Bid £${(bid - budgetAmount).toLocaleString()} above client budget`);
    } else {
      priceScore100 = 18;
      priceFeedback = { type: "negative", text: `Your bid is ${Math.round((ratio - 1) * 100)}% above the project budget — significantly reduces your shortlist probability.` };
      weakFactors.push("Bid price well above project budget");
    }
  }

  const priceWeighted = (priceScore100 / 100) * 25;

  // ── 2. PROFESSIONAL TRUST SCORE (weight 30) ───────────────────────────────
  // Based on verifiable signals: qualifications, reviews, completed jobs
  // Incomplete profiles are capped at lower ceiling

  const TOP_QUALS = ["CTA", "ACA", "ICAEW", "FCA", "FCCA"];
  const MID_QUALS = ["ACCA", "ATT", "AAT", "CIMA", "CIPFA"];

  const hasTopQual   = qualifications.some(q => TOP_QUALS.includes(q));
  const hasMidQual   = qualifications.some(q => MID_QUALS.includes(q));
  const qualCount    = qualifications.length;
  const isNewAccount = completedJobs === 0 && rating === 0;

  // Qualification score (0–40 of trust component)
  let qualTrust =
    hasTopQual  ? 40 :
    hasMidQual  ? 32 :
    qualCount > 0 ? 22 : 10;

  // Review/rating score (0–35 of trust component)
  // rating assumed 0–5 scale
  const ratingNorm = Math.min(5, Math.max(0, rating));
  const ratingTrust = ratingNorm >= 4.8 ? 35 : ratingNorm >= 4.5 ? 30 : ratingNorm >= 4.0 ? 24 :
                      ratingNorm >= 3.5 ? 17 : ratingNorm > 0 ? 10 : 0;

  // Completed jobs (0–25 of trust component)
  const jobsTrust = completedJobs >= 50 ? 25 : completedJobs >= 20 ? 21 :
                    completedJobs >= 10 ? 17 : completedJobs >= 5 ? 13 :
                    completedJobs >= 1  ? 8  : 0;

  // New account uncertainty penalty: cap trust at 55/100
  let trustRaw100 = qualTrust + ratingTrust + jobsTrust; // max 100
  if (isNewAccount) {
    trustRaw100 = Math.min(trustRaw100, 55);
    weakFactors.push("New account — limited track record reduces trust ceiling");
  }

  const trustScore100 = Math.min(100, trustRaw100);
  const trustWeighted = (trustScore100 / 100) * 30;

  // Trust explanations
  if (hasTopQual) strongFactors.push(`${qualifications.filter(q => TOP_QUALS.includes(q)).join(", ")} verified — highest trust tier qualification`);
  else if (hasMidQual) strongFactors.push(`${qualifications.filter(q => MID_QUALS.includes(q)).join(", ")} qualification adds professional credibility`);
  else if (qualCount === 0) weakFactors.push("No qualifications listed — reduces trust score significantly");

  if (ratingNorm >= 4.5) strongFactors.push(`Strong client rating (${ratingNorm.toFixed(1)}★) boosts shortlist probability`);
  else if (ratingNorm > 0 && ratingNorm < 4.0) weakFactors.push(`Below-average rating (${ratingNorm.toFixed(1)}★) may concern clients`);

  if (completedJobs >= 10) strongFactors.push(`${completedJobs} completed projects demonstrates proven delivery`);
  else if (completedJobs >= 1) factors.push({ type: "neutral", text: `${completedJobs} completed job${completedJobs > 1 ? "s" : ""} — building track record` });
  else weakFactors.push("No completed projects yet — clients may prefer more experienced professionals");

  // ── 3. PROPOSAL QUALITY SCORE (weight 15) ────────────────────────────────
  // Purely deterministic based on proposal text signals
  const pLen = proposal.trim().length;
  const pWords = proposal.trim().split(/\s+/).filter(Boolean).length;

  // Quality signals
  const hasProjectRef   = /vat|self.assessment|corporation|payroll|bookkeeping|r&d|capital.gains|inherit/i.test(proposal);
  const hasApproach     = /approach|process|method|deliver|complete|review|check|prepare|submit/i.test(proposal);
  const hasCredentials  = /acca|aca|cta|att|aat|qualified|experience|year|specialist/i.test(proposal);
  const hasTimeline     = /week|day|hour|deadline|complete|deliver|turnaround/i.test(proposal);
  const isGeneric       = pLen < 30 || /^(hi|hello|dear|i can|i will|i am able)/i.test(proposal.trim());

  let proposalScore100 = 0;
  if (isGeneric && pLen < 40) {
    proposalScore100 = 8;
    weakFactors.push("Proposal is too generic — personalise it to the project details");
  } else {
    // Length quality (0–30)
    const lenScore = pWords >= 80 ? 30 : pWords >= 50 ? 24 : pWords >= 25 ? 18 : pWords >= 10 ? 12 : 6;
    // Signal bonuses (each worth 17.5, max 4 signals = 70)
    const signalScore = ((hasProjectRef ? 17 : 0) + (hasApproach ? 17 : 0) + (hasCredentials ? 18 : 0) + (hasTimeline ? 18 : 0));
    proposalScore100 = Math.min(100, lenScore + signalScore);
  }

  const proposalWeighted = (proposalScore100 / 100) * 15;

  if (proposalScore100 >= 70) strongFactors.push("Proposal demonstrates relevant expertise and project understanding");
  else if (proposalScore100 >= 40) factors.push({ type: "neutral", text: "Proposal is adequate — adding specific project details would improve your score" });
  else if (!isGeneric) weakFactors.push("Proposal lacks specifics — mention your approach, timeline, and relevant qualifications");

  // ── 4. COMPETITION DIFFICULTY (weight 20) ────────────────────────────────
  // Fewer competitors = higher base, more competitors = lower ceiling
  // Also accounts for average competitor strength

  const competition = getCompetitionProfile(bidCount);
  const { count, avgCompetitorTrust, level } = competition;

  // Your relative position: if your trust > avg competitor trust, you rank higher
  const relativeEdge = trustScore100 - avgCompetitorTrust; // can be negative

  // Base competition score: inversely proportional to count
  const baseCompScore = count >= 15 ? 20 : count >= 10 ? 32 : count >= 6 ? 48 :
                        count >= 3  ? 65 : count >= 2  ? 78 : 90;

  // Adjust by relative edge
  const edgeBonus = Math.max(-20, Math.min(20, relativeEdge * 0.4));
  const competitionScore100 = Math.min(100, Math.max(5, baseCompScore + edgeBonus));
  const competitionWeighted = (competitionScore100 / 100) * 20;

  if (count >= 8) weakFactors.push(`${count} professionals bidding — competitive pool reduces individual probability`);
  else if (count <= 2) strongFactors.push(`Only ${count} bidder${count > 1 ? "s" : ""} so far — low competition window`);
  else factors.push({ type: "neutral", text: `${count} bidders competing — moderate competition` });

  // ── 5. RESPONSE SPEED / TIMING (weight 10) ───────────────────────────────
  const speedScore100 =
    timeline === "24h" ? 95 :
    timeline === "3d"  ? 80 :
    timeline === "1w"  ? 62 :
    timeline === "2w"  ? 44 :
    timeline === "1m"  ? 28 : 50;

  const speedWeighted = (speedScore100 / 100) * 10;

  if (timeline === "24h" || timeline === "3d") strongFactors.push("Fast delivery commitment is highly valued by clients");
  else if (timeline === "1m") weakFactors.push("Longer delivery timeline reduces competitive edge for time-sensitive projects");

  // ── FINAL PROBABILITY ─────────────────────────────────────────────────────
  // Sum of all weighted components (max = 100)
  const rawScore = priceWeighted + trustWeighted + proposalWeighted + competitionWeighted + speedWeighted;

  // Apply a realistic ceiling: even the best bid rarely exceeds 83% in any real marketplace
  // because unknown client preferences always create uncertainty
  const ceiling = count >= 10 ? 72 : count >= 6 ? 78 : 85;
  const percent = Math.round(Math.min(ceiling, Math.max(5, rawScore)));

  // Percentile rank estimate (relative to avgCompetitorTrust)
  const percentileRank = Math.min(99, Math.max(1, Math.round(50 + (trustScore100 - avgCompetitorTrust) * 0.5 + (priceScore100 - 60) * 0.2)));

  return {
    percent,
    // Sub-scores (0–100)
    priceScore100,
    trustScore100,
    proposalScore100,
    competitionScore100,
    speedScore100,
    // Weighted contributions (0–25/30/15/20/10)
    priceWeighted,
    trustWeighted,
    proposalWeighted,
    competitionWeighted,
    speedWeighted,
    // Explainability
    strongFactors,
    weakFactors,
    neutralFactors: factors,
    priceFeedback,
    // Market metrics
    avgMarketBid,
    competition,
    percentileRank,
  };
}

// ─── UI Components ─────────────────────────────────────────────────────────────

function WeightedBar({ label, scored, maxWeight, color, icon: Icon }) {
  const pct = Math.round((scored / maxWeight) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon && <Icon className="h-3 w-3 shrink-0" />}
          <span>{label}</span>
          <span className="text-[10px] text-muted-foreground/60">({maxWeight}%)</span>
        </div>
        <span className="text-xs font-bold text-foreground tabular-nums">{pct}/100</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function FactorTag({ text, type }) {
  const styles = {
    positive: "bg-emerald-50 border-emerald-200 text-emerald-700",
    negative:  "bg-rose-50 border-rose-200 text-rose-600",
    warning:   "bg-amber-50 border-amber-200 text-amber-700",
    neutral:   "bg-secondary border-border text-muted-foreground",
  };
  const icons = {
    positive: <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />,
    negative: <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />,
    warning:  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />,
    neutral:  <Info className="h-3 w-3 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex items-start gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 ${styles[type]}`}>
      {icons[type]}{text}
    </div>
  );
}

export default function WinProbability({ amount, budgetAmount, timeline, qualifications, proposal, bidCount, completedJobs, rating }) {
  const result = useMemo(
    () => computeWinProbability({ amount, budgetAmount, timeline, qualifications, proposal, bidCount, completedJobs, rating }),
    [amount, budgetAmount, timeline, proposal, bidCount, completedJobs, rating, qualifications?.join(",")]
  );

  if (!result) return null;

  const {
    percent,
    priceWeighted, trustWeighted, proposalWeighted, competitionWeighted, speedWeighted,
    strongFactors, weakFactors, neutralFactors, priceFeedback,
    avgMarketBid, competition, percentileRank,
  } = result;

  const isHigh   = percent >= 60;
  const isMedium = percent >= 35 && percent < 60;

  const ringColor = isHigh ? "text-emerald-500" : isMedium ? "text-amber-500" : "text-rose-500";
  const bgBorder  = isHigh ? "bg-card border-emerald-200" : isMedium ? "bg-card border-amber-200" : "bg-card border-rose-200";
  const tagline   = isHigh ? "Strong shortlist position" : isMedium ? "Competitive with improvements" : "Needs improvement to compete";
  const circumference = 2 * Math.PI * 24;

  return (
    <motion.div
      key={percent}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${bgBorder} overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <TrendingUp className="h-3.5 w-3.5 text-violet-600 shrink-0" />
        <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">AI Bid Intelligence</span>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium">Transparent weighted model</span>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Probability gauge + market metrics */}
        <div className="flex items-center gap-4">
          {/* Circular gauge */}
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-secondary" />
              <motion.circle
                cx="28" cy="28" r="24" fill="none"
                stroke="currentColor" strokeWidth="4"
                strokeLinecap="round"
                className={ringColor}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-sm font-black leading-none ${ringColor}`}>{percent}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm leading-snug">
              {percent}% projected win probability
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>

            {/* Market context */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-[10px] text-muted-foreground">
                Competition: <strong className={`${competition.count >= 8 ? "text-rose-600" : competition.count >= 4 ? "text-amber-600" : "text-emerald-600"}`}>{competition.level}</strong>
              </span>
              <span className="text-[10px] text-muted-foreground">
                Bidders: <strong className="text-foreground">{competition.count}</strong>
              </span>
              {percentileRank && (
                <span className="text-[10px] text-muted-foreground">
                  Your rank: <strong className="text-primary">Top {100 - percentileRank}%</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Market pricing context */}
        {avgMarketBid && amount && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
              <p className="text-muted-foreground text-[10px]">Avg market bid</p>
              <p className="font-bold text-foreground">£{avgMarketBid.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
              <p className="text-muted-foreground text-[10px]">Your bid</p>
              <p className={`font-bold ${Number(amount) > avgMarketBid ? "text-rose-600" : "text-emerald-600"}`}>
                £{Number(amount).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
              <p className="text-muted-foreground text-[10px]">vs market</p>
              <p className={`font-bold ${Number(amount) > avgMarketBid ? "text-rose-600" : "text-emerald-600"}`}>
                {Number(amount) > avgMarketBid ? "+" : ""}{Math.round(((Number(amount) - avgMarketBid) / avgMarketBid) * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* Weighted score breakdown */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Score Breakdown</p>
          <WeightedBar label="Price Competitiveness"  scored={priceWeighted}       maxWeight={25} color="bg-emerald-500" icon={TrendingUp} />
          <WeightedBar label="Professional Trust"      scored={trustWeighted}       maxWeight={30} color="bg-primary"     icon={ShieldCheck} />
          <WeightedBar label="Proposal Quality"        scored={proposalWeighted}    maxWeight={15} color="bg-violet-500"  icon={FileText} />
          <WeightedBar label="Competition Difficulty"  scored={competitionWeighted} maxWeight={20} color="bg-amber-500"   icon={Users} />
          <WeightedBar label="Response Speed"          scored={speedWeighted}       maxWeight={10} color="bg-sky-500"     icon={Clock} />
        </div>

        {/* Price feedback */}
        {priceFeedback && (
          <FactorTag text={priceFeedback.text} type={priceFeedback.type} />
        )}

        {/* AI Assessment */}
        {(strongFactors.length > 0 || weakFactors.length > 0) && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">AI Assessment</p>
            {strongFactors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-emerald-700">Strong factors:</p>
                {strongFactors.map((f, i) => <FactorTag key={i} text={f} type="positive" />)}
              </div>
            )}
            {neutralFactors.length > 0 && (
              <div className="space-y-1.5">
                {neutralFactors.map((f, i) => <FactorTag key={i} text={f.text} type="neutral" />)}
              </div>
            )}
            {weakFactors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-rose-600">Areas to improve:</p>
                {weakFactors.map((f, i) => <FactorTag key={i} text={f} type={f.includes("budget") || f.includes("low") ? "warning" : "negative"} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}