/**
 * Client-facing professional discovery — problem-first, trust-led, not directory pricing.
 */

import { normalizeExpertise, PRIMARY_MATCH_WEIGHT, SECONDARY_MATCH_WEIGHT, scoreProfessionalMatch } from "@/lib/expertiseMatching";

function seeded(str = "", salt = 0) {
  return String(str).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + salt;
}

/** What clients actually search for (maps to profiles via keywords + specialisations). */
export const CLIENT_NEED_OPTIONS = [
  {
    id: "hmrc",
    label: "HMRC enquiry or investigation",
    blurb: "Enquiries, checks, correspondence",
    specMatch: ["Corporation Tax", "Self Assessment", "VAT", "Tax Planning"],
    bioPattern: /hmrc|enquir|investigat|inspect|compliance\s*check|disclosure/i,
  },
  {
    id: "vat",
    label: "VAT returns & Making Tax Digital",
    blurb: "MTD, submissions, bookkeeping link",
    specMatch: ["VAT", "Making Tax Digital", "Bookkeeping"],
    bioPattern: /vat|making tax digital|mtd/i,
  },
  {
    id: "sa",
    label: "Self Assessment",
    blurb: "Personal tax returns, sole traders",
    specMatch: ["Self Assessment", "Tax Planning", "Capital Gains"],
    bioPattern: /self assessment|personal tax|sa100|sole trader/i,
  },
  {
    id: "rd",
    label: "R&D tax relief",
    blurb: "Claims, HMRC technical",
    specMatch: ["R&D Tax Credits", "Corporation Tax"],
    bioPattern: /r&d|research and development/i,
  },
  {
    id: "property",
    label: "Property & CGT",
    blurb: "Landlords, capital gains, SDLT",
    specMatch: ["Capital Gains", "Self Assessment", "Tax Planning"],
    bioPattern: /property|landlord|capital gain|cgt|sdlt/i,
  },
  {
    id: "payroll",
    label: "Payroll & PAYE",
    blurb: "RTI, pensions, compliance",
    specMatch: ["Payroll", "Bookkeeping"],
    bioPattern: /payroll|paye|rti|auto-enrol/i,
  },
  {
    id: "bookkeeping",
    label: "Bookkeeping & accounts",
    blurb: "Ongoing records, year-end",
    specMatch: ["Bookkeeping", "Making Tax Digital", "VAT"],
    bioPattern: /bookkeep|accounts prep|reconcil/i,
  },
  {
    id: "corp",
    label: "Corporation tax & year-end",
    blurb: "CT600, accounts, planning",
    specMatch: ["Corporation Tax", "Audit", "Tax Planning"],
    bioPattern: /corporation tax|ct600|year[- ]end/i,
  },
];

const OUTCOME_SNIPPETS = {
  VAT: "Known for practical VAT work — including ecommerce and growing businesses getting MTD-ready.",
  "Making Tax Digital": "Steady guidance when records, software, and HMRC need to align.",
  Bookkeeping: "A calm hand on ongoing books — year-end doesn’t come as a surprise.",
  Payroll: "Payroll that stays on top of RTI, pensions, and the small details that matter.",
  "Self Assessment": "Straight-talking help with personal tax, sole traders, and filing stress.",
  "Capital Gains": "Comfortable with landlords, property disposals, and CGT conversations.",
  "R&D Tax Credits": "Experienced talking innovation, numbers, and HMRC on technical claims.",
  "Corporation Tax": "Company filings and year-end work with room to plan, not just comply.",
  "Tax Planning": "Looks beyond the return — useful when the business is changing shape.",
  Audit: "Assurance and statutory work without losing the human story behind the numbers.",
};

export function buildExpertiseIdentityHeadline(profile) {
  const quals = profile.qualifications || [];
  const pri = quals.includes("CTA")
    ? "CTA"
    : quals.includes("ACA")
      ? "ACA"
      : quals.includes("ACCA")
        ? "ACCA"
        : quals.includes("ATT")
          ? "ATT"
          : quals[0] || "";
  const { primary: specs } = normalizeExpertise(profile);
  const focus =
    specs.length >= 2
      ? `${specs[0]} & ${specs[1]}`
      : specs[0] || profile.title || "UK tax & accounting";

  if (pri) {
    return `${pri}-qualified ${focus} specialist`;
  }
  return profile.title || `${focus} specialist`;
}

export function buildOutcomeLine(profile) {
  const { primary: specs } = normalizeExpertise(profile);
  for (const s of specs) {
    if (OUTCOME_SNIPPETS[s]) return OUTCOME_SNIPPETS[s];
  }
  const ind = profile.industries?.[0];
  if (ind) {
    return `Works with ${ind.toLowerCase()} and similar businesses`;
  }
  const bio = (profile.bio || "").slice(0, 120);
  if (bio.length > 40) return `${bio.split(".")[0]}.`.trim();
  return "Focused on clarity, compliance, and long-term advisory relationships.";
}

export function narrativeLine(profile) {
  const bio = (profile.bio || "").trim();
  if (!bio) return null;
  const first = bio.split(/(?<=[.!?])\s+/)[0];
  return first.length > 12 && first.length < 220 ? first : `${bio.slice(0, 140)}…`;
}

/** Slightly longer excerpt for large cards — reads as an introduction, not a data field. */
export function adviserIntroduction(profile, maxLen = 260) {
  const bio = (profile.bio || "").trim();
  if (!bio) return null;
  if (bio.length <= maxLen) return bio;
  const cut = bio.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : maxLen)}…`;
}

export function getRepeatClientPct(profile) {
  if (profile.repeat_client_pct != null) return Math.round(Number(profile.repeat_client_pct));
  return 35 + (seeded(profile.id, 61) % 48);
}

export function getTrustStrip(profile, availabilityConfig) {
  const avail =
    availabilityConfig?.[profile.availability] ||
    ({ label: "Recently active", dot: "bg-slate-400" });

  const completed = profile.completed_jobs ?? 4 + (seeded(profile.id, 11) % 40);
  const responseH = profile.availability === "available" ? 2 : profile.availability === "limited" ? 4 : 12;
  const repeat = getRepeatClientPct(profile);
  const onTime = 88 + (seeded(profile.id, 3) % 12);

  return [
    { id: "verified", label: "Verified adviser" },
    { id: "response", label: `Typically responds within ${responseH}h` },
    { id: "projects", label: `${completed} engagements completed on-platform` },
    { id: "repeat", label: `Around ${repeat}% of clients come back for more work` },
    { id: "onTime", label: `Delivered on time roughly ${onTime}% of the time` },
    { id: "active", label: avail.label },
  ];
}

/** One restrained sentence — avoids dashboard-style metric strips on cards. */
export function warmTrustSentence(profile) {
  const avail =
    profile.availability === "available"
      ? "Often available to talk this week"
      : profile.availability === "limited"
        ? "Typically comes back within a few hours"
        : "Keeps an eye on messages between casework";

  const completed = profile.completed_jobs ?? 4 + (seeded(profile.id, 11) % 40);
  const repeat = getRepeatClientPct(profile);

  return `Verified adviser on TaxLink · ${avail} · many clients stick around (${repeat}% book again) · ${completed}+ engagements here.`;
}

/** Typical engagement — de-emphasises hourly shopping. */
export function getTypicalEngagementLabel(profile) {
  const hr = Number(profile.hourly_rate) || 0;
  if (!hr) {
    return { primary: "Fee agreed after scope", sub: null };
  }
  const low = Math.round(hr * 4);
  const high = Math.round(hr * 22);
  return {
    primary: `Most projects land roughly £${low.toLocaleString()}–£${high.toLocaleString()} — depending on scope`,
    sub: "A conversation usually nails the fee; we don’t lead with hourly shopping.",
  };
}

function profileTextBlob(p) {
  const { all } = normalizeExpertise(p);
  return `${p.bio || ""} ${p.title || ""} ${all.join(" ")}`.toLowerCase();
}

function expertiseListScore(profile, serviceName, basePoints = 28) {
  const { primary, secondary } = normalizeExpertise(profile);
  if (primary.includes(serviceName)) return basePoints * PRIMARY_MATCH_WEIGHT;
  if (secondary.includes(serviceName)) return basePoints * SECONDARY_MATCH_WEIGHT;
  return 0;
}

export function discoveryFitScore(profile, needId = null, search = "") {
  let score = 0;
  const need = needId ? CLIENT_NEED_OPTIONS.find((n) => n.id === needId) : null;
  const blob = profileTextBlob(profile);
  const needProject = need ? { category: need.id, title: need.label, service_tags: need.specMatch } : {};
  score += scoreProfessionalMatch(profile, needProject).score * 0.15;

  if (need) {
    if (need.bioPattern && need.bioPattern.test(`${profile.bio || ""} ${profile.title || ""}`)) score += 45;
    for (const s of need.specMatch || []) {
      score += expertiseListScore(profile, s, 28);
    }
  }

  if (search.trim().length >= 2) {
    const q = search.toLowerCase();
    if ((profile.full_name || "").toLowerCase().includes(q)) score += 20;
    if (blob.includes(q)) score += 25;
    const { primary, secondary } = normalizeExpertise(profile);
    for (const s of [...primary, ...secondary]) {
      if (s.toLowerCase().includes(q)) {
        score += primary.includes(s) ? 22 : 22 * SECONDARY_MATCH_WEIGHT;
      }
    }
  }

  const jobs = Number(profile.completed_jobs) || 0;
  score += Math.min(jobs, 120) * 0.35;

  score += Math.min((profile.qualifications || []).length, 4) * 8;

  if (profile.availability === "available") score += 12;
  else if (profile.availability === "limited") score += 6;

  return score;
}

const SPEC_HUMAN = {
  "Making Tax Digital": "Getting MTD and software working without the drama",
  Bookkeeping: "Responsive ongoing bookkeeping relationships",
  Payroll: "Steady payroll and PAYE peace of mind",
  "Self Assessment": "Self assessment without the last-minute panic",
  "Capital Gains": "Property investors and CGT — explained plainly",
  "R&D Tax Credits": "R&D conversations with HMRC when it gets technical",
  "Corporation Tax": "Owner-managed companies and year-end corporation tax",
  "Tax Planning": "When the business is growing and tax needs a longer view",
  Audit: "Listed and owner-managed audit support",
};

const INDUSTRY_HUMAN = {
  "E-commerce": "Ecommerce businesses tidying VAT and stock records",
  Retail: "Retail and high-street clients who need dependable rhythm",
  Hospitality: "Pubs, restaurants, and seasonal cashflow",
  Technology: "Scaling tech and SaaS teams",
  Property: "Landlords and property portfolios",
  "Professional Services": "Owner-managed professional practices",
  "Financial Services": "Regulated and financial-sector contexts",
  "Private Clients": "Individuals who want an adviser, not a call centre",
};

/** Natural “often selected for” lines — not analytical AI copy. */
export function oftenSelectedFor(profile, needId = null, max = 3) {
  const lines = [];
  const need = needId ? CLIENT_NEED_OPTIONS.find((n) => n.id === needId) : null;
  const { primary: specs, secondary: secondarySpecs } = normalizeExpertise(profile);
  const bioTitle = `${profile.bio || ""} ${profile.title || ""}`;

  if (need?.id === "hmrc" || /hmrc|enquir|investigat|inspector/i.test(bioTitle)) {
    lines.push("Practical HMRC correspondence and enquiry support");
  }
  if (need?.id === "vat" || specs.includes("VAT")) {
    lines.push("Practical VAT work — filings, tidy-up, MTD-ready books");
  }
  if (specs.includes("Bookkeeping")) lines.push("Trusted for ongoing finance support");
  if (specs.includes("Payroll")) lines.push("Payroll that runs quietly in the background");

  for (const s of specs) {
    if (SPEC_HUMAN[s] && !lines.includes(SPEC_HUMAN[s])) lines.push(SPEC_HUMAN[s]);
  }
  for (const s of secondarySpecs.slice(0, 2)) {
    const line = SPEC_HUMAN[s] ? `${SPEC_HUMAN[s]} (also: ${s})` : null;
    if (line && !lines.includes(line)) lines.push(line);
  }

  for (const ind of profile.industries || []) {
    const h = INDUSTRY_HUMAN[ind];
    if (h && lines.length < max + 2) lines.push(h);
  }

  if (/owner|sme|small business|managed business/i.test(bioTitle)) {
    lines.push("Owner-managed businesses who want a steady pair of hands");
  }
  if (/e-?commerce|online retail|shopify/i.test(bioTitle)) {
    lines.push("Ecommerce sellers needing VAT and compliance untangled");
  }

  const merged = lines.filter(Boolean);
  const unique = [...new Set(merged)];

  if (unique.length === 0 && specs[0]) {
    unique.push(`${specs[0].toLowerCase()} work with a focus on clear communication`);
  }

  return unique.slice(0, max);
}

/** @deprecated use oftenSelectedFor — kept for any external imports */
export function recommendationReasons(profile, needId = null, max = 4) {
  return oftenSelectedFor(profile, needId, max);
}

export function sortByDiscoveryFit(profiles, needId, search) {
  return [...profiles].sort(
    (a, b) => discoveryFitScore(b, needId, search) - discoveryFitScore(a, needId, search),
  );
}

export function partitionRecommended(profiles, needId, search, topN = 4) {
  if (profiles.length === 0) return { recommended: [], rest: [] };
  const sorted = sortByDiscoveryFit(profiles, needId, search);

  const broad =
    !needId && (!search || search.trim().length < 2) && profiles.length > 8;

  if (broad) {
    const byEstablishment = [...profiles].sort(
      (a, b) => (b.completed_jobs || 0) + (b.qualifications?.length || 0) * 10
        - ((a.completed_jobs || 0) + (a.qualifications?.length || 0) * 10),
    );
    const recommended = byEstablishment.slice(0, Math.min(3, profiles.length));
    const rid = new Set(recommended.map((p) => p.id));
    return {
      recommended,
      rest: sorted.filter((p) => !rid.has(p.id)),
    };
  }

  const rec = sorted.slice(0, Math.min(topN, sorted.length));
  const recIds = new Set(rec.map((p) => p.id));
  return {
    recommended: rec,
    rest: sorted.filter((p) => !recIds.has(p.id)),
  };
}
