import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Star, Zap, Briefcase, Clock, Award, Lock, User,
  CheckCircle2, FileText, TrendingUp, Sparkles, MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buildProtectedProfessionalProfile } from "@/lib/professionalProfilePreview";
import { getBidderProfilePath } from "@/lib/bidderPublicProfile";
import { RevealedProfessionalContact } from "@/components/shared/ProtectedProfessionalIdentity";
import ProfessionalFitReasons from "@/components/shared/ProfessionalFitReasons";

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export default function ProtectedProfessionalProfileModal({
  open,
  onOpenChange,
  bid,
  project,
  onShortlist,
  onAward,
  onContact,
  canAward = false,
  isShortlisted = false,
}) {
  if (!bid) return null;

  const profile = buildProtectedProfessionalProfile(bid, project);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 z-10 border-b border-border/60 bg-card/95 backdrop-blur px-6 py-5">
          <DialogHeader>
            <div className="flex flex-wrap items-start gap-3 pr-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-primary/20 border border-teal-200 flex items-center justify-center shrink-0">
                <User className="h-7 w-7 text-teal-700" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <DialogTitle className="text-xl">{profile.displayName}</DialogTitle>
                <DialogDescription className="mt-1">
                  {profile.publicLabel}
                  {profile.revealed ? " · Full identity unlocked" : " · Protected marketplace profile"}
                </DialogDescription>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className="gap-1 bg-teal-50 text-teal-800 border-teal-200">
                    <ShieldCheck className="h-3 w-3" />
                    Verified professional
                  </Badge>
                  {isShortlisted && (
                    <Badge className="bg-violet-100 text-violet-800 border-violet-200">Shortlisted</Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {!profile.revealed && profile.identityNotice && (
            <p className="text-xs text-teal-800 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              {profile.identityNotice}
            </p>
          )}

          {profile.fitReasons?.length > 0 && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-3">
              <ProfessionalFitReasons reasons={profile.fitReasons} />
            </div>
          )}

          <Section title="Professional summary">
            <p className="text-sm text-foreground leading-relaxed">{profile.summary}</p>
          </Section>

          {profile.proposal && (
            <Section title="Proposal for this project">
              <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-violet-300 pl-3">
                {profile.proposal}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                {profile.amount != null && (
                  <span className="font-semibold text-primary">£{Number(profile.amount).toLocaleString()} proposed</span>
                )}
                {profile.timeline && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {profile.timeline}
                  </span>
                )}
              </div>
            </Section>
          )}

          <Section title="Expertise & services">
            <div className="flex flex-wrap gap-1.5">
              {profile.specialisms.length > 0 ? (
                profile.specialisms.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">General UK tax & accounting</span>
              )}
            </div>
          </Section>

          <Section title="Experience metrics">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {profile.yearsExperience && (
                <MetricCard icon={Award} label="Experience" value={profile.yearsExperience} />
              )}
              <MetricCard icon={Zap} label="Response" value={`${profile.metrics.responseRate}%`} sub="response rate" />
              <MetricCard icon={CheckCircle2} label="On-time" value={`${profile.metrics.onTimeRate}%`} sub="on-time delivery" />
              <MetricCard icon={Briefcase} label="Projects" value={profile.metrics.completedProjects} sub="completed" />
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {profile.metrics.repeatClients}% repeat clients on completed marketplace work
            </p>
          </Section>

          <Section title="Qualifications">
            <div className="flex flex-wrap gap-1.5">
              {profile.qualifications.length > 0 ? (
                profile.qualifications.map((q) => (
                  <Badge key={q} variant="outline" className="text-xs font-bold border-primary/30 text-primary">
                    {q} verified
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Qualifications not listed on this bid</span>
              )}
            </div>
          </Section>

          <Section title="Reviews & reputation">
            {profile.reviews.rating ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="text-lg font-bold text-foreground">{profile.reviews.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({profile.reviews.count} reviews)</span>
                </div>
                <p className="text-xs text-muted-foreground">{profile.reviews.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.reviews.highlights.map((h) => (
                    <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-900">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{profile.reviews.summary}</p>
            )}
          </Section>

          <Section title="Marketplace activity">
            <ul className="space-y-2">
              {profile.activity.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  {item.label}
                </li>
              ))}
            </ul>
          </Section>

          {profile.caseExamples.length > 0 && (
            <Section title="Relevant experience (summary)">
              {profile.caseExamples.map((ex) => (
                <div key={ex.title} className="rounded-xl border border-border/60 p-3 bg-secondary/20">
                  <p className="text-sm font-semibold text-foreground">{ex.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ex.detail}</p>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground italic">
                Illustrative scope only — not a client testimonial. Full case history available after award.
              </p>
            </Section>
          )}

          {profile.revealed && profile.contact && (
            <Section title="Collaboration contact">
              <RevealedProfessionalContact bid={profile.bid} />
            </Section>
          )}

          {!profile.revealed && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 flex items-start gap-3">
              <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Contact details protected</p>
                <p>Email, phone, and direct links are hidden during bidding to keep collaboration on-platform.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 border-t border-border/60 bg-card px-6 py-4 flex-col sm:flex-row gap-2">
          {bid?.id && (
            <Button type="button" className="rounded-xl gap-2 flex-1 bg-teal-700 hover:bg-teal-800" asChild>
              <Link to={getBidderProfilePath(bid)} state={{ bid, project }}>
                <User className="h-4 w-4" />
                View full profile page
              </Link>
            </Button>
          )}
          {project?.id && (
            <Button type="button" variant="outline" className="rounded-xl gap-2 flex-1" asChild>
              <Link to={`/my-projects/${project.id}`}>Full comparison</Link>
            </Button>
          )}
          {onContact && (
            <Button type="button" className="rounded-xl gap-2 flex-1 bg-teal-700 hover:bg-teal-800" onClick={() => onContact(profile.bid)}>
              <MessageCircle className="h-4 w-4" />
              Contact bidder
            </Button>
          )}
          {canAward && !profile.revealed && onShortlist && (
            <Button
              type="button"
              variant="outline"
              className={`rounded-xl flex-1 gap-2 ${isShortlisted ? "border-violet-400 text-violet-800 bg-violet-50" : ""}`}
              onClick={() => onShortlist(profile.bid)}
            >
              {isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            </Button>
          )}
          {canAward && onAward && (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1 gap-2 border-violet-300 text-violet-800 hover:bg-violet-50"
              onClick={() => {
                onAward(project, profile.bid, { profileViewed: true });
                onOpenChange(false);
              }}
            >
              <Award className="h-4 w-4" />
              Award after review
            </Button>
          )}
          <Button type="button" variant="ghost" className="rounded-xl sm:w-auto w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

