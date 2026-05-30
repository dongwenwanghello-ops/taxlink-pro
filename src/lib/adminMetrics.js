/**
 * Founder admin — user rows and activity counts from Base44 entities.
 */

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

export function parseSignupDate(user) {
  const raw = user.signup_date || user.created_date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRoleLabel(role) {
  const r = String(role || "").toLowerCase();
  if (r === "client") return "Client";
  if (r === "professional") return "Professional";
  return role ? String(role) : "—";
}

function countByEmail(email, items, getEmail) {
  const norm = normalizeEmail(email);
  return items.filter((item) => normalizeEmail(getEmail(item)) === norm).length;
}

export function buildAdminUserRows({ users, projects, bids, workspaces }) {
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role || user.user_role,
    roleLabel: formatRoleLabel(user.role || user.user_role),
    signupDate: parseSignupDate(user),
    projectsPosted: countByEmail(
      user.email,
      projects,
      (p) => p.created_by || p.client_email,
    ),
    bidsSubmitted: countByEmail(
      user.email,
      bids,
      (b) => b.bidder_email || b.created_by || b.professional_email,
    ),
    workspaceCount: workspaces.filter((ws) => {
      const norm = normalizeEmail(user.email);
      if (normalizeEmail(ws.client_email) === norm) return true;
      if (normalizeEmail(ws.professional_email) === norm) return true;
      if (normalizeEmail(ws.selected_professional_email) === norm) return true;
      return (ws.members || []).some((m) => normalizeEmail(m.email) === norm);
    }).length,
  }));
}
