import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import HeroSection from "../components/home/HeroSection";
import TrustBanner from "../components/home/TrustBanner";
import FeaturedProfessionals from "../components/home/FeaturedProfessionals";
import FeaturesSection from "../components/home/FeaturesSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";
import WhyUsSection from "../components/home/WhyUsSection";
import MarketplaceGovernance from "../components/home/MarketplaceGovernance";
import PricingSection from "../components/home/PricingSection";

export default function Home() {
  useEffect(() => {
    base44.analytics.track({ eventName: "page_viewed", properties: { page: "home" } });
  }, []);

  return (
    <>
      <HeroSection />
      <TrustBanner />
      <FeaturedProfessionals />
      <FeaturesSection />
      <HowItWorksSection />
      <MarketplaceGovernance />
      <WhyUsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  );
}