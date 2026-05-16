import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { awardProject, getPostedProjects, mergeProjectSources, updateProject } from "@/lib/projectStore";
import { getBiddingState } from "@/lib/biddingState";
import { awardProjectBid, getAllBids } from "@/lib/bidStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Clock, Users, CheckCircle2, XCircle, Star, ChevronDown, ChevronUp, Gavel, TrendingUp, Award, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import MyProjectsDemo from "@/components/emptyStates/MyProjectsDemo";
import ProjectActivityFeed from "@/components/shared/ProjectActivityFeed";
import { useToast } from "@/components/ui/use-toast";

const STATUS_CONFIG = {
  open:        { label: "Open for Bids", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  reviewing:   { label: "Reviewing Bids", color: "bg-amber-100 text-amber-700 border-amber-200" },
  awarded:     { label: "Awarded",        color: "bg-violet-100 text-violet-700 border-violet-200" },
  in_progress: { label: "In Progress",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed:   { label: "Completed",     color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed:      { label: "Closed",        color: "bg-secondary text-muted-foreground border-border" },
};

const BID_STATUS = {
  pending:     { label: "Pending",     color: "bg-secondary text-secondary-foreground" },
  shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700" },
  accepted:    { label: "Accepted",    color: "bg-emerald-100 text-emerald-700" },
  rejected:    { label: "Rejected",    color: "bg-rose-100 text-rose-600" },
};

const URGENCY_LABELS = {
  negotiable: "Negotiable",
  flexible: "Negotiable",
  standard: "Standard",
  within_month: "Within a month",
  within_2weeks: "Within 2 weeks",
  within_week: "Within 1 week",
  urgent: "Urgent",
  asap: "ASAP",
};

function ProjectRow({ project, bids, onAwardBid, onCompleteProject }) {
  const [expanded, setExpanded] = useState(false);
  const projectBids = bids.filter(b => b.project_id === project.id);
  const displayStatus = project.lifecycle_state === "awarded" ? "awarded" : project.status;
  const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.open;
  const postedAgo = project.created_date ? formatDistanceToNow(new Date(project.created_date), { addSuffix: true }) : null;
  const hasAwardedBid = projectBids.some((bid) => bid.status === "accepted" || bid.awarded);
  const canAward = !hasAwardedBid && !["in_progress", "awarded", "completed", "closed"].includes(project.status);
  const acceptedBid = projectBids.find((bid) => bid.status === "accepted" || bid.awarded);
  const canComplete = (project.status === "in_progress" || project.lifecycle_state === "awarded") && acceptedBid;

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
              {project.urgency && (
                <Badge variant="secondary" className="text-xs">{URGENCY_LABELS[project.urgency] || project.urgency}</Badge>
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
          {canComplete && (
            <button
              onClick={() => onCompleteProject(project, acceptedBid)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline underline-offset-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm work completed
            </button>
          )}
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
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Review Bids</p>
                     {projectBids.map((bid, i) => {
                       const bCfg = BID_STATUS[bid.status] || BID_STATUS.pending;
                       const bidQualifications = bid.qualifications || bid.bidder_quals || bid.professional_credentials?.qualifications || (bid.bidder_qual ? [bid.bidder_qual] : []);
                       const bidExperience = bid.years_experience || bid.experience_label || bid.professional_credentials?.years_experience;
                       const bidSpecialisms = bid.bidder_specialisms || bid.professional_credentials?.specialisations || [];
                       const bidHeadline = bid.bidder_headline || bid.professional_credentials?.headline;
                       const bidderRating = bid.bidder_rating || bid.rating;
                       const completedJobs = bid.completed_jobs || bid.completedJobs;
                       const onTimeRate = bid.on_time_completion_rate || bid.onTimeCompletionRate;
                       return (
                         <div key={bid.id} className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${bid.status === "accepted" ? "bg-emerald-50 border-emerald-200" : "bg-secondary/30 border-border/40"}`}>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-sm font-semibold text-foreground">{bid.bidder_name || "Anonymous"}</span>
                               {bid.status === "accepted" && (
                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                   <Award className="h-3 w-3" /> Selected
                                 </span>
                               )}
                             </div>
                             {bidHeadline && (
                               <p className="text-xs text-muted-foreground mb-1">{bidHeadline}</p>
                             )}
                             {(bidQualifications.length > 0 || bidExperience) && (
                               <div className="flex flex-wrap gap-1.5 mb-2">
                                 {bidQualifications.slice(0, 4).map((qualification) => (
                                   <span key={qualification} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                     {qualification}
                                   </span>
                                 ))}
                                 {bidExperience && (
                                   <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold">
                                     {bidExperience} experience
                                   </span>
                                 )}
                                 {bidSpecialisms.slice(0, 2).map((specialism) => (
                                   <span key={specialism} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-bold">
                                     {specialism}
                                   </span>
                                 ))}
                               </div>
                             )}
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <Clock className="h-3 w-3" />
                               <span>{bid.timeline_label || bid.timeline}</span>
                             </div>
                             <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                               {bidderRating ? <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{Number(bidderRating).toFixed ? Number(bidderRating).toFixed(1) : bidderRating} rating</span> : null}
                               {completedJobs ? <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{completedJobs} jobs</span> : null}
                               {onTimeRate ? <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />{Math.round(Number(onTimeRate) > 1 ? Number(onTimeRate) : Number(onTimeRate) * 100)}% on-time</span> : null}
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
                             {canAward && bid.status !== "rejected" && (
                               <Button
                                 type="button"
                                 size="sm"
                                 onClick={() => onAwardBid(project, bid)}
                                 className="h-8 rounded-lg text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-primary border-0"
                               >
                                 <Award className="h-3.5 w-3.5" />
                                 Award
                               </Button>
                             )}
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
  const { toast } = useToast();

  const loadProjects = async () => {
    const localProjects = getPostedProjects();
    try {
      const user = await base44.auth.me();
      const results = await base44.entities.JobPost.filter({ created_by: user.email }, "-created_date", 100);
      setProjects(mergeProjectSources(results, localProjects));
    } catch {
      setProjects(localProjects);
    }
  };

  const loadBids = async () => {
    try {
      const results = await base44.entities.Bid.list("-created_date", 200);
      const localBids = getAllBids();
      const resultIds = new Set((results || []).map((bid) => bid.id));
      setBids([...(results || []), ...localBids.filter((bid) => !resultIds.has(bid.id))]);
    } catch {
      setBids(getAllBids());
    }
  };

  const handleAwardBid = async (project, bid) => {
    if (!window.confirm(`You are selecting ${bid.bidder_name || "this professional"} for the project. Bidding will close and other bidders will be marked as not selected.`)) return;

    const awardPatch = {
      status: "in_progress",
      lifecycle_state: "awarded",
      awarded_bid_id: bid.id,
      awarded_bidder_name: bid.bidder_name,
      awarded_amount: bid.amount,
      awarded_at: new Date().toISOString(),
      accepting_bids: false,
      openForBids: false,
    };

    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, ...awardPatch } : item));
    setBids((current) => current.map((item) => {
      if (item.project_id !== project.id) return item;
      return {
        ...item,
        status: item.id === bid.id ? "accepted" : "rejected",
        awarded: item.id === bid.id,
        awarded_at: item.id === bid.id ? awardPatch.awarded_at : item.awarded_at,
        rejection_reason: item.id === bid.id ? undefined : "Project awarded to another professional",
      };
    }));

    awardProject(project.id, bid);
    awardProjectBid(project.id, bid.id);

    try {
      await base44.entities.JobPost.update(project.id, awardPatch);
    } catch (err) {
      console.warn("Failed to update project award in backend; local state saved.", err);
    }

    await Promise.allSettled(bids
      .filter((item) => item.project_id === project.id)
      .map((item) => base44.entities.Bid.update(item.id, {
        status: item.id === bid.id ? "accepted" : "rejected",
        awarded: item.id === bid.id,
        awarded_at: item.id === bid.id ? awardPatch.awarded_at : item.awarded_at,
        rejection_reason: item.id === bid.id ? undefined : "Project awarded to another professional",
      }))
    );

    window.dispatchEvent(new CustomEvent("projectAwarded", { detail: { project: { ...project, ...awardPatch }, bid } }));
    window.dispatchEvent(new CustomEvent("bidUpdated", { detail: { projectId: project.id, winningBidId: bid.id } }));
    window.dispatchEvent(new CustomEvent("projectUpdated", { detail: { ...project, ...awardPatch } }));

    toast({
      title: "Project awarded",
      description: `${bid.bidder_name || "The selected professional"} has been chosen. Bidding is now closed.`,
      duration: 3500,
    });
  };

  const handleCompleteProject = async (project, bid) => {
    if (!window.confirm("Confirm the work is completed? This will unlock a verified client review for the selected professional.")) return;

    const completionPatch = {
      status: "completed",
      lifecycle_state: "completed",
      completed_at: new Date().toISOString(),
      review_available: true,
      accepted_bid_id: bid?.id || project.awarded_bid_id,
      accepted_professional_name: bid?.bidder_name || project.awarded_bidder_name,
      accepting_bids: false,
      openForBids: false,
    };

    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, ...completionPatch } : item));
    updateProject(project.id, completionPatch);

    try {
      await base44.entities.JobPost.update(project.id, completionPatch);
    } catch (err) {
      console.warn("Failed to update project completion in backend; local state saved.", err);
    }

    const detail = { project: { ...project, ...completionPatch }, bid };
    window.dispatchEvent(new CustomEvent("projectCompleted", { detail }));
    window.dispatchEvent(new CustomEvent("projectUpdated", { detail: detail.project }));

    toast({
      title: "Project completed",
      description: "You can now leave a verified completed-project review.",
      duration: 3500,
    });
  };

  useEffect(() => {
    loadProjects();
    loadBids();
    const refresh = () => { loadProjects(); loadBids(); };
    window.addEventListener("projectPosted", refresh);
    window.addEventListener("bidSubmitted", loadBids);
    window.addEventListener("bidUpdated", refresh);
    window.addEventListener("projectAwarded", refresh);
    window.addEventListener("projectCompleted", refresh);
    return () => {
      window.removeEventListener("projectPosted", refresh);
      window.removeEventListener("bidSubmitted", loadBids);
      window.removeEventListener("bidUpdated", refresh);
      window.removeEventListener("projectAwarded", refresh);
      window.removeEventListener("projectCompleted", refresh);
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
                { label: "Active Projects", value: projects.filter(p => getBiddingState(p).isOpen).length, color: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-100" },
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
                <ProjectRow project={project} bids={bids} onAwardBid={handleAwardBid} onCompleteProject={handleCompleteProject} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}