/**
 * TaxLink V1 — role-based navigation (foundation).
 * UI labels and paths only; enforcement lives in future route guards.
 */

export const NAV_ROLES = {
  guest: "guest",
  professional: "professional",
  client: "client",
  admin: "admin",
};

export function resolveNavRole({ user, isAuthenticated } = {}) {
  const storedRole =
    typeof window !== "undefined" ? localStorage.getItem("user_role") : null;

  const role = String(user?.role || storedRole || NAV_ROLES.guest).toLowerCase().trim();

  if (role === NAV_ROLES.admin) return NAV_ROLES.admin;
  if (role === NAV_ROLES.client) return NAV_ROLES.client;
  if (role === NAV_ROLES.professional) return NAV_ROLES.professional;

  if (isAuthenticated && user?.email) {
    return NAV_ROLES.professional;
  }

  return NAV_ROLES.guest;
}

const guestNav = [
  { label: "Find Experts", to: "/professionals" },
  { label: "Browse Projects", to: "/jobs" },
  { label: "Resources", to: "/resources" },
];

const professionalNav = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Browse Projects", to: "/jobs" },
  { label: "My Bids", to: "/my-bids", badgeKey: "bids" },
  { label: "Workspaces", to: "/workspaces" },
  { label: "Compliance", to: "/compliance" },
  { label: "Lounge", to: "/lounge" },
  { label: "Profile", to: "/my-profile" },
];

const clientNav = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Post Project", to: "/post-job" },
  { label: "My Projects", to: "/my-projects" },
  { label: "Workspaces", to: "/workspaces" },
  { label: "Compliance", to: "/compliance" },
  { label: "Profile", to: "/my-profile" },
];

const adminNav = [
  { label: "Users", to: "/admin/users" },
  { label: "Projects", to: "/admin/projects" },
  { label: "Audit Logs", to: "/admin/audit-logs" },
  { label: "Settings", to: "/admin/settings" },
];

export function getNavLinksForRole(role) {
  switch (role) {
    case NAV_ROLES.admin:
      return adminNav;
    case NAV_ROLES.client:
      return clientNav;
    case NAV_ROLES.professional:
      return professionalNav;
    default:
      return guestNav;
  }
}

export function getPrimaryCtaForRole(role) {
  switch (role) {
    case NAV_ROLES.client:
      return { label: "Post a Project", to: "/post-job", variant: "default" };
    case NAV_ROLES.professional:
      return { label: "Browse Projects", to: "/jobs", variant: "default" };
    case NAV_ROLES.admin:
      return { label: "Overview", to: "/admin", variant: "outline" };
    default:
      return { label: "Join", to: "/create-profile", variant: "default" };
  }
}

export function getSecondaryCtaForRole(role) {
  if (role === NAV_ROLES.guest) {
    return { label: "Join Early Access", to: "/create-profile", variant: "outline" };
  }
  if (role === NAV_ROLES.admin) {
    return null;
  }
  return null;
}

/** Active path: exact match or nested segment (e.g. /compliance/cdd). */
export function isNavActive(pathname, to) {
  if (pathname === to) return true;
  if (to !== "/" && pathname.startsWith(`${to}/`)) return true;
  return false;
}
