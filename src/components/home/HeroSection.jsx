import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ShieldCheck, Star, CheckCircle2, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTAClick } from "@/lib/analytics";



// ── Live activity ticker ──────────────────────────────────────
const ACTIVITIES = [
  "ACA professional · side project · £650 earned",
  "Remote R&D bid won · CTA · 3 hrs work",
  "★★★★★ Review — Self Assessment · done in evenings",
  "ACCA freelancer · VAT project · hired same day",
  "Corporation Tax project · bid free · won remotely",
  "CTA specialist · R&D credit · spare-time project",
  "Bookkeeping project awarded · ACCA · 100% remote",
];

function ActivityTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ACTIVITIES.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.span key={idx} className="text-[11px] text-muted-foreground font-medium"
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}>
          {ACTIVITIES[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── Game-style stat pill ──────────────────────────────────────
function StatPill({ value, label, color }) {
  return (
    <motion.div whileHover={{ scale: 1.04 }}
      className="flex flex-col items-center px-4 py-2.5 rounded-xl border"
      style={{ background: `${color}0d`, borderColor: `${color}33` }}>
      <span className="text-lg font-black leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold">{label}</span>
    </motion.div>
  );
}

// ── CTA button ────────────────────────────────────────────────
function CTAButton({ to, label, sub, primary, onClick }) {
  const btn = (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative w-full sm:w-auto overflow-hidden rounded-2xl font-black text-sm tracking-wide px-7 py-4 border-2 flex flex-col items-center sm:items-start"
      style={primary
        ? { background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", borderColor: "transparent", color: "#fff", boxShadow: "0 8px 32px rgba(99,102,241,0.45)" }
        : { background: "transparent", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }
      }
    >
      {primary && (
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: "linear" }}
        />
      )}
      <span className="relative leading-none">{label}</span>
      {sub && <span className="relative text-[10px] mt-1 opacity-60 font-semibold tracking-normal">{sub}</span>}
    </motion.button>
  );
  return <Link to={to}>{btn}</Link>;
}

// ── Main hero ─────────────────────────────────────────────────
export default function HeroSection() {
  const [liveUsers] = useState(() => 847 + Math.floor(Math.random() * 153));

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_55%,transparent_100%)]" />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />

      {/* ── FREE PROMISE BANNER — Full-width, above everything ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="relative border-b-2 border-emerald-400"
        style={{ background: "linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-stretch divide-x-2 divide-emerald-400">
            {[
              { check: "✓", label: "JOIN FREE" },
              { check: "✓", label: "BID FREE" },
              { check: "✓", label: "POST PROJECTS FREE" },
            ].map((item) => (
              <div key={item.label} className="flex-1 flex items-center justify-center gap-2.5 py-4 sm:py-5">
                <span className="text-emerald-200 text-2xl sm:text-3xl font-black leading-none select-none">{item.check}</span>
                <span className="text-white font-black text-base sm:text-xl lg:text-2xl tracking-tight leading-none">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-[11px] sm:text-xs font-bold text-emerald-100 pb-2 tracking-wide uppercase">
          No subscription · No commission · No hidden fees — ever
        </p>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 sm:pt-18 sm:pb-20 lg:pt-22 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* ── LEFT ── */}
          <div>
            {/* Platform identity label */}
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
              className="text-xs font-black uppercase tracking-widest mb-3"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              The UK's Free Remote Tax Project Marketplace
            </motion.p>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.1rem] font-black tracking-tight text-foreground leading-[1.08]"
            >
              Earn Beyond Your 9–5 with Your{" "}
              <span style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Professional Skills
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.17 }}
              className="mt-5 text-base text-muted-foreground leading-relaxed max-w-lg"
            >
              The UK marketplace for ACA, ACCA &amp; CTA professionals to win flexible remote tax projects in their spare time — outside their full-time jobs, on their own terms. No agencies. No fees. Ever.
            </motion.p>

            {/* Key benefits row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}
              className="mt-5 flex flex-wrap gap-x-5 gap-y-2"
            >
              {[
                "Fair competitive bidding",
                "100% remote projects",
                "Flexible — work in your spare time",
                "Direct access, no middlemen",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.27 }}
              className="mt-7 flex flex-col sm:flex-row gap-3"
            >
              <CTAButton
                to="/create-profile"
                label="GET EARLY ACCESS"
                sub="Notify me about UK tax projects"
                primary
                onClick={() => {
                  base44.analytics.track({ eventName: "hero_cta_clicked", properties: { cta: "early_access" } });
                  trackCTAClick("GET EARLY ACCESS", "/create-profile");
                }}
              />
              <CTAButton
                to="/post-job"
                label="⚡ POST A PROJECT FREE"
                sub="AI writes the brief · takes 2 min"
                onClick={() => {
                  base44.analytics.track({ eventName: "hero_cta_clicked", properties: { cta: "post_project" } });
                  trackCTAClick("POST A PROJECT FREE", "/post-job");
                }}
              />
            </motion.div>

            {/* Live users badge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card">
              <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }} />
              <span className="text-xs font-semibold text-muted-foreground">{liveUsers.toLocaleString()} professionals earning side income this week</span>
            </motion.div>

            {/* Live activity + ratings */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
              className="mt-6 space-y-3"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
                <div className="flex -space-x-1.5 shrink-0">
                  {["from-blue-500 to-blue-700", "from-violet-500 to-violet-700", "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700", "from-amber-500 to-amber-700"].map((g, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} border-2 border-card flex items-center justify-center text-white text-[9px] font-bold`}>
                      {["SM","JT","PP","DC","ER"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs font-black text-foreground ml-1">4.9</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Rated by 400+ verified clients</p>
                </div>
                <div className="flex-1 min-w-0"><ActivityTicker /></div>
              </div>

              {/* Stat pills */}
              <div className="flex gap-2">
                <StatPill value="500+" label="UK Experts" color="#6366f1" />
                <StatPill value="4.9★" label="Avg Rating" color="#f59e0b" />
                <StatPill value="<24h" label="First Bid" color="#10b981" />
                <StatPill value="£0" label="No Commission" color="#a855f7" />
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT — Live Marketplace Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.28 }}
            className="hidden lg:block"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.3)" }}>
                  <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Side Income · Live Now</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />active now
                </span>
              </div>

              {/* Platform promise cards */}
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Why professionals choose us</p>
                <div className="space-y-2">
                  {[
                    { icon: "💼", title: "Use skills outside your day job", desc: "Win remote tax projects in your spare time" },
                    { icon: "⚖️", title: "Fair competitive bidding", desc: "Win on merit — no agency fees, no gatekeepers" },
                    { icon: "🏡", title: "100% remote UK projects", desc: "Work from anywhere, on your schedule" },
                    { icon: "£", title: "Zero cost to participate", desc: "Free to join, free to bid, £0 commission" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/40 bg-background/50">
                      <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professionals bidding now */}
              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Earning Side Income Now</p>
                  <span className="text-[9px] text-violet-500 font-bold">3 open projects</span>
                </div>
                {[
                  { initials: "SM", name: "Sarah M.", title: "CTA · evening project", bid: "£320", bids: 4, color: "from-blue-500 to-blue-700" },
                  { initials: "JT", name: "James T.", title: "ACA · R&D · spare time", bid: "£890", bids: 2, color: "from-violet-500 to-violet-700" },
                  { initials: "PP", name: "Priya P.", title: "ACCA · remote VAT work", bid: "£150", bids: 6, color: "from-emerald-500 to-emerald-700" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-[10px] font-black shrink-0`}>{p.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{p.title}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-600">{p.bid}</div>
                      <div className="text-[9px] text-muted-foreground">{p.bids} bids</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust signals */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-1.5">
                {[
                  { icon: ShieldCheck, text: "All professionals verified against UK bodies" },
                  { icon: Star, text: "Win on skill — no agencies, no commissions" },
                  { icon: CheckCircle2, text: "Flexible remote work — fit around your career" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}