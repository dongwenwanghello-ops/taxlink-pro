import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Clock, PoundSterling, Pencil, ExternalLink, Loader2, UserPlus, Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const ROLE_LABELS = {
  client: "Client",
  professional: "Professional",
  both: "Client & Professional",
};

export default function MyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("my_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <UserPlus className="h-14 w-14 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No profile yet</h2>
        <p className="text-muted-foreground mb-6">Create your professional profile to start receiving bids.</p>
        <Link to="/create-profile">
          <Button className="rounded-xl h-11 px-8 font-semibold">Create Your Profile</Button>
        </Link>
      </div>
    );
  }

  const availabilityConfig = {
    available: { label: "Available now", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    limited: { label: "Limited availability", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    unavailable: { label: "Not taking clients", dot: "bg-slate-400", badge: "bg-secondary text-muted-foreground border-border" },
  };
  const visibilityConfig = {
    public:  { Icon: Eye,    label: "Public",           desc: "Visible in search & directory",        color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    hidden:  { Icon: EyeOff, label: "Open Privately",   desc: "Hidden from search · AI-matchable",    color: "bg-violet-50 text-violet-700 border-violet-200" },
    private: { Icon: Lock,   label: "Private",          desc: "Invite only · Not publicly visible",   color: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const vis = visibilityConfig[profile.visibility] || visibilityConfig.public;
  const avail = availabilityConfig[profile.availability] || availabilityConfig.available;
  const initials = (profile.full_name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const trustSummary = [
    ...(profile.qualifications || []).slice(0, 2),
    profile.years_experience ? `${profile.years_experience}+ years experience` : null,
    ...(profile.specialisations || []).slice(0, 2),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground">Manage how clients see you</p>
          </div>
          <div className="flex gap-2">
            {profile.slug && (
              <Link to={`/professionals/${profile.slug || profile.id}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                  <ExternalLink className="h-3.5 w-3.5" /> View Public
                </Button>
              </Link>
            )}
            <Link to="/create-profile">
              <Button size="sm" className="gap-1.5 rounded-lg">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Success banner */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Your profile is live</p>
            <p className="text-xs text-emerald-700 mt-0.5">Clients can now find and contact you. You'll receive bid invitations matching your specialisations.</p>
          </div>
        </motion.div>

        {/* Visibility status */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${vis.color}`}>
          <vis.Icon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Profile visibility: {vis.label}</p>
            <p className="text-xs mt-0.5 opacity-80">{vis.desc}</p>
          </div>
          <Link to="/create-profile">
            <button className="text-xs font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 shrink-0 mt-0.5">Change</button>
          </Link>
        </motion.div>

        {/* Open to opportunities privately callout */}
        {profile.visibility === "hidden" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200">
            <Sparkles className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-800">Open to Opportunities Privately</p>
              <p className="text-xs text-violet-700 mt-0.5">
                You won't appear in public search, but our AI matching engine can still surface relevant projects to you discreetly — ideal for employed professionals exploring opportunities.
              </p>
            </div>
          </motion.div>
        )}

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border/70 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-extrabold text-xl shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
              <p className="text-muted-foreground text-sm mt-0.5">{profile.headline || profile.title}</p>
              <Badge variant="outline" className="mt-2 text-xs">
                {ROLE_LABELS[profile.user_role] || "Professional"}
              </Badge>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
                )}
                {profile.years_experience && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{profile.years_experience}+ yrs</span>
                )}
                {profile.hourly_rate && (
                  <span className="flex items-center gap-1"><PoundSterling className="h-3.5 w-3.5" />{profile.hourly_rate}/hr</span>
                )}
              </div>
              <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full border text-xs font-semibold ${avail.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
                {avail.label}
              </div>
              {trustSummary.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {trustSummary.map((item) => (
                    <span key={item} className="px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15 text-[10px] font-bold">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed border-t border-border/50 pt-4">{profile.bio}</p>
          )}

          {profile.qualifications?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.qualifications.map(q => (
                <Badge key={q} className="bg-primary/10 text-primary border border-primary/20 font-bold">{q}</Badge>
              ))}
            </div>
          )}

          {profile.specialisations?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.specialisations.map(s => (
                <Badge key={s} variant="secondary" className="font-medium">{s}</Badge>
              ))}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/jobs" className="block">
            <div className="bg-card border border-border/70 rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer text-center">
              <p className="font-semibold text-foreground text-sm">Browse Projects</p>
              <p className="text-xs text-muted-foreground mt-0.5">Find jobs to bid on</p>
            </div>
          </Link>
          <Link to="/professionals" className="block">
            <div className="bg-card border border-border/70 rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer text-center">
              <p className="font-semibold text-foreground text-sm">See Your Listing</p>
              <p className="text-xs text-muted-foreground mt-0.5">How clients see you</p>
            </div>
          </Link>
          <Link to="/create-profile" className="block">
            <div className="bg-card border border-border/70 rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer text-center">
              <p className="font-semibold text-foreground text-sm">Edit Profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">Update your details</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}