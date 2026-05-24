/**
 * Advisor profile resolution — demo, API, localStorage, and safe fallbacks.
 */

import { base44 } from "@/api/base44Client";
import { DEMO_PROFESSIONALS, DEMO_REVIEWS } from "@/lib/demoData";
import { buildExpertiseIdentityHeadline } from "@/lib/professionalDiscovery";
import { normalizeExpertise } from "@/lib/expertiseMatching";
import {
  buildQualificationSummaryLines,
  QUALIFICATION_STATUS,
  QUALIFICATION_STATUS_OPTIONS,
} from "@/lib/professionalProfileModel";

/** Additional demo advisers (6 base + 4 = 10) */
export const EXTENDED_DEMO_ADVISORS = [
  {
    id: "pro-7",
    slug: "peter-patel",
    full_name: "Peter Patel",
    title: "ACCA Accountant — VAT & Bookkeeping",
    bio: "Experienced ACCA professional specialising in cloud bookkeeping, Making Tax Digital and VAT compliance for SMEs. CTA finalist with a practical, client-first approach.",
    qualifications: ["ACCA"],
    qualification_status: QUALIFICATION_STATUS.STUDYING,
    qualification_body: "CTA",
    primary_expertise: ["Corporation Tax", "VAT", "Self Assessment"],
    secondary_expertise: ["Capital Gains", "Payroll", "R&D Tax Credits"],
    specialisations: ["Corporation Tax", "VAT", "Self Assessment"],
    location: "Birmingham",
    years_experience: 7,
    years_experience_numeric: 7,
    professional_level: "senior",
    current_firm: "Patel & Co Tax Ltd",
    previous_employers: ["EY", "Local practice"],
    completed_jobs: 89,
    availability: "available",
    hourly_rate: 72,
    remote_work: true,
    consultation_fee: "Free initial consultation",
    typical_project_min: 250,
    typical_project_max: 1500,
    trust_score: 4.9,
    response_time_hours: 3,
    avg_rating: 4.9,
    review_count: 24,
    verified_adviser: true,
    qualification_verified: true,
    identity_checked: true,
  },
  {
    id: "pro-8",
    slug: "sarah-lee",
    full_name: "Sarah Lee",
    title: "Tax Investigation Specialist",
    bio: "Former HMRC officer with deep experience in enquiries, disclosures and compliance checks. Supports individuals and SMEs through stressful HMRC contact with calm, clear advice.",
    qualifications: [],
    qualification_status: QUALIFICATION_STATUS.QUALIFIED_BY_EXPERIENCE,
    professional_background: "HMRC",
    previous_employer: "HMRC",
    previous_employers: ["HMRC", "Big4 advisory"],
    primary_expertise: ["Self Assessment", "HMRC Investigations", "Tax Planning"],
    secondary_expertise: ["Property Tax", "Capital Gains", "Corporation Tax"],
    specialisations: ["Self Assessment", "HMRC Investigations", "Tax Planning"],
    location: "London",
    years_experience: 12,
    years_experience_numeric: 12,
    professional_level: "senior",
    current_firm: "Lee Tax Advisory",
    completed_jobs: 56,
    availability: "limited",
    hourly_rate: 130,
    remote_work: true,
    consultation_fee: "£50",
    typical_project_min: 500,
    typical_project_max: 3500,
    trust_score: 4.95,
    response_time_hours: 5,
    avg_rating: 5,
    review_count: 18,
    verified_adviser: true,
    qualification_verified: true,
    identity_checked: true,
  },
  {
    id: "pro-9",
    slug: "anna-kowalski",
    full_name: "Anna Kowalski",
    title: "Part-qualified ACCA — Payroll & Employment Tax",
    bio: "Part-qualified ACCA with strong payroll and employment tax experience for growing UK businesses. Comfortable with RTI, auto-enrolment and PAYE reviews.",
    qualifications: ["ACCA"],
    qualification_status: QUALIFICATION_STATUS.PART_QUALIFIED,
    qualification_body: "ACCA",
    qualification_progress_papers: "9/13",
    primary_expertise: ["Payroll", "Employment Tax", "Bookkeeping"],
    secondary_expertise: ["VAT", "Making Tax Digital", "Corporation Tax"],
    specialisations: ["Payroll", "Employment Tax", "Bookkeeping"],
    location: "Leeds",
    years_experience: 5,
    years_experience_numeric: 5,
    professional_level: "mid",
    current_firm: "Northern Payroll Partners",
    previous_employers: ["PwC", "Industry"],
    completed_jobs: 67,
    availability: "available",
    hourly_rate: 55,
    remote_work: true,
    consultation_fee: "Free",
    typical_project_min: 150,
    typical_project_max: 900,
    trust_score: 4.7,
    response_time_hours: 4,
    avg_rating: 4.8,
    review_count: 15,
    verified_adviser: true,
    qualification_verified: false,
    identity_checked: true,
  },
  {
    id: "pro-10",
    slug: "marcus-hughes",
    full_name: "Marcus Hughes",
    title: "Director — Corporation Tax & Share Schemes",
    bio: "ACA and CTA qualified director-level adviser working with owner-managed businesses, share schemes and year-end corporation tax. Previously at a Top 10 firm.",
    qualifications: ["ACA", "CTA"],
    qualification_status: QUALIFICATION_STATUS.FULLY_QUALIFIED,
    primary_expertise: ["Corporation Tax", "Share Schemes", "Tax Planning"],
    secondary_expertise: ["Self Assessment", "R&D Tax Credits", "Audit"],
    specialisations: ["Corporation Tax", "Share Schemes", "Tax Planning"],
    location: "Manchester",
    years_experience: 16,
    years_experience_numeric: 16,
    professional_level: "director",
    current_firm: "Hughes Corporate Tax LLP",
    previous_employers: ["Deloitte", "BDO"],
    completed_jobs: 41,
    availability: "limited",
    hourly_rate: 165,
    remote_work: true,
    consultation_fee: "Custom",
    typical_project_min: 800,
    typical_project_max: 8000,
    trust_score: 4.92,
    response_time_hours: 8,
    avg_rating: 4.9,
    review_count: 12,
    verified_adviser: true,
    qualification_verified: true,
    identity_checked: true,
  },
];

const ALL_DEMO = [...DEMO_PROFESSIONALS, ...EXTENDED_DEMO_ADVISORS];

function seeded(id = "", salt = 0) {
  return String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0) + salt;
}

export function advisorUrl(profileOrId) {
  const id = typeof profileOrId === "string" ? profileOrId : profileOrId?.slug || profileOrId?.id;
  return `/advisor/${encodeURIComponent(id || "unknown")}`;
}

export function qualificationStatusLabel(status) {
  const opt = QUALIFICATION_STATUS_OPTIONS.find((o) => o.value === status);
  return opt?.label || (status ? String(status).replace(/_/g, " ") : "Qualified");
}

function defaultPreviousEmployers(profile) {
  if (profile.previous_employers?.length) return profile.previous_employers;
  if (profile.previous_employer) return [profile.previous_employer];
  if (profile.professional_background === "HMRC") return ["HMRC"];
  const pool = ["EY", "PwC", "Deloitte", "KPMG", "BDO", "Local practice"];
  const n = 1 + (seeded(profile.id, 2) % 2);
  return pool.slice(seeded(profile.id, 9) % 4, seeded(profile.id, 9) % 4 + n);
}

function enrichAdvisorProfile(raw, { isUpdating = false, isDemo = false } = {}) {
  const expertise = normalizeExpertise(raw);
  const years =
    raw.years_experience_numeric ||
    (typeof raw.years_experience === "number" ? raw.years_experience : null) ||
    parseInt(String(raw.years_experience || "").match(/\d+/)?.[0] || "", 10) ||
    null;

  const hr = Number(raw.hourly_rate) || 0;
  const typicalMin = raw.typical_project_min ?? (hr ? Math.round(hr * 3) : 250);
  const typicalMax = raw.typical_project_max ?? (hr ? Math.round(hr * 18) : 1500);

  return {
    ...raw,
    id: raw.id || raw.slug || "unknown",
    slug: raw.slug || raw.id,
    headline: raw.headline || buildExpertiseIdentityHeadline(raw),
    primary_expertise: expertise.primary.length ? expertise.primary : (raw.specialisations || []).slice(0, 3),
    secondary_expertise: expertise.secondary,
    specialisations: expertise.primary.length ? expertise.primary : raw.specialisations || [],
    years_experience_display: years ? `${years} years experience` : raw.years_experience || null,
    qualification_lines: buildQualificationSummaryLines(raw),
    qualification_status_label: qualificationStatusLabel(raw.qualification_status || QUALIFICATION_STATUS.FULLY_QUALIFIED),
    current_firm: raw.current_firm || raw.firm_name || raw.company_name || null,
    previous_employers: defaultPreviousEmployers(raw),
    trust_score: raw.trust_score ?? 4.5 + (seeded(raw.id, 4) % 5) / 10,
    response_time_hours: raw.response_time_hours ?? (raw.availability === "available" ? 2 + (seeded(raw.id, 1) % 4) : 6),
    completed_jobs: raw.completed_jobs ?? 10 + (seeded(raw.id, 11) % 80),
    avg_rating: raw.avg_rating ?? 4.8,
    review_count: raw.review_count ?? 5 + (seeded(raw.id, 13) % 30),
    typical_project_min: typicalMin,
    typical_project_max: typicalMax,
    consultation_fee: raw.consultation_fee || (hr < 70 ? "Free" : hr < 120 ? "£50" : "Custom"),
    verified_adviser: raw.verified_adviser !== false,
    qualification_verified: raw.qualification_verified !== false && (raw.qualifications?.length > 0 || raw.qualification_status === QUALIFICATION_STATUS.FULLY_QUALIFIED),
    identity_checked: raw.identity_checked !== false,
    isUpdating,
    isDemo,
  };
}

/** Split legacy specialisations into primary (3) + secondary when missing */
function withExpertiseDefaults(p) {
  const hasPrimary = p.primary_expertise?.length || p.secondary_expertise?.length;
  if (hasPrimary) return p;
  const specs = p.specialisations || [];
  return {
    ...p,
    primary_expertise: specs.slice(0, 3),
    secondary_expertise: specs.slice(3),
    qualification_status: p.qualification_status || QUALIFICATION_STATUS.FULLY_QUALIFIED,
  };
}

export function getReviewsForAdvisor(advisorId) {
  const fromDemo = DEMO_REVIEWS.filter((r) => r.professional_id === advisorId);
  if (fromDemo.length >= 2) return fromDemo;

  const profile = ALL_DEMO.find((p) => p.id === advisorId || p.slug === advisorId);
  if (!profile) return fromDemo;

  const extras = [
    {
      id: `gen-${advisorId}-1`,
      professional_id: advisorId,
      reviewer_name: "James W.",
      reviewer_company: "SME Client",
      rating: 5,
      comment: `Clear advice and fast turnaround. Would work with ${profile.full_name?.split(" ")[0] || "this adviser"} again.`,
      service_type: profile.primary_expertise?.[0] || profile.specialisations?.[0] || "Tax",
      verified: true,
      created_date: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: `gen-${advisorId}-2`,
      professional_id: advisorId,
      reviewer_name: "Helen M.",
      reviewer_company: "Limited company",
      rating: 5,
      comment: "Professional, responsive and easy to understand — exactly what we needed.",
      service_type: profile.secondary_expertise?.[0] || "Advisory",
      verified: true,
      created_date: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
  ];
  return [...fromDemo, ...extras];
}

function findDemoAdvisor(id) {
  const key = decodeURIComponent(id || "").toLowerCase();
  return ALL_DEMO.find(
    (p) => p.id?.toLowerCase() === key || p.slug?.toLowerCase() === key,
  );
}

function findLocalAdvisor(id) {
  try {
    const raw = localStorage.getItem("my_profile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    const key = decodeURIComponent(id || "").toLowerCase();
    if (
      p.id?.toLowerCase() === key ||
      p.slug?.toLowerCase() === key ||
      p.email?.toLowerCase() === key ||
      String(p.display_name || "").toLowerCase().replace(/\s+/g, "-") === key
    ) {
      return withExpertiseDefaults({
        ...p,
        id: p.id || "my-profile",
        slug: p.slug || p.id || "my-profile",
        full_name: p.display_name || p.full_name || "Your profile",
      });
    }
  } catch {
    return null;
  }
  return null;
}

/** Fast sync lookup (demo + localStorage only) — for Post Job banners. */
export function peekAdvisorProfile(id) {
  const demo = findDemoAdvisor(id);
  if (demo) {
    return enrichAdvisorProfile(withExpertiseDefaults(demo), { isDemo: true });
  }
  const local = findLocalAdvisor(id);
  if (local) return enrichAdvisorProfile(local);
  return null;
}

export function createStubAdvisor(id) {
  const label = decodeURIComponent(id || "adviser").replace(/-/g, " ");
  return enrichAdvisorProfile(
    {
      id: id || "unknown",
      slug: id || "unknown",
      full_name: label.replace(/\b\w/g, (c) => c.toUpperCase()),
      title: "UK Tax & Accounting Professional",
      bio: null,
      location: "United Kingdom",
      availability: "limited",
      specialisations: [],
      primary_expertise: [],
      secondary_expertise: [],
      qualifications: [],
    },
    { isUpdating: true, isDemo: false },
  );
}

/**
 * Resolve adviser for detail page. Returns { profile, reviews, source }.
 */
export async function resolveAdvisorProfile(id) {
  const demo = findDemoAdvisor(id);
  if (demo) {
    const profile = enrichAdvisorProfile(withExpertiseDefaults(demo), { isDemo: true });
    return { profile, reviews: getReviewsForAdvisor(profile.id), source: "demo" };
  }

  const local = findLocalAdvisor(id);
  if (local) {
    const profile = enrichAdvisorProfile(local);
    return { profile, reviews: getReviewsForAdvisor(profile.id), source: "local" };
  }

  try {
    const results = await base44.entities.ProfessionalProfile.filter({ id });
    let row = results?.[0];
    if (!row) {
      const bySlug = await base44.entities.ProfessionalProfile.list("-created_date", 100);
      const key = decodeURIComponent(id || "").toLowerCase();
      row = (bySlug || []).find(
        (p) => p.id?.toLowerCase() === key || p.slug?.toLowerCase() === key,
      );
    }
    if (row) {
      const profile = enrichAdvisorProfile(withExpertiseDefaults({ ...row, slug: row.slug || row.id }));
      let reviews = [];
      try {
        reviews = (await base44.entities.Review.filter({ professional_id: row.id })) || [];
      } catch {
        reviews = getReviewsForAdvisor(row.id);
      }
      if (!reviews.length) reviews = getReviewsForAdvisor(row.id);
      return { profile, reviews, source: "api" };
    }
  } catch {
    /* fall through */
  }

  if (id) {
    const stub = createStubAdvisor(id);
    return { profile: stub, reviews: [], source: "stub" };
  }

  return { profile: createStubAdvisor("unknown"), reviews: [], source: "stub" };
}

export function listBrowsableAdvisors() {
  return ALL_DEMO.map((p) => enrichAdvisorProfile(withExpertiseDefaults(p), { isDemo: true }));
}
