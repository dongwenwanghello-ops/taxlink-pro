import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Gavel } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTAClick } from "@/lib/analytics";
import { getAllBids } from "@/lib/bidStore";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [bidCount, setBidCount] = useState(() => getAllBids().length);
  const location = useLocation();

  useEffect(() => {
    const refresh = () => setBidCount(getAllBids().length);
    window.addEventListener("bidSubmitted", refresh);
    return () => window.removeEventListener("bidSubmitted", refresh);
  }, []);

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive(path)
        ? "text-primary bg-primary/8"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="flex items-center gap-0.5">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M10 2L3 6v8l7 4 7-4V6L10 2z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M10 2v12M3 6l7 4 7-4" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-foreground ml-1.5">
              TaxPro<span className="text-primary">UK</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          <Link to="/professionals" className={linkClass("/professionals")}>Find Experts</Link>
          <Link to="/jobs" className={linkClass("/jobs")}>Browse Projects</Link>
          <Link to="/post-job" className={linkClass("/post-job")}>Post a Project</Link>
          <Link to="/reviews" className={linkClass("/reviews")}>Reviews</Link>
          <Link to="/my-bids" className={`relative ${linkClass("/my-bids")}`}>
            My Bids
            {bidCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">{bidCount}</span>
            )}
          </Link>
          <Link to="/my-projects" className={linkClass("/my-projects")}>My Projects</Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link to="/create-profile" onClick={() => { base44.analytics.track({ eventName: "nav_cta_clicked", properties: { cta: "early_access" } }); trackCTAClick("Join Early Access", "/create-profile"); }}>
            <Button size="sm" variant="outline" className="font-bold rounded-lg h-9">
              Join Early Access
            </Button>
          </Link>
          <Link to="/post-job" onClick={() => { base44.analytics.track({ eventName: "nav_cta_clicked", properties: { cta: "post_project" } }); trackCTAClick("Post a Project Free", "/post-job"); }}>
            <Button size="sm" className="font-bold rounded-lg h-9 shadow-sm bg-gradient-to-r from-violet-600 to-primary border-0">
              ⚡ Post a Project Free
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 pt-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M10 2L3 6v8l7 4 7-4V6L10 2z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M10 2v12M3 6l7 4 7-4" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-extrabold text-foreground">TaxPro<span className="text-primary">UK</span></span>
            </div>
            <nav className="flex flex-col gap-1">
              {[
                { label: "Find Talent", to: "/professionals" },
                { label: "Browse Projects", to: "/jobs" },
                { label: "Post a Project", to: "/post-job" },
                { label: "Reviews", to: "/reviews" },
                { label: "My Bids", to: "/my-bids" },
                { label: "My Projects", to: "/my-projects" },
              ].map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.to) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                  }`}>
                  {link.label}
                </Link>
              ))}
              <div className="border-t my-4" />
              <Link to="/create-profile" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full mb-2 rounded-lg font-bold">Join Early Access</Button>
              </Link>
              <Link to="/post-job" onClick={() => setOpen(false)}>
                <Button className="w-full rounded-lg font-bold">⚡ Post a Project Free</Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}