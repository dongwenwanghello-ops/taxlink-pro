/**
 * Workspace creation & repair — called ONLY from reconcileMarketplaceState().
 * Do not call these directly from pages; use marketplaceState.reconcileMarketplaceState().
 */
import { enrichBidIdentity } from "@/lib/professionalIdentity";

function resolveProfessionalEmail(bid) {
  const enriched = enrichBidIdentity(bid);
  return (
    enriched.bidder_email
    || bid?.created_by
    || bid?.professional_email
    || ""
  ).toLowerCase().trim();
}
import { getPostedProjects } from "@/lib/projectStore";
import { awardProjectBid, getAllBids, getBidsForProject } from "@/lib/bidStore";
import {
  createWorkspaceOnAward,
  getWorkspaceByProjectId,
  updateWorkspace,
} from "@/lib/workspaceStore";
import {
  buildWorkspaceMemberPatch,
  persistWorkspaceAccessGrant,
  setSessionProfessionalEmail,
} from "@/lib/workspaceAccess";
import { DEMO_BID_TEMPLATES } from "@/lib/demoBidTemplates";
import { BID_STATUSES, normalizeBidStatus } from "@/lib/bidLifecycle";

function projectStubFromBid(bid, clientEmail) {
  return {
    id: bid.project_id,
    title: bid.project_title || "Collaboration workspace",
    category: bid.project_category || bid.category,
    status: "in_progress",
    lifecycle_state: "awarded",
    awarded_bid_id: bid.id,
    awarded_bidder_name: bid.bidder_name || bid.bidder_full_name,
    awarded_amount: bid.amount,
    created_by: clientEmail || bid.client_email || "demo-client@taxprouk.local",
  };
}

/** Ensure workspace for one selected/accepted bid. */
export function ensureWorkspaceForSelectedBid(bid, { clientEmail } = {}) {
  if (!bid?.project_id) return null;

  const status = normalizeBidStatus(bid.status, bid);
  const isWinner = status === BID_STATUSES.selected || bid.awarded || bid.status === "accepted";
  if (!isWinner) return null;

  const enriched = enrichBidIdentity({
    ...bid,
    status: "accepted",
    awarded: true,
    identity_revealed: true,
  });
  const proEmail = resolveProfessionalEmail(enriched);
  if (proEmail) setSessionProfessionalEmail(proEmail);

  const existing = getWorkspaceByProjectId(bid.project_id);
  if (existing) {
    const patch = buildWorkspaceMemberPatch({
      clientEmail: clientEmail || existing.client_email,
      bid: enriched,
    });
    if (patch.professional_email || patch.members?.length) {
      updateWorkspace(bid.project_id, patch);
      persistWorkspaceAccessGrant(bid.project_id, {
        clientEmail: patch.client_email,
        professionalEmail: patch.professional_email,
        bidId: patch.selected_bid_id,
      });
    }
    return getWorkspaceByProjectId(bid.project_id) || existing;
  }

  const project =
    getPostedProjects().find((p) => p.id === bid.project_id)
    || projectStubFromBid(enriched, clientEmail);

  const ws = createWorkspaceOnAward({
    project,
    bid: enriched,
    clientEmail: clientEmail || project.created_by,
  });

  persistWorkspaceAccessGrant(bid.project_id, {
    clientEmail: (clientEmail || project.created_by || "").toLowerCase(),
    professionalEmail: proEmail,
    bidId: enriched.id,
  });

  return ws;
}

/** Create/repair workspaces for all awarded projects in localStorage. */
export function syncWorkspacesFromAwardedProjects(clientEmail = null) {
  const projects = getPostedProjects();
  let created = 0;

  for (const project of projects) {
    const isAwarded =
      project.lifecycle_state === "awarded"
      || project.status === "in_progress"
      || project.awarded_bid_id;

    if (!isAwarded) continue;

    const existingWs = getWorkspaceByProjectId(project.id);
    const bids = getBidsForProject(project.id);
    let winning = bids.find((b) => b.id === project.awarded_bid_id);
    if (!winning) winning = bids.find((b) => b.status === "accepted" || b.awarded);

    if (!winning) continue;

    const proEmail = resolveProfessionalEmail(winning);
    const client = (clientEmail || project.created_by || "").toLowerCase();
    if (existingWs) {
      const patch = buildWorkspaceMemberPatch({
        clientEmail: client,
        bid: { ...enrichBidIdentity(winning), bidder_email: proEmail },
      });
      const needsRepair =
        patch.professional_email
        && (
          !existingWs.members?.length
          || existingWs.professional_email !== patch.professional_email
          || existingWs.bid_id !== patch.bid_id
        );
      if (needsRepair) updateWorkspace(project.id, patch);
      if (patch.professional_email || patch.client_email) {
        persistWorkspaceAccessGrant(project.id, {
          clientEmail: patch.client_email,
          professionalEmail: patch.professional_email,
          bidId: patch.selected_bid_id,
        });
      }
      continue;
    }

    createWorkspaceOnAward({
      project,
      bid: {
        ...enrichBidIdentity(winning),
        bidder_email: proEmail,
      },
      clientEmail: clientEmail || project.created_by,
    });
    created += 1;
  }

  return created;
}

/** Create workspaces from all selected bids (+ demo templates when storage empty). */
export function syncWorkspacesFromAcceptedBids() {
  let touched = 0;
  const selected = getAllBids().filter((b) => normalizeBidStatus(b.status, b) === BID_STATUSES.selected);

  for (const bid of selected) {
    if (ensureWorkspaceForSelectedBid(bid)) touched += 1;
  }

  if (selected.length === 0) {
    for (const template of DEMO_BID_TEMPLATES) {
      if (normalizeBidStatus(template.status, template) === BID_STATUSES.selected) {
        if (ensureWorkspaceForSelectedBid(template)) touched += 1;
      }
    }
  }

  return touched;
}
