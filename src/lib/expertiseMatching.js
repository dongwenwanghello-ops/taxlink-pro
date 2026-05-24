/**
 * Primary vs secondary expertise — limits and matching weights.
 * Primary score = 1.0 · Secondary score = 0.4
 */

export const MAX_PRIMARY_EXPERTISE = 3;
export const MAX_EXPERTISE_WARNING = "You already selected the maximum number.";
export const MAX_SECONDARY_EXPERTISE = 10;
export const PRIMARY_MATCH_WEIGHT = 1.0;
export const SECONDARY_MATCH_WEIGHT = 0.4;

/** @deprecated Use MAX_PRIMARY_EXPERTISE */
export const MAX_PRIMARY_SERVICES = MAX_PRIMARY_EXPERTISE;

const LEVEL_MATCH_WEIGHT = {
  junior: 0.65,
  mid: 0.85,
  senior: 1.0,
  manager: 1.08,
  director: 1.12,
};

const STATUS_MATCH_WEIGHT = {
  fully_qualified: 1.0,
  part_qualified: 0.78,
  studying: 0.58,
  qualified_by_experience: 0.88,
};

export function parseYearsFromProfile(profile = {}) {
  const direct = Number(profile.years_experience_numeric);
  if (direct > 0) return direct;
  const bucket = String(profile.years_experience || "").toLowerCase();
  if (bucket.includes("10")) return 12;
  if (bucket.includes("5-10") || bucket.includes("5–10")) return 7;
  if (bucket.includes("3-5") || bucket.includes("3–5")) return 4;
  if (bucket.includes("1-3") || bucket.includes("1–3")) return 2;
  const m = bucket.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export function getQualificationStatusWeight(status) {
  return STATUS_MATCH_WEIGHT[status] ?? 0.7;
}

export function getProfessionalLevelWeight(level) {
  return LEVEL_MATCH_WEIGHT[level] ?? 0.85;
}

export function getExperienceMatchWeight(profile) {
  const years = parseYearsFromProfile(profile);
  if (!years) return 0;
  return Math.min(years / 12, 1) * 0.35;
}

export function normalizeExpertise(source = {}) {
  const primary = [
    ...(source.primary_expertise || source.specialisations || source.bidder_primary_specialisms || []),
  ];
  const secondaryRaw = [
    ...(source.secondary_expertise || source.bidder_secondary_specialisms || []),
  ];
  const primarySet = new Set(primary);
  const secondary = secondaryRaw.filter((s) => !primarySet.has(s));

  return {
    primary,
    secondary,
    all: [...primary, ...secondary],
  };
}

export function expertiseCounts(source = {}) {
  const { primary, secondary } = normalizeExpertise(source);
  return {
    primary: primary.length,
    secondary: secondary.length,
    primaryMax: MAX_PRIMARY_EXPERTISE,
    secondaryMax: MAX_SECONDARY_EXPERTISE,
  };
}

/**
 * Score how well profile/bid expertise matches a list of tags (service names).
 */
export function scoreExpertiseMatch(source, tags = []) {
  const { primary, secondary } = normalizeExpertise(source);
  let score = 0;
  let primaryHits = 0;
  let secondaryHits = 0;

  for (const tag of tags) {
    if (!tag) continue;
    if (primary.includes(tag)) {
      score += PRIMARY_MATCH_WEIGHT;
      primaryHits += 1;
    } else if (secondary.includes(tag)) {
      score += SECONDARY_MATCH_WEIGHT;
      secondaryHits += 1;
    }
  }

  return { score, primaryHits, secondaryHits };
}

/** Score against project category + optional explicit service tags. */
export function scoreExpertiseForProject(source, project = {}) {
  const tags = [];
  if (project.service_tags?.length) {
    tags.push(...project.service_tags);
  }
  if (project.category) {
    tags.push(project.category.replace(/_/g, " "));
  }
  const { primary, secondary } = normalizeExpertise(source);
  const blob = `${project.title || ""} ${project.description || ""}`.toLowerCase();

  let { score, primaryHits, secondaryHits } = scoreExpertiseMatch(source, tags);

  for (const s of primary) {
    if (blob.includes(s.toLowerCase())) {
      score += PRIMARY_MATCH_WEIGHT * 0.5;
      primaryHits += 1;
    }
  }
  for (const s of secondary) {
    if (blob.includes(s.toLowerCase())) {
      score += SECONDARY_MATCH_WEIGHT * 0.5;
      secondaryHits += 1;
    }
  }

  return { score, primaryHits, secondaryHits };
}

/** Combined expertise + qualification status + level + experience (for discovery / AI prep). */
export function scoreProfessionalMatch(source, project = {}) {
  const { score: expertiseScore, primaryHits, secondaryHits } = scoreExpertiseForProject(source, project);
  const statusW = getQualificationStatusWeight(source.qualification_status);
  const levelW = getProfessionalLevelWeight(source.professional_level);
  const expW = getExperienceMatchWeight(source);

  const composite =
    expertiseScore * statusW * levelW + expW * 10;

  return {
    score: composite,
    expertiseScore,
    primaryHits,
    secondaryHits,
    statusWeight: statusW,
    levelWeight: levelW,
    experienceWeight: expW,
  };
}

export function togglePrimaryExpertise(form, item) {
  const { primary, secondary } = normalizeExpertise(form);
  const inPrimary = primary.includes(item);

  if (inPrimary) {
    return {
      next: {
        ...form,
        primary_expertise: primary.filter((s) => s !== item),
        specialisations: primary.filter((s) => s !== item),
      },
      message: null,
    };
  }

  if (primary.length >= MAX_PRIMARY_EXPERTISE) {
    return {
      next: form,
      message: MAX_EXPERTISE_WARNING,
    };
  }

  const nextPrimary = [...primary, item];
  const nextSecondary = secondary.filter((s) => s !== item);

  return {
    next: {
      ...form,
      primary_expertise: nextPrimary,
      specialisations: nextPrimary,
      secondary_expertise: nextSecondary,
    },
    message: null,
  };
}

export function toggleSecondaryExpertise(form, item) {
  const { primary, secondary } = normalizeExpertise(form);

  if (primary.includes(item)) {
    return {
      next: form,
      message: "Already selected as primary expertise. Remove it from primary first.",
    };
  }

  const inSecondary = secondary.includes(item);

  if (inSecondary) {
    return {
      next: {
        ...form,
        secondary_expertise: secondary.filter((s) => s !== item),
      },
      message: null,
    };
  }

  if (secondary.length >= MAX_SECONDARY_EXPERTISE) {
    return {
      next: form,
      message: MAX_EXPERTISE_WARNING,
    };
  }

  return {
    next: {
      ...form,
      secondary_expertise: [...secondary, item],
    },
    message: null,
  };
}
