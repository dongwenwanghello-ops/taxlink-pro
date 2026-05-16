import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Search, MessageSquare, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "client", label: "I'm a Client", icon: Building2 },
  { id: "professional", label: "I'm a Professional", icon: UserPlus },
];

const steps = {
  client: [
    { icon: Search, step: "01", title: "Post Your Project", description: "Select project type, answer guided questions. Our AI writes a professional brief automatically — no expertise in writing needed." },
    { icon: MessageSquare, step: "02", title: "Receive Competitive Bids", description: "Verified ACCA, ACA & CTA professionals compete for your project. You see their quotes, timelines, and reputation scores side-by-side." },
    { icon: UserPlus, step: "03", title: "Select the Best Proposal", description: "Compare bids on price, delivery time, qualifications, and trust score. Award the project to your preferred expert." },
    { icon: CheckCircle, step: "04", title: "Confirm Delivery", description: "Work is delivered remotely. Confirm completion to release payment and leave a review — building the marketplace's trust data." },
  ],
  professional: [
    { icon: UserPlus, step: "01", title: "Create & Verify Profile", description: "Showcase ACA, ACCA, CTA or other qualifications. We verify credentials against UK professional bodies — your badge builds instant client trust." },
    { icon: Search, step: "02", title: "Browse Spare-Time Projects", description: "Find remote, flexible projects that fit around your existing commitments. Filter by project type, complexity, and budget." },
    { icon: MessageSquare, step: "03", title: "Submit Your Quote", description: "Place a competitive bid with your price, timeline, and a short proposal. Your reputation score gives you an edge over competitors." },
    { icon: CheckCircle, step: "04", title: "Deliver & Build Reputation", description: "Complete the project remotely, mark as delivered, and earn a client review. Every delivery strengthens your reputation and future bid success rate." },
  ],
};

export default function HowItWorksSection() {
  const [tab, setTab] = useState("client");
  const activeSteps = steps[tab];

  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            Bidding marketplace — not a job board
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            How the bidding marketplace works
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Clients post projects. Verified professionals compete with quotes. The best proposal wins.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-12">
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
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeSteps.map((item, index) => (
            <motion.div
              key={`${tab}-${item.step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="relative"
            >
              {/* Connector line */}
              {index < activeSteps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2.5rem)] right-0 h-px border-t-2 border-dashed border-border/60" />
              )}
              <div className="text-center px-2">
                <div className="relative inline-flex mb-5">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[11px] font-bold text-primary-foreground">{index + 1}</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}