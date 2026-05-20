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
      className="relative w-full sm:w-auto overflow-hidden rounded-2xl font-bold text-sm tracking-wide px-7 py-4 border flex flex-col items-center sm:items-start transition-shadow"
      style={primary
        ? { background: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)", borderColor: "transparent", color: "#fff", boxShadow: "0 14px 30px rgba(37,99,235,0.18)" }
        : { background: "#ffffff", borderColor: "#dbe3ef", color: "#0f172a", boxShadow: "0 8px 22px rgba(15,23,42,0.06)" }
      }
    >
      <span className="relative leading-none">{label}</span>
      {sub && <span className="relative text-[10px] mt-1 opacity-70 font-semibold tracking-normal">{sub}</span>}
    </motion.button>
  );
  return <Link to={to}>{btn}</Link>;
}

// ── Main hero ─────────────────────────────────────────────────
export default function HeroSection() {
  const [liveUsers] = useState(() => 847 + Math.floor(Math.random() * 153));

  return (
    <section className="relative overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.08),transparent_26%)]" />

      {/* Top glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* ── Beta marketplace banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="relative border-b border-slate-200 bg-white/80 backdrop-blur"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-stretch divide-x divide-slate-200">
            {[
              { check: "✓", label: "FREE TO JOIN" },
              { check: "✓", label: "FREE TO BID" },
              { check: "✓", label: "FREE TO POST PROJECTS" },
            ].map((item) => (
              <div key={item.label} className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4">
                <span className="text-teal-700 text-xl sm:text-2xl font-black leading-none select-none">{item.check}</span>
                <span className="text-slate-800 font-black text-xs sm:text-base lg:text-lg tracking-tight leading-none">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-[11px] sm:text-xs font-bold text-slate-500 pb-2 tracking-wide uppercase">
          No subscription · No platform commission · No hidden fees
        </p>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-18 sm:pb-24 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-[1.03fr_0.97fr] gap-10 lg:gap-14 items-center">

          {/* ── LEFT ── */}
          <div>
            {/* Platform identity label */}
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest mb-4 text-teal-800"
            >
              <Zap className="h-3.5 w-3.5" />
              UK Tax & Accounting Freelance Marketplace
            </motion.p>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-[4rem] font-black tracking-tight text-slate-950 leading-[1.02]"
            >
              Find Flexible{" "}
              <span style={{ background: "linear-gradient(135deg,#0f766e,#2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                UK Tax Projects
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.17 }}
              className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl"
            >
              Built for ACA, ACCA &amp; CTA professionals looking for remote freelance and side income opportunities, with direct client access and flexible UK tax work.
            </motion.p>

            {/* Key benefits row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl"
            >
              {[
                "Remote freelance tax work",
                "Side income opportunities",
                "Direct client access",
                "Free to join, bid and post",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.27 }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl"
            >
              <CTAButton
                to="/create-profile"
                label="CREATE PROFILE"
                sub="Free to join"
                primary
                onClick={() => {
                  base44.analytics.track({ eventName: "hero_cta_clicked", properties: { cta: "create_profile" } });
                  trackCTAClick("CREATE PROFILE", "/create-profile");
                }}
              />
              <CTAButton
                to="/jobs"
                label="BROWSE PROJECTS"
                sub="See open UK tax work"
                onClick={() => {
                  base44.analytics.track({ eventName: "hero_cta_clicked", properties: { cta: "browse_projects" } });
                  trackCTAClick("BROWSE PROJECTS", "/jobs");
                }}
              />
              <CTAButton
                to="/post-job"
                label="POST A PROJECT"
                sub="For clients"
                onClick={() => {
                  base44.analytics.track({ eventName: "hero_cta_clicked", properties: { cta: "post_project" } });
                  trackCTAClick("POST A PROJECT", "/post-job");
                }}
              />
            </motion.div>

            {/* Live users badge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm">
              <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }} />
              <span className="text-xs font-semibold text-slate-600">{liveUsers.toLocaleString()} professionals exploring flexible tax projects</span>
            </motion.div>

            {/* Live activity + ratings */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
              className="mt-6 space-y-3"
            >
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex -space-x-1.5 shrink-0">
                  {["from-blue-500 to-blue-700", "from-violet-500 to-violet-700", "from-emerald-500 to-emerald-700", "from-rose-500 to-rose-700", "from-amber-500 to-amber-700"].map((g, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}>
                      {["SM","JT","PP","DC","ER"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs font-black text-slate-950 ml-1">4.9</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Marketplace trust signals</p>
                </div>
                <div className="flex-1 min-w-0"><ActivityTicker /></div>
              </div>

              {/* Stat pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatPill value="500+" label="UK Experts" color="#6366f1" />
                <StatPill value="4.9★" label="Avg Rating" color="#f59e0b" />
                <StatPill value="<24h" label="First Bid" color="#10b981" />
                <StatPill value="£0" label="Platform Fees" color="#0f766e" />
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT — Live Marketplace Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.28 }}
            className="hidden lg:block"
          >
            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
              <div className="relative space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{ background: "rgba(15,118,110,0.08)", borderColor: "rgba(15,118,110,0.18)" }}>
                  <TrendingUp className="h-3.5 w-3.5 text-teal-700" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-800">Project marketplace preview</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />active now
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-700">Featured project</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950 leading-tight">Capital Gains Tax Support for Property Sale</h3>
                    <p className="mt-1 text-xs text-slate-500">Remote · CTA preferred · Flexible deadline</p>
                  </div>
                  <div className="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 text-right">
                    <p className="text-lg font-black text-teal-800">£650</p>
                    <p className="text-[10px] text-teal-700">opening budget</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["6", "active bids"],
                    ["2h", "first reply"],
                    ["100%", "remote"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center">
                      <p className="text-base font-black text-slate-950">{value}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform promise cards */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Why professionals choose us</p>
                <div className="space-y-2">
                  {[
                    { icon: "💼", title: "Use your tax skills flexibly", desc: "Find remote UK tax projects that fit around your schedule" },
                    { icon: "⚖️", title: "Direct client access", desc: "Speak with clients and compete on clear proposals" },
                    { icon: "🏡", title: "100% remote UK projects", desc: "Work from anywhere, on your schedule" },
                    { icon: "£", title: "Free marketplace model", desc: "Free to join, free to bid and free to post projects" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-950">{item.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professionals bidding now */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Professionals bidding now</p>
                  <span className="text-[9px] text-teal-700 font-bold">3 open projects</span>
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
                        <span className="text-xs font-bold text-slate-950">{p.name}</span>
                        <CheckCircle2 className="h-3 w-3 text-teal-700 shrink-0" />
                      </div>
                      <span className="text-[10px] text-slate-500">{p.title}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-teal-700">{p.bid}</div>
                      <div className="text-[9px] text-slate-400">{p.bids} bids</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust signals */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3 space-y-1.5">
                {[
                  { icon: ShieldCheck, text: "Built for named UK tax and accounting professionals" },
                  { icon: Star, text: "Marketplace profiles highlight credentials and experience" },
                  { icon: CheckCircle2, text: "Flexible remote work — fit around your career" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-teal-800 font-medium">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}