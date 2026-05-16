import React from "react";
import { ShieldCheck, PoundSterling, BadgeCheck, Clock, Users, Zap, Gavel, Star, TrendingUp, Ban } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Gavel,
    title: "Bidding marketplace — not a job board",
    description: "Professionals compete for your project with quotes and timelines. You pick the best proposal. No placement fees, no recruiters, no full-time roles.",
    accent: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    icon: Zap,
    title: "AI writes your project brief",
    description: "Answer a few plain-language questions. Our AI generates a professional project description automatically — so you attract the right bids immediately.",
    accent: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: PoundSterling,
    title: "Spare-time side income",
    description: "Pick up remote tax projects around your existing job. No minimum hours, no agency, no commute. ACCA, ACA & CTA professionals earn on their own schedule.",
    accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: Star,
    title: "Two-sided reputation system",
    description: "Professionals are rated on delivery quality, on-time completion, and expertise. Clients are rated on clarity, communication, and payment reliability.",
    accent: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: BadgeCheck,
    title: "Verified credentials only",
    description: "ACA, ACCA, CTA qualifications independently checked against UK professional bodies. Clients see real verified badges — not self-reported claims.",
    accent: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    icon: Ban,
    title: "No full-time roles. Ever.",
    description: "Every engagement is remote, project-based, and flexible. This platform exists exclusively for spare-time professional work — that's the rule, not a suggestion.",
    accent: "bg-sky-50 text-sky-600 border-sky-100",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              Remote. Flexible. Project-based.
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              A trust-driven project marketplace for UK tax professionals
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              TaxPro UK is not a recruitment site. It's a bidding marketplace where ACCA, ACA & CTA professionals earn flexible spare-time income — and clients get competitive proposals from verified UK specialists.
            </p>
          </div>
          <div className="hidden lg:block text-right text-sm text-muted-foreground">
            <div className="inline-block rounded-2xl border border-border/60 bg-card p-6 text-left shadow-sm max-w-xs">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Platform Rules</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  "Remote projects only — no office roles",
                  "Project-based & flexible — no full-time",
                  "Credentials independently verified",
                  "Two-sided reputation for both parties",
                  "Delivery confirmed before payment releases",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              className="group p-6 rounded-2xl border border-border/60 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={`h-11 w-11 rounded-xl border flex items-center justify-center mb-4 ${feature.accent}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}