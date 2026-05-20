/**
 * Protected professional identity — semi-anonymous pre-award, full reveal after award.
 */

const VERIFIED_QUAL_TITLES = {
  CTA: "CTA Verified Adviser",
  ATT: "ATT Verified Adviser",
  ACCA: "ACCA Verified Professional",
  ACA: "ACA Chartered Accountant",
  ICAEW: "ICAEW Verified Professional",
  AAT: "AAT Verified Professional",
  FCCA: "FCCA Verified Professional",
  FCA: "FCA Verified Professional",
};

const SENIORITY_FROM_EXPERIENCE = {
  "10+ years": "Senior Tax Adviser",
  "5-10 years": "Experienced Tax Adviser",
  "3-5 years": "Tax Adviser",
  "1-3 years": "Tax Professional",
};

export const IDENTITY_REVEAL_CLIENT_MESSAGE =
  "Professional contact details become available after project award.";

export const IDENTITY_REVEAL_WORKSPACE_MESSAGE =
  "Full identity and collaboration details are revealed once the project begins.";

export function toPartialDisplayName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function buildPublicLabel(qualifications = [], yearsExperience = "") {
  const quals = Array.isArray(qualifications) ? qualifications : [];
  for (const qual of quals) {
    if (VERIFIED_QUAL_TITLES[qual]) return VERIFIED_QUAL_TITLES[qual];
  }
  if (yearsExperience && SENIORITY_FROM_EXPERIENCE[yearsExperience]) {
    return SENIORITY_FROM_EXPERIENCE[yearsExperience];
  }
  if (quals.length > 0) return `${quals[0]} Verified Professional`;
  return "Verified UK Tax Professional";
}

export function buildBidIdentityFromSources({
  fullName = "",
  displayName = "",
  qualifications = [],
  yearsExperience = "",
  firmName = "",
  email = "",
  phone = "",
  linkedin = "",
  headline = "",
}) {
  const legalName = String(fullName || "").trim();
  const partial = String(displayName || "").trim() || toPartialDisplayName(legalName);
  const publicLabel = buildPublicLabel(qualifications, yearsExperience);
  const protectedDisplay = partial || publicLabel;

  return {
    bidder_full_name: legalName,
    bidder_display_name: protectedDisplay,
    bidder_public_label: publicLabel,
    bidder_name: protectedDisplay,
    bidder_firm_name: firmName || "",
    bidder_email: email || "",
    bidder_phone: phone || "",
    bidder_linkedin: linkedin || "",
    bidder_headline: headline || "",
    identity_protected: true,
  };
}

export function enrichBidIdentity(bid = {}) {
  if (!bid || typeof bid !== "object") return bid;

  const qualifications =
    bid.qualifications
    || bid.bidder_quals
    || bid.professional_credentials?.qualifications
    || (bid.bidder_qual ? [bid.bidder_qual] : []);

  const yearsExperience =
    bid.years_experience
    || bid.experience_label
    || bid.professional_credentials?.years_experience
    || "";

  const fullName = bid.bidder_full_name || bid.bidder_legal_name || "";
  const rawName = String(bid.bidder_name || "").trim();
  const looksLikeEmail = rawName.includes("@");
  const looksLikeFullLegal =
    rawName.split(/\s+/).filter(Boolean).length >= 2
    && !VERIFIED_QUAL_TITLES[rawName]
    && !rawName.toLowerCase().includes("verified");

  const resolvedFullName = fullName || (looksLikeFullLegal && !looksLikeEmail ? rawName : "");

  const identity = buildBidIdentityFromSources({
    fullName: resolvedFullName,
    displayName: bid.bidder_display_name,
    qualifications,
    yearsExperience,
    firmName: bid.bidder_firm_name || bid.firm_name,
    email: bid.bidder_email,
    phone: bid.bidder_phone,
    linkedin: bid.bidder_linkedin,
    headline: bid.bidder_headline || bid.professional_credentials?.headline,
  });

  return {
    ...bid,
    ...identity,
    qualifications: bid.qualifications?.length ? bid.qualifications : qualifications,
    years_experience: bid.years_experience || yearsExperience,
    experience_label: bid.experience_label || yearsExperience,
  };
}

export function isBidIdentityRevealed(bid, project = null) {
  if (!bid) return false;
  if (bid.identity_revealed || bid.status === "accepted" || bid.awarded) return true;
  if (project?.awarded_bid_id && bid.id === project.awarded_bid_id) return true;
  if (project?.lifecycle_state === "awarded" && project?.awarded_bid_id === bid.id) return true;
  return false;
}

export function getProtectedDisplayName(bid, { revealed = false } = {}) {
  const enriched = enrichBidIdentity(bid);
  if (revealed) {
    return enriched.bidder_full_name || enriched.bidder_display_name || enriched.bidder_public_label || "Professional";
  }
  return enriched.bidder_display_name || enriched.bidder_public_label || "Verified UK Tax Professional";
}

export function getRevealedFullName(bid) {
  const enriched = enrichBidIdentity(bid);
  return enriched.bidder_full_name || enriched.bidder_display_name || enriched.bidder_name || "Professional";
}

export function getVerificationBadges(bid) {
  const enriched = enrichBidIdentity(bid);
  const quals = enriched.qualifications || [];
  return quals.slice(0, 4).map((q) => ({
    id: q,
    label: VERIFIED_QUAL_TITLES[q] ? q : q,
    verified: Boolean(VERIFIED_QUAL_TITLES[q]),
  }));
}

export function getProfessionalTrustMetrics(bid) {
  const enriched = enrichBidIdentity(bid);
  const metrics = [];

  const rating = Number(enriched.bidder_rating || enriched.rating);
  if (rating > 0) {
    metrics.push({ id: "rating", label: `${rating.toFixed(1)} client rating`, icon: "star" });
  }

  const responseRate = enriched.response_rate ?? enriched.responseRate;
  if (responseRate != null && responseRate !== "") {
    const pct = Number(responseRate) > 1 ? Math.round(Number(responseRate)) : Math.round(Number(responseRate) * 100);
    if (pct > 0) metrics.push({ id: "response", label: `${pct}% response rate`, icon: "zap" });
  }

  const onTime = enriched.on_time_completion_rate ?? enriched.onTimeCompletionRate;
  if (onTime != null && onTime !== "") {
    const pct = Number(onTime) > 1 ? Math.round(Number(onTime)) : Math.round(Number(onTime) * 100);
    if (pct > 0) metrics.push({ id: "ontime", label: `${pct}% on-time delivery`, icon: "shield" });
  }

  const completed = enriched.completed_jobs ?? enriched.completedJobs;
  if (completed > 0) {
    metrics.push({ id: "jobs", label: `${completed} completed projects`, icon: "briefcase" });
  }

  const years = enriched.years_experience || enriched.experience_label;
  if (years) {
    metrics.push({ id: "experience", label: `${years} experience`, icon: "award" });
  }

  return metrics;
}

export function getContactDetailsForReveal(bid) {
  const enriched = enrichBidIdentity(bid);
  return {
    fullName: getRevealedFullName(enriched),
    email: enriched.bidder_email || "",
    phone: enriched.bidder_phone || "",
    firmName: enriched.bidder_firm_name || enriched.firm_name || "",
    linkedin: enriched.bidder_linkedin || enriched.linkedin || "",
    headline: enriched.bidder_headline || enriched.professional_credentials?.headline || "",
  };
}
