import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ArrowRight, Clock, Users, TrendingUp, Zap, Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import DemoProjectDetailModal from "@/components/demo/DemoProjectDetailModal";

// Demo project data with multiple states
const DEMO_PROJECTS = [
  {
    id: "open",
    title: "2024 Corporation Tax Return Filing",
    budget: 450,
    company_name: "Smith & Co Ltd",
    statusLabel: "Open for Bids",
    statusColor: "bg-emerald-500 animate-pulse",
    bids_received: 5,
    views: 35,
    time_left: "3 days",
    description: "Full corporation tax return for financial year ending 31st Dec 2024, including VAT reconciliation, capital allowances, and directors' loans analysis.",
    recent_activity: [
      "New bid from ACCA specialist — 12 mins ago",
      "5th quote received — 25 mins ago",
      "CTA expert placed bid — 1 hour ago",
      "2 professionals viewing now",
    ],
    market_insight: "£450 is within typical market range for this complexity. Expect 6–10 qualified bids over 3 days.",
    sample_bid: {
      bidder_name: "Sarah Chen, ACCA",
      amount: 425,
      timeline: "5 working days",
      proposal: "15+ years of experience with corporate tax. I'll handle all HMRC submissions and provide a detailed breakdown.",
    },
  },
  {
    id: "under_review",
    title: "Payroll Setup — 20 Employee Business",
    budget: 280,
    company_name: "TechVenture Ltd",
    statusLabel: "Under Review",
    statusColor: "bg-violet-500",
    bids_received: 7,
    views: 58,
    time_left: "Closed",
    description: "Complete payroll system setup for 20 employees, including PAYE registration, RTI submissions, pension auto-enrolment, and staff briefing documentation.",
    recent_activity: [
      "Bid period closed — reviewing 7 quotes",
      "Final bid received 1 hour before deadline",
      "High engagement — 58 views from qualified professionals",
      "Shortlisting in progress",
    ],
    market_insight: "Strong interest from your budget. Most competitive bids clustered around £280–£320. Selection expected within 24 hours.",
    sample_bid: {
      bidder_name: "Michael Johnson, ACA",
      amount: 310,
      timeline: "10 working days",
      proposal: "Payroll specialist with experience managing similar-sized teams. I'll ensure smooth implementation and full HMRC compliance.",
    },
  },
  {
    id: "awarded",
    title: "Self Assessment — Multiple Income Sources",
    budget: 320,
    company_name: "James Wilson (Self-employed)",
    statusLabel: "Awarded & In Progress",
    statusColor: "bg-emerald-500",
    bids_received: 3,
    views: 22,
    time_left: "Delivery due in 5 days",
    description: "Personal self-assessment including employment income, rental property (1 property), dividends from shareholding, and personal allowance optimization.",
    recent_activity: [
      "Professional started work — 2 days ago",
      "You selected bid from Alex Patel — £320",
      "Project marked as 'In Progress'",
      "Communication via platform messaging",
    ],
    market_insight: "Project proceeding smoothly. Professional is on track for delivery. Client satisfaction currently rated as high.",
    sample_bid: {
      bidder_name: "Alex Patel, ACCA (Selected)",
      amount: 320,
      timeline: "5 working days",
      proposal: "Specialist in complex personal tax. I've reviewed your income sources and can optimize your allowances. Full documentation included.",
    },
  },
];

function DemoProjectCard({ project, onClick }) {
  const isAwarded = project.id === "awarded";
  const isUnderReview = project.id === "under_review";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/70 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="p-5 pb-3 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-violet-100 text-violet-700 border-violet-200">Demo</Badge>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">{project.company_name}</span>
            </div>
            <h4 className="font-semibold text-foreground text-sm">{project.title}</h4>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">Budget</p>
            <p className="text-lg font-extrabold text-primary">£{project.budget}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
          <span className={`h-2 w-2 rounded-full ${project.statusColor}`} />
          <p className="text-xs font-bold text-foreground flex-1">{project.statusLabel}</p>
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">{project.time_left}</span>
        </div>

        {/* Metrics Row */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-violet-600" />
            <span className="font-semibold text-violet-700">{project.bids_received} bids</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-semibold text-blue-700">{project.views} views</span>
          </div>
          {isAwarded && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-emerald-700">Awarded</span>
            </div>
          )}
        </div>

        {/* Special Badges */}
        {isUnderReview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 flex items-center gap-1.5 text-xs text-violet-700 font-bold">
            <Star className="h-3.5 w-3.5 fill-violet-400" />
            Actively reviewing bids
          </motion.div>
        )}
        {isAwarded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Professional is delivering
          </motion.div>
        )}

        {/* View Details */}
        <div className="pt-2 border-t border-border/40">
          <button className="text-primary text-xs font-semibold hover:underline underline-offset-2">
            View full project →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyProjectsDemo() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-3">
          <span>📚</span> Interactive Demo
        </div>
        <h3 className="text-lg font-bold text-foreground">Your Projects Dashboard</h3>
        <p className="text-sm text-muted-foreground">See how projects move through the platform lifecycle from posting to delivery</p>
      </div>

      {/* Demo Project Cards */}
      <div className="space-y-4">
        {DEMO_PROJECTS.map((project, i) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <DemoProjectCard project={project} onClick={() => setSelectedProject(project)} />
          </motion.div>
        ))}
      </div>

      {/* Project Lifecycle Info */}
      <div className="rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 text-sm text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">Project Lifecycle:</p>
        <ul className="space-y-1.5 text-xs ml-3">
          <li className="flex gap-2">
            <span className="text-primary font-bold">1.</span>
            <span><strong>Open for Bids</strong> — Professionals compete with quotes and timelines</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">2.</span>
            <span><strong>Under Review</strong> — You compare and shortlist the best fit</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">3.</span>
            <span><strong>Awarded & In Progress</strong> — Professional delivers work with milestone tracking</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">4.</span>
            <span><strong>Completed</strong> — Review work, release payment, and build reputation</span>
          </li>
        </ul>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/30 border border-border/40 p-3 space-y-1.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Zap className="h-3.5 w-3.5 text-violet-600" />
            Market Insights
          </p>
          <p className="text-[11px] text-muted-foreground">Guidance on budget, competition, and bid quality</p>
        </div>
        <div className="rounded-lg bg-secondary/30 border border-border/40 p-3 space-y-1.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            Bid Activity
          </p>
          <p className="text-[11px] text-muted-foreground">Real-time updates as professionals bid and engage</p>
        </div>
      </div>

      {/* CTA */}
      <Link to="/post-job">
        <Button className="w-full h-11 rounded-xl font-semibold gap-2 bg-gradient-to-r from-violet-600 to-primary border-0">
          <Briefcase className="h-4 w-4" />
          Post My First Project — Free
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      <p className="text-center text-xs text-muted-foreground">
        ✓ 100% free during beta · No credit card required · Instant posting
      </p>

      {/* Modal */}
      {selectedProject && (
        <DemoProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
}