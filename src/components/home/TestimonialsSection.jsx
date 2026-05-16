import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote: "Found a CTA-qualified adviser within a day. Saved us £38k in corp tax we hadn't even claimed.",
    author: "Richard H.",
    role: "CFO · London",
    initials: "RH",
    color: "from-blue-500 to-blue-700",
    rating: 5,
  },
  {
    quote: "Profiles are transparent and rates are upfront. No awkward negotiation — just found the right person and got started.",
    author: "Aisha K.",
    role: "Founder · Manchester",
    initials: "AK",
    color: "from-violet-500 to-violet-700",
    rating: 5,
  },
  {
    quote: "My ACA badge immediately builds trust. Three new retainer clients in my first six weeks on the platform.",
    author: "James T.",
    role: "Chartered Accountant · ACA",
    initials: "JT",
    color: "from-emerald-500 to-emerald-700",
    rating: 5,
  },
  {
    quote: "Sorted our R&D claim from scratch. The adviser James found on here handled HMRC start to finish — zero stress.",
    author: "Olivia P.",
    role: "CTO · SaaS Start-up",
    initials: "OP",
    color: "from-rose-500 to-rose-700",
    rating: 5,
  },
  {
    quote: "Finally a platform that understands accountants aren't generalists. The filters alone save hours of scrolling.",
    author: "Sarah M.",
    role: "Tax Adviser · CTA",
    initials: "SM",
    color: "from-amber-500 to-amber-700",
    rating: 5,
  },
  {
    quote: "Got my self assessment done in 3 days, expenses maximised, and the fixed fee meant no surprises.",
    author: "Dan F.",
    role: "Freelance Designer · Bristol",
    initials: "DF",
    color: "from-sky-500 to-sky-700",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));
  const t = testimonials[current];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            What people are saying
          </h2>
          <p className="mt-2 text-muted-foreground">Real feedback from clients and professionals on TaxPro UK.</p>
        </div>

        {/* Featured quote */}
        <div className="max-w-2xl mx-auto mb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border/60 rounded-2xl p-8 sm:p-10 text-center shadow-sm"
            >
              <div className="flex justify-center gap-0.5 mb-5">
                {Array(t.rating).fill(0).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-xl font-semibold text-foreground leading-snug mb-6">
                "{t.quote}"
              </blockquote>
              <div className="flex flex-col items-center gap-2">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="outline" size="icon" onClick={prev} className="rounded-full h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={next} className="rounded-full h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { value: "98%", label: "Client Satisfaction" },
            { value: "£2M+", label: "Tax Savings Facilitated" },
            { value: "500+", label: "Verified Professionals" },
            { value: "< 24h", label: "Average First Response" },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 rounded-xl bg-card border border-border/50">
              <div className="text-2xl font-extrabold text-primary">{item.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}