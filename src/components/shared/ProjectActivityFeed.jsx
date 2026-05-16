import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Clock, Activity, Zap } from "lucide-react";

export default function ProjectActivityFeed({ bids = [] }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!bids || bids.length === 0) return;

    // Generate activity signals from bid data
    const recent = bids.slice(0, 3);
    const newActivities = [];

    // Activity 1: Bid count signal
    if (bids.length > 0) {
      newActivities.push({
        id: `bid-count-${bids.length}`,
        type: "bid_count",
        count: bids.length,
        label: `${bids.length} ${bids.length === 1 ? "bid" : "bids"} submitted`,
        icon: Users,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        timeAgo: "Last 2 hours",
      });
    }

    // Activity 2: Latest bid
    if (recent.length > 0) {
      newActivities.push({
        id: `latest-bid-${recent[0].id}`,
        type: "latest_bid",
        bid: recent[0],
        label: `New bid: £${recent[0].amount}`,
        icon: TrendingUp,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        timeAgo: "Just now",
      });
    }

    // Activity 3: Interest level
    if (bids.length >= 3) {
      newActivities.push({
        id: "interest-surge",
        type: "interest_surge",
        label: "Strong bidder interest detected",
        icon: Zap,
        color: "text-violet-600 bg-violet-50 border-violet-200",
        timeAgo: "Trending",
      });
    }

    setActivities(newActivities);
  }, [bids]);

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-secondary/20 px-4 py-3 text-center text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5 mx-auto mb-1.5 opacity-40" />
        No activity yet — waiting for bids
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Recent Activity</p>
      <AnimatePresence>
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className={`rounded-lg border px-3 py-2.5 flex items-center gap-2.5 text-xs ${activity.color}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight">{activity.label}</p>
                <p className="text-[10px] opacity-70">{activity.timeAgo}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}