import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DEMO_JOBS } from "@/lib/demoData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, Plus, X, Wifi, Gavel, ArrowRight, Clock, CheckCircle2, Zap, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import JobCard from "../components/shared/JobCard";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "tax_return", label: "Tax Return" },
  { value: "bookkeeping", label: "Bookkeeping" },
  { value: "payroll", label: "Payroll" },
  { value: "vat", label: "VAT" },
  { value: "corporation_tax", label: "Corporation Tax" },
  { value: "audit", label: "Audit" },
  { value: "advisory", label: "Advisory" },
  { value: "other", label: "Other" },
];

const DURATIONS = [
  { value: "all", label: "Any Duration" },
  { value: "one_off", label: "One-off" },
  { value: "short_term", label: "Short-term" },
  { value: "long_term", label: "Long-term" },
  { value: "ongoing", label: "Ongoing" },
];

const BUDGET_BANDS = [
  { label: "Any Budget",    min: 0,   max: Infinity },
  { label: "Under £150",   min: 0,   max: 150 },
  { label: "£150–£400",    min: 150, max: 400 },
  { label: "£400–£900",    min: 400, max: 900 },
  { label: "£900+",        min: 900, max: Infinity },
];

const LIVE_ACTIVITY = [
  "New bid submitted — Corporation Tax · 3 mins ago",
  "CTA specialist joined bidding — R&D project",
  "Bid increased to £340 — VAT return",
  "ACCA expert placed a quote — Self Assessment",
  "4 professionals viewing — Payroll project",
  "Bid deadline extended — Bookkeeping role",
  "New bid: £180 — Capital Gains project",
  "ACA qualified joined — Advisory project",
];

function LiveActivityFeed() {
  const [idx, setIdx] = useState(0);
  const [items, setItems] = useState(() =>
    [0, 1, 2].map((i) => ({ id: i, text: LIVE_ACTIVITY[i % LIVE_ACTIVITY.length] }))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => {
        const next = [...prev.slice(1), { id: Date.now(), text: LIVE_ACTIVITY[Math.floor(Math.random() * LIVE_ACTIVITY.length)] }];
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1.5 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Activity</span>
      </div>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-tight py-1 border-b border-border/30 last:border-0">
            <Zap className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Jobs() {
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("all");
  const [duration, setDuration]   = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [budgetBand, setBudgetBand] = useState(0);
  const [dbJobs, setDbJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadJobs = async () => {
    try {
      const results = await base44.entities.JobPost.filter({ status: "open" }, "-created_date", 100);
      setDbJobs(results);
    } catch {
      setDbJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const handler = () => loadJobs();
    window.addEventListener("projectPosted", handler);
    return () => window.removeEventListener("projectPosted", handler);
  }, []);

  // Merge: real DB jobs first, then demo jobs for any IDs not already in DB
  const dbJobIds = new Set(dbJobs.map(j => j.id));
  const jobs = [
    ...dbJobs,
    ...DEMO_JOBS.filter(j => !dbJobIds.has(j.id)),
  ].sort((a, b) => {
    if (a._user_posted && !b._user_posted) return -1;
    if (!a._user_posted && b._user_posted) return 1;
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  const filtered = jobs.filter((job) => {
    const matchesSearch = !search ||
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || job.category === category;
    const matchesDuration = duration === "all" || job.duration === duration;
    const matchesRemote   = !remoteOnly || job.remote;
    const band = BUDGET_BANDS[budgetBand];
    const budget = job.budget_amount || 0;
    const matchesBudget = budget >= band.min && budget < band.max;
    return matchesSearch && matchesCategory && matchesDuration && matchesRemote && matchesBudget;
  });

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const hasFilters = search || category !== "all" || duration !== "all" || remoteOnly || budgetBand !== 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Remote Project Marketplace</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Open Projects
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isLoading ? "Loading..." : `${openJobs} open project${openJobs !== 1 ? "s" : ""} accepting bids from verified UK tax & accounting professionals.`}
              </p>
            </div>
            <Link to="/post-job" className="shrink-0">
              <Button className="rounded-xl font-semibold shadow-sm gap-2">
                <Plus className="h-4 w-4" />
                Post a Project
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="mt-6 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project type, skill, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Marketplace governance banner */}
      <div className="bg-violet-50 border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-violet-700">
            <span className="flex items-center gap-1.5 font-black text-violet-800"><Gavel className="h-3.5 w-3.5" /> How bidding works:</span>
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-violet-200 text-violet-800 text-[9px] font-black flex items-center justify-center">1</span> Post project</span>
            <ArrowRight className="h-3 w-3 text-violet-400 hidden sm:block" />
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-violet-200 text-violet-800 text-[9px] font-black flex items-center justify-center">2</span> Professionals bid</span>
            <ArrowRight className="h-3 w-3 text-violet-400 hidden sm:block" />
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-violet-200 text-violet-800 text-[9px] font-black flex items-center justify-center">3</span> Client selects winner</span>
            <ArrowRight className="h-3 w-3 text-violet-400 hidden sm:block" />
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-violet-200 text-violet-800 text-[9px] font-black flex items-center justify-center">4</span> Work delivered remotely</span>
            <ArrowRight className="h-3 w-3 text-violet-400 hidden sm:block" />
            <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Payment released on delivery confirmation</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Category */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Category</p>
                <div className="space-y-0.5">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} onClick={() => setCategory(c.value)}
                      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
                        category === c.value
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-secondary"
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Duration</p>
                <div className="space-y-0.5">
                  {DURATIONS.map((d) => (
                    <button key={d.value} onClick={() => setDuration(d.value)}
                      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
                        duration === d.value
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-secondary"
                      }`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Budget</p>
                <div className="space-y-0.5">
                  {BUDGET_BANDS.map((b, i) => (
                    <button key={i} onClick={() => setBudgetBand(i)}
                      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
                        budgetBand === i ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-secondary"
                      }`}>{b.label}</button>
                  ))}
                </div>
              </div>

              {/* Remote toggle */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Work Type</p>
                <button
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`flex items-center gap-2 w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
                    remoteOnly ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-secondary"
                  }`}>
                  <Wifi className="h-3.5 w-3.5" />Remote only
                </button>
              </div>

              {hasFilters && (
                <button onClick={() => { setSearch(""); setCategory("all"); setDuration("all"); setRemoteOnly(false); setBudgetBand(0); }}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  <X className="h-3 w-3" /> Clear all filters
                </button>
              )}

              {/* Live activity feed */}
              <LiveActivityFeed />
            </div>
          </aside>

          {/* Mobile filter chips */}
          <div className="flex-1 min-w-0">
            <div className="lg:hidden flex flex-wrap gap-2 mb-5">
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <button key={c.value} onClick={() => setCategory(category === c.value ? "all" : c.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    category === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}>{c.label}</button>
              ))}
              <button onClick={() => setRemoteOnly(!remoteOnly)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                  remoteOnly ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}>
                <Wifi className="h-3 w-3" />Remote
              </button>
            </div>

            {/* Results count + clear */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${filtered.length} project${filtered.length !== 1 ? "s" : ""} found`}
              </p>
              {hasFilters && (
                <button onClick={() => { setSearch(""); setCategory("all"); setDuration("all"); setRemoteOnly(false); setBudgetBand(0); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 lg:hidden">
                  <X className="h-3 w-3" />Clear
                </button>
              )}
            </div>

            {/* Job list */}
            {isLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-card border border-border/60 rounded-2xl p-6 space-y-3">
                    <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-28 rounded-lg" /></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border/60 rounded-2xl px-6">
                <Briefcase className="h-12 w-12 text-muted-foreground/25 mx-auto mb-4" />
                {hasFilters ? (
                  <>
                    <h3 className="text-lg font-semibold text-foreground mb-1">No projects match your filters</h3>
                    <p className="text-muted-foreground text-sm mb-5">Try widening your search — or be the first to post in this category.</p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <Button variant="outline" className="rounded-xl" onClick={() => { setSearch(""); setCategory("all"); setDuration("all"); setRemoteOnly(false); setBudgetBand(0); }}>
                        Clear filters
                      </Button>
                      <Link to="/post-job">
                        <Button className="rounded-xl gap-2"><Plus className="h-4 w-4" />Post a Project</Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-foreground mb-1">No projects posted yet</h3>
                    <p className="text-muted-foreground text-sm mb-5">Be the first to post a remote project and receive competitive bids from verified UK tax professionals.</p>
                    <Link to="/post-job">
                      <Button className="rounded-xl gap-2"><Plus className="h-4 w-4" />Post the First Project</Button>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((job, i) => (
                  <motion.div key={job.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}>
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}