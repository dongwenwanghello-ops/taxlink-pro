import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  BadgeCheck,
  UserCheck,
  Star,
  Briefcase,
  GraduationCap,
  MessageCircle,
  Send,
  Heart,
  PoundSterling,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/shared/StarRating";
import ProfessionalExpertiseDisplay from "@/components/shared/ProfessionalExpertiseDisplay";
import { base44 } from "@/api/base44Client";
import { resolveAdvisorProfile, advisorUrl } from "@/lib/advisorProfiles";

const AVAILABILITY = {
  available: { label: "Available now", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  limited: { label: "Limited availability", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  unavailable: { label: "Not taking new clients", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

function avatarGradient(name = "") {
  const colors = [
    "from-blue-500 to-blue-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
    "from-teal-500 to-teal-700",
    "from-rose-500 to-rose-700",
  ];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
}

function AdvisorCtaPanel({ profile, className = "" }) {
  const postJobUrl = `/post-job?advisor=${encodeURIComponent(profile.slug || profile.id)}`;
  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-3 ${className}`}>
      <p className="text-sm font-semibold text-foreground">Work with {profile.full_name?.split(" ")[0]}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Start with a consultation or post a project and invite them to quote.
      </p>
      <Button asChild className="w-full rounded-xl h-11 font-semibold gap-2">
        <Link to={postJobUrl}>
          <MessageCircle className="h-4 w-4" />
          Request consultation
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full rounded-xl h-11 font-semibold gap-2">
        <Link to={postJobUrl}>Discuss project</Link>
      </Button>
      <Button asChild variant="secondary" className="w-full rounded-xl h-10 gap-2">
        <Link to={`${postJobUrl}&invite=1`}>
          <Send className="h-4 w-4" />
          Invite to project
        </Link>
      </Button>
    </div>
  );
}

export default function AdvisorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    resolveAdvisorProfile(id).then(({ profile: p, reviews: r }) => {
      if (cancelled) return;
      setProfile(p);
      setReviews(r);
      setLoading(false);
      base44.analytics.track({
        eventName: "advisor_profile_view",
        properties: { advisor_id: p.id, updating: p.isUpdating },
      });
      const savedList = JSON.parse(localStorage.getItem("saved_profiles") || "[]");
      setSaved(savedList.includes(p.id));
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleSave = () => {
    if (!profile) return;
    const current = JSON.parse(localStorage.getItem("saved_profiles") || "[]");
    const next = saved ? current.filter((i) => i !== profile.id) : [...current, profile.id];
    localStorage.setItem("saved_profiles", JSON.stringify(next));
    setSaved(!saved);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = (profile.full_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avail = AVAILABILITY[profile.availability] || AVAILABILITY.available;
  const grad = avatarGradient(profile.full_name);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-12">
      <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-lg" onClick={toggleSave} aria-label="Save adviser">
              <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg hidden sm:inline-flex">
              <Link to="/professionals">Browse advisers</Link>
            </Button>
          </div>
        </div>
      </div>

      {profile.isUpdating && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-start gap-2 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>This adviser profile is being updated. You can still request a consultation below.</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
          <div className="space-y-8 min-w-0">
            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row gap-6">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.full_name}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover ring-2 ring-border shrink-0"
                  />
                ) : (
                  <div
                    className={`h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md`}
                  >
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                      {profile.full_name}
                    </h1>
                    <p className="text-base text-primary font-medium mt-1 leading-snug">{profile.headline}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    {profile.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.location}
                      </span>
                    )}
                    {profile.years_experience_display && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {profile.years_experience_display}
                      </span>
                    )}
                    {profile.qualification_lines?.[0] && (
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {profile.qualification_lines[0]}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${avail.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
                      {avail.label}
                    </span>
                  </div>
                  <StarRating rating={profile.avg_rating} total={profile.review_count} />
                </div>
              </div>
            </motion.section>

            {/* Trust */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-4">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Trust & verification</h2>
              <ul className="grid sm:grid-cols-3 gap-3 text-sm">
                {profile.verified_adviser && (
                  <li className="flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    Verified adviser
                  </li>
                )}
                {profile.qualification_verified && (
                  <li className="flex items-center gap-2 text-emerald-800">
                    <BadgeCheck className="h-4 w-4 shrink-0" />
                    Qualification verified
                  </li>
                )}
                {profile.identity_checked && (
                  <li className="flex items-center gap-2 text-emerald-800">
                    <UserCheck className="h-4 w-4 shrink-0" />
                    Identity checked
                  </li>
                )}
              </ul>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl bg-white/80 border border-emerald-100 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{profile.trust_score?.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Trust score</p>
                </div>
                <div className="rounded-xl bg-white/80 border border-emerald-100 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{profile.response_time_hours}h</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Typical response</p>
                </div>
                <div className="rounded-xl bg-white/80 border border-emerald-100 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{profile.completed_jobs}+</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Projects completed</p>
                </div>
              </div>
            </section>

            {/* Expertise */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">Expertise</h2>
              {(profile.primary_expertise?.length > 0 || profile.secondary_expertise?.length > 0) ? (
                <ProfessionalExpertiseDisplay profile={profile} />
              ) : (
                <p className="text-sm text-muted-foreground">Expertise details coming soon.</p>
              )}
            </section>

            {/* About */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio ||
                  "This adviser works with UK businesses and individuals on tax and accounting matters. Request a consultation to discuss your needs."}
              </p>
            </section>

            {/* Experience */}
            <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Experience
              </h2>
              {profile.current_firm && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current firm</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{profile.current_firm}</p>
                </div>
              )}
              {profile.previous_employers?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Previous</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {profile.previous_employers.map((emp) => (
                      <Badge key={emp} variant="outline" className="font-normal">
                        {emp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.years_experience_display && (
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Years:</strong> {profile.years_experience_display.replace(" experience", "")}
                </p>
              )}
              {profile.professional_level && (
                <p className="text-sm text-muted-foreground capitalize">
                  Level: {String(profile.professional_level).replace(/_/g, " ")}
                </p>
              )}
            </section>

            {/* Qualifications */}
            <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Qualifications
              </h2>
              {profile.qualifications?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.qualifications.map((q) => (
                    <Badge key={q} className="bg-primary/10 text-primary border-primary/20">
                      {q}
                    </Badge>
                  ))}
                </div>
              )}
              {profile.qualification_body && !profile.qualifications?.includes(profile.qualification_body) && (
                <Badge variant="outline">{profile.qualification_body}</Badge>
              )}
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-foreground">{profile.qualification_status_label}</span>
              </p>
              {profile.qualification_lines?.length > 1 && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {profile.qualification_lines.slice(1).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </section>

            {/* Reviews */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-foreground">Reviews</h2>
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= Math.round(profile.avg_rating) ? "fill-amber-400" : "fill-muted stroke-muted"}`}
                    />
                  ))}
                </div>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-6 text-center">
                  No reviews yet — be the first to work with {profile.full_name?.split(" ")[0]}.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="rounded-xl border border-border/60 bg-card p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{rev.reviewer_name}</p>
                          {rev.reviewer_company && (
                            <p className="text-xs text-muted-foreground">{rev.reviewer_company}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      {rev.service_type && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {rev.service_type}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">{rev.comment}</p>
                      {rev.created_date && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(rev.created_date), { addSuffix: true })}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Pricing */}
            <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <PoundSterling className="h-5 w-5 text-primary" />
                Pricing guide
              </h2>
              <p className="text-sm text-foreground">
                Typical project range:{" "}
                <strong>
                  £{profile.typical_project_min?.toLocaleString()}–£{profile.typical_project_max?.toLocaleString()}
                </strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Consultation: <strong className="text-foreground">{profile.consultation_fee}</strong>
              </p>
              {profile.hourly_rate > 0 && (
                <p className="text-xs text-muted-foreground">
                  Indicative hourly rate: £{profile.hourly_rate}/hr — final fees depend on scope.
                </p>
              )}
            </section>
          </div>

          {/* Desktop sidebar CTA */}
          <aside className="hidden lg:block sticky top-20">
            <AdvisorCtaPanel profile={profile} />
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3 safe-area-pb">
        <div className="max-w-5xl mx-auto flex gap-2">
          <Button asChild className="flex-1 rounded-xl h-11 font-semibold">
            <Link to={`/post-job?advisor=${encodeURIComponent(profile.slug || profile.id)}`}>
              Request consultation
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl h-11 px-4">
            <Link to={`/post-job?advisor=${encodeURIComponent(profile.slug || profile.id)}`}>Discuss</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
