/**
 * My Bids — merge local + remote sources, safe formatting, demo fallback.
 */
import { base44 } from "@/api/base44Client";
import { getAllBids } from "@/lib/bidStore";
import { syncWorkspacesFromAwardedProjects, syncWorkspacesFromAcceptedBids } from "@/lib/awardWorkflow";
import {
  getBidStatusUI,
  normalizeBidStatus,
  getBidLifecycleSteps,
} from "@/lib/awardWorkflow";
import { getWorkspaceByProjectId } from "@/lib/workspaceStore";
import { DEMO_BID_TEMPLATES } from "@/lib/demoBidTemplates";

export { DEMO_BID_TEMPLATES };

function getPracticalBidContext(bid, index = 0) {
  const competingBids = bid.competing_bids ?? Math.max(1, 2 + (index % 4));
  const trustPct = bid.client_trust_score != null
    ? Math.round(Number(bid.client_trust_score) > 1 ? Number(bid.client_trust_score) : Number(bid.client_trust_score) * 100)
    : 88 + (index % 10);
  return {
    competing_bids: competingBids,
    client_rating: `${trustPct}%`,
  };
}

export function formatBidForDashboard(bid, index = 0, { isDemo = false } = {}) {
  if (!bid || !bid.id) return null;

  const normalized = normalizeBidStatus(bid.status, bid);
  const statusUi = getBidStatusUI(bid);
  const hasWorkspace = Boolean(bid.project_id && getWorkspaceByProjectId(bid.project_id));
  const isSelected = normalized === "selected";
  const isRejected = normalized === "rejected";
  const isClosed = isRejected || (bid.bidding_deadline && new Date(bid.bidding_deadline) < new Date());
  const practical = getPracticalBidContext(bid, index);

  return {
    id: bid.id,
    project_id: bid.project_id,
    status: normalized,
    storageStatus: bid.status,
    project_title: bid.project_title || "Untitled project",
    amount: bid.amount ?? 0,
    timeline_label: bid.timeline_label || bid.timeline || "—",
    proposal: bid.proposal,
    bidder_name: bid.bidder_name,
    bidder_email: bid.bidder_email,
    bidder_headline: bid.bidder_headline || bid.professional_credentials?.headline,
    bidder_specialisms: bid.bidder_specialisms || bid.professional_credentials?.specialisations || [],
    qualifications: bid.qualifications || bid.bidder_quals || bid.professional_credentials?.qualifications || [],
    years_experience: bid.years_experience || bid.experience_label || bid.professional_credentials?.years_experience,
    statusLabel: statusUi.label,
    statusBadgeClass: statusUi.badgeClass,
    lifecycleSteps: getBidLifecycleSteps(bid, { hasWorkspace }),
    hasWorkspace,
    isDemo,
    ...practical,
    project_description: bid.project_description || bid.project_title,
    client_deadline: bid.client_deadline || "4 weeks",
    bidding_deadline: bid.bidding_deadline,
    created_date: bid.created_date,
    activity: isSelected
      ? (hasWorkspace ? "Workspace is open — start collaborating with your client." : "Selected — open your workspace when ready.")
      : isRejected
        ? (bid.rejection_reason || "Another professional was selected")
        : isClosed
          ? "Bidding closed"
          : "Your bid is live and visible to the client",
    activity_icon: isSelected ? "trending" : (isRejected || isClosed) ? "closed" : "trending",
  };
}

function formatBidListSafe(bids, { isDemo = false } = {}) {
  return bids
    .map((bid, index) => formatBidForDashboard(bid, index, { isDemo }))
    .filter(Boolean);
}

export function getDemoBidsForDisplay() {
  return formatBidListSafe(
    DEMO_BID_TEMPLATES.map((t) => ({ ...t, isDemo: true })),
    { isDemo: true },
  );
}

/** Merge API + localStorage bids (dedupe by id). */
export async function fetchMergedRawBids() {
  let dbBids = [];
  try {
    dbBids = await base44.entities.Bid.list("-created_date", 100);
  } catch {
    dbBids = [];
  }

  const localBids = getAllBids();
  const dbIds = new Set((dbBids || []).map((b) => b.id).filter(Boolean));

  return [
    ...(Array.isArray(dbBids) ? dbBids : []),
    ...localBids.filter((b) => b?.id && !dbIds.has(b.id)),
  ].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
}

/**
 * Optional: when logged in, prefer bids for this professional (still show unassigned local bids).
 */
export function filterBidsForProfessional(bids, userEmail) {
  if (!userEmail) return bids;
  const email = userEmail.toLowerCase().trim();
  return bids.filter((bid) => {
    const bidderEmail = (bid.bidder_email || bid.created_by || "").toLowerCase().trim();
    if (!bidderEmail) return true;
    return bidderEmail === email;
  });
}

export async function loadMyBidsDisplay({ userEmail = null } = {}) {
  try {
    syncWorkspacesFromAwardedProjects();
    syncWorkspacesFromAcceptedBids();
  } catch (err) {
    console.warn("[MyBids] workspace sync skipped", err);
  }

  let raw = await fetchMergedRawBids();
  raw = filterBidsForProfessional(raw, userEmail);

  let formatted = formatBidListSafe(raw, { isDemo: false });

  if (formatted.length === 0) {
    formatted = getDemoBidsForDisplay();
  }

  return {
    bids: formatted,
    isDemo: formatted.length > 0 && formatted.every((b) => b.isDemo),
    rawCount: raw.length,
  };
}
