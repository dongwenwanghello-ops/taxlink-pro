import { Award, Zap, RefreshCw, ShieldCheck, Star, Clock } from "lucide-react";

const BADGE_CONFIG = {
  top_rated: {
    label: "Top Rated",
    icon: Award,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    iconClass: "text-amber-500",
  },
  fast_responder: {
    label: "Fast Responder",
    icon: Zap,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    iconClass: "text-blue-500",
  },
  repeat_hire: {
    label: "Repeat Hire",
    icon: RefreshCw,
    className: "bg-violet-50 text-violet-700 border-violet-200",
    iconClass: "text-violet-500",
  },
  verified_specialist: {
    label: "Verified Specialist",
    icon: ShieldCheck,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconClass: "text-emerald-500",
  },
  trusted_professional: {
    label: "Trusted Professional",
    icon: Star,
    className: "bg-primary/10 text-primary border-primary/20",
    iconClass: "text-primary",
  },
  experienced: {
    label: "10+ Years",
    icon: Clock,
    className: "bg-secondary text-foreground border-border",
    iconClass: "text-muted-foreground",
  },
};

export function computeBadges(profile, reviewCount = 0) {
  const badges = [];
  const completed = profile.completed_jobs || 0;
  const years = profile.years_experience || 0;
  const rating = profile.reputation_score || 0;
  const repeats = profile.repeat_clients || 0;
  const quals = profile.qualifications || [];

  if (completed >= 20 && rating >= 70) badges.push("top_rated");
  if ((profile.response_rate || 0) >= 90) badges.push("fast_responder");
  if (repeats >= 3) badges.push("repeat_hire");
  if (quals.some(q => ["ACA", "ACCA", "CTA"].includes(q))) badges.push("verified_specialist");
  if (completed >= 10 && reviewCount >= 5) badges.push("trusted_professional");
  if (years >= 10) badges.push("experienced");

  // Also include any explicitly stored badges
  const stored = profile.trust_badges || [];
  const all = [...new Set([...stored, ...badges])];
  return all;
}

export default function TrustBadges({ badges = [], size = "sm" }) {
  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((key) => {
        const cfg = BADGE_CONFIG[key];
        if (!cfg) return null;
        const Icon = cfg.icon;
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.className}`}
          >
            <Icon className={`h-3 w-3 ${cfg.iconClass}`} />
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}