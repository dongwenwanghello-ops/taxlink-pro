import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Clock, Users, Star, TrendingUp, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Must sit above FeedbackWidget (z-[60]) so footer CTAs receive clicks */
const MODAL_LAYER = "z-[10050]";

export default function DemoBidDetailModal({ bid, onClose }) {
  const navigate = useNavigate();

  const handleBrowseProjects = () => {
    onClose();
    navigate("/jobs");
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 ${MODAL_LAYER} flex items-end sm:items-center justify-center p-4 pointer-events-none`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          className="absolute inset-0 z-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
          aria-hidden
        />
        <motion.div
          className="relative z-10 pointer-events-auto w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">{bid.project_title}</p>
              <Badge variant="outline" className="text-[10px]">Demo Example</Badge>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 min-h-0 p-5 space-y-5 overscroll-contain">

            {/* Your Bid Summary */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-foreground">Your Quote</p>
                <p className="text-3xl font-extrabold text-primary">£{bid.amount}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">Timeline</p>
                  <p className="text-sm font-bold text-foreground">{bid.timeline_label}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">Status</p>
                  <p className={`text-sm font-bold ${bid.statusColor}`}>{bid.statusLabel}</p>
                </div>
              </div>
            </div>

            {(bid.qualifications?.length > 0 || bid.years_experience) && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Professional Credentials</p>
                <div className="flex flex-wrap gap-1.5">
                  {bid.qualifications?.map((qualification) => (
                    <span key={qualification} className="px-2.5 py-1 rounded-full bg-white border border-primary/15 text-primary text-xs font-bold">
                      {qualification}
                    </span>
                  ))}
                  {bid.years_experience && (
                    <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold">
                      {bid.years_experience} experience
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Win Probability */}
            <div className={`rounded-xl border p-4 space-y-3 ${bid.winColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${bid.winIconColor}`} />
                  <span className="font-semibold text-xs uppercase tracking-widest">Bid Competitiveness</span>
                </div>
                <p className={`text-2xl font-extrabold ${bid.winIconColor}`}>
                  {typeof bid.win_probability === "number" ? `${Math.round(bid.win_probability)}%` : bid.win_probability}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{bid.win_analysis}</p>
            </div>

            {/* Market Position */}
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-widest">Market Position</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Quote</span>
                  <span className="font-bold text-foreground">£{bid.amount}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
                  <div className="absolute h-full bg-primary/20 w-full" />
                  <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${bid.marketPercentile}%` }} transition={{ duration: 0.6 }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Market floor: £{bid.market_floor}</span>
                  <span>Market avg: £{bid.market_avg}</span>
                  <span>Market high: £{bid.market_high}</span>
                </div>
              </div>
              <p className={`text-xs font-semibold ${bid.marketPositionColor}`}>
                {bid.marketPositionLabel}
              </p>
            </div>

            {/* Competition Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-center">
                <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-extrabold text-foreground">{bid.competing_bids}</p>
                <p className="text-[10px] text-muted-foreground">competing bids</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-center">
                <Star className="h-4 w-4 text-amber-400 mx-auto mb-1 fill-amber-400" />
                <p className="text-lg font-extrabold text-foreground">{bid.client_rating}</p>
                <p className="text-[10px] text-muted-foreground">client trust</p>
              </div>
            </div>

            {/* AI Insight */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                AI Insight
              </p>
              <p className="text-xs text-emerald-700 leading-relaxed">{bid.ai_insight}</p>
            </div>

            {/* Project Description (Sample) */}
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Project Details</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{bid.project_description}</p>
            </div>

            {/* Timeline Info */}
            <div className="rounded-xl border border-border/70 p-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Timeline</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your delivery</span>
                  <span className="font-bold text-foreground">{bid.timeline_label}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Client deadline</span>
                  <span className="font-bold text-foreground">{bid.client_deadline}</span>
                </div>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>This is a demo example.</strong> Submit your first real bid on open projects to see actual win probabilities and AI insights.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-20 border-t border-border/40 px-5 py-4 flex gap-3 shrink-0 bg-secondary/20">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl text-sm">
              Close
            </Button>
            <Button
              type="button"
              onClick={handleBrowseProjects}
              className="flex-1 h-10 rounded-xl text-sm bg-gradient-to-r from-violet-600 to-primary border-0 hover:shadow-lg hover:shadow-primary/30"
            >
              Browse Open Projects
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}