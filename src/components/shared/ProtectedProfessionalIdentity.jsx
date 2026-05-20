import React from "react";
import {
  ShieldCheck, Star, Zap, Briefcase, Award, Lock, Mail, Phone, Building2, Linkedin, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  enrichBidIdentity,
  isBidIdentityRevealed,
  getProtectedDisplayName,
  getVerificationBadges,
  getProfessionalTrustMetrics,
  getContactDetailsForReveal,
  IDENTITY_REVEAL_CLIENT_MESSAGE,
} from "@/lib/professionalIdentity";

const METRIC_ICONS = {
  star: Star,
  zap: Zap,
  shield: ShieldCheck,
  briefcase: Briefcase,
  award: Award,
};

function InitialsAvatar({ name, revealed }) {
  const parts = String(name || "P").trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : (parts[0]?.[0] || "P");
  return (
    <div
      className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
        revealed
          ? "bg-gradient-to-br from-teal-500 to-primary text-white"
          : "bg-slate-100 text-slate-700 border border-slate-200"
      }`}
    >
      {initials.toUpperCase()}
    </div>
  );
}

export function IdentityRevealNotice({ className = "" }) {
  return (
    <p className={`text-[11px] text-slate-600 flex items-start gap-1.5 ${className}`}>
      <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-teal-600" />
      <span>{IDENTITY_REVEAL_CLIENT_MESSAGE}</span>
    </p>
  );
}

export function RevealedProfessionalContact({ bid, className = "" }) {
  const contact = getContactDetailsForReveal(bid);
  if (!contact.fullName && !contact.email) return null;

  return (
    <div className={`rounded-xl border border-teal-200 bg-teal-50/80 p-3 space-y-2 ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-teal-800 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        Collaboration details unlocked
      </p>
      <p className="text-sm font-bold text-foreground">{contact.fullName}</p>
      {contact.firmName && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          {contact.firmName}
        </p>
      )}
      {contact.headline && <p className="text-xs text-muted-foreground">{contact.headline}</p>}
      <div className="flex flex-col gap-1.5 pt-1">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="text-xs font-medium text-teal-800 hover:underline flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <p className="text-xs text-foreground flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {contact.phone}
          </p>
        )}
        {contact.linkedin && (
          <a
            href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-teal-800 hover:underline flex items-center gap-1.5"
          >
            <Linkedin className="h-3.5 w-3.5" />
            Professional profile
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProtectedProfessionalIdentity({
  bid,
  project = null,
  compact = false,
  showRevealNotice = true,
  className = "",
}) {
  const enriched = enrichBidIdentity(bid);
  const revealed = isBidIdentityRevealed(enriched, project);
  const displayName = getProtectedDisplayName(enriched, { revealed });
  const badges = getVerificationBadges(enriched);
  const metrics = getProfessionalTrustMetrics(enriched);
  const specialisms = enriched.bidder_specialisms || enriched.professional_credentials?.specialisations || [];
  const headline = enriched.bidder_headline || enriched.professional_credentials?.headline;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start gap-3">
        <InitialsAvatar name={displayName} revealed={revealed} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
              {displayName}
            </span>
            <Badge variant="outline" className="text-[10px] gap-1 bg-teal-50 text-teal-800 border-teal-200">
              <ShieldCheck className="h-3 w-3" />
              {revealed ? "Identity verified" : "Protected identity"}
            </Badge>
          </div>
          {headline && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{headline}</p>
          )}
          {!revealed && enriched.bidder_public_label && enriched.bidder_display_name !== enriched.bidder_public_label && (
            <p className="text-[11px] text-teal-700 mt-0.5">{enriched.bidder_public_label}</p>
          )}
        </div>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge.id}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                badge.verified
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {badge.verified ? `${badge.label} verified` : badge.label}
            </span>
          ))}
          {specialisms.slice(0, compact ? 2 : 3).map((specialism) => (
            <span
              key={specialism}
              className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-bold"
            >
              {specialism}
            </span>
          ))}
        </div>
      )}

      {metrics.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {metrics.map((metric) => {
            const Icon = METRIC_ICONS[metric.icon] || ShieldCheck;
            return (
              <span key={metric.id} className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Icon className={`h-3 w-3 shrink-0 ${metric.icon === "star" ? "text-amber-500 fill-amber-500" : "text-emerald-600"}`} />
                {metric.label}
              </span>
            );
          })}
        </div>
      )}

      {enriched.proposal && !compact && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed border-l-2 border-violet-200 pl-2">
          {enriched.proposal}
        </p>
      )}

      {!revealed && showRevealNotice && (
        <IdentityRevealNotice className="pt-1 border-t border-border/50" />
      )}

      {revealed && (
        <RevealedProfessionalContact bid={enriched} />
      )}
    </div>
  );
}

