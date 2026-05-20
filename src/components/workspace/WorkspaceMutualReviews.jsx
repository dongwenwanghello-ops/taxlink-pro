import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CLIENT_REVIEW_TAGS, PROFESSIONAL_REVIEW_TAGS } from "@/lib/workspaceStore";
import { cn } from "@/lib/utils";

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5" aria-label={`${n} stars`}>
          <Star className={cn("h-6 w-6", n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
        </button>
      ))}
    </div>
  );
}

export default function WorkspaceMutualReviews({ workspace, userRole, onSubmitReview }) {
  const reviews = workspace?.reviews || {};
  const myReview = reviews[userRole];
  const theirReview = userRole === "client" ? reviews.professional : reviews.client;
  const tags = userRole === "client" ? CLIENT_REVIEW_TAGS : PROFESSIONAL_REVIEW_TAGS;
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState("");

  if (workspace?.completion_phase !== "completed" && workspace?.workflow_status !== "completed") {
    return null;
  }

  if (myReview) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
        <p className="text-sm font-bold text-slate-900">Your review submitted</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={cn("h-4 w-4", n <= myReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
          ))}
        </div>
        {myReview.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {myReview.tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-emerald-200">{t}</span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">
          {theirReview ? "The other party has also left a review." : "Waiting for the other party's review."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-3">
      <p className="text-sm font-bold text-slate-900">
        {userRole === "client" ? "Review your accountant" : "Review your client"}
      </p>
      <p className="text-xs text-slate-600">
        {userRole === "client"
          ? "Rate communication, expertise, timeliness, and professionalism."
          : "Rate responsiveness, document readiness, and communication."}
      </p>
      <StarPicker value={rating} onChange={setRating} />
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const on = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTags((t) => (on ? t.filter((x) => x !== tag) : [...t, tag]))}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                on ? "bg-violet-600 text-white border-violet-600" : "bg-white border-violet-200 text-violet-800",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional short comment (max 500 characters)"
        rows={2}
        className="text-sm resize-none bg-white"
        maxLength={500}
      />
      <Button size="sm" className="w-full rounded-lg" onClick={() => onSubmitReview?.({ rating, tags: selectedTags, comment })}>
        Submit verified review
      </Button>
    </div>
  );
}
