import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Users,
  X,
  ShieldCheck,
  Wifi,
  Heart,
  PanelRight,
  ArrowRight,
  MessageCircle,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_PROFESSIONALS } from "@/lib/demoData";
import { EXTENDED_DEMO_ADVISORS, advisorUrl } from "@/lib/advisorProfiles";
import { base44 } from "@/api/base44Client";
import {
  CLIENT_NEED_OPTIONS,
  buildExpertiseIdentityHeadline,
  buildOutcomeLine,
  narrativeLine,
  adviserIntroduction,
  warmTrustSentence,
  getTypicalEngagementLabel,
  oftenSelectedFor,
  partitionRecommended,
  discoveryFitScore,
} from "@/lib/professionalDiscovery";
import { normalizeExpertise } from "@/lib/expertiseMatching";
import ProfessionalQualificationLines from "@/components/shared/ProfessionalQualificationLines";
import ProfessionalExpertiseDisplay from "@/components/shared/ProfessionalExpertiseDisplay";

const QUALIFICATIONS = ["ACA", "ACCA", "CTA", "ATT", "AAT", "CIMA"];
const SPECIALISATIONS = [
  "Self Assessment", "Corporation Tax", "VAT", "Payroll",
  "Bookkeeping", "Audit", "Tax Planning", "R&D Tax Credits",
  "Capital Gains", "Making Tax Digital",
];
const RATE_BANDS = [
  { label: "Any guide range", min: 0, max: Infinity },
  { label: "Under ~£250 typical day-equivalent", min: 0, max: 65 },
  { label: "~£250–£500", min: 65, max: 95 },
  { label: "~£500–£800", min: 95, max: 130 },
  { label: "Premium / specialist (~£800+)", min: 130, max: Infinity },
];
const EXP_LEVELS = [
  { label: "Any experience depth", min: 0, max: Infinity },
  { label: "1–5 years", min: 1, max: 5 },
  { label: "5–10 years", min: 5, max: 10 },
  { label: "10+ years", min: 10, max: Infinity },
];

const AVAIL_CONFIG = {
  available:   { label: "Available now", dot: "bg-emerald-500", color: "text-emerald-700" },
  limited:     { label: "Responds within a few hours", dot: "bg-teal-500", color: "text-teal-700" },
  unavailable: { label: "Recently active", dot: "bg-slate-400", color: "text-muted-foreground" },
};

const GRAD = [
  "from-teal-500 to-teal-700", "from-slate-600 to-slate-800",
  "from-violet-500 to-violet-700", "from-emerald-600 to-teal-700",
];

const LIVE_ACTIVITIES = [
  "Advisers across the UK taking on VAT and bookkeeping relationships",
  "Many specialists are used to HMRC letters and enquiries",
  "Owner-managed businesses often stay with the same adviser here",
  "When scope is unclear, a short call usually sorts the next step",
];

function MarketplacePulse({ className = "" }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % LIVE_ACTIVITIES.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`flex items-start gap-2 text-sm text-muted-foreground ${className}`}>
      <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-1.5 animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className="leading-snug"
        >
          {LIVE_ACTIVITIES[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function FiltersPanel({
  availability,
  setAvailability,
  selectedQual,
  setSelectedQual,
  selectedSpec,
  setSelectedSpec,
  selectedLocation,
  setSelectedLocation,
  remoteOnly,
  setRemoteOnly,
  rateBand,
  setRateBand,
  expLevel,
  setExpLevel,
  allLocations,
  handleQualClick,
  handleSpecClick,
  handleLocationClick,
}) {
  return (
    <div className="space-y-6 pt-2">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Availability</p>
        {[
          { value: "all", label: "Show all" },
          { value: "available", label: "Available now" },
          { value: "limited", label: "Fast response" },
          { value: "unavailable", label: "Recently active" },
        ].map((opt) => (
          <FilterBtn key={opt.value} active={availability === opt.value} onClick={() => setAvailability(opt.value)}>
            {opt.label}
          </FilterBtn>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Credentials</p>
        <FilterBtn active={!selectedQual} onClick={() => setSelectedQual(null)}>Any</FilterBtn>
        {QUALIFICATIONS.map((q) => (
          <FilterBtn key={q} active={selectedQual === q} onClick={() => handleQualClick(q)}>{q}</FilterBtn>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Service area</p>
        <FilterBtn active={!selectedSpec} onClick={() => setSelectedSpec(null)}>Any</FilterBtn>
        {SPECIALISATIONS.map((s) => (
          <FilterBtn key={s} active={selectedSpec === s} onClick={() => handleSpecClick(s)}>{s}</FilterBtn>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Region</p>
        <FilterBtn active={!selectedLocation} onClick={() => setSelectedLocation(null)}>UK-wide</FilterBtn>
        {allLocations.map((loc) => (
          <FilterBtn key={loc} active={selectedLocation === loc} onClick={() => handleLocationClick(loc)}>{loc}</FilterBtn>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Typical engagement level</p>
        {RATE_BANDS.map((b, i) => (
          <FilterBtn key={`${b.label}-${i}`} active={rateBand === i} onClick={() => setRateBand(i)}>{b.label}</FilterBtn>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Experience</p>
        {EXP_LEVELS.map((e, i) => (
          <FilterBtn key={e.label} active={expLevel === i} onClick={() => setExpLevel(i)}>{e.label}</FilterBtn>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Working style</p>
        <FilterBtn active={!remoteOnly} onClick={() => setRemoteOnly(false)}>Any</FilterBtn>
        <FilterBtn active={remoteOnly} onClick={() => setRemoteOnly(true)}>
          <span className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /> Remote-first</span>
        </FilterBtn>
      </div>
    </div>
  );
}

function DiscoveryCard({
  profile,
  variant,
  idx,
  savedIds,
  onToggleSave,
  activeNeed,
}) {
  const initials = profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const grad = GRAD[idx % GRAD.length];
  const isSaved = savedIds.includes(profile.id);
  const avail = AVAIL_CONFIG[profile.availability] || AVAIL_CONFIG.available;
  const headline = buildExpertiseIdentityHeadline(profile);
  const outcome = buildOutcomeLine(profile);
  const story = narrativeLine(profile);
  const isLarge = variant === "large";
  const intro = isLarge ? adviserIntroduction(profile, 280) : null;
  const trustLine = warmTrustSentence(profile);
  const engage = getTypicalEngagementLabel(profile);
  const reasonsMax = isLarge ? 3 : 2;
  const reasons = oftenSelectedFor(profile, activeNeed, reasonsMax);
  const trackProfile = () => {
    base44.analytics.track({ eventName: "profile_open", properties: { professional: profile.full_name } });
  };

  return (
    <div
      className={`relative bg-card rounded-2xl border transition-shadow duration-300 hover:shadow-lg ${
        isLarge ? "rounded-3xl border-border/50 p-7 md:p-8 shadow-sm" : "border-border/50 p-6"
      }`}
    >
      {isLarge && (
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent rounded-full" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-5 md:gap-6">
        <div className={`rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shrink-0 shadow-inner ${isLarge ? "h-[4.25rem] w-[4.25rem] text-lg" : "h-14 w-14 text-base"}`}>
          {initials}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-semibold text-foreground leading-snug ${isLarge ? "text-lg md:text-xl" : "text-base"}`}>
                {headline}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{profile.full_name} · {profile.location}</p>
            </div>
            <button
              type="button"
              aria-label={isSaved ? "Remove from saved" : "Save adviser"}
              onClick={() => onToggleSave(profile.id)}
              className={`shrink-0 p-2 rounded-lg transition-colors ${isSaved ? "text-rose-500" : "text-muted-foreground/35 hover:text-rose-400"}`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500" : ""}`} />
            </button>
          </div>

          <p className={`text-muted-foreground ${isLarge ? "text-sm" : "text-xs"} leading-relaxed ${isLarge ? "line-clamp-3" : "line-clamp-2"}`}>{outcome}</p>

          {isLarge && intro && (
            <p className="text-sm text-foreground/90 leading-relaxed line-clamp-5">{intro}</p>
          )}
          {!isLarge && story && (
            <p className="text-xs text-foreground/85 leading-relaxed line-clamp-2">{story}</p>
          )}

          <ProfessionalQualificationLines profile={profile} className="text-[11px]" />
          <ProfessionalExpertiseDisplay profile={profile} compact />

          <p className="text-xs text-muted-foreground leading-relaxed">{trustLine}</p>

          {reasons.length > 0 && (
            <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">Often selected for</p>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-snug list-disc list-inside marker:text-teal-600/70">
                {reasons.map((r, ri) => (
                  <li key={`${profile.id}-r-${ri}`} className="pl-0.5">{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4 pt-1 border-t border-border/30">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground leading-snug">{engage.primary}</p>
              {engage.sub && <p className="text-[11px] text-muted-foreground leading-relaxed">{engage.sub}</p>}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
                <span className={avail.color}>{avail.label}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm" className={`rounded-xl gap-1.5 ${isLarge ? "h-10 px-4" : "h-9"}`}>
              <Link to={advisorUrl(profile)} onClick={trackProfile}>
                View Adviser <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl gap-1.5">
              <Link to={`/post-job?advisor=${encodeURIComponent(profile.slug || profile.id)}`}>Discuss Project</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="rounded-xl gap-1.5 text-muted-foreground">
              <Link to={`/post-job?advisor=${encodeURIComponent(profile.slug || profile.id)}`}>
                <MessageCircle className="h-3.5 w-3.5" />
                Request Consultation
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Professionals() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [search, setSearch] = useState("");
  const [activeNeed, setActiveNeed] = useState(params.get("need") || null);
  const [availability, setAvailability] = useState("all");
  const [selectedSpec, setSelectedSpec] = useState(params.get("spec") || null);
  const [selectedQual, setSelectedQual] = useState(params.get("qual") || null);
  const [selectedLocation, setSelectedLocation] = useState(params.get("location") || null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [rateBand, setRateBand] = useState(0);
  const [expLevel, setExpLevel] = useState(0);
  const [savedIds, setSavedIds] = useState(() => JSON.parse(localStorage.getItem("saved_profiles") || "[]"));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [realProfiles, setRealProfiles] = useState([]);

  useEffect(() => {
    base44.entities.ProfessionalProfile.list("-created_date", 100)
      .then((data) => setRealProfiles(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const n = params.get("need");
    if (n) setActiveNeed(n);
  }, [location.search]);

  const demoIds = new Set(DEMO_PROFESSIONALS.map((p) => p.id));
  const uniqueReal = realProfiles.filter((p) => !demoIds.has(p.id) && (p.visibility === "public" || !p.visibility)).map((p) => ({
    ...p,
    slug: p.id,
    qualifications: p.qualifications || [],
    specialisations: p.specialisations || p.primary_expertise || [],
    primary_expertise: p.primary_expertise || p.specialisations || [],
    secondary_expertise: p.secondary_expertise || [],
    software_expertise: p.software_expertise || [],
    completed_jobs: p.completed_jobs || 0,
    availability: p.availability || "available",
    remote_work: p.remote_work !== false,
  }));
  const allProfessionals = [...uniqueReal, ...DEMO_PROFESSIONALS, ...EXTENDED_DEMO_ADVISORS];

  const band = RATE_BANDS[rateBand];
  const exp = EXP_LEVELS[expLevel];
  const allLocations = [...new Set(allProfessionals.map((p) => p.location).filter(Boolean))].sort();

  const filtered = useMemo(() => allProfessionals.filter((p) => {
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      const hit =
        p.full_name.toLowerCase().includes(q) ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q) ||
        normalizeExpertise(p).all.some((s) => s.toLowerCase().includes(q)) ||
        (p.qualifications || []).some((x) => x.toLowerCase().includes(q)) ||
        (p.bio || "").toLowerCase().includes(q);
      if (!hit) return false;
    }

    if (activeNeed && discoveryFitScore(p, activeNeed, "") < 14) return false;

    if (availability !== "all" && p.availability !== availability) return false;
    if (selectedSpec && !normalizeExpertise(p).all.includes(selectedSpec)) return false;
    if (selectedQual && !p.qualifications?.includes(selectedQual)) return false;
    if (selectedLocation && p.location !== selectedLocation) return false;
    if (remoteOnly && !p.remote_work) return false;

    const hr = Number(p.hourly_rate) || 0;
    if (rateBand !== 0) {
      if (hr <= 0) return false;
      if (hr < band.min || hr >= band.max) return false;
    }

    const y = Number(p.years_experience) || 0;
    if (expLevel !== 0 && (y < exp.min || y > exp.max)) return false;

    return true;
  }), [
    allProfessionals, search, activeNeed, availability, selectedSpec, selectedQual,
    selectedLocation, remoteOnly, rateBand, expLevel, band.min, band.max, exp.min, exp.max,
  ]);

  const { recommended, rest } = useMemo(
    () => partitionRecommended(filtered, activeNeed, search, 4),
    [filtered, activeNeed, search],
  );

  const hasFilters =
    search ||
    activeNeed ||
    availability !== "all" ||
    selectedSpec ||
    selectedQual ||
    selectedLocation ||
    remoteOnly ||
    rateBand !== 0 ||
    expLevel !== 0;

  const filterCount = [
    activeNeed,
    availability !== "all",
    selectedSpec,
    selectedQual,
    selectedLocation,
    remoteOnly,
    rateBand !== 0,
    expLevel !== 0,
  ].filter(Boolean).length;

  const clearAll = () => {
    setSearch("");
    setActiveNeed(null);
    setAvailability("all");
    setSelectedSpec(null);
    setSelectedQual(null);
    setSelectedLocation(null);
    setRemoteOnly(false);
    setRateBand(0);
    setExpLevel(0);
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

  const toggleSave = (profileId) => {
    setSavedIds((prev) => {
      const next = prev.includes(profileId) ? prev.filter((i) => i !== profileId) : [...prev, profileId];
      localStorage.setItem("saved_profiles", JSON.stringify(next));
      if (!prev.includes(profileId)) {
        const prof = allProfessionals.find((x) => x.id === profileId);
        base44.analytics.track({ eventName: "save_profile", properties: { professional: prof?.full_name } });
      }
      return next;
    });
  };

  const needLabel = activeNeed ? CLIENT_NEED_OPTIONS.find((n) => n.id === activeNeed)?.label : null;

  const filtersUi = (
    <FiltersPanel
      availability={availability}
      setAvailability={setAvailability}
      selectedQual={selectedQual}
      setSelectedQual={setSelectedQual}
      selectedSpec={selectedSpec}
      setSelectedSpec={setSelectedSpec}
      selectedLocation={selectedLocation}
      setSelectedLocation={setSelectedLocation}
      remoteOnly={remoteOnly}
      setRemoteOnly={setRemoteOnly}
      rateBand={rateBand}
      setRateBand={setRateBand}
      expLevel={expLevel}
      setExpLevel={setExpLevel}
      allLocations={allLocations}
      handleQualClick={handleQualClick}
      handleSpecClick={handleSpecClick}
      handleLocationClick={handleLocationClick}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-gradient-to-b from-muted/40 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 text-foreground text-xs font-medium border border-border/60">
              <Compass className="h-3.5 w-3.5 text-teal-600" />
              Adviser-led · UK tax & accounting
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              Find a trusted adviser for your situation
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Trusted UK tax professionals for businesses and individuals. Get matched with advisers experienced in situations like yours — relationship-led support, scoped after a proper conversation.
            </p>
            <MarketplacePulse />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">What do you need help with?</p>
            <div className="flex flex-wrap gap-2">
              {CLIENT_NEED_OPTIONS.map((need) => {
                const active = activeNeed === need.id;
                return (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => setActiveNeed(active ? null : need.id)}
                    className={`text-left px-3.5 py-2 rounded-xl border text-sm transition-all max-w-[240px] ${
                      active
                        ? "border-teal-500 bg-teal-50 text-teal-950 shadow-sm"
                        : "border-border/70 bg-card hover:border-teal-200 text-foreground"
                    }`}
                  >
                    <span className="font-semibold block leading-snug">{need.label}</span>
                    <span className={`text-[11px] mt-0.5 block ${active ? "text-teal-800/90" : "text-muted-foreground"}`}>{need.blurb}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Or describe your situation in your own words…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl border-border/70 bg-background/80 shadow-sm text-base"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {["Verified credentials", "Built for ongoing relationships", "Quiet confidence — not a race to the bottom"].map((lab) => (
              <span
                key={lab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card/60 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-teal-600 shrink-0 opacity-80" />
                {lab}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span>
              {" "}
              {filtered.length === 1 ? "adviser" : "advisers"}
              {activeNeed ? (
                <span className="text-muted-foreground"> · shown with your situation in mind</span>
              ) : (
                <span className="text-muted-foreground"> · for you to explore at your pace</span>
              )}
            </p>
            {savedIds.length > 0 && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-rose-500" />{savedIds.length} saved
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={clearAll}>
                <X className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="rounded-xl gap-2 border-border/80 shadow-sm">
                  <PanelRight className="h-4 w-4" />
                  Refine
                  {filterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 min-w-[1.25rem]">
                      {filterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Refine your search</SheetTitle>
                  <SheetDescription>
                    Optional filters. Start with your situation above — then narrow by credential, region, or typical engagement level.
                  </SheetDescription>
                </SheetHeader>
                {filtersUi}
                <div className="pt-6 border-t mt-6">
                  <Button type="button" className="w-full rounded-xl" onClick={() => setSheetOpen(false)}>
                    Show results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {(selectedQual || selectedSpec || selectedLocation) && (
          <div className="flex flex-wrap gap-2">
            {selectedQual && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium border">
                {selectedQual}
                <button type="button" aria-label="Remove" onClick={() => setSelectedQual(null)}><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedSpec && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium border">
                {selectedSpec}
                <button type="button" aria-label="Remove" onClick={() => setSelectedSpec(null)}><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedLocation && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium border">
                {selectedLocation}
                <button type="button" aria-label="Remove" onClick={() => setSelectedLocation(null)}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-muted/25 border border-border/50 rounded-2xl px-6 space-y-4">
            <Users className="h-11 w-11 text-muted-foreground/35 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground">No advisers match yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Try another situation above, loosen Refine filters, clear your description, or post a brief so advisers come to you.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={clearAll}>Reset search</Button>
              <Button asChild className="rounded-xl">
                <Link to="/post-job">Post a project</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {recommended.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">
                    {needLabel ? `A strong fit for · ${needLabel}` : "Advisers worth a closer look"}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    A starting point based on your situation — not a mechanical score. Take your time; the right relationship matters more than ticking every box.
                  </p>
                </div>
                <div className="grid gap-8">
                  {recommended.map((p, i) => (
                    <DiscoveryCard
                      key={p.id}
                      profile={p}
                      variant="large"
                      idx={i}
                      savedIds={savedIds}
                      onToggleSave={toggleSave}
                      activeNeed={activeNeed}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-5">
              {rest.length > 0 && (
                <>
                  <h2 className="text-base font-semibold text-foreground">More advisers</h2>
                  <div className="grid grid-cols-1 gap-8">
                    {rest.map((p, i) => (
                      <DiscoveryCard
                        key={p.id}
                        profile={p}
                        variant="default"
                        idx={i + recommended.length}
                        savedIds={savedIds}
                        onToggleSave={toggleSave}
                        activeNeed={activeNeed}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
