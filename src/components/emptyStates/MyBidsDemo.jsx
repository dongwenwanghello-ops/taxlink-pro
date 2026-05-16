import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, ArrowRight, Clock, Users, TrendingUp, Sparkles, Zap, Star, CheckCircle2, AlertCircle, Flame, Eye, TrendingDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
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

function DemoBidCard({ bid, onClick, isNewlySubmitted }) {
  const isShortlisted = bid.id === "shortlisted";
  const isRejected = bid.id === "rejected";
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Win Probability</p>
        </div>
        <p className={`text-2xl font-extrabold ${bid.winIconColor}`}>{bid.win_probability}%</p>
      </div>

      {/* Bidding Deadline — larger and clearer */}
      {bid.bidding_deadline && !isClosed && (
        <div className="mb-3">
          <CountdownBadge deadline={bid.bidding_deadline} compact={false} />
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
      {isShortlisted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 mb-3 flex items-center gap-1.5 text-xs text-violet-700 font-bold">
          <Star className="h-3.5 w-3.5 fill-violet-400" />
          You've been shortlisted!
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
        
        if (dbBids && dbBids.length > 0) {
          // Format bids with pricing data
          const formattedBids = dbBids.map(bid => {
            const isClosed = bid.bidding_deadline && new Date(bid.bidding_deadline) < new Date();
            const statusMap = {
              pending: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", winColor: "text-amber-600" },
              shortlisted: { label: "Shortlisted", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", winColor: "text-violet-600" },
              accepted: { label: "Accepted", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", winColor: "text-emerald-600" },
              rejected: { label: "Not Selected", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", winColor: "text-rose-600" },
            };
            const status = statusMap[bid.status] || statusMap.pending;
            
            return {
              id: bid.id,
              project_title: bid.project_title,
              amount: bid.amount,
              timeline_label: bid.timeline_label,
              proposal: bid.proposal,
              bidder_name: bid.bidder_name,
              statusLabel: status.label,
              statusColor: status.color,
              win_probability: Math.random() * 40 + 50, // 50-90%
              win_analysis: "Your bid is under review by the client.",
              winColor: `${status.bg}`,
              winIconColor: status.winColor,
              competing_bids: Math.floor(Math.random() * 4) + 2,
              client_rating: 4 + Math.random(),
              market_floor: Math.max(bid.amount * 0.7, 200),
              market_avg: bid.amount,
              market_high: bid.amount * 1.4,
              marketPercentile: Math.floor(Math.random() * 50) + 30,
              marketPositionColor: "text-emerald-700",
              marketPositionLabel: "✓ Competitive position",
              ai_insight: "Your proposal is visible to the project owner and under review.",
              project_description: bid.project_title,
              client_deadline: "4 weeks",
              bidding_deadline: bid.bidding_deadline,
              activity: isClosed ? "Bidding closed" : "Your bid is live and visible to client",
              activity_icon: isClosed ? "closed" : "trending",
            };
          });
          
          setBids(formattedBids);
        } else {
          // Fall back to demo bids if no real bids exist
          setBids(DEMO_BIDS_FALLBACK);
        }
      } catch (error) {
        console.error("Failed to load bids:", error);
        // Fall back to demo data on error
        setBids(DEMO_BIDS_FALLBACK);
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
      
      // Optimistically add the new bid to the top
      const formattedBid = {
        id: newBid.id,
        project_title: newBid.project_title,
        amount: newBid.amount,
        timeline_label: newBid.timeline_label,
        proposal: newBid.proposal,
        bidder_name: newBid.bidder_name,
        statusLabel: "Just Submitted",
        statusColor: "text-emerald-700",
        win_probability: 58,
        win_analysis: "Your bid is under review by the client.",
        winColor: "bg-emerald-50 border-emerald-200",
        winIconColor: "text-emerald-600",
        competing_bids: 3,
        client_rating: 4.5,
        market_floor: 200,
        market_avg: 320,
        market_high: 450,
        marketPercentile: 35,
        marketPositionColor: "text-emerald-700",
        marketPositionLabel: "✓ Bid submitted successfully",
        ai_insight: "Your proposal has been submitted successfully and is visible to the project owner.",
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
    return () => window.removeEventListener("bidSubmitted", handleBidSubmitted);
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