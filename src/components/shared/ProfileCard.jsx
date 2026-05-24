import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, PoundSterling, CheckCircle2, Wifi, ArrowRight, Briefcase, TrendingUp, Star, ShieldCheck } from "lucide-react";
import VerificationBadge from "./VerificationBadge";
import StarRating from "./StarRating";
import ProfessionalQualificationLines from "./ProfessionalQualificationLines";
import ProfessionalExpertiseDisplay from "./ProfessionalExpertiseDisplay";
import { motion } from "framer-motion";
import { advisorUrl } from "@/lib/advisorProfiles";

// Deterministic seeded reputation metrics per profile
function seeded(id = "", offset = 0) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + offset;
}
function fakeOnTime(id)      { return 88 + (seeded(id, 3) % 12); }
function fakeCompletion(id)  { return 90 + (seeded(id, 7) % 10); }
function fakeProjects(id, base = 0) { return base || 4 + (seeded(id, 11) % 44); }

const availabilityConfig = {
  available:   { label: "Active now",          dot: "bg-emerald-500" },
  limited:     { label: "Replies within 2h",   dot: "bg-amber-500" },
  unavailable: { label: "Recently online",     dot: "bg-slate-400" },
};

function avatarColor(name = "") {
  const colors = [
    "from-blue-500 to-blue-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
    "from-rose-500 to-rose-700",
    "from-amber-500 to-amber-700",
    "from-sky-500 to-sky-700",
    "from-indigo-500 to-indigo-700",
  ];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
}

export default function ProfileCard({ profile, featured = false }) {
  const initials = (profile.full_name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avail = availabilityConfig[profile.availability] || availabilityConfig.available;
  const rating = profile.avg_rating || 4.8;
  const reviewCount = profile.review_count || 0;
  const gradient = avatarColor(profile.full_name);
  const isVerified   = profile.qualifications?.some((q) => ["ACA", "ACCA", "CTA"].includes(q));
  const onTime       = fakeOnTime(profile.id);
  const completion   = fakeCompletion(profile.id);
  const projectsDone = fakeProjects(profile.id, profile.completed_jobs);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Link to={advisorUrl(profile)} className="block h-full">
        <div className={`relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/8 h-full ${
          featured ? "border-primary/30 ring-1 ring-primary/20" : "border-border/70"
        }`}>
          {featured && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
                ⭐ Featured
              </span>
            </div>
          )}

          <div className={`h-1 w-full bg-gradient-to-r ${gradient} opacity-70`} />

          <div className="p-5 flex flex-col gap-3.5 flex-1">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                {profile.profile_image_url ? (
                  <img src={profile.profile_image_url} alt={profile.full_name}
                    className="h-14 w-14 rounded-xl object-cover ring-2 ring-border" />
                ) : (
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                    {initials}
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${avail.dot}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-foreground leading-tight text-[15px]">{profile.full_name}</h3>
                  {isVerified && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{profile.title}</p>
                <ProfessionalQualificationLines profile={profile} className="mt-1" />
                <div className="mt-1.5">
                  <StarRating rating={rating} total={reviewCount} />
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{profile.bio}</p>
            )}

            {/* Qualifications */}
            {profile.qualifications?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.qualifications.slice(0, 4).map((q) => (
                  <VerificationBadge key={q} qualification={q} />
                ))}
                {profile.qualifications.length > 4 && (
                  <span className="text-xs text-muted-foreground self-center">+{profile.qualifications.length - 4}</span>
                )}
              </div>
            )}

            <ProfessionalExpertiseDisplay profile={profile} compact />

            {/* Reputation metrics strip */}
            <div className="grid grid-cols-3 gap-1.5 border-t border-border/50 pt-3 mt-auto">
              <div className="flex flex-col items-center px-1.5 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-sm font-extrabold text-emerald-700 leading-none">{onTime}%</span>
                <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 leading-tight">On-Time</span>
              </div>
              <div className="flex flex-col items-center px-1.5 py-2 rounded-lg bg-violet-50 border border-violet-100 text-center">
                <span className="text-sm font-extrabold text-violet-700 leading-none">{projectsDone}</span>
                <span className="text-[9px] text-violet-600 font-semibold mt-0.5 leading-tight">Projects</span>
              </div>
              <div className="flex flex-col items-center px-1.5 py-2 rounded-lg bg-amber-50 border border-amber-100 text-center">
                <span className="text-sm font-extrabold text-amber-700 leading-none">{rating}★</span>
                <span className="text-[9px] text-amber-600 font-semibold mt-0.5 leading-tight">Rating</span>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
              {profile.years_experience && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{profile.years_experience}+ yrs</span>}
              {profile.remote_work && <span className="flex items-center gap-1 text-emerald-600 font-medium"><Wifi className="h-3.5 w-3.5" />Remote</span>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div>
                {profile.hourly_rate ? (
                  <>
                    <span className="text-lg font-bold text-foreground flex items-center gap-0.5">
                      <PoundSterling className="h-4 w-4" />{profile.hourly_rate}
                    </span>
                    <span className="text-xs text-muted-foreground">/hr</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Rate on request</span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                View Profile <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}