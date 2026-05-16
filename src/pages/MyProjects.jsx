import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Clock, Users, CheckCircle2, XCircle, Star, ChevronDown, ChevronUp, Gavel, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import MyProjectsDemo from "@/components/emptyStates/MyProjectsDemo";
import ProjectActivityFeed from "@/components/shared/ProjectActivityFeed";

const STATUS_CONFIG = {
  open:        { label: "Open for Bids", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  closed:      { label: "Closed",        color: "bg-secondary text-muted-foreground border-border" },
};

const BID_STATUS = {
  pending:     { label: "Pending",     color: "bg-secondary text-secondary-foreground" },
  shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700" },
  accepted:    { label: "Accepted",    color: "bg-emerald-100 text-emerald-700" },
  rejected:    { label: "Rejected",    color: "bg-rose-100 text-rose-600" },
};

function ProjectRow({ project, bids }) {
  const [expanded, setExpanded] = useState(false);
  const projectBids = bids.filter(b => b.project_id === project.id);
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.open;
  const postedAgo = project.created_date ? formatDistanceToNow(new Date(project.created_date), { addSuffix: true }) : null;

  return (
    <div className="bg-card border border-border/70 rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              {project.category && (
                <Badge variant="outline" className="text-xs">{project.category.replace("_", " ")}</Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground leading-snug">{project.title}</h3>
            {postedAgo && <p className="text-xs text-muted-foreground mt-1">Posted {postedAgo}</p>}
          </div>
          <div className="shrink-0 text-right">
            {project.budget_amount && (
              <p className="font-extrabold text-primary text-lg">£{project.budget_amount.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground">{projectBids.length} bid{projectBids.length !== 1 ? "s" : ""} received</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline underline-offset-2"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Hide bids" : `View ${projectBids.length} bid${projectBids.length !== 1 ? "s" : ""}`}
          </button>
          <Link to={`/projects/${project.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View project →
          </Link>
        </div>
      </div>

      <AnimatePresence initial={false}>
         {expanded && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="overflow-hidden"
           >
             <div className="border-t border-border/40 px-5 py-4 space-y-4">
               {/* Activity Feed */}
               <ProjectActivityFeed bids={projectBids} />

               {/* Bids List */}
               <div className="space-y-3">
                 {projectBids.length === 0 ? (
                   <div className="text-center py-6">
                     <Gavel className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">No bids yet — professionals will bid soon.</p>
                   </div>
                 ) : (
                   <>
                     <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">All Bids</p>
                     {projectBids.map((bid, i) => {
                       const bCfg = BID_STATUS[bid.status] || BID_STATUS.pending;
                       return (
                         <div key={bid.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-sm font-semibold text-foreground">{bid.bidder_name || "Anonymous"}</span>
                               {bid.bidder_qual && (
                                 <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{bid.bidder_qual}</span>
                               )}
                             </div>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <Clock className="h-3 w-3" />
                               <span>{bid.timeline_label || bid.timeline}</span>
                             </div>
                             {bid.proposal && (
                               <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{bid.proposal}</p>
                             )}
                           </div>
                           <div className="shrink-0 text-right space-y-1.5">
                             <p className="text-base font-extrabold text-primary">£{bid.amount?.toLocaleString()}</p>
                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${bCfg.color}`}>
                               {bCfg.label}
                             </span>
                           </div>
                         </div>
                       );
                     })}
                   </>
                 )}
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [bids, setBids] = useState([]);

  const loadProjects = async () => {
    try {
      const user = await base44.auth.me();
      const results = await base44.entities.JobPost.filter({ created_by: user.email }, "-created_date", 100);
      setProjects(results);
    } catch {
      setProjects([]);
    }
  };

  const loadBids = async () => {
    try {
      const results = await base44.entities.Bid.list("-created_date", 200);
      setBids(results);
    } catch {}
  };

  useEffect(() => {
    loadProjects();
    loadBids();
    const refresh = () => { loadProjects(); loadBids(); };
    window.addEventListener("projectPosted", refresh);
    window.addEventListener("bidSubmitted", loadBids);
    return () => {
      window.removeEventListener("projectPosted", refresh);
      window.removeEventListener("bidSubmitted", loadBids);
    };
  }, []);

  const totalBids = bids.filter(b => projects.some(p => p.id === b.project_id)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground">My Projects</h1>
                <p className="text-sm text-muted-foreground">Manage your posted projects and review incoming bids</p>
              </div>
            </div>
            <Link to="/post-job">
              <Button className="rounded-xl gap-2 shrink-0"><Plus className="h-4 w-4" />Post Project</Button>
            </Link>
          </div>

          {projects.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Active Projects", value: projects.filter(p => p.status === "open").length, color: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-100" },
                { label: "Total Bids Received", value: totalBids, color: "text-primary", bg: "bg-primary/5 border border-primary/10" },
                { label: "Projects Posted", value: projects.length, color: "text-foreground", bg: "bg-secondary/50" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl px-3 py-2.5 text-center ${s.bg}`}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {projects.length === 0 ? (
          <MyProjectsDemo />
        ) : (
          <div className="space-y-4">
            {[...projects].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((project, i) => (
              <motion.div key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.25) }}>
                <ProjectRow project={project} bids={bids} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}