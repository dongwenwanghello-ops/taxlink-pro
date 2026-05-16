import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Search } from "lucide-react";

const paths = [
  {
    icon: Search,
    tag: "For Clients",
    heading: "Post a project, get competitive bids.",
    body: "Our AI helps you write a professional brief in minutes. Verified ACCA, ACA & CTA specialists compete for your project — you choose the best proposal.",
    cta: "Post a Project — Free",
    to: "/post-job",
    style: "bg-primary text-primary-foreground",
    btnStyle: "bg-white text-primary hover:bg-white/90",
  },
  {
    icon: Briefcase,
    tag: "For Professionals",
    heading: "Get notified about matching UK tax projects.",
    body: "Join early access with just your email and optional credentials. No password, CV upload, or full account setup while we validate marketplace demand.",
    cta: "Get Early Access",
    to: "/create-profile",
    style: "bg-foreground text-background",
    btnStyle: "bg-white/10 border border-white/20 text-white hover:bg-white/20",
  },
];

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Post a remote project or start earning flexible side-income as a verified UK tax professional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {paths.map((p) => (
            <div key={p.tag} className={`relative rounded-3xl px-8 py-10 sm:px-10 sm:py-12 overflow-hidden ${p.style}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm font-semibold mb-5">
                  <p.icon className="h-4 w-4" />
                  {p.tag}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
                  {p.heading}
                </h3>
                <p className="opacity-80 leading-relaxed mb-8 max-w-md">
                  {p.body}
                </p>
                <Link to={p.to}>
                  <button className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${p.btnStyle}`}>
                    {p.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}