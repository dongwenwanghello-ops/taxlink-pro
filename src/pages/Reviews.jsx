import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DEMO_REVIEWS, DEMO_PROFESSIONALS } from "@/lib/demoData";
import { getPostedProjects } from "@/lib/projectStore";
import { getAllBids } from "@/lib/bidStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, CheckCircle2, Plus, X, Loader2, ThumbsUp, MessageSquare, Award, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import StarRating from "../components/shared/StarRating";
import TrustBadges, { computeBadges } from "../components/shared/TrustBadges";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { DemoBadge, DemoNotice, isDemoMode } from "@/lib/demoModeDetector.jsx";

const SERVICE_TYPES = [
  "Self Assessment", "Corporation Tax", "VAT Return", "Bookkeeping",
  "Payroll", "Audit", "Tax Planning", "R&D Tax Credits", "Capital Gains", "Other"
];

const LOCAL_REVIEW_KEY = "taxprouk_verified_reviews";
const REVIEW_TAGS = [
  "Delivered on time",
  "Strong communication",
  "Professional advice",
  "Clear explanations",
  "Responsive",
  "Would hire again",
];

function getLocalReviews() {
  try {
    const reviews = JSON.parse(localStorage.getItem(LOCAL_REVIEW_KEY) || "[]");
    return Array.isArray(reviews) ? reviews : [];
  } catch {
    return [];
  }
}

function saveLocalReview(review) {
  const saved = {
    id: `review_${Date.now()}`,
    created_date: new Date().toISOString(),
    verified: true,
    review_source: "completed_project",
    ...review,
  };
  localStorage.setItem(LOCAL_REVIEW_KEY, JSON.stringify([saved, ...getLocalReviews()]));
  window.dispatchEvent(new CustomEvent("reviewSubmitted", { detail: saved }));
  return saved;
}

function getReviewEligibleProjects() {
  const projects = getPostedProjects();
  const bids = getAllBids();
  const existingReviews = getLocalReviews();

  return projects
    .filter((project) => project.status === "completed" || project.lifecycle_state === "completed" || project.review_available)
    .map((project) => {
      const acceptedBid = bids.find((bid) =>
        bid.project_id === project.id &&
        (bid.status === "accepted" || bid.awarded || bid.id === project.accepted_bid_id || bid.id === project.awarded_bid_id)
      );
      if (!acceptedBid) return null;
      const alreadyReviewed = existingReviews.some((review) => review.project_id === project.id && review.professional_bid_id === acceptedBid.id);
      return {
        project,
        bid: acceptedBid,
        alreadyReviewed,
      };
    })
    .filter(Boolean);
}

const SUB_RATINGS = [
  { key: "communication_rating",   label: "Communication" },
  { key: "technical_rating",       label: "Technical Quality" },
  { key: "professionalism_rating", label: "Professionalism" },
  { key: "value_rating",           label: "Value for Money" },
];

function InteractiveStars({ value, onChange, size = "lg" }) {
  const [hovered, setHovered] = useState(0);
  const s = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none">
          <Star className={`${s} transition-colors ${
            star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"
          }`} />
        </button>
      ))}
    </div>
  );
}

function SubRatingRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
      <InteractiveStars value={value} onChange={onChange} size="sm" />
    </div>
  );
}

function ReviewCard({ review, professionals, index }) {
  const professional = professionals.find(p => p.id === review.professional_id);
  const initials = (review.reviewer_name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const gradients = ["from-blue-500 to-blue-700","from-violet-500 to-violet-700","from-emerald-500 to-emerald-700","from-rose-500 to-rose-700","from-amber-500 to-amber-700"];
  const grad = gradients[index % gradients.length];

  const hasSubs = review.communication_rating || review.technical_rating || review.professionalism_rating || review.value_rating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-foreground">{review.reviewer_name}</span>
            {review.reviewer_company && (
              <span className="text-sm text-muted-foreground">· {review.reviewer_company}</span>
            )}
            {review.verified && (
              <Badge variant="secondary" className="text-xs gap-1 font-normal py-0">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />Verified Client Review
              </Badge>
            )}
            {review.review_source === "completed_project" && (
              <Badge variant="outline" className="text-xs gap-1 font-normal py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="h-3 w-3" />Completed Project Review
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StarRating rating={review.rating} showValue={true} />
            {review.service_type && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{review.service_type}</span>
            )}
            {review.created_date && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reviewed professional link */}
      {professional && (
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <Award className="h-3.5 w-3.5" />
          Review of: {professional.full_name} — {professional.title}
        </div>
      )}
      {!professional && review.professional_name && (
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <Award className="h-3.5 w-3.5" />
          Review of: {review.professional_name}
        </div>
      )}

      {/* Project link */}
      {review.project_title && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Completed project: <span className="font-medium text-foreground">{review.project_title}</span>
        </div>
      )}

      {review.feedback_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.feedback_tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15 text-[10px] font-bold">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
      )}

      {/* Sub-dimension ratings */}
      {hasSubs && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-2 border-t border-border/60">
          {SUB_RATINGS.map(({ key, label }) => {
            const val = review[key];
            if (!val) return null;
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-3 w-3 ${s <= val ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Would rehire */}
      {review.would_rehire === true && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <ThumbsUp className="h-3.5 w-3.5" />Would hire again
        </div>
      )}
    </motion.div>
  );
}

export default function Reviews() {
  const [showForm, setShowForm] = useState(false);
  const [dbReviews, setDbReviews] = useState([]);
  const [localReviews, setLocalReviews] = useState(() => getLocalReviews());
  const [eligibleProjects, setEligibleProjects] = useState(() => getReviewEligibleProjects());
  const [dbProfessionals, setDbProfessionals] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reviewer_name: "",
    reviewer_company: "",
    rating: 0,
    communication_rating: 0,
    technical_rating: 0,
    professionalism_rating: 0,
    value_rating: 0,
    comment: "",
    service_type: "",
    professional_id: "",
    transaction_id: "",
    feedback_tags: [],
    would_rehire: true,
  });

  const refreshEligibility = () => {
    setLocalReviews(getLocalReviews());
    setEligibleProjects(getReviewEligibleProjects());
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [revs, pros] = await Promise.all([
          base44.entities.Review.list("-created_date", 50),
          base44.entities.ProfessionalProfile.list(),
        ]);
        setDbReviews(revs || []);
        setDbProfessionals(pros || []);
      } catch {
        // fall back to demo
      } finally {
        setLoadingReviews(false);
      }
    };
    load();
    window.addEventListener("projectCompleted", refreshEligibility);
    window.addEventListener("reviewSubmitted", refreshEligibility);
    return () => {
      window.removeEventListener("projectCompleted", refreshEligibility);
      window.removeEventListener("reviewSubmitted", refreshEligibility);
    };
  }, []);

  const isUsingDemoData = dbReviews.length === 0 && localReviews.length === 0;
  const mergedRealReviews = [...localReviews, ...dbReviews].filter((review, index, reviews) => {
    const key = review.project_id && review.professional_bid_id
      ? `${review.project_id}:${review.professional_bid_id}`
      : review.id;
    return reviews.findIndex((item) => {
      const itemKey = item.project_id && item.professional_bid_id
        ? `${item.project_id}:${item.professional_bid_id}`
        : item.id;
      return itemKey === key;
    }) === index;
  });
  const allReviews = isUsingDemoData ? DEMO_REVIEWS : mergedRealReviews;
  const allProfessionals = dbProfessionals.length > 0 ? dbProfessionals : DEMO_PROFESSIONALS;
  const reviewableTransactions = eligibleProjects.filter((item) => !item.alreadyReviewed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selected = reviewableTransactions.find((item) => `${item.project.id}:${item.bid.id}` === form.transaction_id);
    if (!selected) return toast.error("Reviews are only available after a completed project.");
    if (!form.rating) return toast.error("Please select an overall star rating.");
    if (form.feedback_tags.length === 0) return toast.error("Please choose at least one structured feedback tag.");
    if (form.comment.trim().length > 240) return toast.error("Please keep review comments under 240 characters for MVP moderation.");

    setSubmitting(true);
    const payload = {
      reviewer_name: "Verified client",
      reviewer_company: "",
      rating: form.rating,
      comment: form.comment.trim(),
      feedback_tags: form.feedback_tags,
      would_rehire: form.feedback_tags.includes("Would hire again"),
      verified: true,
      review_type: "client_to_professional",
      review_source: "completed_project",
      project_id: selected.project.id,
      project_title: selected.project.title,
      professional_bid_id: selected.bid.id,
      professional_id: selected.bid.bidder_profile_id || selected.bid.bidder_id || selected.bid.id,
      professional_name: selected.bid.bidder_name || selected.project.awarded_bidder_name || "Selected professional",
      service_type: selected.project.category?.replace("_", " ") || selected.bid.project_category || "",
    };

    let saved = saveLocalReview(payload);
    try {
      saved = await base44.entities.Review.create(payload);
      setDbReviews(prev => [saved, ...prev]);
    } catch {
      // Local verified review is enough for MVP validation if backend is unavailable.
    }
    setLocalReviews(getLocalReviews());
    toast.success("Verified completed-project review submitted.");
    setShowForm(false);
    setForm({
      reviewer_name: "", reviewer_company: "", rating: 0,
      communication_rating: 0, technical_rating: 0, professionalism_rating: 0, value_rating: 0,
      comment: "", service_type: "", professional_id: "", transaction_id: "", feedback_tags: [], would_rehire: true,
    });
    setSubmitting(false);
  };

  const avgRating = allReviews.length
    ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
    : "—";
  const verifiedCount = allReviews.filter(r => r.verified).length;
  const withSubRatings = allReviews.filter(r => r.communication_rating || r.technical_rating).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Marketplace Trust</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Reviews & Reputation</h1>
              <p className="mt-2 text-muted-foreground max-w-xl">
                Verified completed-project feedback only. Reviews are transaction-based trust signals, not open public comments.
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              disabled={reviewableTransactions.length === 0}
              className="rounded-xl font-semibold gap-2 shrink-0"
            >
              {showForm ? <><X className="h-4 w-4" />Cancel</> : <><Plus className="h-4 w-4" />Review Completed Project</>}
            </Button>
          </div>

          {/* Demo badge in header */}
          {isUsingDemoData && (
            <div className="mt-4 mb-6">
              <DemoBadge />
            </div>
          )}

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { label: "Total Reviews", value: allReviews.length, icon: MessageSquare, color: "text-primary" },
              { label: "Average Rating", value: `${avgRating} ★`, icon: Star, color: "text-amber-500" },
              { label: "Verified Reviews", value: verifiedCount, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Completed Reviews", value: allReviews.filter(r => r.review_source === "completed_project" || r.verified).length, icon: Award, color: "text-violet-500" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-background border border-border/60">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <div className="text-xl font-extrabold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust notice */}
          <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 max-w-2xl">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span><strong>Trust-first MVP:</strong> Only completed projects can create verified reviews. Comments stay short and optional to reduce moderation risk.</span>
          </div>
          {reviewableTransactions.length === 0 && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 max-w-2xl">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Reviews unlock after a project is awarded and the client confirms completion.</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Review form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 rounded-2xl border border-primary/20 bg-card p-6 sm:p-8 shadow-sm"
            >
              {isUsingDemoData && (
                <div className="mb-5">
                  <DemoNotice />
                </div>
              )}
              <h2 className="text-lg font-bold text-foreground mb-1">Review a Completed Project</h2>
              <p className="text-sm text-muted-foreground mb-6">Keep it lightweight: star rating, trust tags, and an optional short comment.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label>Completed project *</Label>
                  <Select value={form.transaction_id} onValueChange={v => setForm({ ...form, transaction_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose a completed project" /></SelectTrigger>
                    <SelectContent>
                      {reviewableTransactions.map(({ project, bid }) => (
                        <SelectItem key={`${project.id}:${bid.id}`} value={`${project.id}:${bid.id}`}>
                          {project.title} — {bid.bidder_name || "Selected professional"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Overall rating */}
                <div className="space-y-2">
                  <Label>Overall Rating *</Label>
                  <InteractiveStars value={form.rating} onChange={r => setForm({ ...form, rating: r })} />
                  {form.rating > 0 && (
                    <p className="text-sm text-muted-foreground">{["","Poor","Fair","Good","Very Good","Excellent"][form.rating]}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Structured feedback tags *</Label>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_TAGS.map((tag) => {
                      const selected = form.feedback_tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setForm((current) => ({
                            ...current,
                            feedback_tags: selected
                              ? current.feedback_tags.filter((item) => item !== tag)
                              : [...current.feedback_tags, tag],
                          }))}
                          className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comment">Short comment (optional)</Label>
                  <Textarea id="comment"
                    placeholder="Optional: one or two professional sentences about the completed work."
                    value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
                    className="h-24" maxLength={240} />
                  <p className="text-xs text-muted-foreground">{form.comment.length}/240 chars</p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button type="submit" className="w-full sm:w-auto rounded-xl font-semibold" disabled={submitting}>
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Review"}
                  </Button>
                  {isUsingDemoData && (
                    <p className="text-xs text-muted-foreground italic">✓ Demo submissions are fully functional and will be saved</p>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review list */}
        {loadingReviews ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {allReviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} professionals={allProfessionals} index={i} />
            ))}
            {allReviews.length === 0 && (
              <div className="text-center py-20">
                <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                <p className="font-semibold text-foreground mb-1">No reviews yet</p>
                <p className="text-sm text-muted-foreground">Be the first to share your experience with a professional on the platform.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}