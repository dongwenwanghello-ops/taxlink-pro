import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Gavel, CreditCard, PackageCheck, AlertTriangle, Star, ChevronDown, ChevronUp, Building2, UserPlus } from "lucide-react";

const tabs = [
  { id: "client", label: "I'm a Client", icon: Building2 },
  { id: "professional", label: "I'm a Professional", icon: UserPlus },
];

const clientFlow = [
  { icon: Gavel,       step: "01", title: "Post a Project",         desc: "Describe your tax or accounting need. Our AI writes the professional brief. Your project goes live instantly." },
  { icon: ShieldCheck, step: "02", title: "Receive Verified Bids",  desc: "Only ACCA, ACA & CTA verified professionals can bid. You see their quote, timeline, rating, and on-time delivery rate side-by-side." },
  { icon: Star,        step: "03", title: "Select the Best Proposal", desc: "Compare bids on price, speed, qualifications, and reputation score. Award the project to your preferred expert." },
  { icon: PackageCheck,step: "04", title: "Confirm Delivery",       desc: "Delivery is confirmed by you before payment releases. This protects both parties and builds verifiable trust history." },
];

const professionalFlow = [
  { icon: ShieldCheck, step: "01", title: "Create a Verified Profile", desc: "Submit your ACA, ACCA, or CTA credentials. We check against UK professional bodies — your badge is real, not self-reported." },
  { icon: Gavel,       step: "02", title: "Browse & Bid on Projects",  desc: "Filter remote projects by type, complexity, and budget. Submit your quote, timeline, and a short proposal to compete." },
  { icon: PackageCheck,step: "03", title: "Deliver Remotely",          desc: "Work flexibly around your existing commitments. Mark the project as delivered when complete." },
  { icon: Star,        step: "04", title: "Build Your Reputation",     desc: "Each completed project improves your on-time rate, rating, and completion score — making future bids more competitive." },
];

const rules = [
  {
    icon: CreditCard,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    title: "Payment Protection",
    desc: "Funds are only released after the client confirms delivery. Neither party can be shortchanged.",
  },
  {
    icon: AlertTriangle,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    title: "Dispute Resolution",
    desc: "If delivery is disputed, our resolution team reviews the work against the original brief. Outcomes are recorded in reputation history.",
  },
  {
    icon: Star,
    color: "bg-violet-50 text-violet-600 border-violet-100",
    title: "Reputation Consequences",
    desc: "Late delivery, cancellations, or disputes reduce your on-time rate and visibility in future bids. A strong track record compounds over time.",
  },
  {
    icon: ShieldCheck,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    title: "Verified Credentials Only",
    desc: "Unverified profiles cannot bid. Credential checks run against ACCA, ICAEW, CIOT, and AAT registers.",
  },
];

export default function MarketplaceGovernance() {
  const [tab, setTab] = useState("client");
  const [rulesOpen, setRulesOpen] = useState(false);
  const flow = tab === "client" ? clientFlow : professionalFlow;

  return (
    <section className="py-16 sm:py-20 bg-card border-t border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <ShieldCheck className="h-3.5 w-3.5" /> Governed marketplace — not just a listing site
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">How Bidding Works</h2>
          <p className="mt-3 text-muted-foreground">
            Every transaction on TaxPro UK follows a defined lifecycle — from project posting to payment release — so both clients and professionals know exactly what to expect.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl border border-border p-1 bg-background gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flow steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
          >
            {flow.map((item, i) => (
              <div key={item.step} className="relative">
                {i < flow.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+2.5rem)] right-0 h-px border-t-2 border-dashed border-border/50" />
                )}
                <div className="text-center px-2">
                  <div className="relative inline-flex mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Expandable governance rules */}
        <div className="border border-border/60 rounded-2xl overflow-hidden">
          <button
            onClick={() => setRulesOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 bg-secondary/30 hover:bg-secondary/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Marketplace Rules: Payment protection, disputes &amp; reputation</span>
            </div>
            {rulesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          <AnimatePresence initial={false}>
            {rulesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
                  {rules.map((rule) => (
                    <div key={rule.title} className="space-y-2">
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${rule.color}`}>
                        <rule.icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}