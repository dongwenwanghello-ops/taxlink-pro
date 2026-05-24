/**
 * Central marketplace workflow state — single source of truth for all environments.
 * All workspace sync runs through reconcileMarketplaceState(); pages consume snapshots/bundles.
 */
import { getAllBids, getBidsForProject } from "@/lib/bidStore";
import { getPostedProjects, updateProject } from "@/lib/projectStore";
import { getAllWorkspaces, getWorkspaceByProjectId, getUserRoleInWorkspace, updateWorkspace } from "@/lib/workspaceStore";
import {
  syncWorkspacesFromAwardedProjects,
  syncWorkspacesFromAcceptedBids,
  ensureWorkspaceForSelectedBid,
} from "@/lib/workflowSync";
import {
  BID_STATUSES,
  normalizeBidStatus,
  getProjectStatusUI,
} from "@/lib/bidLifecycle";
import {
  buildWorkspaceMemberPatch,
  getSessionProfessionalEmail,
  persistWorkspaceAccessGrant,
  resolveWorkspaceUserRole,
  workspaceIncludesEmail,
  collectWorkspaceIdentityEmails,
  setSessionProfessionalEmail,
} from "@/lib/workspaceAccess";
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
import { DEMO_BID_TEMPLATES } from "@/lib/demoBidTemplates";

/** Bump when storage shape or reconcile rules change (triggers migration on load). */
export const WORKFLOW_SCHEMA_VERSION = 2;

export const STORAGE_KEYS = {
  bids: "taxprouk_bids",
  workspaces: "taxprouk_workspaces",
  projects: "taxprouk_posted_projects",
  sessionProEmail: "taxprouk_professional_email",
  sessionClientEmail: "taxprouk_client_email",
  schemaVersion: "taxprouk_workflow_schema_version",
  workflowBackup: "taxprouk_workflow_backup",
  userRole: "user_role",
  myProfile: "my_profile",
};

export const WORKFLOW_EVENTS = {
  reconciled: "workflowReconciled",
  projectAwarded: "projectAwarded",
  bidUpdated: "bidUpdated",
  workspaceCreated: "workspaceCreated",
  workspaceUpdated: "workspaceUpdated",
};

export const DEMO_POLICY = {
  myBidsFallback: "when_no_stored_bids",
  jobsMergeDemo: true,
  workspaceSyncIncludesDemoTemplates: true,
};

const LOG_PREFIX = "[marketplace-reconcile]";

function readSchemaVersion() {
  try {
    return Number(localStorage.getItem(STORAGE_KEYS.schemaVersion) || "0");
  } catch {
    return 0;
  }
}

function writeSchemaVersion() {
  localStorage.setItem(STORAGE_KEYS.schemaVersion, String(WORKFLOW_SCHEMA_VERSION));
}

function readTaxLinkAuthEmail() {
  try {
    return JSON.parse(localStorage.getItem("taxlink_auth_session") || "null")?.user?.email || "";
  } catch {
    return "";
  }
}

/** Session identity used for permissions and workspace listing (consistent across pages). */
export function getMarketplaceSession() {
  let profileEmail = "";
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.myProfile);
    if (raw) profileEmail = JSON.parse(raw)?.email || "";
  } catch { /* ignore */ }

  const authEmail = readTaxLinkAuthEmail();
  const professionalEmail = getSessionProfessionalEmail();
  const clientEmail = (localStorage.getItem(STORAGE_KEYS.sessionClientEmail) || profileEmail || "")
    .toLowerCase()
    .trim();
  const normalizedAuth = String(authEmail || "").toLowerCase().trim();
  const normalizedProfile = (profileEmail || "").toLowerCase().trim();

  const role = localStorage.getItem(STORAGE_KEYS.userRole) || "professional";

  return {
    role,
    professionalEmail,
    clientEmail,
    authEmail: normalizedAuth,
    profileEmail: normalizedProfile,
    email: role === "client"
      ? (clientEmail || normalizedAuth || normalizedProfile)
      : (professionalEmail || normalizedAuth || normalizedProfile),
  };
}

export function setMarketplaceClientEmail(email) {
  if (!email) return;
  localStorage.setItem(STORAGE_KEYS.sessionClientEmail, String(email).toLowerCase().trim());
}

/** Keep marketplace session keys aligned with TaxLink auth (role-aware). */
export function syncSessionIdentityFromUser(user) {
  if (!user?.email) return;
  const email = String(user.email).toLowerCase().trim();
  const role = user.role || localStorage.getItem(STORAGE_KEYS.userRole) || "professional";
  if (role === "client") {
    setMarketplaceClientEmail(email);
  } else {
    setSessionProfessionalEmail(email);
  }
  if (user.role) {
    localStorage.setItem(STORAGE_KEYS.userRole, user.role);
  }
}

export function getEnvironmentLabel() {
  if (typeof window === "undefined") return "server";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "development";
  if (host.includes("vercel.app")) return "preview";
  return "production";
}

/**
 * Snapshot marketplace localStorage before schema migrations (per-origin).
 * Returns backup id or null if storage unavailable.
 */
export function backupMarketplaceState(label = "pre-reconcile") {
  if (typeof window === "undefined") return null;
  try {
    const payload = {
      label,
      at: new Date().toISOString(),
      environment: getEnvironmentLabel(),
      schemaVersion: readSchemaVersion(),
      bids: localStorage.getItem(STORAGE_KEYS.bids),
      workspaces: localStorage.getItem(STORAGE_KEYS.workspaces),
      projects: localStorage.getItem(STORAGE_KEYS.projects),
    };
    const id = `${label}-${Date.now()}`;
    const backups = JSON.parse(localStorage.getItem(STORAGE_KEYS.workflowBackup) || "[]");
    backups.unshift({ id, ...payload });
    localStorage.setItem(STORAGE_KEYS.workflowBackup, JSON.stringify(backups.slice(0, 5)));
    return id;
  } catch (err) {
    console.warn(LOG_PREFIX, "backup failed", err);
    return null;
  }
}

/** Detect inconsistent workspace / project / bid linkages. */
export function auditOrphanedWorkspaces() {
  const projects = getPostedProjects();
  const bids = getAllBids();
  const workspaces = getAllWorkspaces();
  const projectIds = new Set(projects.map((p) => p.id));

  const orphans = {
    workspaceWithoutProject: [],
    workspaceWithoutWinningBid: [],
    awardedProjectWithoutWorkspace: [],
    selectedBidWithoutWorkspace: [],
    workspaceMemberMismatch: [],
  };

  for (const ws of workspaces) {
    if (!projectIds.has(ws.project_id) && !String(ws.project_id || "").startsWith("demo-")) {
      orphans.workspaceWithoutProject.push(ws.project_id);
    }
    const project = projects.find((p) => p.id === ws.project_id);
    const projectBids = bids.filter((b) => b.project_id === ws.project_id);
    const winning = projectBids.find((b) => b.id === project?.awarded_bid_id)
      || projectBids.find((b) => normalizeBidStatus(b.status, b) === BID_STATUSES.selected);
    if (project && !winning && !String(ws.project_id || "").startsWith("demo-")) {
      orphans.workspaceWithoutWinningBid.push(ws.project_id);
    }
    if (!ws.members?.length && !ws.professional_email && !ws.client_email) {
      orphans.workspaceMemberMismatch.push(ws.project_id);
    }
  }

  for (const project of projects) {
    const isAwarded =
      project.lifecycle_state === "awarded"
      || project.status === "in_progress"
      || project.awarded_bid_id;
    if (isAwarded && !getWorkspaceByProjectId(project.id)) {
      orphans.awardedProjectWithoutWorkspace.push(project.id);
    }
  }

  for (const bid of bids) {
    if (normalizeBidStatus(bid.status, bid) !== BID_STATUSES.selected) continue;
    if (!getWorkspaceByProjectId(bid.project_id)) {
      orphans.selectedBidWithoutWorkspace.push({ bidId: bid.id, projectId: bid.project_id });
    }
  }

  return orphans;
}

function repairWorkspacesFromProjects(projects, bids) {
  let repaired = 0;
  for (const project of projects) {
    const isAwarded =
      project.lifecycle_state === "awarded"
      || project.status === "in_progress"
      || project.awarded_bid_id;

    if (!isAwarded) continue;

    const projectBids = bids.filter((b) => b.project_id === project.id);
    let winning = projectBids.find((b) => b.id === project.awarded_bid_id);
    if (!winning) winning = projectBids.find((b) => b.status === "accepted" || b.awarded);
    if (!winning) continue;

    const ws = getWorkspaceByProjectId(project.id);
    const patch = buildWorkspaceMemberPatch({
      clientEmail: project.created_by,
      bid: enrichBidIdentity(winning),
    });

    if (ws) {
      const needsRepair =
        !ws.members?.length
        || (patch.professional_email && ws.professional_email !== patch.professional_email)
        || ws.bid_id !== patch.bid_id;
      if (needsRepair) {
        updateWorkspace(project.id, patch);
        repaired += 1;
      }
    } else {
      ensureWorkspaceForSelectedBid(winning, { clientEmail: project.created_by });
      repaired += 1;
    }

    if (patch.professional_email || patch.client_email) {
      persistWorkspaceAccessGrant(project.id, {
        clientEmail: patch.client_email,
        professionalEmail: patch.professional_email,
        bidId: patch.selected_bid_id,
      });
    }
  }
  return repaired;
}

function alignProjectsWithBids(projects, bids) {
  let updated = 0;
  for (const project of projects) {
    const projectBids = bids.filter((b) => b.project_id === project.id);
    const winner = projectBids.find((b) => b.status === "accepted" || b.awarded);
    if (!winner) continue;
    if (project.awarded_bid_id === winner.id && project.lifecycle_state === "awarded") continue;

    updateProject(project.id, {
      status: "in_progress",
      lifecycle_state: "awarded",
      awarded_bid_id: winner.id,
      awarded_amount: winner.amount,
      accepting_bids: false,
      openForBids: false,
    });
    updated += 1;
  }
  return updated;
}

/**
 * Canonical state engine: backup (on migration), sync workspaces, repair, align, audit, snapshot.
 */
export function reconcileMarketplaceState(options = {}) {
  if (typeof window === "undefined") return { ok: false };

  const { skipBackup = false } = options;
  const prevVersion = readSchemaVersion();
  const needsMigration = prevVersion < WORKFLOW_SCHEMA_VERSION;

  if (needsMigration && !skipBackup) {
    backupMarketplaceState("schema-migration");
  }

  const createdFromProjects = syncWorkspacesFromAwardedProjects();
  const createdFromBids = syncWorkspacesFromAcceptedBids();

  const projects = getPostedProjects();
  const bids = getAllBids();
  const repaired = repairWorkspacesFromProjects(projects, bids);
  const projectsAligned = alignProjectsWithBids(projects, bids);
  const orphans = auditOrphanedWorkspaces();

  writeSchemaVersion();

  const snapshot = buildWorkflowSnapshot();

  const report = {
    ok: true,
    schemaVersion: WORKFLOW_SCHEMA_VERSION,
    migrated: needsMigration,
    environment: getEnvironmentLabel(),
    createdFromProjects,
    createdFromBids,
    repaired,
    projectsAligned,
    orphans,
    snapshot,
  };

  const orphanCount = Object.values(orphans).reduce((n, arr) => n + arr.length, 0);
  if (orphanCount > 0 || import.meta.env?.DEV) {
    console.info(LOG_PREFIX, report);
  }

  window.dispatchEvent(
    new CustomEvent(WORKFLOW_EVENTS.reconciled, { detail: report }),
  );

  return report;
}

export function buildWorkflowSnapshot() {
  const session = getMarketplaceSession();
  const projects = getPostedProjects();
  const bids = getAllBids();
  const workspaces = getAllWorkspaces();

  const byProjectId = {};
  for (const project of projects) {
    const projectBids = bids.filter((b) => b.project_id === project.id);
    const ws = getWorkspaceByProjectId(project.id);
    const winning = projectBids.find((b) => b.id === project.awarded_bid_id)
      || projectBids.find((b) => normalizeBidStatus(b.status, b) === BID_STATUSES.selected);

    byProjectId[project.id] = {
      project,
      bids: projectBids,
      workspace: ws,
      winningBid: winning || null,
      projectStatus: getProjectStatusUI(project),
      hasWorkspace: Boolean(ws),
      userRole: ws ? resolveWorkspaceUserRole({ workspace: ws, project, user: { email: session.email } }) : null,
    };
  }

  const accessibleWorkspaces = getAccessibleWorkspacesForUser({
    email: session.email,
    role: session.role,
  });

  return {
    schemaVersion: WORKFLOW_SCHEMA_VERSION,
    environment: getEnvironmentLabel(),
    session,
    projects,
    bids,
    workspaces,
    accessibleWorkspaces,
    byProjectId,
    counts: {
      projects: projects.length,
      bids: bids.length,
      workspaces: workspaces.length,
      accessibleWorkspaces: accessibleWorkspaces.length,
    },
  };
}

function workspaceMatchesIdentity(ws, norm, role) {
  if (!norm || !workspaceIncludesEmail(ws, norm)) return false;
  if (role === "client") return getUserRoleInWorkspace(ws, norm) === "client";
  if (role === "professional") return getUserRoleInWorkspace(ws, norm) === "professional";
  return true;
}

function workspaceProfessionalFieldsMatch(ws, identities) {
  const proEmails = [
    ws.professional_email,
    ws.selected_professional_email,
  ]
    .map((e) => String(e || "").toLowerCase().trim())
    .filter(Boolean);
  return identities.some((id) => proEmails.includes(id));
}

function resolveEffectiveRole(role) {
  try {
    const authRole = JSON.parse(localStorage.getItem("taxlink_auth_session") || "null")?.user?.role;
    if (authRole) return String(authRole).toLowerCase().trim();
  } catch {
    /* ignore */
  }
  return String(role || localStorage.getItem(STORAGE_KEYS.userRole) || "professional")
    .toLowerCase()
    .trim();
}

/** List workspaces visible to user after reconcile (use snapshot in UI when possible). */
export function getAccessibleWorkspacesForUser({ email, role } = {}) {
  const identities = collectWorkspaceIdentityEmails({ email });
  const effectiveRole = resolveEffectiveRole(role);

  const selectedBids = getAllBids().filter((b) => {
    if (normalizeBidStatus(b.status, b) !== BID_STATUSES.selected) return false;
    if (!identities.length) return true;
    const proEmail = resolveProfessionalEmail(b);
    return !proEmail || identities.includes(proEmail);
  });

  const demoSelected =
    effectiveRole === "professional"
      ? DEMO_BID_TEMPLATES.filter((b) => normalizeBidStatus(b.status, b) === BID_STATUSES.selected)
      : [];

  const linkedProjectIds = new Set(
    [...selectedBids, ...demoSelected].map((b) => b.project_id).filter(Boolean),
  );

  const all = getAllWorkspaces();

  if (effectiveRole === "professional" && identities.length) {
    const byProfessionalEmail = all.filter((ws) => workspaceProfessionalFieldsMatch(ws, identities));
    if (byProfessionalEmail.length) return byProfessionalEmail;
  }

  return all.filter((ws) => {
    for (const norm of identities) {
      if (workspaceMatchesIdentity(ws, norm, effectiveRole)) return true;
    }
    if (effectiveRole === "professional" && workspaceProfessionalFieldsMatch(ws, identities)) {
      return true;
    }
    if (linkedProjectIds.has(ws.project_id)) return true;
    if (effectiveRole === "professional" && String(ws.project_id || "").startsWith("demo-project-")) {
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

/** Per-project bundle for workspace routes, Quick View, Compare Bids. */
export function getProjectWorkflowBundle(projectId) {
  const report = reconcileMarketplaceState({ skipBackup: true });
  return report.snapshot?.byProjectId?.[projectId] || {
    project: getPostedProjects().find((p) => p.id === projectId) || null,
    bids: getBidsForProject(projectId),
    workspace: getWorkspaceByProjectId(projectId),
    winningBid: null,
    projectStatus: null,
    hasWorkspace: Boolean(getWorkspaceByProjectId(projectId)),
    userRole: null,
  };
}

export function getNormalizedBidsForProject(projectId) {
  const bids = getBidsForProject(projectId);
  return bids.map((b) => ({
    ...b,
    _normalizedStatus: normalizeBidStatus(b.status, b),
  }));
}

/** @deprecated Use reconcileMarketplaceState + snapshot.accessibleWorkspaces */
export function getWorkspacesForUserWithSync({ email, role }) {
  reconcileMarketplaceState({ skipBackup: true });
  return getAccessibleWorkspacesForUser({ email, role });
}
