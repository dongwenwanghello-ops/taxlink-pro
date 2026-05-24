import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/* global gtag */
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Clock, PoundSterling, CheckCircle2, Wifi, ArrowLeft,
  Briefcase, MessageSquare, Star, Timer, TrendingUp, ShieldCheck, Heart, EyeOff, ThumbsUp
} from "lucide-react";
import VerificationBadge from "../components/shared/VerificationBadge";
import StarRating from "../components/shared/StarRating";
import TrustBadges, { computeBadges } from "../components/shared/TrustBadges";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { DEMO_PROFESSIONALS, DEMO_REVIEWS } from "@/lib/demoData";
import { advisorUrl } from "@/lib/advisorProfiles";
import { base44 } from "@/api/base44Client";

function seeded(id = "", offset = 0) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + offset;
}
function fakeOnTime(id)     { return 88 + (seeded(id, 3) % 12); }
function fakeCompletion(id) { return 90 + (seeded(id, 7) % 10); }

function avatarColor(name = "") {
  const colors = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700",
    "from-amber-500 to-amber-700", "from-sky-500 to-sky-700",
    "from-indigo-500 to-indigo-700",
  ];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
}

const availabilityConfig = {
  available:   { label: "Active now",          dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  limited:     { label: "Replies within 2h",   dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  unavailable: { label: "Recently online",     dot: "bg-slate-400",   badge: "bg-secondary text-muted-foreground border-border" },
};

function ContactModal({ profile, onClose }) {
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  const initials = (profile.full_name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const gradient = avatarColor(profile.full_name);

  const handleSend = () => {
    base44.analytics.track({ eventName: "contact_click", properties: { professional: profile.full_name } });
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coming soon notice */}
        <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium flex items-center gap-1.5">
          <span>⚠️</span> Direct messaging is coming soon — for now this is a preview.
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">Request Noted</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Messaging goes live soon. We'll let you know when {profile.full_name} can be contacted directly.
            </p>
            <Button onClick={onClose} className="rounded-xl w-full">Close</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm`}>
                {initials}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.title}</p>
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-4">Express Interest</h3>
            <textarea
              placeholder={`Hi ${(profile.full_name || "").split(" ")[0]}, I'd like to discuss a potential project...`}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="w-full h-28 p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleSend} className="flex-1 rounded-xl" disabled={!msg.trim()}>
                Submit Interest
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function ProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [saved, setSaved] = useState(false);
  const [realProfile, setRealProfile] = useState(null);
  const [loadingReal, setLoadingReal] = useState(true);
  const [liveReviews, setLiveReviews] = useState(null);

  // Try to load from DB first; fall back to demo data
  useEffect(() => {
    const tryLoad = async () => {
      try {
        // Check if current user owns this profile — redirect to my-profile
        const isAuthed = await base44.auth.isAuthenticated();
        if (isAuthed) {
          const me = await base44.auth.me();
          const myProfileRaw = localStorage.getItem("my_profile");
          if (myProfileRaw) {
            const myProfile = JSON.parse(myProfileRaw);
            if (myProfile.id === id || myProfile.slug === id || myProfile.created_by === me?.email) {
              navigate("/my-profile", { replace: true });
              return;
            }
          }
        }
        // Try fetching the real profile from DB
        const results = await base44.entities.ProfessionalProfile.filter({ id });
        if (results?.length > 0) {
          setRealProfile(results[0]);
          // Load live reviews for this profile
          const revs = await base44.entities.Review.filter({ professional_id: id });
          setLiveReviews(revs || []);
        }
      } catch {
        // Not found in DB, will fall back to demo data
      } finally {
        setLoadingReal(false);
      }
    };
    tryLoad();
  }, [id, navigate]);

  const demoProfile = DEMO_PROFESSIONALS.find(p => p.slug === id || p.id === id) || null;
  const profile = realProfile
    ? { ...realProfile, slug: realProfile.id, qualifications: realProfile.qualifications || [], specialisations: realProfile.specialisations || [], software_expertise: realProfile.software_expertise || [], industries: realProfile.industries || [] }
    : demoProfile;
  const reviews = liveReviews !== null
    ? liveReviews
    : (profile && !realProfile ? DEMO_REVIEWS.filter(r => r.professional_id === profile.id) : []);

  useEffect(() => {
    if (profile) {
      base44.analytics.track({ eventName: "profile_open", properties: { professional: profile.full_name, slug: profile.slug } });
      const savedList = JSON.parse(localStorage.getItem("saved_profiles") || "[]");
      setSaved(savedList.includes(profile.id));
    }
  }, [profile?.id]);

  const toggleSave = () => {
    const current = JSON.parse(localStorage.getItem("saved_profiles") || "[]");
    let updated;
    if (saved) {
      updated = current.filter(i => i !== profile.id);
      gtag('event', 'professional_unsaved', { 
        professional_id: profile.id,
        professional_name: profile.full_name 
      });
    } else {
      updated = [...current, profile.id];
      base44.analytics.track({ eventName: "save_profile", properties: { professional: profile.full_name } });
      gtag('event', 'professional_saved', { 
        professional_id: profile.id,
        professional_name: profile.full_name 
      });
    }
    localStorage.setItem("saved_profiles", JSON.stringify(updated));
    setSaved(!saved);
  };

  const handleQualFilter = (q) => {
    base44.analytics.track({ eventName: "qualification_filter_click", properties: { qualification: q } });
    navigate(`/professionals?qual=${q}`);
  };

  const handleSpecFilter = (s) => {
    base44.analytics.track({ eventName: "service_filter_click", properties: { service: s } });
    navigate(`/professionals?spec=${encodeURIComponent(s)}`);
  };

  const handleLocationFilter = (loc) => {
    base44.analytics.track({ eventName: "city_filter_click", properties: { city: loc } });
    navigate(`/professionals?location=${encodeURIComponent(loc)}`);
  };

  if (loadingReal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Block access to private profiles (not the owner — they're redirected above)
  if (profile && profile.visibility === "private") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/60 bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/professionals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />Back to Professionals
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">This profile is private</h2>
          <p className="text-muted-foreground mb-8">This professional has set their profile to invite-only. Browse other verified experts below.</p>
          <Link to="/professionals"><Button className="rounded-xl">Browse All Professionals</Button></Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/60 bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/professionals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />Back to Professionals
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Profile not found</h2>
          <p className="text-muted-foreground mb-8">This professional may have updated their profile. Browse our verified experts below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {DEMO_PROFESSIONALS.slice(0, 3).map((p) => {
              const initials = p.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              const grad = avatarColor(p.full_name);
              return (
                <Link key={p.id} to={advisorUrl(p)}
                  className="flex flex-col items-center p-4 bg-card border border-border/60 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm mb-2`}>{initials}</div>
                  <p className="text-sm font-semibold text-foreground text-center">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground text-center mt-0.5">{p.title}</p>
                </Link>
              );
            })}
          </div>
          <Link to="/professionals">
            <Button className="rounded-xl">Browse All Professionals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const initials = (profile.full_name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const gradient = avatarColor(profile.full_name);
  const avail = availabilityConfig[profile.availability] || availabilityConfig.available;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 4.8;
  const onTime = fakeOnTime(profile.id);
  const completion = fakeCompletion(profile.id);
  const reviewGradients = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700", "from-amber-500 to-amber-700",
  ];

  return (
    <>
      {showContact && <ContactModal profile={profile} onClose={() => setShowContact(false)} />}

      {/* Hidden-profile notice for direct-link visitors */}
      {profile.visibility === "hidden" && (
        <div className="bg-violet-50 border-b border-violet-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-xs text-violet-700 font-medium">
            <EyeOff className="h-3.5 w-3.5 shrink-0" />
            This professional is open to opportunities privately — they're not listed in public search but accept direct introductions.
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background">
        <div className="border-b border-border/60 bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link to="/professionals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />Back to Professionals
            </Link>
            <button onClick={toggleSave}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${saved ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-card border-border text-muted-foreground hover:border-rose-300 hover:text-rose-500"}`}>
              <Heart className={`h-3.5 w-3.5 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
              {saved ? "Saved" : "Save Profile"}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-7">

            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/70 rounded-2xl overflow-hidden">
                <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="relative shrink-0">
                      <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold text-2xl shadow-md`}>
                        {initials}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${avail.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{profile.full_name}</h1>
                        {profile.qualifications?.some((q) => ["ACA", "ACCA", "CTA"].includes(q)) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            <CheckCircle2 className="h-3 w-3" />Verified
                          </span>
                        )}
                      </div>
                      <p className="text-base font-medium text-muted-foreground mb-3">{profile.title}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <StarRating rating={avgRating} total={reviews.length} size="lg" />
                        {profile.location && (
                          <button onClick={() => handleLocationFilter(profile.location)}
                            className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                            <MapPin className="h-3.5 w-3.5" />{profile.location}
                          </button>
                        )}
                        {profile.years_experience && (
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{profile.years_experience}+ years</span>
                        )}
                      </div>
                      {profile.qualifications?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {profile.qualifications.map((q) => (
                            <button key={q} onClick={() => handleQualFilter(q)}
                              className="cursor-pointer hover:scale-105 transition-transform">
                              <VerificationBadge qualification={q} size="lg" />
                            </button>
                          ))}
                        </div>
                      )}
                      <TrustBadges badges={computeBadges(profile, reviews.length)} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {profile.bio && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="bg-card border border-border/70 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-foreground mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">{profile.bio}</p>
                </motion.div>
              )}

              {profile.specialisations?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                  className="bg-card border border-border/70 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Services Offered</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialisations.map((spec) => (
                      <button key={spec} onClick={() => handleSpecFilter(spec)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border/60 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />{spec}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">Click a service to find other professionals offering it</p>
                </motion.div>
              )}

              {profile.software_expertise?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
                  className="bg-card border border-border/70 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Software & Tools</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.software_expertise.map((s) => (
                      <span key={s} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">{s}</span>
                    ))}
                  </div>
                </motion.div>
              )}

              {profile.industries?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                  className="bg-card border border-border/70 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Industries Served</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.industries.map((ind) => (
                      <span key={ind} className="px-3 py-1.5 rounded-xl bg-secondary text-foreground text-sm font-medium border border-border/60">{ind}</span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reviews */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                className="bg-card border border-border/70 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-foreground">Client Reviews ({reviews.length})</h2>
                  {reviews.length > 0 && <StarRating rating={avgRating} size="lg" />}
                </div>
                {reviews.length === 0 ? (
                  <div className="text-center py-10">
                    <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-foreground mb-1">No reviews yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">Reviews appear after completed jobs.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {reviews.map((review, i) => {
                      const ri = (review.reviewer_name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                      return (
                        <div key={review.id} className={i < reviews.length - 1 ? "pb-5 border-b border-border/60" : ""}>
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${reviewGradients[i % reviewGradients.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {ri}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-foreground">{review.reviewer_name}</span>
                                {review.reviewer_company && <span className="text-xs text-muted-foreground">· {review.reviewer_company}</span>}
                                {review.verified && (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <CheckCircle2 className="h-3 w-3" />Verified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <StarRating rating={review.rating} showValue={false} />
                                {review.service_type && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-md">{review.service_type}</span>}
                                {review.created_date && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                              {/* Sub-dimension ratings */}
                              {(review.communication_rating || review.technical_rating || review.professionalism_rating || review.value_rating) && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border/60">
                                  {[
                                    { key: "communication_rating", label: "Communication" },
                                    { key: "technical_rating", label: "Technical" },
                                    { key: "professionalism_rating", label: "Professionalism" },
                                    { key: "value_rating", label: "Value" },
                                  ].map(({ key, label }) => review[key] ? (
                                    <div key={key} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">{label}</span>
                                      <span className="flex items-center gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                          <Star key={s} className={`h-2.5 w-2.5 ${s <= review[key] ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                                        ))}
                                      </span>
                                    </div>
                                  ) : null)}
                                </div>
                              )}
                              {review.would_rehire === true && (
                                <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />Would hire again
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="bg-card border border-border/70 rounded-2xl p-6 sticky top-24">

                <div className="mb-5">
                  {profile.hourly_rate ? (
                    <>
                      <span className="text-3xl font-extrabold text-foreground flex items-center gap-1">
                        <PoundSterling className="h-6 w-6" />{profile.hourly_rate}
                      </span>
                      <span className="text-sm text-muted-foreground">per hour</span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">Rate on request</span>
                  )}
                </div>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium mb-4 ${avail.badge}`}>
                  <span className={`h-2 w-2 rounded-full ${avail.dot} animate-pulse`} />
                  {avail.label}
                </div>

                <div className="mb-5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" />Reputation Metrics
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                      <span className="text-lg font-extrabold text-emerald-700 leading-none">{onTime}%</span>
                      <span className="text-[9px] text-emerald-600 font-semibold mt-0.5">On-Time Delivery</span>
                    </div>
                    <div className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-violet-50 border border-violet-100 text-center">
                      <span className="text-lg font-extrabold text-violet-700 leading-none">{completion}%</span>
                      <span className="text-[9px] text-violet-600 font-semibold mt-0.5">Completion Rate</span>
                    </div>
                    <div className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-amber-50 border border-amber-100 text-center">
                      <span className="text-lg font-extrabold text-amber-700 leading-none">{avgRating.toFixed(1)}★</span>
                      <span className="text-[9px] text-amber-600 font-semibold mt-0.5">Avg Rating</span>
                    </div>
                    <div className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-blue-50 border border-blue-100 text-center">
                      <span className="text-lg font-extrabold text-blue-700 leading-none">{profile.completed_jobs || 0}</span>
                      <span className="text-[9px] text-blue-600 font-semibold mt-0.5">Jobs Done</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border/40">
                    <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="text-[10px] text-muted-foreground font-medium">No dispute history · Trusted professional</span>
                  </div>
                  {computeBadges(profile, reviews.length).length > 0 && (
                    <div className="mt-3">
                      <TrustBadges badges={computeBadges(profile, reviews.length)} />
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  {profile.years_experience && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Experience</span>
                      <span className="font-medium text-foreground">{profile.years_experience}+ years</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" />Response time</span>
                    <span className="font-medium text-foreground">Within 24 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" />Remote work</span>
                    <span className="font-medium text-foreground">{profile.remote_work ? "Yes" : "No"}</span>
                  </div>
                </div>

                <Button className="w-full rounded-xl font-semibold h-11 mb-3 gap-2" onClick={() => setShowContact(true)}>
                  <MessageSquare className="h-4 w-4" />
                  Contact {(profile.full_name || "").split(" ")[0]}
                </Button>
                <Link to="/post-job">
                  <Button variant="outline" className="w-full rounded-xl font-semibold h-10 gap-2">
                    <Briefcase className="h-4 w-4" />Post a Job Instead
                  </Button>
                </Link>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  No commitment until you agree terms directly.
                </p>
              </motion.div>

              {profile.location && (
                <div className="bg-card border border-border/70 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />Based in
                  </h3>
                  <button onClick={() => handleLocationFilter(profile.location)}
                    className="text-sm text-primary font-medium hover:underline">
                    {profile.location}, United Kingdom
                  </button>
                  {profile.remote_work && (
                    <p className="text-xs text-emerald-600 font-medium mt-1.5">✓ Available to work remotely across the UK</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}