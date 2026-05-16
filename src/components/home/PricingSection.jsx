import React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const ROWS = [
  { feature: "Post a project",              cost: "Free", detail: "Always free, no limits" },
  { feature: "Create a professional profile", cost: "Free", detail: "Join in minutes" },
  { feature: "Submit bids",                 cost: "Free", detail: "Bid on unlimited projects" },
  { feature: "Platform commission",         cost: "£0",   detail: "No hidden fees, no commissions" },
  { feature: "AI-generated project briefs", cost: "Free", detail: "Included for all users" },
];

export default function PricingSection() {
  return (
    <section className="py-16 sm:py-20 bg-background border-t border-border/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-black mb-4 tracking-wide">
            ✓ Free to Join &nbsp;·&nbsp; ✓ Free to Bid &nbsp;·&nbsp; ✓ Free to Post
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">No Cost. No Catch.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Participation is completely free for everyone — professionals and clients alike. Use your existing skills to earn flexible side income with zero barrier to entry.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border overflow-hidden"
        >
          <div className="grid grid-cols-3 bg-secondary/60 px-5 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border">
            <span>Feature</span>
            <span className="text-center">Cost</span>
            <span className="text-right">Details</span>
          </div>
          {ROWS.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 items-center px-5 py-4 ${i < ROWS.length - 1 ? "border-b border-border/40" : ""} bg-card`}>
              <span className="text-sm font-semibold text-foreground">{row.feature}</span>
              <span className="text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold">
                  <CheckCircle2 className="h-3 w-3" />{row.cost}
                </span>
              </span>
              <span className="text-right text-xs text-muted-foreground">{row.detail}</span>
            </div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          No subscription. No commission. No hidden fees — ever.
        </p>
      </div>
    </section>
  );
}