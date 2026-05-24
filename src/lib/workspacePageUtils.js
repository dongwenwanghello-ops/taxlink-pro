/**
 * Workspace page helpers — snapshot-first list resolution and auth probing.
 */
import { auth } from "@/config/providers";
import { getAccessibleWorkspacesForUser, getAcceptedBidsForUser } from "@/lib/marketplaceState";
import { getWorkspaceByProjectId } from "@/lib/workspaceStore";

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
