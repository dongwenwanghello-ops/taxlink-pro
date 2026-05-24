/**
 * Workspace permission sync: members list, access grants, role resolution.
 */
import { enrichBidIdentity } from "@/lib/professionalIdentity";
import { getBidsForProject } from "@/lib/bidStore";

function resolveProEmail(bid) {
  const enriched = enrichBidIdentity(bid || {});
  return (
    enriched.bidder_email
    || bid?.created_by
    || bid?.professional_email
    || ""
  ).toLowerCase().trim();
}

function isWinningBid(bid) {
  if (!bid) return false;
  if (bid.awarded || bid.status === "accepted" || bid.status === "selected") return true;
  return false;
}

export const SESSION_PRO_EMAIL_KEY = "taxprouk_professional_email";

export function getSessionProfessionalEmail() {
  return (localStorage.getItem(SESSION_PRO_EMAIL_KEY) || "").toLowerCase().trim();
}

export function setSessionProfessionalEmail(email) {
  if (!email) return;
  localStorage.setItem(SESSION_PRO_EMAIL_KEY, String(email).toLowerCase().trim());
}

function accessGrantKey(projectId) {
  return `taxprouk_ws_access_${projectId}`;
}

export function persistWorkspaceAccessGrant(projectId, { clientEmail, professionalEmail, bidId } = {}) {
  if (!projectId) return;
  localStorage.setItem(
    accessGrantKey(projectId),
    JSON.stringify({
      project_id: projectId,
      client_email: (clientEmail || "").toLowerCase().trim(),
      professional_email: (professionalEmail || "").toLowerCase().trim(),
      bid_id: bidId || null,
      granted_at: new Date().toISOString(),
    }),
  );
}

export function getWorkspaceAccessGrant(projectId) {
  if (!projectId) return null;
  try {
    return JSON.parse(localStorage.getItem(accessGrantKey(projectId)) || "null");
  } catch {
    return null;
  }
}

/** Build canonical member fields from project + winning bid. */
export function buildWorkspaceMemberPatch({ clientEmail, bid } = {}) {
  const enriched = enrichBidIdentity(bid || {});
  let proEmail = resolveProEmail(enriched);
  if (!proEmail) proEmail = getSessionProfessionalEmail();
  if (!proEmail && String(enriched.id || "").startsWith("demo-")) {
    proEmail = getSessionProfessionalEmail() || "demo-professional@taxprouk.local";
  }

  const client = (clientEmail || "").toLowerCase().trim();
  const members = [];
  if (client) members.push({ role: "client", email: client });
  if (proEmail) {
    members.push({
      role: "professional",
      email: proEmail,
      bid_id: enriched.id || null,
    });
  }

  return {
    client_email: client,
    professional_email: proEmail,
    selected_bid_id: enriched.id || null,
    selected_professional_email: proEmail,
    bid_id: enriched.id || bid?.id || null,
    members,
  };
}

export function isEmailWorkspaceMember(workspace, email) {
  if (!workspace || !email) return null;
  const norm = email.toLowerCase().trim();

  const member = (workspace.members || []).find((m) => m.email === norm);
  if (member) return member.role;

  if (workspace.client_email?.toLowerCase() === norm) return "client";
  if (workspace.professional_email?.toLowerCase() === norm) return "professional";
  if (workspace.selected_professional_email?.toLowerCase() === norm) return "professional";

  const grant = getWorkspaceAccessGrant(workspace.project_id);
  if (grant?.client_email === norm) return "client";
  if (grant?.professional_email === norm) return "professional";

  return null;
}

export function collectCandidateEmails(user, project, winningBid) {
  const emails = new Set();
  if (user?.email) emails.add(user.email.toLowerCase().trim());

  const session = getSessionProfessionalEmail();
  if (session) emails.add(session);

  if (winningBid) {
    const pro = resolveProEmail(winningBid);
    if (pro) emails.add(pro);
  }

  const projectId = project?.id || winningBid?.project_id;
  const grant = projectId ? getWorkspaceAccessGrant(projectId) : null;
  if (grant?.client_email) emails.add(grant.client_email);
  if (grant?.professional_email) emails.add(grant.professional_email);

  return [...emails].filter(Boolean);
}

const CLIENT_SESSION_EMAIL_KEY = "taxprouk_client_email";

/** True when workspace is missing client/professional owner fields or member rows. */
export function isWorkspaceOwnershipIncomplete(workspace) {
  if (!workspace) return false;
  const hasClient = Boolean(workspace.client_email?.trim());
  const hasPro = Boolean(
    workspace.professional_email?.trim()
    || workspace.selected_professional_email?.trim(),
  );
  const members = workspace.members || [];
  const hasClientMember = members.some((m) => m.role === "client" && m.email);
  const hasProMember = members.some((m) => m.role === "professional" && m.email);
  return !hasClient || !hasPro || !hasClientMember || !hasProMember;
}

function readDevOnboardingClientEmail() {
  try {
    const signup = JSON.parse(localStorage.getItem("early_access_signup") || "null");
    if (signup?.email) return String(signup.email).toLowerCase().trim();
  } catch {
    /* ignore */
  }
  return (localStorage.getItem(CLIENT_SESSION_EMAIL_KEY) || "").toLowerCase().trim();
}

/**
 * Development-only: allow local demo users when ownership metadata is missing
 * or when TaxLink local auth email does not match stored workspace client.
 * No effect in production builds.
 */
export function resolveDevLocalWorkspaceRoleFallback({
  workspace,
  project = null,
  user = null,
  winningBid = null,
} = {}) {
  if (!import.meta.env.DEV || !workspace) return null;

  const storedRole = localStorage.getItem("user_role");
  const role = user?.role || storedRole;
  if (!role) return null;

  if (isWorkspaceOwnershipIncomplete(workspace)) {
    if (role === "client") return "client";
    if (role === "professional") return "professional";
  }

  const wsClient = workspace.client_email?.toLowerCase().trim();
  const projectOwner = project?.created_by?.toLowerCase().trim();
  const onboardingClient = readDevOnboardingClientEmail();

  if (role === "client") {
    const ownerEmail = wsClient || projectOwner;
    if (ownerEmail) {
      if (onboardingClient && onboardingClient === ownerEmail) return "client";
      if (projectOwner && projectOwner === ownerEmail) return "client";
      if (wsClient && projectOwner && wsClient === projectOwner) return "client";
    }
  }

  if (role === "professional" && winningBid) {
    const winPro = resolveProEmail(winningBid);
    const wsPro = (
      workspace.professional_email
      || workspace.selected_professional_email
      || ""
    ).toLowerCase().trim();
    const sessionPro = getSessionProfessionalEmail();
    if (winPro && (wsPro === winPro || sessionPro === winPro || !wsPro)) {
      return "professional";
    }
  }

  return null;
}

/**
 * Resolve client | professional role for workspace access.
 */
export function resolveWorkspaceUserRole({
  workspace,
  project = null,
  user = null,
  winningBid = null,
} = {}) {
  if (!workspace) return null;

  const projectId = workspace.project_id || project?.id;
  const bids = projectId ? getBidsForProject(projectId) : [];

  let winning = winningBid;
  if (!winning) {
    const winId = workspace.bid_id || workspace.selected_bid_id || project?.awarded_bid_id;
    winning = bids.find((b) => b.id === winId)
      || bids.find((b) => b.status === "accepted" || b.awarded);
  }

  const emails = collectCandidateEmails(user, project || { id: projectId }, winning);
  for (const email of emails) {
    const role = isEmailWorkspaceMember(workspace, email);
    if (role) return role;
  }

  const isWinning =
    winning
    && (
      winning.status === "accepted"
      || winning.awarded
      || isWinningBid(winning)
    );

  if (isWinning) {
    const winProEmail = resolveProEmail(winning);
    const session = getSessionProfessionalEmail();

    if (user?.email && winProEmail && user.email.toLowerCase() === winProEmail) {
      return "professional";
    }
    if (session && winProEmail && session === winProEmail) return "professional";
    if (session && !winProEmail) return "professional";

    const winners = bids.filter((b) => b.status === "accepted" || b.awarded);
    if (winners.length === 1 && winners[0].id === winning.id && !user?.email && !session) {
      return "professional";
    }
  }

  if (String(projectId || "").startsWith("demo-project-")) {
    const storedRole = localStorage.getItem("user_role");
    if (storedRole === "professional") return "professional";
    if (winning?.id?.startsWith("demo-") || workspace.bid_id?.startsWith("demo-")) {
      return "professional";
    }
  }

  if (project?.created_by && user?.email && project.created_by.toLowerCase() === user.email.toLowerCase()) {
    return "client";
  }

  return resolveDevLocalWorkspaceRoleFallback({
    workspace,
    project,
    user,
    winningBid: winning,
  });
}

export function workspaceIncludesEmail(workspace, email) {
  return Boolean(isEmailWorkspaceMember(workspace, email));
}

/** Sender identity for workspace actions when auth.me() is unavailable. */
export function resolveWorkspaceActor({ user, userRole, workspace } = {}) {
  const sessionEmail = getSessionProfessionalEmail();
  if (userRole === "client") {
    return {
      name: user?.full_name || user?.email || workspace?.client_name || "Client",
      email: (user?.email || workspace?.client_email || "").toLowerCase().trim(),
    };
  }
  return {
    name: user?.full_name || user?.email || workspace?.professional_name || "Professional",
    email: (
      user?.email
      || sessionEmail
      || workspace?.professional_email
      || workspace?.selected_professional_email
      || ""
    ).toLowerCase().trim(),
  };
}
