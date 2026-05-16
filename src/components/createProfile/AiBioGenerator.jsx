import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

function buildPrompt(form) {
  return `Write a concise, professional first-person bio (3-4 sentences, max 90 words) for a UK-based tax and accounting professional with the following profile:
- Title: ${form.title || "Tax Professional"}
- Qualifications: ${form.qualifications.join(", ") || "Professional qualifications"}
- Specialisations: ${form.specialisations.join(", ") || "Tax and accounting services"}
- Software expertise: ${form.software_expertise?.join(", ") || "accounting software"}
- Years of experience: ${form.years_experience || "several years"}
- Location: ${form.location || "UK"}

Write in a warm, credible, first-person tone. Mention their qualifications, niche specialisms, who they help, and what makes them trustworthy. Do not use buzzwords like "passionate" or "dynamic". Output the bio text only — no quotes, no preamble.`;
}

export default function AiBioGenerator({ form, onBioGenerated, autoGenerate = false }) {
  const [loading, setLoading] = useState(false);

  const generate = async (silent = false) => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(form) });
      onBioGenerated(typeof result === "string" ? result : result?.text || result?.content || "");
      base44.analytics.track({ eventName: "ai_bio_generated" });
      if (!silent) toast.success("Bio generated! Edit it to make it your own.");
    } catch {
      if (!silent) toast.error("AI bio generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount if requested and no bio yet
  useEffect(() => {
    if (autoGenerate && !form.bio) {
      generate(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => generate(false)}
      disabled={loading}
      className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50 hover:border-violet-300"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : form.bio ? (
        <RefreshCw className="h-3.5 w-3.5" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {loading ? "Generating…" : form.bio ? "Refine with AI" : "Generate with AI"}
    </Button>
  );
}