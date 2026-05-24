/**
 * TaxLink platform auth — local session only (no external redirects).
 */
import { setMarketplaceClientEmail } from "@/lib/marketplaceState";

const SESSION_KEY = "taxlink_auth_session";
const CLOUD_SESSION_KEY = "taxlink_cloud_session";

/** Legacy vendor keys cleared on bootstrap */
const LEGACY_VENDOR_KEYS = [
  "base44_access_token",
  "base44_app_id",
  "base44_app_base_url",
  "base44_from_url",
  "base44_functions_version",
  "base44_server_url",
  "token",
];

export function clearLegacyVendorStorage() {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_VENDOR_KEYS) {
    localStorage.removeItem(key);
  }
}

function readProfile() {
  try {
    const raw = localStorage.getItem("my_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(user) {
  const session = {
    user,
    provider: "taxlink-local",
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(CLOUD_SESSION_KEY, "active");
  if (user?.email) {
    setMarketplaceClientEmail(user.email);
  }
  window.dispatchEvent(new CustomEvent("taxlink-auth-changed", { detail: user }));
  return user;
}

export function getAuthDebugInfo() {
  const session = readSession();
  return {
    appId: "taxlink-local",
    authUrl: "(in-app — TaxLink platform auth)",
    session: {
      authenticated: Boolean(session?.user),
      email: session?.user?.email || null,
      provider: session?.provider || "taxlink-local",
      cloud: localStorage.getItem(CLOUD_SESSION_KEY) || "none",
    },
  };
}

export function logAuthDebug(extra = {}) {
  const info = getAuthDebugInfo();
  console.log("Auth app:", info.appId);
  console.log("Current auth endpoint:", info.authUrl);
  console.log("Session status:", { ...info.session, ...extra });
  return info;
}

export function isAuthenticated() {
  return Boolean(readSession()?.user?.email);
}

/**
 * Establish a local TaxLink session (stays on this origin).
 */
export async function login(options = {}) {
  clearLegacyVendorStorage();
  const profile = readProfile();
  const email =
    options.email ||
    profile?.email ||
    localStorage.getItem("taxprouk_professional_email") ||
    `user-${Date.now()}@taxlink.local`;

  const user = {
    id: options.id || profile?.id || `taxlink-user-${Date.now()}`,
    email: String(email).toLowerCase().trim(),
    full_name:
      options.full_name ||
      options.name ||
      profile?.full_name ||
      profile?.display_name ||
      "TaxLink User",
    role: options.role || profile?.user_role || localStorage.getItem("user_role") || "professional",
  };

  logAuthDebug({ action: "login", email: user.email });
  return writeSession(user);
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.setItem(CLOUD_SESSION_KEY, "expired");
  clearLegacyVendorStorage();
  window.dispatchEvent(new CustomEvent("taxlink-auth-changed", { detail: null }));
  logAuthDebug({ action: "logout" });
}

export async function getCurrentUser() {
  return readSession()?.user || null;
}

/**
 * Restore session from TaxLink storage or onboarding profile.
 */
export async function restoreSession() {
  clearLegacyVendorStorage();
  const existing = readSession()?.user;
  if (existing?.email) {
    setMarketplaceClientEmail(existing.email);
    logAuthDebug({ source: "session" });
    return { user: existing, authenticated: true };
  }

  const profile = readProfile();
  if (profile?.email) {
    const user = await login({
      email: profile.email,
      full_name: profile.full_name || profile.display_name,
      role: profile.user_role,
      id: profile.id,
    });
    return { user, authenticated: true };
  }

  const cloud = localStorage.getItem(CLOUD_SESSION_KEY);
  logAuthDebug({ source: "none", cloud });
  return { user: null, authenticated: false, cloudExpired: cloud === "expired" };
}

/** @deprecated Use restoreSession — alias for components migrating off vendor SDK */
export async function me() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Not authenticated");
    err.status = 401;
    throw err;
  }
  return user;
}
