import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gavel, ArrowRight, Clock, Users, Star, CheckCircle2, AlertCircle,
  Eye, Loader2, LayoutGrid,
} from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { formatBidForDashboard, loadMyBidsDisplay } from "@/lib/myBidsLoader";
import { normalizeBidStatus } from "@/lib/bidLifecycle";
import { getProjectWorkflowBundle } from "@/lib/marketplaceState";
import DemoBidDetailModal from "@/components/demo/DemoBidDetailModal";
import CountdownBadge from "@/components/shared/CountdownBadge.jsx";
import BidLifecycleTimeline from "@/components/shared/BidLifecycleTimeline";

function openWorkspaceForBid(bid) {
  if (bid?.project_id) getProjectWorkflowBundle(bid.project_id);
}

function DemoBidCard({ bid, onClick, isNewlySubmitted }) {
  const normalized = normalizeBidStatus(bid.status, bid);
  const isSelected = normalized === "selected";
  const isShortlisted = normalized === "shortlisted";
  const isRejected = normalized === "rejected";
  const isClosed = isRejected || (bid.bidding_deadline && new Date(bid.bidding_deadline) < new Date());
  const bidId = String(bid.id || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${
        isNewlySubmitted ? "border-emerald-400 shadow-lg shadow-emerald-100 ring-2 ring-emerald-200/50" :
        isSelected ? "border-emerald-300 shadow-md shadow-emerald-100/80" :
        isShortlisted ? "border-violet-300 shadow-sm shadow-violet-100" :
        isRejected ? "border-border/70 opacity-75" :
        "border-border/70 hover:border-primary/30"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {bid.isDemo && (
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]">Example</Badge>
            )}
            {isNewlySubmitted && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
              </motion.div>
            )}
            <Badge variant="outline" className={`text-[10px] border ${bid.statusBadgeClass || "bg-amber-50 border-amber-200 text-amber-800"}`}>
              {bid.statusLabel}
            </Badge>
          </div>
          <h4 className="font-semibold text-foreground truncate text-sm">{bid.project_title}</h4>
          {bid.bidder_headline && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{bid.bidder_headline}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {bidId.startsWith("bid_") ? "Submitted recently" :
             bid.created_date ? "Submitted on this project" :
             "Active on this project"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mb-1">Quote</p>
          <p className="text-2xl font-extrabold text-primary">£{Number(bid.amount || 0).toLocaleString()}</p>
        </div>
      </div>

      {(bid.qualifications?.length > 0 || bid.years_experience || bid.bidder_specialisms?.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {bid.qualifications?.slice(0, 4).map((qualification) => (
            <span key={qualification} className="px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15 text-[10px] font-bold">
              {qualification}
            </span>
          ))}
          {bid.years_experience && (
            <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold">
              {bid.years_experience}
            </span>
          )}
        </div>
      )}

      {bid.bidding_deadline && !isClosed && (
        <div className="mb-3">
          <CountdownBadge deadline={bid.bidding_deadline} startDate={bid.created_date} compact={false} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-secondary/50 px-2.5 py-1.5 text-center text-[10px]">
          <Users className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
          <p className="font-bold text-foreground">{bid.competing_bids <= 2 ? "Low" : bid.competing_bids <= 5 ? "Moderate" : "Active"}</p>
          <p className="text-muted-foreground">interest</p>
        </div>
        <div className="rounded-lg bg-secondary/50 px-2.5 py-1.5 text-center text-[10px]">
          <Star className="h-3 w-3 text-amber-400 mx-auto mb-0.5 fill-amber-400" />
          <p className="font-bold text-foreground">{bid.client_rating}</p>
          <p className="text-muted-foreground">client trust</p>
        </div>
        <div className="rounded-lg bg-secondary/50 px-2.5 py-1.5 text-center text-[10px]">
          <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
          <p className="font-bold text-foreground">{isClosed ? "Closed" : "Live"}</p>
          <p className="text-muted-foreground">status</p>
        </div>
      </div>

      {bid.activity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5 text-xs font-medium border ${
            bid.activity_icon === "eye" ? "bg-blue-50 border-blue-200 text-blue-700" :
            bid.activity_icon === "closed" ? "bg-slate-50 border-slate-200 text-slate-700" :
            "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {bid.activity_icon === "eye" && <Eye className="h-3.5 w-3.5" />}
          {bid.activity}
        </motion.div>
      )}

      {bid.lifecycleSteps?.length > 0 && (
        <div className="mb-3 rounded-lg border border-border/50 bg-muted/20 px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <BidLifecycleTimeline steps={bid.lifecycleSteps} compact />
        </div>
      )}

      {isSelected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 mb-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Your proposal was selected — collaboration can begin.
          </p>
          {bid.project_id && (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/workspace/${bid.project_id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openWorkspaceForBid(bid);
                }}
              >
                <Button type="button" size="sm" className="h-8 rounded-lg text-xs gap-1.5 bg-teal-700 hover:bg-teal-800">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Open workspace
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      )}
      {isShortlisted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 mb-3 flex items-center gap-1.5 text-xs text-violet-700 font-bold">
          <Star className="h-3.5 w-3.5 fill-violet-400" />
          Shortlisted by the client
        </motion.div>
      )}
      {isRejected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 mb-3 flex items-center gap-1.5 text-xs text-rose-700 font-bold">
          <AlertCircle className="h-3.5 w-3.5" />
          Another professional was selected
        </motion.div>
      )}

      <div className="pt-2 border-t border-border/40">
        <button type="button" className="text-primary text-xs font-semibold hover:underline underline-offset-2">
          View details →
        </button>
      </div>
    </motion.div>
  );
}

export default function MyBidsDemo() {
  const [selectedBid, setSelectedBid] = useState(null);
  const [bids, setBids] = useState([]);
  const [showingDemo, setShowingDemo] = useState(false);
  const [newlySubmittedId, setNewlySubmittedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      let userEmail = null;
      try {
        const user = await base44.auth.me();
        userEmail = user?.email || null;
      } catch { /* demo mode */ }

      const { bids: loaded, isDemo } = await loadMyBidsDisplay({ userEmail });
      setBids(loaded);
      setShowingDemo(isDemo);
    } catch (err) {
      console.error("[MyBids] load failed", err);
      const { getDemoBidsForDisplay } = await import("@/lib/myBidsLoader");
      setBids(getDemoBidsForDisplay());
      setShowingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const handleBidSubmitted = (event) => {
      const newBid = event.detail;
      if (!newBid?.id) return;
      const formatted = {
        ...formatBidForDashboard(newBid, 0),
        statusLabel: "Just Submitted",
        statusBadgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800",
      };
      if (!formatted?.id) return;
      setShowingDemo(false);
      setBids((prev) => [formatted, ...prev.filter((b) => b.id !== formatted.id)]);
      setNewlySubmittedId(newBid.id);
      setTimeout(() => setNewlySubmittedId(null), 5000);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleRefresh = () => reload();

    window.addEventListener("bidSubmitted", handleBidSubmitted);
    window.addEventListener("bidUpdated", handleRefresh);
    window.addEventListener("projectAwarded", handleRefresh);
    window.addEventListener("workspaceCreated", handleRefresh);
    return () => {
      window.removeEventListener("bidSubmitted", handleBidSubmitted);
      window.removeEventListener("bidUpdated", handleRefresh);
      window.removeEventListener("projectAwarded", handleRefresh);
      window.removeEventListener("workspaceCreated", handleRefresh);
    };
  }, [reload]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-3">
          <span>📊</span> Your Bids
        </div>
        <h3 className="text-lg font-bold text-foreground">Bid Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          {bids.length} bid{bids.length !== 1 ? "s" : ""} {showingDemo ? "(sample examples)" : "submitted"}
        </p>
        {showingDemo && (
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Submit a quote on an open project to replace these examples with your live bids.
          </p>
        )}
      </div>

      {bids.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Gavel className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-foreground">No bids yet</p>
            <p className="text-xs text-muted-foreground">Start submitting quotes to see them here</p>
          </div>
          <Link to="/jobs">
            <Button className="rounded-xl gap-2">Browse open projects</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid, i) => (
            <motion.div key={bid.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.08, 0.4) }}>
              <DemoBidCard
                bid={bid}
                onClick={() => setSelectedBid(bid)}
                isNewlySubmitted={newlySubmittedId === bid.id}
              />
            </motion.div>
          ))}
        </div>
      )}

      {(() => {
        const selected = bids.find((b) => normalizeBidStatus(b.status, b) === "selected" && b.project_id);
        if (selected?.project_id) {
          return (
            <div className="space-y-2 pt-2">
              <Link
                to={`/workspace/${selected.project_id}`}
                onClick={() => openWorkspaceForBid(selected)}
              >
                <Button className="w-full h-11 rounded-xl font-semibold gap-2 bg-teal-700 hover:bg-teal-800">
                  <LayoutGrid className="h-4 w-4" />
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/workspaces">
                <Button variant="outline" className="w-full h-9 rounded-xl text-xs">
                  All workspaces
                </Button>
              </Link>
            </div>
          );
        }
        return (
          <Link to="/jobs">
            <Button variant="outline" className="w-full h-11 rounded-xl font-semibold gap-2">
              <Gavel className="h-4 w-4" />
              Browse open projects
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        );
      })()}

      {selectedBid && (
        <DemoBidDetailModal bid={selectedBid} onClose={() => setSelectedBid(null)} />
      )}
    </div>
  );
}
