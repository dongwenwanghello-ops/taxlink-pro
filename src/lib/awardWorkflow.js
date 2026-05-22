/**
 * Award execution & UI helpers. Workspace sync lives in workflowSync.js;
 * canonical reconcile in marketplaceState.js.
 */
import { enrichBidIdentity, getRevealedFullName } from "@/lib/professionalIdentity";
import { awardProject, updateProject } from "@/lib/projectStore";
import { awardProjectBid } from "@/lib/bidStore";
import { createWorkspaceOnAward } from "@/lib/workspaceStore";
import {
  persistWorkspaceAccessGrant,
  setSessionProfessionalEmail,
} from "@/lib/workspaceAccess";
import { reconcileMarketplaceState } from "@/lib/marketplaceState";

export {
  BID_STATUSES,
  BID_STATUS_UI,
  PROJECT_STATUS_UI,
  normalizeBidStatus,
  getBidStatusUI,
  getProjectStatusUI,
  getWorkspaceStatusUI,
} from "@/lib/bidLifecycle";

export {
  ensureWorkspaceForSelectedBid,
  syncWorkspacesFromAwardedProjects,
  syncWorkspacesFromAcceptedBids,
} from "@/lib/workflowSync";

export {
  getAccessibleWorkspacesForUser,
  getAcceptedBidsForUser,
  getWorkspacesForUserWithSync,
} from "@/lib/marketplaceState";

import { BID_STATUSES, normalizeBidStatus, getWorkspaceStatusUI } from "@/lib/bidLifecycle";

/** Visual timeline for professional bid journey. */
export function getBidLifecycleSteps(bid, { hasWorkspace = false } = {}) {
  const status = normalizeBidStatus(bid?.status, bid);
  const steps = [
    { id: "submitted", label: "Bid Submitted" },
    { id: "review", label: "Under Review" },
    { id: "shortlisted", label: "Shortlisted" },
    { id: "selected", label: "Selected" },
    { id: "workspace", label: "Workspace Opened" },
    { id: "completed", label: "Completed" },
  ];

  const order = ["submitted", "review", "shortlisted", "selected", "workspace", "completed"];
  let activeIndex = 1;
  if (status === BID_STATUSES.shortlisted) activeIndex = 2;
  if (status === BID_STATUSES.selected) activeIndex = hasWorkspace ? 4 : 3;
  if (status === BID_STATUSES.rejected) activeIndex = 1;

  return steps.map((step) => {
    const idx = order.indexOf(step.id);
    let state = "upcoming";
    if (status === BID_STATUSES.rejected && step.id === "selected") state = "skipped";
    else if (idx < activeIndex) state = "done";
    else if (idx === activeIndex) state = "current";
    return { ...step, state };
  });
}

export function resolveProfessionalEmail(bid) {
  const enriched = enrichBidIdentity(bid);
  return (
    enriched.bidder_email
    || bid?.created_by
    || bid?.professional_email
    || ""
  ).toLowerCase().trim();
}

export function buildAwardPatch(project, winningBid) {
  const enriched = enrichBidIdentity({ ...winningBid, identity_revealed: true, status: "accepted" });
  const professionalLabel = getRevealedFullName(enriched);
  return {
    projectPatch: {
      status: "in_progress",
      lifecycle_state: "awarded",
      awarded_bid_id: enriched.id,
      awarded_bidder_name: professionalLabel,
      awarded_amount: enriched.amount,
      awarded_at: new Date().toISOString(),
      accepting_bids: false,
      openForBids: false,
    },
    winningBid: enriched,
    professionalLabel,
  };
}

/**
 * Single entry: award bid → update project → reject other bids → create workspace → reconcile.
 */
export function executeProjectAward({ project, winningBid, clientEmail }) {
  const { projectPatch, winningBid: enriched, professionalLabel } = buildAwardPatch(project, winningBid);

  const updatedProject = awardProject(project.id, enriched) || {
    ...project,
    ...projectPatch,
  };
  updateProject(project.id, projectPatch);

  awardProjectBid(project.id, enriched.id);

  const proEmail = resolveProfessionalEmail(enriched);
  if (proEmail) setSessionProfessionalEmail(proEmail);

  const workspace = createWorkspaceOnAward({
    project: { ...updatedProject, ...projectPatch },
    bid: {
      ...enriched,
      bidder_email: proEmail || enriched.bidder_email,
    },
    clientEmail: (clientEmail || project.created_by || "").toLowerCase(),
  });

  persistWorkspaceAccessGrant(project.id, {
    clientEmail: (clientEmail || project.created_by || "").toLowerCase(),
    professionalEmail: proEmail,
    bidId: enriched.id,
  });

  const payload = {
    project: { ...project, ...projectPatch },
    bid: enriched,
    workspace,
    winningBidId: enriched.id,
    projectId: project.id,
    professionalLabel,
  };

  window.dispatchEvent(new CustomEvent("bidUpdated", { detail: payload }));
  window.dispatchEvent(new CustomEvent("projectAwarded", { detail: payload }));
  window.dispatchEvent(new CustomEvent("projectUpdated", { detail: payload.project }));

  reconcileMarketplaceState({ skipBackup: true });

  return payload;
}

export function summarizeWorkspaceCard(ws, userRole) {
  const messages = ws.messages || [];
  const files = ws.files || [];
  const unread = messages.filter((m) => m.sender_role !== userRole).length;
  const awaitingDocs =
    ws.workflow_status === "awaiting_documents"
    || (files.length === 0 && userRole === "client" && ws.workflow_status === "quote_accepted");

  const lastActivity = ws.activities?.[0];

  return {
    unreadMessages: unread,
    awaitingDocuments: awaitingDocs,
    fileCount: files.length,
    lastActivityText: lastActivity?.message || "Workspace ready — start collaborating",
    lastActivityAt: lastActivity?.created_at || ws.updated_at,
    workspaceStatus: getWorkspaceStatusUI(ws),
  };
}
