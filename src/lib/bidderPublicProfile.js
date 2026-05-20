/**
 * Maps bid + project context → public profile page data (MVP localStorage cache).
 */
import { getAllBids } from "@/lib/bidStore";
import { getPostedProjects } from "@/lib/projectStore";
import { buildProtectedProfessionalProfile } from "@/lib/professionalProfilePreview";
import {
  enrichBidIdentity,
  getRevealedFullName,
  isBidIdentityRevealed,
} from "@/lib/professionalIdentity";

const CACHE_KEY = "taxprouk_bidder_public_profiles";

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getBidderProfilePath(bid) {
  if (!bid?.id) return "/professionals";
  return `/professionals/bid/${encodeURIComponent(bid.id)}`;
}

/** Navigate to the full public profile page for a bidder. */
export function navigateToBidderProfile(navigate, bid, project = null) {
  if (!bid?.id || !navigate) return;
  cacheBidderPublicProfile(bid, project);
  navigate(getBidderProfilePath(bid), { state: { bid, project } });
}

export function cacheBidderPublicProfile(bid, project = null) {
  if (!bid?.id) return null;
  const resolved = resolveBidderPublicProfile(bid.id, { bid, project });
  if (!resolved) return null;
  const all = readCache();
  all[bid.id] = { ...resolved, cached_at: new Date().toISOString() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  return resolved;
}

function parseYearsLabel(label) {
  if (!label) return null;
  const m = String(label).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function inferIndustries(bid, project) {
  const fromBid = bid?.industries || bid?.bidder_industries || [];
  if (fromBid.length) return fromBid;
  const cat = (project?.category || "").replace(/_/g, " ");
  if (/vat/i.test(cat)) return ["Retail", "E-commerce", "Professional Services"];
  if (/corporation|corporate/i.test(cat)) return ["Professional Services", "Technology"];
  if (/self assessment|personal/i.test(cat)) return ["Private Clients", "Property"];
  if (/hmrc|enquir|investigation/i.test(cat)) return ["Private Clients", "Professional Services"];
  return ["SMEs", "Professional Services", "Private Clients"];
}

function buildDemoReviews(preview, bid) {
  const { reviews } = preview;
  if (reviews?.rating && reviews.count > 0) {
    return [
      {
        id: `rev-${bid.id}-1`,
        reviewer_name: "Verified client",
        reviewer_company: "TaxPro UK marketplace",
        rating: Math.min(5, Math.max(4, reviews.rating)),
        service_type: "Tax & compliance",
        comment: "Clear communication throughout the engagement. Delivered on time with strong technical knowledge.",
        verified: true,
        would_rehire: true,
        created_date: new Date(Date.now() - 45 * 86400000).toISOString(),
        communication_rating: 5,
        technical_rating: 5,
        professionalism_rating: 5,
        value_rating: 4,
      },
      {
        id: `rev-${bid.id}-2`,
        reviewer_name: "SME director",
        reviewer_company: "Ltd company client",
        rating: Math.min(5, reviews.rating),
        service_type: "Advisory",
        comment: reviews.summary || "Professional, responsive, and practical advice.",
        verified: true,
        would_rehire: true,
        created_date: new Date(Date.now() - 120 * 86400000).toISOString(),
        communication_rating: 5,
        technical_rating: 4,
        professionalism_rating: 5,
        value_rating: 4,
      },
    ].slice(0, Math.min(3, Math.max(1, Math.ceil(reviews.count / 4))));
  }
  return [
    {
      id: `rev-${bid.id}-demo`,
      reviewer_name: "Marketplace client",
      rating: 4.8,
      service_type: "Tax project",
      comment: "Illustrative review for MVP — full verified reviews appear after completed marketplace work.",
      verified: false,
      created_date: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
  ];
}

export function buildPublicProfileRecord(bid, project = null) {
  const enriched = enrichBidIdentity(bid);
  const preview = buildProtectedProfessionalProfile(enriched, project);
  const revealed = isBidIdentityRevealed(enriched, project);
  const fullName = revealed
    ? getRevealedFullName(enriched)
    : preview.displayName;

  const specialisms = [
    ...(preview.specialisms || []),
    "HMRC enquiries",
    "VAT advisory",
    "CGT planning",
    "Corporate tax",
  ].filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 8);

  return {
    id: enriched.id,
    slug: enriched.id,
    full_name: fullName,
    title: enriched.bidder_headline || enriched.bidder_public_label || "UK Tax & Accounting Professional",
    bio: preview.summary,
    specialisations: specialisms,
    qualifications: preview.qualifications?.length
      ? preview.qualifications
      : ["ACCA"],
    industries: inferIndustries(enriched, project),
    software_expertise: enriched.software_expertise || ["Xero", "TaxCalc"],
    years_experience: parseYearsLabel(preview.yearsExperience) || 8,
    completed_jobs: preview.metrics.completedProjects,
    hourly_rate: enriched.hourly_rate || null,
    location: enriched.bidder_location || enriched.location || "United Kingdom",
    availability: "available",
    remote_work: true,
    firm_name: enriched.bidder_firm_name || "",
    metrics: preview.metrics,
    reviews: buildDemoReviews(preview, enriched),
    caseExamples: preview.caseExamples,
    activity: preview.activity,
    fitReasons: preview.fitReasons,
    proposal: preview.proposal,
    timeline: preview.timeline,
    amount: preview.amount,
    revealed,
    contact: preview.contact,
    bid_id: enriched.id,
    project_id: project?.id || enriched.project_id,
    project_title: project?.title || enriched.project_title,
  };
}

/** Resolve profile context by bid id (cache → local bids → optional navigation state). */
export function resolveBidderPublicProfile(bidId, { bid: bidHint, project: projectHint } = {}) {
  if (!bidId) return null;

  const cached = readCache()[bidId];
  if (cached?.profile) {
    return {
      bid: cached.bid || bidHint,
      project: cached.project || projectHint,
      profile: cached.profile,
    };
  }

  let bid = bidHint || getAllBids().find((b) => b.id === bidId);
  if (!bid) return null;

  let project =
    projectHint
    || getPostedProjects().find((p) => p.id === bid.project_id)
    || (bid.project_id
      ? {
        id: bid.project_id,
        title: bid.project_title || "Your project",
        category: bid.project_category || bid.category,
        status: "reviewing",
      }
      : null);

  const profile = buildPublicProfileRecord(bid, project);
  return { bid, project, profile };
}
