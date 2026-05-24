/**
 * UK tax professional profile schema — qualifications, level, expertise, AI-matching payload.
 */

import {
  normalizeExpertise,
  parseYearsFromProfile,
  getQualificationStatusWeight,
  getProfessionalLevelWeight,
  getExperienceMatchWeight,
} from "@/lib/expertiseMatching";

export const QUALIFICATION_STATUS = {
  FULLY_QUALIFIED: "fully_qualified",
  PART_QUALIFIED: "part_qualified",
  STUDYING: "studying",
  QUALIFIED_BY_EXPERIENCE: "qualified_by_experience",
};

export const QUALIFICATION_STATUS_OPTIONS = [
  { value: QUALIFICATION_STATUS.FULLY_QUALIFIED, label: "Fully qualified" },
  { value: QUALIFICATION_STATUS.PART_QUALIFIED, label: "Part-qualified" },
  { value: QUALIFICATION_STATUS.STUDYING, label: "Currently studying" },
  { value: QUALIFICATION_STATUS.QUALIFIED_BY_EXPERIENCE, label: "Qualified by experience" },
];

export const PROFESSIONAL_LEVEL_OPTIONS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director / Partner" },
];

export const PROFESSIONAL_BACKGROUND_OPTIONS = [
  "HMRC",
  "Big4",
  "Industry",
  "Practice",
];

export const QUALIFICATION_BODIES = ["ACCA", "ACA", "CTA", "ATT", "AAT", "ICAEW", "CIMA", "ICAS"];

/** Default empty professional credential block for forms */
export const EMPTY_PROFESSIONAL_CREDENTIALS = {
  qualification_status: "",
  qualification_body: "",
  qualifications: [],
  qualification_year_obtained: "",
  qualification_progress_papers: "",
  qualification_progress_pct: "",
  qualification_expected_completion: "",
  years_experience_numeric: "",
  previous_employer: "",
  professional_background: "",
  professional_level: "",
};

export function parseYearsExperienceValue(profile = {}) {
  return parseYearsFromProfile(profile);
}

export { getQualificationStatusWeight, getProfessionalLevelWeight, getExperienceMatchWeight };

/**
 * Human-readable qualification lines for cards (2–4 lines typical).
 */
export function buildQualificationSummaryLines(profile = {}) {
  const lines = [];
  const status = profile.qualification_status;
  const body = profile.qualification_body;
  const quals = profile.qualifications || [];

  if (status === QUALIFICATION_STATUS.FULLY_QUALIFIED) {
    if (quals.length > 0) {
      for (const q of quals.slice(0, 3)) {
        lines.push(`${q} qualified`);
      }
    } else if (body) {
      lines.push(`${body} qualified`);
    }
    if (profile.qualification_year_obtained) {
      lines.push(`Qualified ${profile.qualification_year_obtained}`);
    }
  } else if (status === QUALIFICATION_STATUS.PART_QUALIFIED) {
    if (body) lines.push(`${body} part-qualified`);
    else lines.push("Part-qualified");
    if (profile.qualification_progress_papers) {
      lines.push(`${profile.qualification_progress_papers} papers completed`);
    } else if (profile.qualification_progress_pct) {
      lines.push(`${profile.qualification_progress_pct}% complete`);
    }
  } else if (status === QUALIFICATION_STATUS.STUDYING) {
    if (body) lines.push(`${body} studying`);
    else lines.push("Currently studying");
    if (profile.qualification_expected_completion) {
      lines.push(`Expected completion ${profile.qualification_expected_completion}`);
    }
  } else if (status === QUALIFICATION_STATUS.QUALIFIED_BY_EXPERIENCE) {
    lines.push("Qualified by experience");
    const yrs = parseYearsExperienceValue(profile);
    if (yrs) lines.push(`${yrs} years tax experience`);
    if (profile.previous_employer) {
      lines.push(`Ex-${profile.previous_employer}`);
    }
    if (profile.professional_background) {
      lines.push(profile.professional_background);
    }
  } else if (quals.length > 0) {
    for (const q of quals.slice(0, 2)) lines.push(`${q} qualified`);
  }

  const yrs = parseYearsExperienceValue(profile);
  if (
    yrs &&
    status !== QUALIFICATION_STATUS.QUALIFIED_BY_EXPERIENCE &&
    !lines.some((l) => l.includes("years"))
  ) {
    lines.push(`${yrs} years tax experience`);
  }

  const levelLabel = PROFESSIONAL_LEVEL_OPTIONS.find((o) => o.value === profile.professional_level)?.label;
  if (levelLabel && lines.length < 4) {
    lines.push(levelLabel);
  }

  return lines.slice(0, 4);
}

export function buildProfileTitle(profile = {}) {
  const { primary } = normalizeExpertise(profile);
  const qualLines = buildQualificationSummaryLines(profile);
  const name = profile.display_name || profile.full_name || "Professional";

  if (primary.length >= 2) {
    return `${name} — ${primary[0]} & ${primary[1]}`;
  }
  if (primary[0]) return `${name} — ${primary[0]} specialist`;
  if (qualLines[0]) return qualLines[0];
  return profile.title || "UK tax & accounting professional";
}

/** Payload for future AI recommendation engine */
export function buildMatchingProfilePayload(profile = {}) {
  const { primary, secondary } = normalizeExpertise(profile);
  return {
    primary_services: primary,
    secondary_services: secondary,
    primary_expertise: primary,
    secondary_expertise: secondary,
    qualification_status: profile.qualification_status || null,
    qualification_body: profile.qualification_body || null,
    qualifications: profile.qualifications || [],
    qualification_progress: profile.qualification_progress_papers
      || profile.qualification_progress_pct
      || null,
    qualification_expected_completion: profile.qualification_expected_completion || null,
    years_experience: profile.years_experience || null,
    years_experience_numeric: parseYearsExperienceValue(profile) || null,
    professional_level: profile.professional_level || null,
    background: profile.professional_background || null,
    previous_employer: profile.previous_employer || null,
    matching_weights: {
      primary_service: 1.0,
      secondary_service: 0.4,
      qualification_status: getQualificationStatusWeight(profile.qualification_status),
      professional_level: getProfessionalLevelWeight(profile.professional_level),
      experience: getExperienceMatchWeight(profile),
    },
  };
}

export function normalizeProfessionalProfile(raw = {}) {
  const expertise = normalizeExpertise(raw);
  return {
    ...raw,
    ...expertise,
    primary_services: expertise.primary,
    secondary_services: expertise.secondary,
    primary_expertise: expertise.primary,
    secondary_expertise: expertise.secondary,
    specialisations: expertise.primary.length ? expertise.primary : raw.specialisations || [],
    matching_payload: buildMatchingProfilePayload(raw),
  };
}
