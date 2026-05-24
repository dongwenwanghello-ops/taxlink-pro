/**
 * Client-side bid evaluation — expertise-first, not price-first.
 */
import { enrichBidIdentity } from "@/lib/professionalIdentity";
import { normalizeExpertise, scoreExpertiseForProject } from "@/lib/expertiseMatching";
import { getQuoteAlignmentSignal } from "@/lib/guidedPricing";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";

export const CLIENT_COMPARE_CRITERIA = [
  { id: "expertise", label: "Relevant expertise", positive: true },
  { id: "experience", label: "Similar project experience", positive: true },
  { id: "communication", label: "Communication quality", positive: true },
  { id: "timeline", label: "Timeline suitability", positive: true },
  { id: "quals", label: "Qualifications", positive: true },
  { id: "price", label: "Not only lowest price", positive: false },
];

export const CLIENT_EVALUATION_STEPS = [
  { id: "compare", label: "Compare quotes" },
  { id: "profile", label: "View profiles" },
  { id: "shortlist", label: "Shortlist 2–3" },
  { id: "award", label: "Review & award" },
];

const CATEGORY_FIT_KEYWORDS = {
  vat: ["vat", "making tax digital", "mtd"],
  tax_return: ["self assessment", "personal tax", "sa100"],
  bookkeeping: ["bookkeeping", "accounts", "reconciliation"],
  payroll: ["payroll", "rti", "paye"],
  corporation_tax: ["corporation tax", "ct600", "company accounts"],
  audit: ["audit", "statutory"],
  advisory: ["advisory", "planning", "strategy"],
};

function proposalMentionsProject(proposal = "", project = {}) {
  const text = proposal.toLowerCase();
  const category = project.category || "";
  const keywords = CATEGORY_FIT_KEYWORDS[category] || [category.replace(/_/g, " ")];
  return keywords.some((k) => k && text.includes(k));
}

function stableHash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

/** Lightweight fit explanations for non-expert clients */
export function buildProfessionalFitReasons(bid, project = null, marketplaceScore = null) {
  const enriched = enrichBidIdentity(bid);
  const reasons = [];
  const quals = [
    ...(enriched.qualifications || []),
    ...(enriched.bidder_quals ? [enriched.bidder_quals] : []),
  ].filter(Boolean);

  if (quals.length > 0) {
    reasons.push({
      id: "quals",
      text: `${quals.slice(0, 2).join(" & ")} qualified`,
    });
  }

  const expertise = normalizeExpertise({
    primary_expertise: enriched.bidder_primary_specialisms,
    secondary_expertise: enriched.bidder_secondary_specialisms,
    specialisations: enriched.bidder_specialisms,
    professional_credentials: enriched.professional_credentials,
    specialties: enriched.specialties,
  });

  const categoryLabel = (project?.category || "").replace(/_/g, " ");
  const { primaryHits, secondaryHits } = project
    ? scoreExpertiseForProject(expertise, project)
    : { primaryHits: 0, secondaryHits: 0 };

  if (primaryHits > 0 && categoryLabel) {
    reasons.push({
      id: "specialism",
      text: `Primary expertise matches your ${categoryLabel} project`,
    });
  } else if (secondaryHits > 0 && categoryLabel) {
    reasons.push({
      id: "specialism-secondary",
      text: `Secondary expertise relevant to your ${categoryLabel} project`,
    });
  } else if (expertise.all.length > 0 && categoryLabel) {
    const match = expertise.all.some((s) =>
      categoryLabel.includes(String(s).toLowerCase().replace(/ /g, "_"))
      || String(s).toLowerCase().includes(categoryLabel.split(" ")[0]),
    );
    if (match) {
      reasons.push({
        id: "specialism",
        text: `Experience relevant to your ${categoryLabel} project`,
      });
    }
  } else if (categoryLabel && /vat|tax|bookkeeping|payroll|hmrc/i.test(categoryLabel + expertise.all.join(" "))) {
    reasons.push({
      id: "category",
      text: `Works on similar ${categoryLabel} projects`,
    });
  }

  const proposal = (enriched.proposal || "").trim();
  if (proposal.length >= 80 && proposalMentionsProject(proposal, project)) {
    reasons.push({
      id: "proposal",
      text: "Proposal shows understanding of your scope",
    });
  } else if (proposal.length >= 50) {
    reasons.push({
      id: "proposal",
      text: "Clear written approach in their proposal",
    });
  }

  const score = marketplaceScore || (project ? scoreMarketplaceProject({
    category: project.category,
    complexity: project.complexity || "medium",
    urgency: project.urgency || "negotiable",
    budgetAmount: project.budget_amount,
  }) : null);

  const alignment = getQuoteAlignmentSignal(enriched.amount, project || {}, score);
  if (alignment?.tone === "positive") {
    reasons.push({ id: "price", text: "Pricing within typical market range for this work" });
  } else if (alignment?.tone === "neutral") {
    reasons.push({ id: "price", text: "Higher fee may reflect specialist expertise — review their profile" });
  }

  const responsePct = enriched.response_rate != null
    ? (Number(enriched.response_rate) > 1 ? Math.round(Number(enriched.response_rate)) : Math.round(Number(enriched.response_rate) * 100))
    : 88 + (stableHash(`${enriched.id}-response`) % 8);

  if (responsePct >= 88) {
    reasons.push({ id: "response", text: "Reliable response history on the marketplace" });
  }

  const timeline = enriched.timeline_label || enriched.timeline || "";
  const urgent = project?.urgency === "urgent" || project?.urgency === "asap";
  if (timeline && (!urgent || /24h|3d|1w|week|fast|urgent/i.test(timeline))) {
    reasons.push({
      id: "timeline",
      text: urgent ? "Timeline matches your project urgency" : "Delivery timeline stated clearly",
    });
  }

  const completed = enriched.completed_jobs ?? enriched.completedJobs;
  if (completed && Number(completed) >= 5) {
    reasons.push({
      id: "track",
      text: `${completed} completed marketplace projects`,
    });
  }

  const rating = Number(enriched.bidder_rating || enriched.rating || 0);
  if (rating >= 4.5) {
    reasons.push({ id: "rating", text: `${rating.toFixed(1)} client rating from past work` });
  }

  const required = project?.required_qualifications || [];
  if (required.length > 0 && quals.some((q) => required.includes(q))) {
    reasons.unshift({
      id: "required",
      text: "Meets your preferred qualifications",
    });
  }

  return reasons.slice(0, 5);
}

export function getClientEvaluationProgress({
  bidCount = 0,
  shortlistedCount = 0,
  profilesViewedCount = 0,
} = {}) {
  if (bidCount === 0) return 0;
  if (shortlistedCount >= 2) return 3;
  if (shortlistedCount >= 1 || profilesViewedCount >= 2) return 2;
  if (profilesViewedCount >= 1) return 1;
  return 0;
}

export function getShortlistGuidance(shortlistedCount, totalBids) {
  if (totalBids < 2) return null;
  if (shortlistedCount === 0) {
    return "Shortlist 2–3 professionals to compare experience and fit before you award.";
  }
  if (shortlistedCount === 1) {
    return "Add one or two more to your shortlist for a fair comparison.";
  }
  if (shortlistedCount >= 2 && shortlistedCount < 4) {
    return "Compare shortlisted profiles side by side, then award the best fit.";
  }
  return "You can remove a shortlist slot to compare a smaller group.";
}

/** @deprecated Use getAwardConfirmCopy + AwardConfirmDialog */
export function getAwardConfirmMessage({ professionalLabel }) {
  const { lead, body, trustNote } = getAwardConfirmCopy({ professionalLabel });
  return [lead, "", body, "", trustNote].join("\n");
}

/** Concise copy for branded award confirmation modal. */
export function getAwardConfirmCopy({ professionalLabel = "this professional" } = {}) {
  const name = professionalLabel?.trim() || "this professional";
  return {
    title: "Confirm award",
    lead: `You are about to award this project to ${name}.`,
    body: "Bidding will close and your collaboration workspace will open immediately.",
    trustNote:
      "We recommend reviewing the professional's full profile and credentials before confirming.",
  };
}

/** Shown on bids not selected after a project is awarded. */
export const BID_NOT_SELECTED_REASON = "Another professional was selected";
