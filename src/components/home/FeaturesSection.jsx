import React from "react";
import { ShieldCheck, PoundSterling, BadgeCheck, Clock, Users, Zap, Gavel, Star, TrendingUp, Ban } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Gavel,
    title: "Bidding marketplace — not a job board",
    description: "Professionals compete for your project with quotes and timelines. You pick the best proposal. Free to post, with no recruiters or full-time roles.",
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
    title: "Credential-led profiles",
    description: "Professionals can show ACA, ACCA, CTA and other qualifications clearly, helping clients compare expertise with more confidence.",
    accent: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    icon: Ban,
    title: "Remote, project-based work",
    description: "The marketplace is focused on flexible UK tax and accounting projects, not office roles or long recruitment processes.",
    accent: "bg-sky-50 text-sky-600 border-sky-100",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 bg-slate-50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-700 text-xs font-bold mb-4 border border-indigo-200">
              Remote. Flexible. Project-based.
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              A trust-driven project marketplace for UK tax professionals
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              TaxPro UK is a guided professional matching marketplace where ACCA, ACA & CTA specialists find flexible work — and clients compare expertise, approach, and fit from verified UK professionals.
            </p>
          </div>
          <div className="hidden lg:block text-right text-sm text-slate-600">
            <div className="inline-block rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-lg shadow-slate-200/70 max-w-xs">
              <p className="text-xs font-black text-teal-700 uppercase tracking-widest mb-3">Marketplace signals</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  "Remote projects only — no office roles",
                  "Project-based & flexible — no full-time",
                  "Named professional identities",
                  "Verified completed-project reviews",
                  "Bidding activity and pricing guidance",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
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
              className="group p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1"
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