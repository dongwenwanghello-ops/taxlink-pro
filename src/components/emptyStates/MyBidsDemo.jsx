import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, ArrowRight, Clock, Users, TrendingUp, Sparkles, Zap, Star, CheckCircle2, AlertCircle, Flame, Eye, TrendingDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getAllBids } from "@/lib/bidStore";
import { computeBidCompetitiveness } from "@/lib/winProbabilityEngine";
import DemoBidDetailModal from "@/components/demo/DemoBidDetailModal";
import CountdownBadge from "@/components/shared/CountdownBadge.jsx";

// Demo bid data with multiple states
const DEMO_BIDS_FALLBACK = [
  {
    id: "pending",
    project_title: "Self Assessment Tax Return 2023/24",
    amount: 280,
    timeline_label: "Within 3 days",
    statusLabel: "Pending Review",
    statusColor: "text-amber-700",
    win_probability: 62,
    win_analysis: "Strong competitive position with market-aligned pricing.",
    winColor: "bg-amber-50 border-amber-200",
    winIconColor: "text-amber-600",
    competing_bids: 4,
    client_rating: 4.7,
    market_floor: 200,
    market_avg: 320,
    market_high: 450,
    marketPercentile: 35,
    marketPositionColor: "text-emerald-700",
    marketPositionLabel: "✓ 12% below market average — competitive position",
    ai_insight: "Your quote is well-positioned against competition. Client has 95% payment reliability and strong communication history.",
    project_description: "Personal self-assessment tax return including employment income, dividend payments, and basic investment gains.",
    client_deadline: "4 weeks",
    competing_bids: 4,
    bidding_deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    activity: "Client viewed your proposal 2 hours ago",
    activity_icon: "eye",
  },
  {
    id: "shortlisted",
    project_title: "Corporation Tax Return — Ltd Company",
    amount: 550,
    timeline_label: "Within 1 week",
    statusLabel: "Shortlisted",
    statusColor: "text-violet-700",
    win_probability: 78,
    win_analysis: "Client shortlisted your bid—strong chance of selection.",
    winColor: "bg-violet-50 border-violet-200",
    winIconColor: "text-violet-600",
    competing_bids: 2,
    client_rating: 4.9,
    market_floor: 450,
    market_avg: 650,
    market_high: 850,
    marketPercentile: 42,
    marketPositionColor: "text-emerald-700",
    marketPositionLabel: "✓ Within market range with premium qualifications",
    ai_insight: "You're shortlisted alongside 2 other professionals. Client appears to value technical expertise—leverage your certifications.",
    project_description: "Full corporation tax return including VAT reconciliation, directors' loans, and capital allowances computation.",
    client_deadline: "3 weeks",
    competing_bids: 3,
    bidding_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    activity: "You're leading the competition",
    activity_icon: "trending",
  },
  {
    id: "rejected",
    project_title: "Payroll Setup & Processing",
    amount: 180,
    timeline_label: "Ongoing retainer",
    statusLabel: "Not Selected",
    statusColor: "text-rose-600",
    win_probability: 35,
    win_analysis: "Another professional was selected, but valuable feedback available.",
    winColor: "bg-rose-50 border-rose-200",
    winIconColor: "text-rose-600",
    competing_bids: 6,
    client_rating: 4.2,
    market_floor: 200,
    market_avg: 350,
    market_high: 500,
    marketPercentile: 28,
    marketPositionColor: "text-amber-700",
    marketPositionLabel: "→ Price below market, but high competition won",
    ai_insight: "Winner quoted £320 (higher, but with faster response time). Consider adding accelerated timeline or bundle services for retainers.",
    project_description: "Monthly payroll processing for 15 employees, RTI submissions, and monthly tax remittance guidance.",
    client_deadline: "Ongoing",
    competing_bids: 6,
    bidding_deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    activity: "Bidding closed",
    activity_icon: "closed",
  },
];

function getCompetitivenessColors(tone, statusBg) {
  if (tone === "high" || tone === "strong") return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" };
  if (tone === "competitive") return { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" };
  if (tone === "watch") return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" };
  if (tone === "low") return { bg: "bg-rose-50 border-rose-200", text: "text-rose-700" };
  return { bg: statusBg, text: "text-amber-600" };
}

function enrichBidWithCompetitiveness(bid, status, options = {}) {
  const competingBids = options.competingBids ?? bid.competing_bids ?? Math.max(1, options.index + 2);
  const clientTrustScore = bid.client_trust_score ?? bid.clientTrustScore ?? 0.86;
  const result = computeBidCompetitiveness({
    amount: bid.amount,
    budgetAmount: bid.budget_amount || bid.starting_bid || Math.round(Number(bid.amount || 0) * 1.12),
    proposal: bid.proposal || "",
    timeline: bid.timeline,
    bidCount: competingBids,
    urgency: bid.urgency || "standard",
    category: bid.project_category || bid.category || "other",
    complexity: bid.complexity || "medium",
    qualifications: bid.qualifications || bid.bidder_quals || bid.professional_credentials?.qualifications || [],
    rating: bid.bidder_rating || bid.rating || 0,
    completedJobs: bid.completed_jobs || bid.completedJobs || 0,
    yearsExperience: bid.years_experience || bid.experience_label || bid.professional_credentials?.years_experience,
    onTimeCompletionRate: bid.on_time_completion_rate || bid.onTimeCompletionRate || 0.8,
    clientTrustScore,
    submittedAt: bid.created_date,
    projectCreatedAt: bid.project_created_date,
  });
  const colors = getCompetitivenessColors(result?.probabilityRange?.tone, status.bg);
  const topInsight = result?.insights?.[0]?.text || "Your bid is under review by the client.";

  return {
    win_probability: result?.displayRange || "30-45%",
    win_label: result?.label || "Outside chance",
    win_analysis: result?.summary || "Outcome depends on client comparison and proposal fit.",
    winColor: colors.bg,
    winIconColor: colors.text,
    competing_bids: competingBids,
    client_rating: `${Math.round(clientTrustScore * 100)}%`,
    market_floor: Math.max(Number(bid.amount || 0) * 0.78, 200),
    market_avg: result?.market?.marketAverage || Number(bid.amount || 0),
    market_high: Number(bid.amount || 0) * 1.3,
    marketPercentile: result ? Math.round(result.score) : 45,
    marketPositionColor: colors.text,
    marketPositionLabel: result?.label ? `${result.label} (${result.displayRange})` : "Competitiveness estimated",
    ai_insight: topInsight,
  };
}

function DemoBidCard({ bid, onClick, isNewlySubmitted }) {
  const isAccepted = bid.status === "accepted" || bid.statusLabel === "Accepted";
  const isShortlisted = bid.status === "shortlisted" || bid.id === "shortlisted";
  const isRejected = bid.status === "rejected" || bid.id === "rejected";
  const isClosed = isRejected || (bid.bidding_deadline && new Date(bid.bidding_deadline) < new Date());
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${
        isNewlySubmitted ? "border-emerald-400 shadow-lg shadow-emerald-100 ring-2 ring-emerald-200/50" :
        isShortlisted ? "border-violet-300 shadow-sm shadow-violet-100" : 
        isRejected ? "border-border/70 opacity-75" : 
        "border-border/70 hover:border-primary/30"
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200">Demo</Badge>
            {isNewlySubmitted && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
              </motion.div>
            )}
            <Badge 
              variant="outline" 
              className={`text-[10px] ${
                isShortlisted ? "bg-violet-50 border-violet-200 text-violet-700" :
                isRejected ? "bg-rose-50 border-rose-200 text-rose-700" :
                "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              {bid.statusLabel}
            </Badge>
          </div>
          <h4 className="font-semibold text-foreground truncate text-sm">{bid.project_title}</h4>
          {bid.bidder_headline && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{bid.bidder_headline}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {bid.id.startsWith("new_") ? `Just submitted now` :
             bid.id === "pending" ? "Submitted 2 hours ago" : 
             bid.id === "shortlisted" ? "Shortlisted 8 hours ago" : 
             "Not selected — 1 day ago"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mb-1">Quote</p>
          <p className="text-2xl font-extrabold text-primary">£{bid.amount}</p>
        </div>
      </div>

      {/* Win Probability */}
      <div className={`rounded-xl p-3 mb-3 flex items-center justify-between ${bid.winColor} border`}>
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${bid.winIconColor}`} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Bid Competitiveness</p>
            {bid.win_label && <p className={`text-xs font-bold ${bid.winIconColor}`}>{bid.win_label}</p>}
          </div>
        </div>
        <p className={`text-xl font-extrabold ${bid.winIconColor}`}>
          {typeof bid.win_probability === "number" ? `${bid.win_probability}%` : bid.win_probability}
        </p>
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
          {bid.bidder_specialisms?.slice(0, 2).map((specialism) => (
            <span key={specialism} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-bold">
              {specialism}
            </span>
          ))}
        </div>
      )}

      {/* Bidding Deadline — larger and clearer */}
      {bid.bidding_deadline && !isClosed && (
        <div className="mb-3">
          <CountdownBadge deadline={bid.bidding_deadline} startDate={bid.created_date} compact={false} />
        </div>
      )}

      {/* Competition Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-secondary/50 px-2.5 py-1.5 text-center text-[10px]">
          <Users className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
          <p className="font-bold text-foreground">{bid.competing_bids}</p>
          <p className="text-muted-foreground">competitors</p>
        </div>
        <div className="rounded-lg bg-secondary/50 px-2.5 py-1.5 text-center text-[10px]">
          <Star className="h-3 w-3 text-amber-400 mx-auto mb-0.5 fill-amber-400" />
          <p className="font-bold text-foreground">{bid.client_rating}</p>
          <p className="text-muted-foreground">client trust</p>
        </div>
        <div className={`rounded-lg px-2.5 py-1.5 text-center text-[10px] ${
          bid.id === "shortlisted" ? "bg-violet-50 border border-violet-200" :
          bid.id === "rejected" ? "bg-rose-50 border border-rose-200" :
          "bg-amber-50 border border-amber-200"
        }`}>
          <Clock className={`h-3.5 w-3.5 mx-auto mb-0.5 ${
            bid.id === "shortlisted" ? "text-violet-600" :
            bid.id === "rejected" ? "text-rose-600" :
            "text-amber-600"
          }`} />
          <p className={`font-bold ${
            bid.id === "shortlisted" ? "text-violet-700" :
            bid.id === "rejected" ? "text-rose-700" :
            "text-amber-700"
          }`}>{bid.id === "pending" ? "18h" : bid.id === "shortlisted" ? "5d" : "Closed"}</p>
          <p className="text-muted-foreground text-[9px]">{bid.id === "pending" || bid.id === "shortlisted" ? "left" : ""}</p>
        </div>
      </div>

      {/* Live Activity Signal */}
      {bid.activity && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className={`rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5 text-xs font-semibold border ${
            bid.activity_icon === "eye" ? "bg-blue-50 border-blue-200 text-blue-700" :
            bid.activity_icon === "trending" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
            "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          {bid.activity_icon === "eye" && <Eye className="h-3.5 w-3.5" />}
          {bid.activity_icon === "trending" && <TrendingUp className="h-3.5 w-3.5" />}
          {bid.activity_icon === "closed" && <AlertCircle className="h-3.5 w-3.5" />}
          {bid.activity}
        </motion.div>
      )}

      {/* Status Badge */}
      {isAccepted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 mb-3 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Congratulations — your proposal has been selected by the client.
        </motion.div>
      )}
      {isShortlisted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 mb-3 flex items-center gap-1.5 text-xs text-violet-700 font-bold">
          <Star className="h-3.5 w-3.5 fill-violet-400" />
          You've been shortlisted!
        </motion.div>
      )}
      {isRejected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 mb-3 flex items-center gap-1.5 text-xs text-rose-700 font-bold">
          <AlertCircle className="h-3.5 w-3.5" />
          Project awarded to another professional.
        </motion.div>
      )}

      {/* View Details */}
      <div className="pt-2 border-t border-border/40">
        <button className="text-primary text-xs font-semibold hover:underline underline-offset-2">
          View details →
        </button>
      </div>
    </motion.div>
  );
}

export default function MyBidsDemo() {
  const [selectedBid, setSelectedBid] = useState(null);
  const [bids, setBids] = useState([]);
  const [newlySubmittedId, setNewlySubmittedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load bids from database on mount
  useEffect(() => {
    const loadBids = async () => {
      try {
        setLoading(true);
        // Load real bids from database, sorted newest first
        const dbBids = await base44.entities.Bid.list("-created_date", 100);
        const localBids = getAllBids();
        const dbIds = new Set((dbBids || []).map((bid) => bid.id));
        const allBids = [
          ...(dbBids || []),
          ...localBids.filter((bid) => !dbIds.has(bid.id)),
        ].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        
        if (allBids.length > 0) {
          // Format bids with pricing data
          const formattedBids = allBids.map(bid => {
            const isClosed = bid.bidding_deadline && new Date(bid.bidding_deadline) < new Date();
            const statusMap = {
              pending: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", winColor: "text-amber-600" },
              shortlisted: { label: "Shortlisted", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", winColor: "text-violet-600" },
              accepted: { label: "Accepted", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", winColor: "text-emerald-600" },
              rejected: { label: "Not Selected", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", winColor: "text-rose-600" },
            };
            const status = statusMap[bid.status] || statusMap.pending;
            const accepted = bid.status === "accepted";
            const rejected = bid.status === "rejected";
            
            const competitiveness = enrichBidWithCompetitiveness(bid, status, { index: allBids.indexOf(bid) });

            return {
              id: bid.id,
              project_id: bid.project_id,
              status: bid.status,
              project_title: bid.project_title,
              amount: bid.amount,
              timeline_label: bid.timeline_label,
              proposal: bid.proposal,
              bidder_name: bid.bidder_name,
              bidder_headline: bid.bidder_headline || bid.professional_credentials?.headline,
              bidder_specialisms: bid.bidder_specialisms || bid.professional_credentials?.specialisations || [],
              qualifications: bid.qualifications || bid.bidder_quals || bid.professional_credentials?.qualifications || [],
              years_experience: bid.years_experience || bid.experience_label || bid.professional_credentials?.years_experience,
              statusLabel: status.label,
              statusColor: status.color,
              ...competitiveness,
              project_description: bid.project_title,
              client_deadline: "4 weeks",
              bidding_deadline: bid.bidding_deadline,
              activity: accepted
                ? "Congratulations — your proposal has been selected by the client."
                : rejected
                  ? "Project awarded to another professional"
                  : isClosed ? "Bidding closed" : "Your bid is live and visible to client",
              activity_icon: accepted ? "trending" : (rejected || isClosed) ? "closed" : "trending",
            };
          });
          
          setBids(formattedBids);
        } else {
          // Fall back to demo bids if no real bids exist
          setBids(DEMO_BIDS_FALLBACK);
        }
      } catch (error) {
        console.error("Failed to load bids:", error);
        const localBids = getAllBids();
        if (localBids.length > 0) {
          setBids(localBids.map((bid, index) => {
            const status = { bg: "bg-amber-50 border-amber-200" };
            const competitiveness = enrichBidWithCompetitiveness(bid, status, { index });
            return {
              id: bid.id,
              project_id: bid.project_id,
              status: bid.status,
              project_title: bid.project_title,
              amount: bid.amount,
              timeline_label: bid.timeline_label,
              proposal: bid.proposal,
              bidder_name: bid.bidder_name,
              bidder_headline: bid.bidder_headline || bid.professional_credentials?.headline,
              bidder_specialisms: bid.bidder_specialisms || bid.professional_credentials?.specialisations || [],
              qualifications: bid.qualifications || bid.bidder_quals || bid.professional_credentials?.qualifications || [],
              years_experience: bid.years_experience || bid.experience_label || bid.professional_credentials?.years_experience,
              statusLabel: "Pending Review",
              statusColor: "text-amber-700",
              ...competitiveness,
              project_description: bid.project_title,
              client_deadline: "4 weeks",
              bidding_deadline: bid.bidding_deadline,
              activity: "Your bid is live and visible to client",
              activity_icon: "trending",
            };
          }));
        } else {
          setBids(DEMO_BIDS_FALLBACK);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBids();
  }, []);

  // Listen for newly submitted bids and reload
  useEffect(() => {
    const handleBidSubmitted = (event) => {
      const newBid = event.detail;
      const status = { bg: "bg-emerald-50 border-emerald-200" };
      const competitiveness = enrichBidWithCompetitiveness(newBid, status, { index: 0 });
      
      // Optimistically add the new bid to the top
      const formattedBid = {
        id: newBid.id,
        project_id: newBid.project_id,
        status: newBid.status || "pending",
        project_title: newBid.project_title,
        amount: newBid.amount,
        timeline_label: newBid.timeline_label,
        proposal: newBid.proposal,
        bidder_name: newBid.bidder_name,
        bidder_headline: newBid.bidder_headline || newBid.professional_credentials?.headline,
        bidder_specialisms: newBid.bidder_specialisms || newBid.professional_credentials?.specialisations || [],
        qualifications: newBid.qualifications || newBid.bidder_quals || newBid.professional_credentials?.qualifications || [],
        years_experience: newBid.years_experience || newBid.experience_label || newBid.professional_credentials?.years_experience,
        statusLabel: "Just Submitted",
        statusColor: "text-emerald-700",
        ...competitiveness,
        project_description: newBid.project_title,
        client_deadline: "4 weeks",
        bidding_deadline: newBid.bidding_deadline,
        activity: "Your bid is live and visible to client",
        activity_icon: "trending",
      };

      // Add new bid to top
      setBids(prevBids => [formattedBid, ...prevBids]);
      setNewlySubmittedId(newBid.id);

      // Highlight for 5 seconds then fade
      setTimeout(() => setNewlySubmittedId(null), 5000);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener("bidSubmitted", handleBidSubmitted);
    const handleBidUpdated = (event) => {
      const detail = event.detail || {};
      const projectId = detail.projectId || detail.project?.id;
      const winningBidId = detail.winningBidId || detail.bid?.id;
      if (!projectId) return;
      setBids((current) => current.map((bid) => {
        if (bid.project_id !== projectId) return bid;
        const accepted = bid.id === winningBidId;
        return {
          ...bid,
          status: accepted ? "accepted" : "rejected",
          statusLabel: accepted ? "Accepted" : "Not Selected",
          statusColor: accepted ? "text-emerald-700" : "text-rose-600",
          activity: accepted
            ? "Congratulations — your proposal has been selected by the client."
            : "Project awarded to another professional",
          activity_icon: accepted ? "trending" : "closed",
        };
      }));
    };
    window.addEventListener("bidUpdated", handleBidUpdated);
    window.addEventListener("projectAwarded", handleBidUpdated);
    return () => {
      window.removeEventListener("bidSubmitted", handleBidSubmitted);
      window.removeEventListener("bidUpdated", handleBidUpdated);
      window.removeEventListener("projectAwarded", handleBidUpdated);
    };
  }, []);

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
        <p className="text-sm text-muted-foreground">{bids.length} bid{bids.length !== 1 ? "s" : ""} submitted</p>
      </div>

      {bids.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Gavel className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-foreground">No bids yet</p>
            <p className="text-xs text-muted-foreground">Start submitting quotes to see them here</p>
          </div>
        </div>
      ) : (
        <>
          {/* Bid Cards */}
          <div className="space-y-4">
            {bids.map((bid, i) => (
              <motion.div key={bid.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <DemoBidCard 
                  bid={bid} 
                  onClick={() => setSelectedBid(bid)}
                  isNewlySubmitted={newlySubmittedId === bid.id}
                />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {bids.length > 0 && (
        <>
          {/* Features Section */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="rounded-lg bg-secondary/30 border border-border/40 p-3 space-y-1.5">
              <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                Win Probability
              </p>
              <p className="text-[11px] text-muted-foreground">AI-calculated odds based on market analysis</p>
            </div>
            <div className="rounded-lg bg-secondary/30 border border-border/40 p-3 space-y-1.5">
              <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                Market Insights
              </p>
              <p className="text-[11px] text-muted-foreground">Real-time pricing competitiveness</p>
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      <Link to="/jobs">
        <Button variant="outline" className="w-full h-11 rounded-xl font-semibold gap-2">
          <Gavel className="h-4 w-4" />
          Browse Open Projects
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      {/* Modal */}
      {selectedBid && (
        <DemoBidDetailModal bid={selectedBid} onClose={() => setSelectedBid(null)} />
      )}
    </div>
  );
}