/**
 * Workspace page helpers — snapshot-first list resolution and auth probing.
 */
import { getAccessibleWorkspacesForUser, getAcceptedBidsForUser } from "@/lib/marketplaceState";
import { getWorkspaceByProjectId } from "@/lib/workspaceStore";

/** True when Base44 auth rejected the request (guest / expired session). */
export function isWorkspaceAuthError(err) {
  if (!err) return false;
  const status = err.status ?? err.response?.status ?? err.data?.status;
  if (status === 401 || status === 403) return true;
  const msg = String(err.message || err.data?.message || "").toLowerCase();
  return msg.includes("logged in") || msg.includes("unauthorized") || msg.includes("authentication");
}

/** Resolve current user via Base44 without throwing. */
export async function resolveWorkspaceUser(fetchMe) {
  try {
    const user = await fetchMe();
    return { user, authRequired: false };
  } catch (err) {
    return {
      user: null,
      authRequired: isWorkspaceAuthError(err),
    };
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
