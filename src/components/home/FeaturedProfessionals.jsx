import React from "react";
import { DEMO_PROFESSIONALS } from "@/lib/demoData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import ProfileCard from "../shared/ProfileCard";
import { motion } from "framer-motion";

const profiles = DEMO_PROFESSIONALS.slice(0, 6);

export default function FeaturedProfessionals() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Verified Talent
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Top Professionals
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hand-picked, qualification-verified experts ready to work with you.
            </p>
          </div>
          <Link to="/professionals" className="shrink-0">
            <Button variant="outline" className="rounded-xl gap-2">
              Browse All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <ProfileCard profile={profile} featured={i < 1} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}