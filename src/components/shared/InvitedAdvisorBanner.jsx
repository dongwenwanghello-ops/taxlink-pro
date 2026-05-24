import React from "react";
import { Link } from "react-router-dom";
import { UserCircle2, ArrowRight } from "lucide-react";
import { advisorUrl } from "@/lib/advisorProfiles";

export default function InvitedAdvisorBanner({ advisor, inviteMode }) {
  if (!advisor) return null;

  const firstName = advisor.full_name?.split(" ")[0] || "this adviser";

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <UserCircle2 className="h-9 w-9 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {inviteMode ? `Invite ${advisor.full_name} to your project` : `Working with ${advisor.full_name}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {advisor.headline || advisor.title}
            {advisor.location ? ` · ${advisor.location}` : ""}
          </p>
        </div>
      </div>
      <Link
        to={advisorUrl(advisor)}
        className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
      >
        View adviser profile
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
