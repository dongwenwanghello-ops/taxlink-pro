import React from "react";
import { Sparkles, TrendingUp, Clock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FAIR_MARKET_PRICES, computeFairMarketRange } from "@/lib/marketplaceIntelligence";

// Base pricing per service (min, max) in GBP
const SERVICE_BASE_PRICES = FAIR_MARKET_PRICES;

// Multipliers
const RECORDS_READY_DISCOUNT = 0.9; // 10% off if records are ready

// Professional levels by max level value
const LEVEL_LABELS = {
  2: "AAT / ATT professional",
  3: "ACCA / ACA professional",
  4: "ACA / CTA professional",
  5: "CTA specialist",
};

// Typical days per service
const SERVICE_DAYS = {
  self_assessment:   { min: 3,  max: 10 },
  vat_return:        { min: 2,  max: 7  },
  corporation_tax:   { min: 5,  max: 14 },
  rd_claim:          { min: 14, max: 28 },
  payroll:           { min: 1,  max: 5  },
  bookkeeping:       { min: 3,  max: 10 },
  tax_investigation: { min: 7,  max: 28 },
  capital_gains:     { min: 3,  max: 10 },
  inheritance_tax:   { min: 7,  max: 21 },
  other:             { min: 3,  max: 14 },
};

function formatDays(min, max) {
  if (max >= 28) return `${Math.round(min / 7)}–${Math.round(max / 7)} weeks`;
  if (max >= 14) return `${Math.round(min / 7)}–${Math.round(max / 7)} weeks`;
  return `${min}–${max} days`;
}

function round50(n) {
  return Math.round(n / 50) * 50;
}

export function computeEstimate(services, complexity, urgency, recordsReady) {
  if (!services.length || !complexity || !urgency) return null;

  const rm = recordsReady ? RECORDS_READY_DISCOUNT : 1;

  const lines = services.map(svc => {
    const base = SERVICE_BASE_PRICES[svc];
    if (!base) return null;
    const marketRange = computeFairMarketRange(svc, complexity, urgency, {
      missingRecords: !recordsReady,
      remote: true,
    });
    const min = Math.max(50, round50(marketRange.min * rm));
    const max = Math.max(50, round50(marketRange.max * rm));
    return { svc, label: base.label, min, max, level: base.level };
  }).filter(Boolean);

  const rawMin = lines.reduce((s, l) => s + l.min, 0);
  const rawMax = lines.reduce((s, l) => s + l.max, 0);

  // Bundle discount: 5% per extra service, capped at 20%
  const bundleDiscount = services.length > 1
    ? Math.min(0.20, (services.length - 1) * 0.05)
    : 0;

  const totalMin = Math.max(50, round50(rawMin * (1 - bundleDiscount)));
  const totalMax = Math.max(50, round50(rawMax * (1 - bundleDiscount)));

  // Highest required level
  const maxLevel = Math.max(...lines.map(l => l.level));
  const profLevel = LEVEL_LABELS[maxLevel] ?? "ACA / CTA professional";

  // Timeline: sum of max days for all services, then take a rough parallel estimate
  const totalMaxDays = lines.reduce((s, l) => s + (SERVICE_DAYS[l.svc]?.max ?? 10), 0);
  const totalMinDays = lines.reduce((s, l) => s + (SERVICE_DAYS[l.svc]?.min ?? 3), 0);
  // Parallel factor: multi-service projects overlap about 40%
  const parallelFactor = services.length > 1 ? 0.65 : 1;
  const estMinDays = Math.round(totalMinDays * parallelFactor);
  const estMaxDays = Math.round(totalMaxDays * parallelFactor);
  const timeline = formatDays(estMinDays, estMaxDays);

  return { lines, rawMin, rawMax, bundleDiscount, totalMin, totalMax, profLevel, timeline };
}

export default function PricingEstimate({ services, complexity, urgency, recordsReady }) {
  const est = computeEstimate(services, complexity, urgency, recordsReady);
  if (!est) return null;

  const discountPct = Math.round(est.bundleDiscount * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4 space-y-3"
    >
      {/* Header */}
      <div className="space-y-2 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          <span className="text-xs font-black text-violet-700 uppercase tracking-widest">Estimated Professional Fee</span>
        </div>
        <p className="text-xs text-violet-600">What qualified professionals typically charge for this work</p>
      </div>

      {/* Per-service lines */}
      <div className="space-y-1.5">
        {est.lines.map(line => (
          <div key={line.svc} className="flex items-center justify-between text-sm">
            <span className="text-violet-800 font-medium">{line.label}</span>
            <span className="font-semibold text-violet-900 tabular-nums">£{line.min.toLocaleString()}–£{line.max.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Bundle discount */}
      <AnimatePresence>
        {discountPct > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-violet-200 pt-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <span className="text-base">🎁</span> Bundle discount
              </span>
              <span className="font-bold text-emerald-700">−{discountPct}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Total */}
      <div className="border-t border-violet-300 pt-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-violet-900">Estimated total</span>
        <span className="text-base font-extrabold text-violet-900 tabular-nums">
          £{est.totalMin.toLocaleString()}–£{est.totalMax.toLocaleString()}
        </span>
      </div>

      {/* Meta: level + timeline */}
      <div className="flex flex-wrap gap-3 pt-1">
        <span className="flex items-center gap-1.5 text-xs text-violet-700 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          {est.profLevel}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-violet-700 font-semibold">
          <Clock className="h-3.5 w-3.5" />
          Typical: {est.timeline}
        </span>
      </div>
    </motion.div>
  );
}