/**
 * Workspace page helpers — snapshot-first list resolution and auth probing.
 */
import { auth } from "@/config/providers";
import {
  getAccessibleWorkspacesForUser,
  getAcceptedBidsForUser,
  getMarketplaceSession,
} from "@/lib/marketplaceState";
import { getAllWorkspaces, getWorkspaceByProjectId } from "@/lib/workspaceStore";

const CLOUD_SESSION_KEY = "taxlink_cloud_session";
const LOCAL_AUTH_SESSION_KEY = "taxlink_auth_session";

export function hasActiveCloudSession() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLOUD_SESSION_KEY) === "active";
}

export function hasStoredLocalAuthSession() {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_SESSION_KEY);
    return Boolean(JSON.parse(raw || "null")?.user?.email);
  } catch {
    return false;
  }
}

/** Marketplace profile, role, or TaxLink local auth on this device. */
export function hasStoredLocalIdentity(session = null) {
  const s = session || getMarketplaceSession();
  if (s.email || s.clientEmail || s.profileEmail || s.professionalEmail) return true;
  if (localStorage.getItem("user_role")) return true;
  if (hasStoredLocalAuthSession()) return true;
  try {
    if (JSON.parse(localStorage.getItem("my_profile") || "null")?.email) return true;
    if (JSON.parse(localStorage.getItem("early_access_signup") || "null")?.email) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** Awarded workspaces persisted in localStorage for this browser origin. */
export function hasStoredLocalWorkspaceData(session = null) {
  const all = getAllWorkspaces();
  if (!all.length) return false;

  const s = session || getMarketplaceSession();
  const email = s.email || s.clientEmail || s.professionalEmail || s.profileEmail;
  if (email) {
    const accessible = getAccessibleWorkspacesForUser({ email, role: s.role });
    if (accessible.length) return true;
  }

  return hasStoredLocalIdentity(s);
}

export function hasLocalWorkspaceOrSessionData(session = null) {
  return hasStoredLocalIdentity(session) || hasStoredLocalWorkspaceData(session);
}

/** Cloud expired banner only when there is no local and no active cloud session. */
export function shouldShowCloudSessionExpired({ user = null, session = null } = {}) {
  if (user?.email) return false;
  const s = session || getMarketplaceSession();
  if (hasLocalWorkspaceOrSessionData(s)) return false;
  return !hasActiveCloudSession();
}

/** Resolve current user via TaxLink auth (no external calls). */
export async function resolveWorkspaceUser() {
  try {
    const { user, authenticated, cloudExpired } = await auth.restoreSession();
    return {
      user,
      authRequired: !authenticated,
      cloudExpired: Boolean(cloudExpired),
    };
  } catch {
    return { user: null, authRequired: true, cloudExpired: true };
  }
}

/**
 * Priority: reconciled snapshot → local fallback (never invert).
 * When session expired, keep local workspaces visible on this device.
 */
export function resolveWorkspaceListPriority({ snapshot, session, authRequired }) {
  const localFallback = getAccessibleWorkspacesForUser({
    email: session?.email,
    role: session?.role,
  });

  if (authRequired) {
    return localFallback;
  }

  if (snapshot != null) {
    return snapshot.accessibleWorkspaces ?? [];
  }

  return localFallback;
}

export function hasWorkspaceForAcceptedBid(acceptedBids) {
  return acceptedBids.some((b) => Boolean(getWorkspaceByProjectId(b.project_id)));
}

export function loadAcceptedBidsForSession(session) {
  if (session?.role === "professional" && session?.email) {
    return getAcceptedBidsForUser(session.email);
  }
  return [];
}
