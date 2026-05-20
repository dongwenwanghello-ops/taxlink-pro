import React, { useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Award, Briefcase, CheckCircle2, Clock, LayoutGrid,
  MessageCircle, ShieldCheck, Star, TrendingUp, Zap, User,
} from "lucide-react";
import { motion } from "framer-motion";
import StarRating from "@/components/shared/StarRating";
import VerificationBadge from "@/components/shared/VerificationBadge";
import ProfessionalFitReasons from "@/components/shared/ProfessionalFitReasons";
import { RevealedProfessionalContact } from "@/components/shared/ProtectedProfessionalIdentity";
import { resolveBidderPublicProfile, cacheBidderPublicProfile } from "@/lib/bidderPublicProfile";
import { isBidIdentityRevealed, enrichBidIdentity } from "@/lib/professionalIdentity";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function MetricTile({ label, value, sub, tone = "slate" }) {
  const tones = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
    violet: "bg-violet-50 border-violet-100 text-violet-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    slate: "bg-secondary/50 border-border text-foreground",
  };
  return (
    <div className={cn("rounded-xl border p-3 text-center", tones[tone] || tones.slate)}>
      <p className="text-lg font-extrabold leading-none">{value}</p>
      <p className="text-[10px] font-semibold mt-1 opacity-80">{label}</p>
      {sub && <p className="text-[9px] mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
}

export default function BidderPublicProfile() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateBid = location.state?.bid;
  const stateProject = location.state?.project;

  const resolved = useMemo(() => {
    const data = resolveBidderPublicProfile(bidId, { bid: stateBid, project: stateProject });
    if (data) cacheBidderPublicProfile(data.bid, data.project);
    return data;
  }, [bidId, stateBid, stateProject]);

  if (!resolved) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-bold mb-2">Profile not found</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          This professional profile is linked to a bid. Open it from My Projects or Compare Bids.
        </p>
        <Link to="/my-projects">
          <Button className="rounded-xl">Back to My Projects</Button>
        </Link>
      </div>
    );
  }

  const { bid, project, profile } = resolved;
  const enriched = enrichBidIdentity(bid);
  const revealed = isBidIdentityRevealed(enriched, project);
  const hasWorkspace =
    project?.lifecycle_state === "awarded"
    || project?.status === "in_progress"
    || enriched.status === "accepted"
    || enriched.awarded;
  const canAward =
    project
    && !hasWorkspace
    && !["in_progress", "awarded", "completed", "closed"].includes(project.status);

  const avgRating = profile.reviews.length
    ? profile.reviews.reduce((s, r) => s + (r.rating || 0), 0) / profile.reviews.length
    : 4.8;

  const initials = (profile.full_name || "P")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const backTo = project?.id ? `/my-projects/${project.id}` : "/my-projects";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {project?.id ? "Back to bid comparison" : "Back to My Projects"}
          </button>
          <div className="flex flex-wrap gap-2">
            {project?.id && (
              <Button type="button" variant="outline" size="sm" className="rounded-lg" asChild>
                <Link to={backTo}>Compare all bids</Link>
              </Button>
            )}
            {hasWorkspace && project?.id && (
              <Button type="button" size="sm" className="rounded-lg gap-1.5 bg-teal-700 hover:bg-teal-800" asChild>
                <Link to={`/workspace/${project.id}`}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Open workspace
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profile.project_title && (
          <p className="text-xs text-muted-foreground mb-4">
            Profile for bid on <span className="font-semibold text-foreground">{profile.project_title}</span>
          </p>
        )}

        <div className="grid lg:grid-cols-3 gap-7">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/70 rounded-2xl overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-teal-500 to-primary" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-2xl shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl font-extrabold text-foreground">{profile.full_name}</h1>
                      <Badge className="bg-teal-50 text-teal-800 border-teal-200 gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Verified professional
                      </Badge>
                      {revealed && (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">
                          Identity revealed
                        </Badge>
                      )}
                    </div>
                    <p className="text-base font-medium text-muted-foreground mb-2">{profile.title}</p>
                    {profile.firm_name && (
                      <p className="text-sm text-muted-foreground mb-2">{profile.firm_name}</p>
                    )}
                    <StarRating rating={avgRating} total={profile.reviews.length} size="lg" />
                  </div>
                </div>
              </div>
            </motion.div>

            <section className="bg-card border border-border/70 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-3">Professional background</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            </section>

            {profile.fitReasons?.length > 0 && (
              <section className="bg-teal-50/50 border border-teal-100 rounded-2xl p-6">
                <ProfessionalFitReasons
                  reasons={profile.fitReasons}
                  title="Why this professional fits your project"
                />
              </section>
            )}

            {profile.proposal && (
              <section className="bg-card border border-border/70 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-3">Proposal on this project</h2>
                <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-violet-300 pl-3">
                  {profile.proposal}
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  {profile.amount != null && (
                    <span className="font-bold text-primary">£{Number(profile.amount).toLocaleString()} proposed</span>
                  )}
                  {profile.timeline && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {profile.timeline}
                    </span>
                  )}
                </div>
              </section>
            )}

            <section className="bg-card border border-border/70 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Tax expertise &amp; services</h2>
              <div className="flex flex-wrap gap-2">
                {profile.specialisations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="bg-card border border-border/70 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Industries served</h2>
              <div className="flex flex-wrap gap-2">
                {profile.industries.map((ind) => (
                  <span key={ind} className="px-3 py-1.5 rounded-xl bg-secondary text-sm border border-border/60">
                    {ind}
                  </span>
                ))}
              </div>
            </section>

            {profile.caseExamples?.length > 0 && (
              <section className="bg-card border border-border/70 rounded-2xl p-6 space-y-3">
                <h2 className="text-lg font-bold">Relevant project experience</h2>
                {profile.caseExamples.map((ex) => (
                  <div key={ex.title} className="rounded-xl border border-border/60 p-4 bg-secondary/20">
                    <p className="font-semibold text-sm">{ex.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ex.detail}</p>
                  </div>
                ))}
              </section>
            )}

            <section className="bg-card border border-border/70 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Client reviews</h2>
                <StarRating rating={avgRating} size="lg" />
              </div>
              <div className="space-y-5">
                {profile.reviews.map((review, i) => (
                  <div key={review.id} className={i < profile.reviews.length - 1 ? "pb-5 border-b border-border/60" : ""}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{review.reviewer_name}</span>
                      {review.verified && (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <StarRating rating={review.rating} showValue={false} />
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                    {review.created_date && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {revealed && profile.contact && (
              <section className="bg-card border border-teal-200 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-3">Contact details</h2>
                <RevealedProfessionalContact bid={enriched} />
              </section>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-card border border-border/70 rounded-2xl p-6 sticky top-24 space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Credentials
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.qualifications.map((q) => (
                  <div key={q} className="flex items-center gap-1">
                    <VerificationBadge qualification={q} size="lg" />
                    <span className="text-[10px] font-bold text-teal-800">{q} verified</span>
                  </div>
                ))}
              </div>
              {profile.years_experience && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  {profile.years_experience}+ years experience
                </p>
              )}

              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground pt-2">
                Performance
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <MetricTile label="Response rate" value={`${profile.metrics.responseRate}%`} tone="blue" />
                <MetricTile label="On-time delivery" value={`${profile.metrics.onTimeRate}%`} tone="emerald" />
                <MetricTile label="Completion" value={`${profile.metrics.completedProjects}`} sub="projects" tone="violet" />
                <MetricTile label="Repeat clients" value={`${profile.metrics.repeatClients}%`} tone="amber" />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Marketplace performance indicators
              </p>

              <div className="pt-2 space-y-2 border-t border-border/60">
                <p className="text-xs font-bold text-foreground">Start collaboration</p>
                {hasWorkspace && project?.id ? (
                  <Button type="button" className="w-full rounded-xl gap-2 bg-teal-700 hover:bg-teal-800" asChild>
                    <Link to={`/workspace/${project.id}`}>
                      <LayoutGrid className="h-4 w-4" />
                      Open workspace
                    </Link>
                  </Button>
                ) : canAward ? (
                  <Button
                    type="button"
                    className="w-full rounded-xl gap-2"
                    onClick={() => navigate(backTo, { state: { awardBidId: bid.id } })}
                  >
                    <Award className="h-4 w-4" />
                    Select this professional
                  </Button>
                ) : null}
                {project?.id && (
                  <Button type="button" variant="outline" className="w-full rounded-xl gap-2" asChild>
                    <Link to={backTo}>
                      <MessageCircle className="h-4 w-4" />
                      Message via comparison
                    </Link>
                  </Button>
                )}
                <Button type="button" variant="ghost" className="w-full rounded-xl text-xs" asChild>
                  <Link to="/professionals">Browse all professionals</Link>
                </Button>
              </div>
            </div>

            {profile.activity?.length > 0 && (
              <div className="bg-card border border-border/70 rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-teal-600" />
                  Marketplace activity
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {profile.activity.map((item) => (
                    <li key={item.id}>{item.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
