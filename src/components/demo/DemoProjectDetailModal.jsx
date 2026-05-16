import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Users, TrendingUp, Zap, CheckCircle2, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DemoProjectDetailModal({ project, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground line-clamp-1">{project.title}</p>
              <Badge variant="outline" className="text-[10px]">Demo Example</Badge>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-5 space-y-5">

            {/* Budget & Status */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Budget</p>
                <p className="text-3xl font-extrabold text-primary">£{project.budget}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full animate-pulse ${project.statusColor}`} />
                <p className={`text-sm font-bold ${project.statusColor}`}>{project.statusLabel}</p>
              </div>
            </div>

            {/* Activity Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-center">
                <Users className="h-4 w-4 text-violet-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-violet-700">{project.bids_received}</p>
                <p className="text-[10px] text-muted-foreground">bids received</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                <TrendingUp className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-blue-700">{project.views}</p>
                <p className="text-[10px] text-muted-foreground">project views</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                <Clock className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-amber-700">{project.time_left}</p>
                <p className="text-[10px] text-muted-foreground">time left</p>
              </div>
            </div>

            {/* Project Description */}
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4 space-y-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
            </div>

            {/* Bid Activity Feed */}
            <div className="rounded-xl border border-border/70 p-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Recent Activity</p>
              <div className="space-y-2">
                {project.recent_activity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b border-border/40 last:border-0 last:pb-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                    <span>{activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Insight */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Market Insight
              </p>
              <p className="text-xs text-emerald-700 leading-relaxed">{project.market_insight}</p>
            </div>

            {/* Bid Details Sample */}
            <div className="rounded-xl border border-border/70 p-4 space-y-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Sample Bid Received</p>
              {project.sample_bid && (
                <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{project.sample_bid.bidder_name}</p>
                    <p className="text-base font-extrabold text-primary">£{project.sample_bid.amount}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.sample_bid.timeline}</p>
                  <p className="text-xs text-muted-foreground italic">{project.sample_bid.proposal}</p>
                </div>
              )}
            </div>

            {/* Demo Notice */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>This is a demo example.</strong> Post your first real project to see actual bids and real-time marketplace activity.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 px-5 py-4 flex gap-3 shrink-0 bg-secondary/20">
            <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl text-sm">
              Close
            </Button>
            <Button className="flex-1 h-10 rounded-xl text-sm bg-gradient-to-r from-violet-600 to-primary border-0">
              Post a Project
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}