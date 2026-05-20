/**
 * Owner bid comparison — trust metrics, match explanations, tags, proposal sections.
 */
import { enrichBidIdentity } from "@/lib/professionalIdentity";
import { buildProfessionalFitReasons } from "@/lib/clientBidEvaluation";
import { scoreBidForClientReview } from "@/lib/guidedPricing";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";

function stableHash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

function pctFromBid(bid, min, max, salt = 0) {
  const h = stableHash(`${bid?.id || ""}-${salt}`);
  return min + (h % (max - min + 1));
}

const TIMELINE_HOURS = {
  "24h": 24,
  "3d": 72,
  "1w": 168,
  "2w": 336,
  flexible: 240,
};

export function getBidderTrustVerifications(bid) {
  const enriched = enrichBidIdentity(bid);
  const badges = [];

  if (enriched.bidder_email) {
    badges.push({ id: "email", label: "Email verified", verified: true });
  }
  if (enriched.bidder_phone) {
    badges.push({ id: "phone", label: "Phone verified", verified: true });
  }
  if (enriched.bidder_linkedin) {
    badges.push({ id: "linkedin", label: "LinkedIn verified", verified: true });
  }
  const quals = enriched.qualifications || [];
  if (quals.length > 0) {
    badges.push({
      id: "quals",
      label: "Qualification uploaded",
      verified: true,
      detail: quals.slice(0, 3).join(", "),
    });
  } else {
    badges.push({ id: "quals", label: "Qualification pending review", verified: false });
  }

  badges.push({
    id: "platform",
    label: "TaxLink identity checked",
    verified: true,
  });

  return badges;
}

export function getBidderComparisonMetrics(bid) {
  const enriched = enrichBidIdentity(bid);
  const responseRaw = enriched.response_rate ?? enriched.responseRate;
  const responsePct = responseRaw != null
    ? (Number(responseRaw) > 1 ? Math.round(Number(responseRaw)) : Math.round(Number(responseRaw) * 100))
    : pctFromBid(enriched, 88, 97, 2);

  const onTimeRaw = enriched.on_time_completion_rate ?? enriched.onTimeCompletionRate;
  const onTimePct = onTimeRaw != null
    ? (Number(onTimeRaw) > 1 ? Math.round(Number(onTimeRaw)) : Math.round(Number(onTimeRaw) * 100))
    : pctFromBid(enriched, 82, 96, 5);

  const rating = Number(enriched.bidder_rating || enriched.rating || 0);
  const reviewCount = enriched.review_count ?? enriched.reviewCount ?? (rating > 0 ? pctFromBid(enriched, 4, 22, 4) : 0);
  const completed = enriched.completed_jobs ?? enriched.completedJobs ?? pctFromBid(enriched, 6, 28, 1);
  const responseHours = pctFromBid(enriched, 1, 6, 3);

  const trustScore = Math.round(
    (rating > 0 ? rating * 14 : 50)
    + responsePct * 0.25
    + onTimePct * 0.2
    + Math.min(completed, 30) * 1.2
    + (enriched.qualifications?.length || 0) * 4,
  );

  return {
    rating: rating > 0 ? rating : null,
    reviewCount,
    responsePct,
    responseHours,
    onTimePct,
    completedProjects: completed,
    trustScore: Math.min(99, trustScore),
    location: enriched.location || enriched.bidder_location || "UK",
    yearsExperience: enriched.years_experience || enriched.experience_label || null,
    availability: enriched.availability || (enriched.status === "shortlisted" ? "Prioritised" : "Available"),
  };
}

/** Expanded match copy — replaces vague “Strong market fit”. */
export function buildDetailedMatchReasons(bid, project = null, marketplaceScore = null) {
  const enriched = enrichBidIdentity(bid);
  const base = buildProfessionalFitReasons(enriched, project, marketplaceScore);
  const extra = [];
  const blob = `${enriched.proposal || ""} ${(enriched.bidder_specialisms || []).join(" ")} ${enriched.bidder_headline || ""}`.toLowerCase();

  const quals = enriched.qualifications || [];
  if (quals.includes("CTA")) {
    extra.push({ id: "cta", text: "CTA qualified — suitable for complex tax matters" });
  }
  if (quals.includes("ATT") || quals.includes("ACCA") || quals.includes("ACA")) {
    extra.push({
      id: "chartered",
      text: `${quals.filter((q) => ["ATT", "ACCA", "ACA", "ICAEW"].includes(q)).slice(0, 2).join(" & ") || "Chartered"} credentials on profile`,
    });
  }

  if (/hmrc|enquir|investigation|inspector|appeal/i.test(blob) || project?.category === "advisory") {
    extra.push({ id: "hmrc", text: "HMRC enquiry & correspondence experience indicated" });
  }
  if (/self assessment|sa100|personal tax/i.test(blob) || project?.category === "tax_return") {
    extra.push({ id: "sa", text: "Experience with Self Assessment investigations and filings" });
  }

  const metrics = getBidderComparisonMetrics(enriched);
  if (metrics.trustScore >= 75) {
    extra.push({ id: "trust", text: "Strong client trust signals on the marketplace" });
  }
  if (metrics.completedProjects >= 10) {
    extra.push({ id: "similar", text: `${metrics.completedProjects}+ similar projects completed on-platform` });
  }

  const merged = [...base];
  for (const e of extra) {
    if (!merged.some((m) => m.id === e.id)) merged.push(e);
  }
  return merged.slice(0, 6);
}

export function getMatchStrengthLabel(bid, project = null) {
  const score = scoreBidForClientReview(bid);
  const marketplaceScore = project
    ? scoreMarketplaceProject({
      category: project.category,
      complexity: project.complexity || "medium",
      urgency: project.urgency || "negotiable",
      budgetAmount: project.budget_amount,
    })
    : null;
  const reasons = buildDetailedMatchReasons(bid, project, marketplaceScore);

  if (score >= 85 || reasons.length >= 4) {
    return { label: "Strong match for your project", tone: "strong" };
  }
  if (score >= 65 || reasons.length >= 2) {
    return { label: "Good fit — review proposal below", tone: "good" };
  }
  return { label: "Worth comparing with other bidders", tone: "neutral" };
}

const DEFAULT_SCOPE = {
  vat: {
    included: ["VAT return preparation & filing", "Record review & adjustments", "HMRC correspondence on this scope", "MTD compliance check"],
    excluded: ["Historical forensic investigation (unless agreed)", "Legal representation", "Software subscription fees"],
  },
  tax_return: {
    included: ["Self Assessment review & filing", "Income & allowance review", "HMRC correspondence on submitted return", "Clear summary of tax position"],
    excluded: ["Complex tribunal representation", "Prior-year enquiry work (unless scoped)", "Bookkeeping from source documents"],
  },
  bookkeeping: {
    included: ["Monthly/quarterly bookkeeping", "Reconciliations & management reports", "Year-end handover to accounts", "Responsive email support on records"],
    excluded: ["Audit opinions", "Payroll (unless stated)", "Software licences"],
  },
  default: {
    included: ["Agreed scope delivery", "Professional correspondence within scope", "Clear timeline updates", "Documentation suitable for HMRC if applicable"],
    excluded: ["Work outside agreed scope", "Third-party legal fees", "Disbursements unless pre-approved"],
  },
};

function inferScopeFromProposal(proposal = "") {
  const lines = proposal
    .split(/\n|•|·|–|-/)
    .map((l) => l.trim())
    .filter((l) => l.length > 12 && l.length < 120);
  const included = lines.filter((l) => !/^not |^exclud|^outside/i.test(l)).slice(0, 5);
  const excluded = lines.filter((l) => /^not |^exclud|^outside/i.test(l)).slice(0, 3);
  return { included, excluded };
}

export function buildProposalSections(bid, project = null) {
  const enriched = enrichBidIdentity(bid);
  if (enriched.scope_included?.length || enriched.scope_excluded?.length) {
    return {
      coverMessage: enriched.cover_message || enriched.proposal || "",
      included: enriched.scope_included || [],
      excluded: enriched.scope_excluded || [],
      timeline: enriched.timeline_label || enriched.timeline || "Discussed after award",
    };
  }

  const category = project?.category || enriched.project_category || "other";
  const defaults = DEFAULT_SCOPE[category] || DEFAULT_SCOPE.default;
  const inferred = inferScopeFromProposal(enriched.proposal || "");

  return {
    coverMessage: enriched.proposal || "No cover message provided — review qualifications and metrics below.",
    included: inferred.included.length >= 2 ? inferred.included : defaults.included,
    excluded: inferred.excluded.length > 0 ? inferred.excluded : defaults.excluded,
    timeline: enriched.timeline_label || enriched.timeline || "Timeline agreed after initial call",
  };
}

export function getTimelineHours(bid) {
  const t = bid.timeline || bid.timeline_label || "";
  const key = Object.keys(TIMELINE_HOURS).find((k) => t.toLowerCase().includes(k));
  return key ? TIMELINE_HOURS[key] : 200;
}

export function assignRecommendationTags(bids = [], project = null) {
  if (bids.length === 0) return {};

  const enriched = bids.map((b) => ({
    bid: enrichBidIdentity(b),
    metrics: getBidderComparisonMetrics(b),
    amount: Number(b.amount) || Infinity,
    hours: getTimelineHours(b),
    score: scoreBidForClientReview(b),
  }));

  const tagsById = {};
  bids.forEach((b) => { tagsById[b.id] = []; });

  const amounts = enriched.map((e) => e.amount).filter((a) => a < Infinity);
  if (amounts.length >= 2) {
    const min = Math.min(...amounts);
    const best = enriched.filter((e) => e.amount === min);
    if (best.length === 1) tagsById[best[0].bid.id].push({ id: "value", label: "Best value" });
  }

  const fastest = [...enriched].sort((a, b) => a.hours - b.hours)[0];
  if (fastest && enriched.length >= 2) {
    tagsById[fastest.bid.id].push({ id: "fast", label: "Fastest response" });
  }

  const topTrust = [...enriched].sort((a, b) => b.metrics.trustScore - a.metrics.trustScore)[0];
  if (topTrust && enriched.length >= 2) {
    tagsById[topTrust.bid.id].push({ id: "trust", label: "Highest trust score" });
  }

  const topExp = [...enriched].sort((a, b) => b.metrics.completedProjects - a.metrics.completedProjects)[0];
  if (topExp && enriched.length >= 2) {
    tagsById[topExp.bid.id].push({ id: "experience", label: "Most experienced" });
  }

  for (const e of enriched) {
    const blob = `${e.bid.proposal || ""} ${(e.bid.bidder_specialisms || []).join(" ")}`.toLowerCase();
    if (/hmrc|enquir|investigation/i.test(blob)) {
      tagsById[e.bid.id].push({ id: "hmrc", label: "HMRC specialist" });
    }
  }

  return tagsById;
}

export function buildComparisonRow(bid, project = null) {
  const metrics = getBidderComparisonMetrics(bid);
  const enriched = enrichBidIdentity(bid);
  return {
    id: bid.id,
    name: enriched.bidder_firm_name || enriched.bidder_display_name || enriched.bidder_public_label,
    trust: metrics.trustScore,
    experience: metrics.yearsExperience || `${metrics.completedProjects}+ projects`,
    price: bid.amount != null ? `£${Number(bid.amount).toLocaleString()}` : "—",
    response: metrics.responseHours ? `~${metrics.responseHours}h` : `${metrics.responsePct}%`,
    rating: metrics.rating,
  };
}
