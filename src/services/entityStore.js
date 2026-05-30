/**
 * Local-first Base44-style entity persistence (localStorage).
 * Powers base44.entities.* for admin and in-app reads.
 */
import { getAllBids } from "@/lib/bidStore";
import { getPostedProjects } from "@/lib/projectStore";
import { getAllWorkspaces } from "@/lib/workspaceStore";

const KEYS = {
  users: "taxprouk_early_access_signups",
  myProfile: "my_profile",
  authSession: "taxlink_auth_session",
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function sortRecords(records, sortField, limit) {
  const field = String(sortField || "").replace(/^-/, "");
  const desc = String(sortField || "").startsWith("-");
  const sorted = [...records].sort((a, b) => {
    const av = a[field] ?? a.created_date ?? a.signup_date ?? "";
    const bv = b[field] ?? b.created_date ?? b.signup_date ?? "";
    if (av === bv) return 0;
    return av > bv ? 1 : -1;
  });
  if (desc) sorted.reverse();
  if (limit && limit > 0) return sorted.slice(0, limit);
  return sorted;
}

function matchFilter(record, criteria = {}) {
  return Object.entries(criteria).every(([key, value]) => {
    if (value === undefined || value === null) return true;
    return record[key] === value;
  });
}

function collectUsers() {
  const byEmail = new Map();

  const add = (raw) => {
    const email = normalizeEmail(raw?.email);
    if (!email) return;
    const existing = byEmail.get(email);
    const role = raw.role || raw.user_role || existing?.role || existing?.user_role || "professional";
    const signupDate =
      raw.signup_date
      || raw.created_date
      || existing?.signup_date
      || existing?.created_date
      || null;

    byEmail.set(email, {
      id: raw.id || existing?.id || `user_${email.replace(/[^a-z0-9]/g, "_")}`,
      email,
      role,
      user_role: role,
      full_name: raw.full_name || raw.legal_name || existing?.full_name || "",
      legal_name: raw.legal_name || existing?.legal_name || "",
      display_name: raw.display_name || existing?.display_name || "",
      signup_date: signupDate,
      created_date: signupDate,
      signup_source: raw.signup_source || existing?.signup_source,
      visibility: raw.visibility ?? existing?.visibility,
      profile_public: raw.profile_public ?? existing?.profile_public,
      qualifications: raw.qualifications || existing?.qualifications || [],
      primary_expertise: raw.primary_expertise || existing?.primary_expertise || [],
      secondary_expertise: raw.secondary_expertise || existing?.secondary_expertise || [],
      bio: raw.bio || existing?.bio || "",
      years_experience: raw.years_experience || existing?.years_experience || "",
      qualification_status: raw.qualification_status || existing?.qualification_status || "",
      client_type: raw.client_type || existing?.client_type || "",
      project_interests: raw.project_interests || existing?.project_interests || [],
      onboarding_completed_steps: raw.onboarding_completed_steps ?? existing?.onboarding_completed_steps,
      _source: existing ? "merged" : (raw._source || "signup"),
      ...existing,
      ...raw,
      email,
      role,
      user_role: role,
      signup_date: signupDate,
      created_date: signupDate,
    });
  };

  const signups = readJson(KEYS.users, []);
  if (Array.isArray(signups)) signups.forEach((s) => add({ ...s, _source: "signup" }));

  const single = readJson(KEYS.myProfile, null);
  if (single?.email) add({ ...single, _source: "my_profile" });

  const auth = readJson(KEYS.authSession, null)?.user;
  if (auth?.email) {
    add({
      id: auth.id,
      email: auth.email,
      full_name: auth.full_name,
      role: auth.role,
      signup_date: auth.created_at,
      _source: "auth_session",
    });
  }

  return [...byEmail.values()];
}

function collectProfessionalProfiles() {
  const users = collectUsers();
  return users
    .filter((u) => (u.role || u.user_role) === "professional")
    .map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name || u.legal_name,
      display_name: u.display_name,
      legal_name: u.legal_name,
      visibility: u.visibility,
      profile_public: u.profile_public,
      qualifications: u.qualifications,
      primary_expertise: u.primary_expertise,
      secondary_expertise: u.secondary_expertise,
      bio: u.bio,
      years_experience: u.years_experience,
      qualification_status: u.qualification_status,
      created_date: u.signup_date || u.created_date,
      user_role: "professional",
    }));
}

function createEntityApi(getAll, { idField = "id" } = {}) {
  return {
    async list(sortField, limit) {
      return sortRecords(getAll(), sortField, limit);
    },
    async filter(criteria = {}, sortField, limit) {
      const filtered = getAll().filter((row) => matchFilter(row, criteria));
      return sortRecords(filtered, sortField, limit);
    },
    async get(id) {
      return getAll().find((row) => row[idField] === id) || null;
    },
    async create(payload) {
      const record = {
        id: payload.id || `local-${Date.now()}`,
        created_date: new Date().toISOString(),
        ...payload,
      };
      return record;
    },
    async update(id, payload) {
      return { id, ...payload };
    },
    async delete() {
      return { ok: true };
    },
  };
}

export const entityApis = {
  User: createEntityApi(collectUsers),
  ProfessionalProfile: createEntityApi(collectProfessionalProfiles),
  JobPost: createEntityApi(() => getPostedProjects().map((p) => ({
    ...p,
    created_by: p.created_by || p.client_email,
  }))),
  Bid: createEntityApi(() => getAllBids().map((b) => ({
    ...b,
    bidder_email: b.bidder_email || b.created_by || b.professional_email,
  }))),
  Workspace: createEntityApi(() => getAllWorkspaces()),
  Review: createEntityApi(() => []),
  FeedbackEntry: createEntityApi(() => []),
};
