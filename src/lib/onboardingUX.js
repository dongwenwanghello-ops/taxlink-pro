/** Marketplace onboarding — progressive steps, copy, and field groupings */

export const LOW_FRICTION_REASSURANCE = [
  "Takes less than 2 minutes",
  "Free to join and explore",
  "No subscription required",
];

export const EMAIL_TRUST_INDICATORS = [
  "No subscription required",
  "Secure registration",
  "Takes under 1 minute",
];

export const ONBOARDING_HERO = {
  professional: {
    headline: "Grow your UK tax practice",
    subheadline: "Join free and get matched with real client projects.",
  },
  client: {
    headline: "Find the right UK tax expert",
    subheadline: "Compare verified professionals and receive quotes.",
  },
};

export const ROLE_CARD_CONFIG = {
  professional: {
    value: "professional",
    title: "I want clients",
    subtitle: "Win UK tax projects and grow your practice",
    benefits: ["Real UK clients", "Free to join", "AI project matching"],
    ctaLabel: "Continue to create profile",
  },
  client: {
    value: "client",
    title: "I need tax help",
    subtitle: "Find and compare trusted professionals",
    benefits: ["Compare quotes", "Verified experts", "Fast matching"],
    ctaLabel: "Find my expert",
  },
};

export const MARKETPLACE_ACTIVITY_SIGNALS = [
  { id: "joining", text: "UK tax professionals joining weekly" },
  { id: "vat", text: "New VAT projects posted regularly" },
  { id: "early", text: "Early access accounting marketplace" },
  { id: "trusted", text: "Trusted UK tax & accounting platform" },
];

export const PROFESSIONAL_IDENTITY_SIGNALS = [
  "ACCA / ATT / CTA professionals welcome",
  "UK tax & accounting marketplace",
  "Build trusted professional reputation",
];

/** @deprecated Use ROLE_CARD_CONFIG — kept for any legacy imports */
export const ROLE_OPTIONS = [
  {
    value: "professional",
    label: "I'm a tax/accounting professional",
    shortDesc: ROLE_CARD_CONFIG.professional.subtitle,
    stepOneHook: "Get matched with real UK tax & accounting projects",
    benefits: ROLE_CARD_CONFIG.professional.benefits,
  },
  {
    value: "client",
    label: "I'm looking for professional help",
    shortDesc: ROLE_CARD_CONFIG.client.subtitle,
    stepOneHook: "Compare verified professionals and quotes",
    benefits: ROLE_CARD_CONFIG.client.benefits,
  },
];

export const PROFESSIONAL_ONBOARDING_STEPS = [
  { id: 1, label: "Join", title: "Grow your UK tax practice", subtitle: "Choose your role and save your spot" },
  { id: 2, label: "Basics", title: "Your professional identity", subtitle: "Experience level and how clients see you" },
  { id: 3, label: "Expertise", title: "Qualifications & expertise", subtitle: "UK-realistic paths — primary (3) + secondary (10)" },
  { id: 4, label: "Visibility", title: "Profile visibility", subtitle: "You control how you appear on TaxLink" },
  { id: 5, label: "Enhance", title: "Enhance with AI", subtitle: "Optional — polish your profile in seconds" },
];

export const CLIENT_ONBOARDING_STEPS = [
  { id: 1, label: "Join", title: "Find the right UK tax expert", subtitle: "Tell us how we can help" },
  { id: 2, label: "Preferences", title: "Your needs", subtitle: "Optional — improves matching" },
];

export const TOP_QUALIFICATIONS = ["ACCA", "ACA", "CTA", "ATT", "AAT", "ICAEW"];
export const MORE_QUALIFICATIONS = ["AATQB", "ICAS", "CIMA", "CIPFA", "FCA", "FCCA"];

export const TOP_SERVICES = [
  "Self Assessment", "VAT", "Corporation Tax", "Capital Gains", "Payroll", "Tax Planning",
];
export const MORE_SERVICES = [
  "Employment Tax", "Share Schemes", "R&D Tax Credits", "Bookkeeping", "Audit",
  "HMRC Investigations", "Property Tax", "Inheritance Tax", "Making Tax Digital",
  "Annual Accounts", "Management Accounts", "Landlord Tax", "CIS Returns",
  "VAT Specialist", "Payroll Specialist",
];

/** @deprecated Import from expertiseMatching.js */
export { MAX_PRIMARY_EXPERTISE, MAX_SECONDARY_EXPERTISE } from "@/lib/expertiseMatching";

export const VISIBILITY_OPTIONS = [
  {
    value: "private",
    label: "Private profile",
    description: "Only visible when you apply to projects. Recommended to start.",
  },
  {
    value: "public",
    label: "Public marketplace profile",
    description: "Clients can discover your profile directly in the directory.",
  },
];

export const CLIENT_TYPES = ["Individual", "Sole trader", "Limited company", "Landlord", "Startup", "Accounting practice", "Other"];
export const PROJECT_INTERESTS = ["Self Assessment", "VAT Return", "Corporation Tax", "Bookkeeping", "Payroll", "General Tax Advice"];

export const LEGAL_NAME_HELPER =
  "Your legal name is kept secure and helps with verification and professional credibility on the platform.";

export const EXPERIENCE_OPTIONS = ["1-3 years", "3-5 years", "5-10 years", "10+ years"];

export function getOnboardingSteps(role) {
  return role === "client" ? CLIENT_ONBOARDING_STEPS : PROFESSIONAL_ONBOARDING_STEPS;
}

export function getOnboardingProgressPercent(step, role) {
  const steps = getOnboardingSteps(role);
  if (!steps.length) return 0;
  return Math.round((step / steps.length) * 100);
}

export function getOnboardingEffortMessage(step, role) {
  const total = getOnboardingSteps(role).length;
  if (step >= total) return "Final step — you're almost done";
  return "Almost there — takes less than 1 minute";
}

export function getStepOneCtaLabel(role) {
  return ROLE_CARD_CONFIG[role]?.ctaLabel || "Continue";
}

export function resolvePublicDisplayName(legalName, displayName) {
  const publicName = String(displayName || "").trim();
  if (publicName) return publicName;
  const parts = String(legalName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
