import React from "react";
import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * V1 foundation placeholder — routing shell only, no business logic.
 */
export default function ComingSoonPage({
  title,
  description,
  layer,
  backTo = "/",
  backLabel = "Back to home",
}) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        {layer && (
          <Badge variant="outline" className="text-xs font-semibold uppercase tracking-widest">
            {layer}
          </Badge>
        )}
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Construction className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {title}
          </h1>
          <p className="text-lg font-medium text-primary">Coming Soon</p>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          TaxLink V1 foundation — route registered; feature implementation follows in a later phase.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to={backTo}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
