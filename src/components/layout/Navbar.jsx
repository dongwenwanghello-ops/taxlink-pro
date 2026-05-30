import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTAClick } from "@/lib/analytics";
import { getAllBids } from "@/lib/bidStore";
import { useAuth } from "@/lib/AuthContext";
import {
  resolveNavRole,
  getNavLinksForRole,
  getPrimaryCtaForRole,
  getSecondaryCtaForRole,
  isNavActive,
  NAV_ROLES,
} from "@/lib/navigationConfig";

function TaxProLogo({ className = "" }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
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
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [bidCount, setBidCount] = useState(() => getAllBids().length);
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isOnboarding = location.pathname === "/create-profile";

  const navRole = useMemo(
    () => resolveNavRole({ user, isAuthenticated }),
    [user, isAuthenticated],
  );

  const navLinks = useMemo(() => getNavLinksForRole(navRole), [navRole]);
  const primaryCta = useMemo(() => getPrimaryCtaForRole(navRole), [navRole]);
  const secondaryCta = useMemo(() => getSecondaryCtaForRole(navRole), [navRole]);

  useEffect(() => {
    const refresh = () => setBidCount(getAllBids().length);
    window.addEventListener("bidSubmitted", refresh);
    window.addEventListener("bidUpdated", refresh);
    window.addEventListener("projectAwarded", refresh);
    return () => {
      window.removeEventListener("bidSubmitted", refresh);
      window.removeEventListener("bidUpdated", refresh);
      window.removeEventListener("projectAwarded", refresh);
    };
  }, []);

  const linkClass = (path) =>
    `px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
      isNavActive(location.pathname, path)
        ? "text-primary bg-primary/8"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`;

  if (isOnboarding) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="shrink-0 group">
            <TaxProLogo />
          </Link>
          <a
            href="mailto:support@taxprouk.com?subject=TaxProUK%20onboarding%20help"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            Need help?
          </a>
        </div>
      </header>
    );
  }

  const trackNavCta = (label, to) => {
    base44.analytics.track({ eventName: "nav_cta_clicked", properties: { cta: label, path: to } });
    trackCTAClick(label, to);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={navRole === NAV_ROLES.admin ? "/admin" : "/"} className="flex items-center gap-2 shrink-0 group">
          <TaxProLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={`relative ${linkClass(link.to)}`}>
              {link.label}
              {link.badgeKey === "bids" && bidCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">
                  {bidCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          {secondaryCta && (
            <Link
              to={secondaryCta.to}
              onClick={() => trackNavCta(secondaryCta.label, secondaryCta.to)}
            >
              <Button size="sm" variant="outline" className="font-bold rounded-lg h-9">
                {secondaryCta.label}
              </Button>
            </Link>
          )}
          {primaryCta && (
            <Link
              to={primaryCta.to}
              onClick={() => trackNavCta(primaryCta.label, primaryCta.to)}
            >
              <Button
                size="sm"
                variant={primaryCta.variant === "outline" ? "outline" : "default"}
                className={`font-bold rounded-lg h-9 ${
                  primaryCta.variant !== "outline"
                    ? "shadow-sm bg-gradient-to-r from-violet-600 to-primary border-0"
                    : ""
                }`}
              >
                {primaryCta.label}
              </Button>
            </Link>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 pt-10">
            <div className="mb-8">
              <TaxProLogo />
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isNavActive(location.pathname, link.to)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                  {link.badgeKey === "bids" && bidCount > 0 ? ` (${bidCount})` : ""}
                </Link>
              ))}
              <div className="border-t my-4" />
              {secondaryCta && (
                <Link to={secondaryCta.to} onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full mb-2 rounded-lg font-bold">
                    {secondaryCta.label}
                  </Button>
                </Link>
              )}
              {primaryCta && (
                <Link to={primaryCta.to} onClick={() => setOpen(false)}>
                  <Button className="w-full rounded-lg font-bold">{primaryCta.label}</Button>
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
