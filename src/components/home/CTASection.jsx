import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Search } from "lucide-react";

const paths = [
  {
    icon: Search,
    tag: "For Clients",
    heading: "Post a project, find the right professional.",
    body: "Our AI helps you write a professional brief in minutes. Verified ACCA, ACA & CTA specialists compete for your project — you choose the best proposal.",
    cta: "Post a Project",
    to: "/post-job",
    style: "bg-white text-slate-950 border border-slate-200",
    btnStyle: "bg-slate-950 text-white hover:bg-slate-800 shadow-sm",
  },
  {
    icon: Briefcase,
    tag: "For Professionals",
    heading: "Create a profile and browse flexible UK tax projects.",
    body: "Join for free, bid on remote projects, and connect directly with clients looking for UK tax and accounting support.",
    cta: "Create Profile",
    to: "/create-profile",
    style: "bg-gradient-to-br from-teal-50 to-blue-50 text-slate-950 border border-teal-100",
    btnStyle: "bg-teal-700 text-white hover:bg-teal-800 shadow-sm",
  },
];

export default function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 bg-slate-50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Free to join, free to bid, and free to post projects. Start exploring the marketplace without platform fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {paths.map((p) => (
            <div key={p.tag} className={`relative rounded-[2rem] px-8 py-10 sm:px-10 sm:py-12 overflow-hidden shadow-lg shadow-slate-200/70 ${p.style}`}>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.45),transparent)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-slate-200 text-sm font-semibold mb-5 text-slate-700">
                  <p.icon className="h-4 w-4" />
                  {p.tag}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
                  {p.heading}
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8 max-w-md">
                  {p.body}
                </p>
                <Link to={p.to}>
                  <button className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 ${p.btnStyle}`}>
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