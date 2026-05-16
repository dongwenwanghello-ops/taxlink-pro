import React from "react";
import { CheckCircle2, X } from "lucide-react";
import { motion } from "framer-motion";

const competitors = ["Upwork", "Fiverr", "Local Firm"];

const rows = [
  { feature: "UK tax specialists only",        us: true,  upwork: false, fiverr: false, firm: true  },
  { feature: "Verified qualifications (ACA/ACCA/CTA)", us: true,  upwork: false, fiverr: false, firm: true  },
  { feature: "Transparent hourly rates",        us: true,  upwork: true,  fiverr: true,  firm: false },
  { feature: "No platform commission",          us: true,  upwork: false, fiverr: false, firm: true  },
  { feature: "Contact directly, no middlemen", us: true,  upwork: false, fiverr: false, firm: true  },
  { feature: "Hire within 24 hours",            us: true,  upwork: true,  fiverr: true,  firm: false },
  { feature: "Freelance flexibility",           us: true,  upwork: true,  fiverr: true,  firm: false },
  { feature: "Real client reviews",             us: true,  upwork: true,  fiverr: true,  firm: false },
];

function Cell({ val }) {
  return val
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
    : <X className="h-4 w-4 text-slate-300 mx-auto" />;
}

export default function WhyUsSection() {
  return (
    <section className="py-16 sm:py-24 bg-card border-t border-border/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
            Why TaxPro UK
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Not Upwork. Not Fiverr. Not your local firm.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            We built this specifically for UK tax and accounting. That makes a difference.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="overflow-x-auto rounded-2xl border border-border/60 bg-background shadow-sm"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-5 py-4 text-muted-foreground font-medium w-1/2">Feature</th>
                <th className="px-4 py-4 text-center">
                  <span className="inline-flex flex-col items-center gap-0.5">
                    <span className="font-extrabold text-primary text-sm">TaxPro UK</span>
                  </span>
                </th>
                {competitors.map((c) => (
                  <th key={c} className="px-4 py-4 text-center text-muted-foreground font-medium text-xs">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                  <td className="px-5 py-3 text-foreground font-medium">{row.feature}</td>
                  <td className="px-4 py-3 text-center bg-primary/4"><Cell val={row.us} /></td>
                  <td className="px-4 py-3 text-center"><Cell val={row.upwork} /></td>
                  <td className="px-4 py-3 text-center"><Cell val={row.fiverr} /></td>
                  <td className="px-4 py-3 text-center"><Cell val={row.firm} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}