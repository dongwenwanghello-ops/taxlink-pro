/** Marketplace onboarding — progressive steps, copy, and field groupings */

export const LOW_FRICTION_REASSURANCE = [
  "Takes less than 2 minutes",
  "Free to join and explore",
  "No subscription required",
];

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

export const ROLE_OPTIONS = [
  {
    value: "professional",
    label: "I'm a tax/accounting professional",
    shortDesc: "Win UK client work and grow your practice",
    stepOneHook: "Get matched with real UK tax & accounting projects",
    benefits: [
      "Get matched with UK tax & accounting projects",
      "Build your verified professional profile",
      "Receive relevant client opportunities",
    ],
  },
  {
    value: "client",
    label: "I'm looking for professional help",
    shortDesc: "Find the right expert for your tax needs",
    stepOneHook: "Compare verified professionals and quotes",
    benefits: [
      "Find trusted UK tax professionals",
      "Compare expertise and quotes",
      "Start projects quickly and securely",
    ],
  },
];

export const PROFESSIONAL_ONBOARDING_STEPS = [
  { id: 1, label: "Join", title: "Join the marketplace", subtitle: "Choose your role and save your spot" },
  { id: 2, label: "Basics", title: "Your professional identity", subtitle: "Just the essentials — details come next" },
  { id: 3, label: "Expertise", title: "Qualifications & services", subtitle: "Help clients understand your strengths" },
  { id: 4, label: "Visibility", title: "Profile visibility", subtitle: "You control how you appear on TaxLink" },
  { id: 5, label: "Enhance", title: "Enhance with AI", subtitle: "Optional — polish your profile in seconds" },
];

export const CLIENT_ONBOARDING_STEPS = [
  { id: 1, label: "Join", title: "Join the marketplace", subtitle: "Find trusted UK tax professionals" },
  { id: 2, label: "Preferences", title: "Your needs", subtitle: "Optional — improves matching" },
];

export const TOP_QUALIFICATIONS = ["ACCA", "ACA", "CTA", "ATT", "AAT", "ICAEW"];
export const MORE_QUALIFICATIONS = ["AATQB", "ICAS", "CIMA", "CIPFA", "FCA", "FCCA"];

export const TOP_SERVICES = [
  "Self Assessment", "VAT", "Corporation Tax", "Bookkeeping", "Payroll", "Tax Planning",
];
export const MORE_SERVICES = [
  "VAT Specialist", "Payroll Specialist", "Audit", "R&D Tax Credits", "Capital Gains",
  "Inheritance Tax", "Property Tax", "Making Tax Digital", "Annual Accounts",
  "Management Accounts", "Landlord Tax", "CIS Returns", "HMRC Investigations",
];

export const MAX_PRIMARY_SERVICES = 3;

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

export function resolvePublicDisplayName(legalName, displayName) {
  const publicName = String(displayName || "").trim();
  if (publicName) return publicName;
  const parts = String(legalName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
