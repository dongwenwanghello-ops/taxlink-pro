/**
 * Connects bid lifecycle ↔ project lifecycle ↔ workspace lifecycle.
 */
import { enrichBidIdentity, getRevealedFullName } from "@/lib/professionalIdentity";
import { awardProject, getPostedProjects, updateProject } from "@/lib/projectStore";
import { awardProjectBid, getAllBids, getBidsForProject } from "@/lib/bidStore";
import {
  createWorkspaceOnAward,
  getAllWorkspaces,
  getWorkspaceByProjectId,
  getUserRoleInWorkspace,
  updateWorkspace,
} from "@/lib/workspaceStore";
import {
  buildWorkspaceMemberPatch,
  getSessionProfessionalEmail,
  persistWorkspaceAccessGrant,
  setSessionProfessionalEmail,
  workspaceIncludesEmail,
} from "@/lib/workspaceAccess";
import { DEMO_BID_TEMPLATES } from "@/lib/demoBidTemplates";

/** Canonical bid statuses (storage may still use "accepted"). */
export const BID_STATUSES = {
  pending: "pending",
  shortlisted: "shortlisted",
  selected: "selected",
  rejected: "rejected",
};

export const BID_STATUS_UI = {
  pending: {
    label: "Pending Review",
    badgeClass: "bg-amber-50 border-amber-200 text-amber-800",
    layer: "bid",
  },
  shortlisted: {
    label: "Shortlisted",
    badgeClass: "bg-violet-50 border-violet-200 text-violet-800",
    layer: "bid",
  },
  selected: {
    label: "Selected",
    badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800",
    layer: "bid",
  },
  rejected: {
    label: "Not selected",
    badgeClass: "bg-rose-50 border-rose-200 text-rose-700",
    layer: "bid",
  },
};

export const PROJECT_STATUS_UI = {
  open: { label: "Open", badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  reviewing: { label: "Reviewing Bids", badgeClass: "bg-amber-50 border-amber-200 text-amber-800" },
  awarded: { label: "Awarded", badgeClass: "bg-violet-50 border-violet-200 text-violet-800" },
  in_progress: { label: "In Progress", badgeClass: "bg-blue-50 border-blue-200 text-blue-800" },
  completed: { label: "Completed", badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  closed: { label: "Closed", badgeClass: "bg-secondary border-border text-muted-foreground" },
};

export function normalizeBidStatus(status, bid = {}) {
  if (bid.awarded || bid.status === "accepted") return BID_STATUSES.selected;
  if (status === "accepted" || status === "awarded") return BID_STATUSES.selected;
  return status || BID_STATUSES.pending;
}

export function getBidStatusUI(bid) {
  const key = normalizeBidStatus(bid?.status, bid);
  return BID_STATUS_UI[key] || BID_STATUS_UI.pending;
}

export function getProjectStatusUI(project = {}) {
  if (project.lifecycle_state === "awarded" || project.awarded_bid_id) {
    return project.status === "in_progress"
      ? PROJECT_STATUS_UI.in_progress
      : PROJECT_STATUS_UI.awarded;
  }
  const key = project.status || "open";
  return PROJECT_STATUS_UI[key] || PROJECT_STATUS_UI.open;
}

export function getWorkspaceStatusUI(workspace) {
  if (!workspace) return { label: "No workspace", badgeClass: "bg-muted border-border text-muted-foreground" };
  const map = {
    quote_accepted: { label: "Workspace Active", badgeClass: "bg-teal-50 border-teal-200 text-teal-800" },
    awaiting_documents: { label: "Awaiting Documents", badgeClass: "bg-amber-50 border-amber-200 text-amber-800" },
    in_progress: { label: "In Progress", badgeClass: "bg-blue-50 border-blue-200 text-blue-800" },
    review: { label: "Under Review", badgeClass: "bg-violet-50 border-violet-200 text-violet-800" },
    submission_ready: { label: "Submission Ready", badgeClass: "bg-indigo-50 border-indigo-200 text-indigo-800" },
    completed: { label: "Completed", badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  };
  return map[workspace.workflow_status] || map.quote_accepted;
}

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

  return steps.map((step, i) => {
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
  const email = (
    enriched.bidder_email
    || bid?.created_by
    || bid?.professional_email
    || ""
  ).toLowerCase().trim();
  return email;
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
 * Single entry: award bid → update project → reject other bids → create workspace → emit events.
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
  };

  window.dispatchEvent(new CustomEvent("bidUpdated", { detail: payload }));
  window.dispatchEvent(new CustomEvent("projectAwarded", { detail: payload }));
  window.dispatchEvent(new CustomEvent("projectUpdated", { detail: payload.project }));

  return payload;
}

/** Repair: ensure every locally awarded project has a workspace. */
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
        bidder_email: resolveProfessionalEmail(winning),
      },
      clientEmail: clientEmail || project.created_by,
    });
    created += 1;
  }

  return created;
}

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

/**
 * Ensure a persisted workspace exists for a selected/accepted bid (localStorage).
 * Call before navigating to /workspace/:projectId and from global sync.
 */
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

/** Sync workspaces from all selected bids in localStorage (+ demo templates). */
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

/**
 * List workspaces for the current user — email, session, grants, and selected-bid linkage.
 */
export function getAccessibleWorkspacesForUser({ email, role } = {}) {
  const sessionEmail = getSessionProfessionalEmail();
  const normalized = (email || sessionEmail || "").toLowerCase().trim();

  const selectedBids = getAllBids().filter((b) => {
    if (normalizeBidStatus(b.status, b) !== BID_STATUSES.selected) return false;
    if (!normalized) return true;
    const proEmail = resolveProfessionalEmail(b);
    return !proEmail || proEmail === normalized || proEmail === sessionEmail;
  });

  const demoSelected =
    role === "professional"
      ? DEMO_BID_TEMPLATES.filter((b) => normalizeBidStatus(b.status, b) === BID_STATUSES.selected)
      : [];

  const linkedProjectIds = new Set(
    [...selectedBids, ...demoSelected].map((b) => b.project_id).filter(Boolean),
  );

  return getAllWorkspaces().filter((ws) => {
    if (normalized && workspaceIncludesEmail(ws, normalized)) {
      if (role === "client") return getUserRoleInWorkspace(ws, normalized) === "client";
      if (role === "professional") return getUserRoleInWorkspace(ws, normalized) === "professional";
      return true;
    }
    if (linkedProjectIds.has(ws.project_id)) return true;
    if (role === "professional" && String(ws.project_id || "").startsWith("demo-project-")) {
      return true;
    }
    return false;
  });
}

export function getAcceptedBidsForUser(email) {
  const normalized = (email || getSessionProfessionalEmail() || "").toLowerCase().trim();
  const fromStorage = getAllBids().filter((bid) => {
    const st = normalizeBidStatus(bid.status, bid);
    if (st !== BID_STATUSES.selected) return false;
    if (!normalized) return true;
    const proEmail = resolveProfessionalEmail(bid);
    return proEmail === normalized;
  });

  const storageProjectIds = new Set(fromStorage.map((b) => b.project_id));
  const demoExtras = DEMO_BID_TEMPLATES.filter((bid) => {
    if (normalizeBidStatus(bid.status, bid) !== BID_STATUSES.selected) return false;
    if (storageProjectIds.has(bid.project_id)) return false;
    if (!normalized) return true;
    const proEmail = resolveProfessionalEmail(bid);
    return proEmail === normalized || bid.bidder_email === normalized;
  });

  return [...fromStorage, ...demoExtras];
}

export function getWorkspacesForUserWithSync({ email, role }) {
  syncWorkspacesFromAwardedProjects(role === "client" ? email : null);
  syncWorkspacesFromAcceptedBids();
  return getAccessibleWorkspacesForUser({ email, role });
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
