import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* global gtag */
import { Search, Users, X, ShieldCheck, Wifi, SlidersHorizontal, Star, TrendingUp, Clock, CheckCircle2, MapPin, Briefcase, Heart, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_PROFESSIONALS } from "@/lib/demoData";
import { base44 } from "@/api/base44Client";

const QUALIFICATIONS = ["ACA", "ACCA", "CTA", "ATT", "AAT", "CIMA"];
const SPECIALISATIONS = [
  "Self Assessment", "Corporation Tax", "VAT", "Payroll",
  "Bookkeeping", "Audit", "Tax Planning", "R&D Tax Credits",
  "Capital Gains", "Making Tax Digital",
];
const RATE_BANDS = [
  { label: "Any Rate",     min: 0,   max: Infinity },
  { label: "Up to £50/hr", min: 0,   max: 51 },
  { label: "£50–£100/hr",  min: 50,  max: 101 },
  { label: "£100–£150/hr", min: 100, max: 151 },
  { label: "£150+/hr",     min: 150, max: Infinity },
];
const EXP_LEVELS = [
  { label: "Any Experience", min: 0, max: Infinity },
  { label: "1–5 years",      min: 1, max: 5 },
  { label: "5–10 years",     min: 5, max: 10 },
  { label: "10+ years",      min: 10, max: Infinity },
];

const AVAIL_CONFIG = {
  available:   { label: "Active now",        dot: "bg-emerald-500", color: "bg-emerald-100 text-emerald-700" },
  limited:     { label: "Replies within 2h", dot: "bg-amber-500",   color: "bg-amber-100 text-amber-700" },
  unavailable: { label: "Recently online",   dot: "bg-slate-400",   color: "bg-slate-100 text-slate-600" },
};

const GRAD = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-600", "from-cyan-500 to-cyan-700",
  "from-indigo-500 to-indigo-700", "from-pink-500 to-pink-700",
  "from-teal-500 to-teal-700", "from-orange-500 to-orange-600",
  "from-purple-500 to-purple-700", "from-lime-500 to-lime-700",
];

const LIVE_ACTIVITIES = [
  "James from Manchester just posted a Corporation Tax project",
  "Sarah replied to an R&D credit inquiry",
  "Priya accepted a new bookkeeping retainer",
  "New bid submitted on a VAT return project",
  "David updated his Capital Gains availability",
  "Emma completed a payroll project — 5★ review received",
  "Michael joined a new HMRC investigation case",
  "Tom bid on a Software R&D claim in Cambridge",
];

function LiveFeed() {
  const [items, setItems] = useState(() =>
    [0, 1].map((i) => ({ id: i, text: LIVE_ACTIVITIES[i] }))
  );
  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => {
        const next = [...prev.slice(1), { id: Date.now(), text: LIVE_ACTIVITIES[Math.floor(Math.random() * LIVE_ACTIVITIES.length)] }];
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1.5 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Activity</span>
      </div>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-1.5 text-[11px] text-muted-foreground py-0.5 border-b border-border/20 last:border-0">
            <Zap className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ProfCard({ profile, featured, idx, savedIds, onToggleSave }) {
  const initials = profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const grad = GRAD[idx % GRAD.length];
  const avail = AVAIL_CONFIG[profile.availability] || AVAIL_CONFIG.available;
  const isSaved = savedIds.includes(profile.id);
  const [hovered, setHovered] = useState(false);

  return (
    <div className={`relative group bg-card border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/8 ${featured ? "border-primary/40 shadow-md shadow-primary/8" : "border-border/70 hover:border-primary/30"}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {featured && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-primary" />}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={`relative h-14 w-14 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-base shrink-0`}>
            {initials}
            {hovered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-xl bg-black/20 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">View</span>
              </motion.div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-foreground text-sm leading-tight">{profile.full_name}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              {featured && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Featured</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{profile.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{profile.location}</span>
              <span className={`ml-2 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${avail.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
                {avail.label}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onToggleSave(profile.id); }}
            className={`shrink-0 p-1.5 rounded-lg transition-colors ${isSaved ? "text-rose-500" : "text-muted-foreground/40 hover:text-rose-400"}`}>
            <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500" : ""}`} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{profile.bio}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {profile.qualifications.map(q => (
            <span key={q} className="px-2 py-0.5 rounded-md bg-primary/8 text-primary border border-primary/20 text-[10px] font-bold">{q}</span>
          ))}
          {profile.specialisations.slice(0, 2).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium">{s}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">4.9</span>
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {profile.completed_jobs} jobs
            </span>
            <span>{profile.years_experience}yr exp</span>
          </div>
          <span className="text-sm font-extrabold text-primary">
            {profile.hourly_rate ? `£${profile.hourly_rate}/hr` : "Rate on request"}
          </span>
        </div>
      </div>

      {/* View Profile hover overlay */}
      <Link to={`/professionals/${profile.slug}`} className="absolute inset-0" onClick={() => base44.analytics.track({ eventName: "profile_open", properties: { professional: profile.full_name } })}>
        <span className="sr-only">View {profile.full_name}'s profile</span>
      </Link>
    </div>
  );
}

function SidebarSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
      }`}>
      {children}
    </button>
  );
}

export default function Professionals() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [search, setSearch]             = useState("");
  const [availability, setAvailability] = useState("all");
  const [selectedSpec, setSelectedSpec] = useState(params.get("spec") || null);
  const [selectedQual, setSelectedQual] = useState(params.get("qual") || null);
  const [selectedLocation, setSelectedLocation] = useState(params.get("location") || null);
  const [remoteOnly, setRemoteOnly]     = useState(false);
  const [rateBand, setRateBand]         = useState(0);
  const [expLevel, setExpLevel]         = useState(0);
  const [savedIds, setSavedIds]         = useState(() => JSON.parse(localStorage.getItem("saved_profiles") || "[]"));
  const [realProfiles, setRealProfiles] = useState([]);

  useEffect(() => {
    base44.entities.ProfessionalProfile.list("-created_date", 100)
      .then(data => setRealProfiles(data || []))
      .catch(() => {});
  }, []);

  // Merge real profiles (first) with demo data, avoiding id collisions
  const demoIds = new Set(DEMO_PROFESSIONALS.map(p => p.id));
  const uniqueReal = realProfiles.filter(p => !demoIds.has(p.id) && (p.visibility === "public" || !p.visibility)).map(p => ({
    ...p,
    slug: p.id,
    qualifications: p.qualifications || [],
    specialisations: p.specialisations || [],
    software_expertise: p.software_expertise || [],
    completed_jobs: p.completed_jobs || 0,
    availability: p.availability || "available",
    remote_work: p.remote_work !== false,
  }));
  const allProfessionals = [...uniqueReal, ...DEMO_PROFESSIONALS];

  const band = RATE_BANDS[rateBand];
  const exp  = EXP_LEVELS[expLevel];
  const allLocations = [...new Set(allProfessionals.map(p => p.location).filter(Boolean))].sort();

  const filtered = allProfessionals.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const hit = p.full_name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.specialisations.some(s => s.toLowerCase().includes(q)) ||
        p.qualifications.some(q2 => q2.toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (availability !== "all" && p.availability !== availability) return false;
    if (selectedSpec && !p.specialisations.includes(selectedSpec)) return false;
    if (selectedQual && !p.qualifications.includes(selectedQual)) return false;
    if (selectedLocation && p.location !== selectedLocation) return false;
    if (remoteOnly && !p.remote_work) return false;
    if (p.hourly_rate < band.min || p.hourly_rate >= band.max) return false;
    if (p.years_experience < exp.min || p.years_experience > exp.max) return false;
    return true;
  });

  const hasFilters = search || availability !== "all" || selectedSpec || selectedQual || selectedLocation || remoteOnly || rateBand !== 0 || expLevel !== 0;

  const clearAll = () => {
    setSearch(""); setAvailability("all"); setSelectedSpec(null);
    setSelectedQual(null); setSelectedLocation(null); setRemoteOnly(false); setRateBand(0); setExpLevel(0);
  };

  const handleQualClick = (q) => {
    base44.analytics.track({ eventName: "qualification_filter_click", properties: { qualification: q } });
    setSelectedQual(selectedQual === q ? null : q);
  };

  const handleSpecClick = (s) => {
    base44.analytics.track({ eventName: "service_filter_click", properties: { service: s } });
    setSelectedSpec(selectedSpec === s ? null : s);
  };

  const handleLocationClick = (loc) => {
    base44.analytics.track({ eventName: "city_filter_click", properties: { city: loc } });
    setSelectedLocation(selectedLocation === loc ? null : loc);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearch(query);
    if (query.length > 2) {
      gtag('event', 'search', { 
        search_term: query,
        results_count: filtered.filter(p => 
          p.full_name.toLowerCase().includes(query.toLowerCase()) ||
          p.specialisations.some(s => s.toLowerCase().includes(query.toLowerCase())) ||
          p.location.toLowerCase().includes(query.toLowerCase())
        ).length
      });
    }
  };

  const toggleSave = (profileId) => {
    setSavedIds(prev => {
      const next = prev.includes(profileId) ? prev.filter(i => i !== profileId) : [...prev, profileId];
      localStorage.setItem("saved_profiles", JSON.stringify(next));
      if (!prev.includes(profileId)) {
        const p = allProfessionals.find(x => x.id === profileId);
        base44.analytics.track({ eventName: "save_profile", properties: { professional: p?.full_name } });
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3 border border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Qualification-Verified Professionals
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Find Your Expert</h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Browse {allProfessionals.length}+ UK-based tax and accounting professionals, each verified against recognised professional bodies.
            </p>
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground max-w-xl">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>TaxLink Pro is a <strong className="text-foreground">quality-first marketplace</strong> — every professional is assessed for qualifications, expertise, and professionalism, not just lowest price.</span>
            </div>
          </div>

          <div className="mt-6 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, specialisation, or location..."
              value={search} onChange={handleSearchChange}
              className="pl-10 h-11 rounded-xl" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick filter chips */}
          {search && (
            <div className="mt-3 flex flex-wrap gap-2">
              {allProfessionals.filter(p =>
                p.full_name.toLowerCase().includes(search.toLowerCase()) ||
                p.specialisations.some(s => s.toLowerCase().includes(search.toLowerCase()))
              ).slice(0, 4).map(p => (
                <Link key={p.id} to={`/professionals/${p.slug || p.id}`}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 hover:bg-primary/20 transition-colors">
                  {p.full_name} — {p.title}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { Icon: Star, text: "4.9★ avg rating", color: "text-amber-600 bg-amber-50 border-amber-200" },
              { Icon: TrendingUp, text: "96% on-time delivery", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { Icon: Clock, text: "First bid within 2h", color: "text-violet-700 bg-violet-50 border-violet-200" },
              { Icon: ShieldCheck, text: "ACA, ACCA & CTA verified", color: "text-blue-700 bg-blue-50 border-blue-200" },
            ].map(({ Icon, text, color }) => (
              <span key={text} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
                <Icon className="h-3.5 w-3.5 shrink-0" />{text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-6 w-52 shrink-0">
            <div className="sticky top-24 space-y-5">
              <SidebarSection title="Availability">
                {[
                  { value: "all", label: "Any Availability" },
                  { value: "available", label: "Active now" },
                  { value: "limited", label: "Replies within 2h" },
                  { value: "unavailable", label: "Recently online" },
                ].map(opt => (
                  <FilterBtn key={opt.value} active={availability === opt.value} onClick={() => setAvailability(opt.value)}>
                    {opt.label}
                  </FilterBtn>
                ))}
              </SidebarSection>

              <SidebarSection title="Qualification">
                <FilterBtn active={!selectedQual} onClick={() => setSelectedQual(null)}>Any Qualification</FilterBtn>
                {QUALIFICATIONS.map(q => (
                  <FilterBtn key={q} active={selectedQual === q} onClick={() => handleQualClick(q)}>{q}</FilterBtn>
                ))}
              </SidebarSection>

              <SidebarSection title="Specialisation">
                <FilterBtn active={!selectedSpec} onClick={() => setSelectedSpec(null)}>Any Specialisation</FilterBtn>
                {SPECIALISATIONS.map(s => (
                  <FilterBtn key={s} active={selectedSpec === s} onClick={() => handleSpecClick(s)}>{s}</FilterBtn>
                ))}
              </SidebarSection>

              <SidebarSection title="Location">
                <FilterBtn active={!selectedLocation} onClick={() => setSelectedLocation(null)}>All UK</FilterBtn>
                {allLocations.map(loc => (
                  <FilterBtn key={loc} active={selectedLocation === loc} onClick={() => handleLocationClick(loc)}>{loc}</FilterBtn>
                ))}
              </SidebarSection>

              <SidebarSection title="Hourly Rate">
                {RATE_BANDS.map((b, i) => (
                  <FilterBtn key={i} active={rateBand === i} onClick={() => setRateBand(i)}>{b.label}</FilterBtn>
                ))}
              </SidebarSection>

              <SidebarSection title="Experience">
                {EXP_LEVELS.map((e, i) => (
                  <FilterBtn key={i} active={expLevel === i} onClick={() => setExpLevel(i)}>{e.label}</FilterBtn>
                ))}
              </SidebarSection>

              <SidebarSection title="Work Type">
                <FilterBtn active={!remoteOnly} onClick={() => setRemoteOnly(false)}>All Professionals</FilterBtn>
                <FilterBtn active={remoteOnly} onClick={() => setRemoteOnly(true)}>
                  <span className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" />Remote Only</span>
                </FilterBtn>
              </SidebarSection>

              {hasFilters && (
                <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  <X className="h-3 w-3" /> Clear all filters
                </button>
              )}

              <LiveFeed />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedQual && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    {selectedQual} <button onClick={() => setSelectedQual(null)}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {selectedSpec && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-200">
                    {selectedSpec} <button onClick={() => setSelectedSpec(null)}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {selectedLocation && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    {selectedLocation} <button onClick={() => setSelectedLocation(null)}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Mobile chips */}
            <div className="lg:hidden flex flex-wrap gap-2 mb-5">
              <span className="text-xs text-muted-foreground self-center flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />Filters:
              </span>
              {QUALIFICATIONS.map(q => (
                <button key={q} onClick={() => handleQualClick(q)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selectedQual === q ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>{q}</button>
              ))}
              <button onClick={() => setRemoteOnly(!remoteOnly)}
                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${remoteOnly ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
                <Wifi className="h-3 w-3" />Remote
              </button>
              {hasFilters && (
                <button onClick={clearAll} className="px-3 py-1 rounded-full text-xs font-medium border border-destructive/30 text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />Clear
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground">
                {filtered.length} professional{filtered.length !== 1 ? "s" : ""} found
              </p>
              {savedIds.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-rose-500 font-semibold">
                  <Heart className="h-3.5 w-3.5 fill-rose-500" />{savedIds.length} saved
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border/60 rounded-2xl px-6">
                <Users className="h-12 w-12 text-muted-foreground/25 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No professionals match your filters</h3>
                <p className="text-muted-foreground mb-6 text-sm">Try adjusting your filters or search terms.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={clearAll} className="rounded-xl">Clear all filters</Button>
                  <Link to="/post-job">
                    <Button className="rounded-xl">Post a Project Instead</Button>
                  </Link>
                </div>
                <div className="mt-8">
                  <p className="text-sm font-semibold text-foreground mb-4">Recommended professionals</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {allProfessionals.slice(0, 3).map((p, i) => {
                      const initials = p.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                      const grad = GRAD[i % GRAD.length];
                      return (
                        <Link key={p.id} to={`/professionals/${p.slug}`}
                          className="flex items-center gap-2 p-3 bg-background border border-border/60 rounded-xl hover:border-primary/40 transition-all text-left">
                          <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{p.full_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.location} · £{p.hourly_rate}/hr</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((profile, i) => (
                  <motion.div key={profile.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: Math.min(i * 0.05, 0.3) }}>
                    <ProfCard profile={profile} featured={i === 0 && !hasFilters} idx={i} savedIds={savedIds} onToggleSave={toggleSave} />
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