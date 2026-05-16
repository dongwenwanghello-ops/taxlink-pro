import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const AVAILABILITY_LABELS = {
  available: "Available now",
  limited: "Limited availability",
  unavailable: "Not taking new clients",
};

const BIO_VARIANTS = [
  {
    name: "credentials-first",
    structure: "Paragraph 1: qualifications, years of experience and main niche. Paragraph 2: services, availability and working style.",
    tone: "clear, direct and professional",
  },
  {
    name: "specialist-profile",
    structure: "Paragraph 1: specialist areas and client types. Paragraph 2: credentials, experience and delivery approach.",
    tone: "calm, credible and marketplace-focused",
  },
  {
    name: "client-support",
    structure: "Paragraph 1: who the professional supports and the problems they help with. Paragraph 2: practical working style and communication.",
    tone: "human, concise and practical",
  },
  {
    name: "linkedin-style",
    structure: "Two short LinkedIn-style paragraphs with natural sentence rhythm, not a keyword list.",
    tone: "polished but understated",
  },
  {
    name: "notes-led",
    structure: "Paragraph 1: lead with the strongest detail from the optional notes, then connect it to credentials and services. Paragraph 2: working style and client confidence.",
    tone: "specific, natural and grounded",
  },
];

const SERVICE_ALIASES = {
  "VAT Specialist": "VAT compliance",
  VAT: "VAT compliance",
  "Tax Adviser": "tax advisory work",
  "Payroll Specialist": "payroll",
  Payroll: "payroll",
  Bookkeeping: "bookkeeping",
  "Self Assessment": "self assessment tax returns",
  "Corporation Tax": "corporation tax",
  "Capital Gains": "capital gains tax",
  "Inheritance Tax": "inheritance tax",
  "Making Tax Digital": "Making Tax Digital",
  "Annual Accounts": "annual accounts",
  "Management Accounts": "management accounts",
  "R&D Tax Credits": "R&D tax credits",
  "HMRC Investigations": "HMRC enquiries",
};

function normaliseService(service) {
  return SERVICE_ALIASES[service] || service;
}

function uniqueServices(services = []) {
  const seen = new Set();
  return services
    .map(normaliseService)
    .map((service) => String(service || "").trim())
    .filter(Boolean)
    .filter((service) => {
      const key = service.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const family = key.includes("vat") ? "vat" : key;
      if (seen.has(family)) return false;
      seen.add(family);
      return true;
    });
}

function joinNatural(items = []) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function splitFocusItems(focus = "") {
  return String(focus || "")
    .split(/,\s*|\s+and\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractNoteFocus(notes = "") {
  const text = String(notes || "").trim();
  if (!text) return "";

  const focus = [];
  if (/\bCGT\b|capital gains/i.test(text)) focus.push("capital gains tax");
  if (/\bVAT\b/i.test(text)) focus.push("VAT compliance");
  if (/landlord/i.test(text)) focus.push("landlord tax");
  if (/property/i.test(text)) focus.push("property tax planning");
  if (/small business|limited compan/i.test(text)) focus.push("small businesses and limited companies");
  if (/bookkeep/i.test(text)) focus.push("bookkeeping");
  if (/payroll/i.test(text)) focus.push("payroll");
  if (/self assessment|tax return/i.test(text)) focus.push("self assessment tax returns");
  if (/HMRC|enquir|investigation/i.test(text)) focus.push("HMRC enquiries");

  return joinNatural([...new Set(focus)]);
}

function cleanBio(text) {
  const blockedPhrases = [
    /passionate about/gi,
    /dynamic/gi,
    /seasoned expert/gi,
    /unlock your potential/gi,
    /tailored solutions/gi,
    /vat,\s*vat specialist/gi,
  ];

  let cleaned = String(text || "")
    .replace(/^["']|["']$/g, "")
    .replace(/^bio:\s*/i, "")
    .replace(/^professional bio:\s*/i, "")
    .replace(/^summary:\s*/i, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\bVAT,\s*VAT specialist\b/gi, "VAT compliance")
    .replace(/\bvat,\s*vat specialist\b/gi, "VAT compliance")
    .replace(/\b(VAT compliance)(,\s*VAT compliance|\s+and\s+VAT compliance)+\b/gi, "VAT compliance")
    .replace(/\b(tax)(\s+tax)+\b/gi, "tax")
    .replace(/\s+([,.])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  blockedPhrases.forEach((phrase) => {
    cleaned = cleaned.replace(phrase, "");
  });

  return cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("\n\n")
    .trim();
}

function buildFallbackBio(form, variantIndex = 0) {
  const services = uniqueServices(form.specialisations).slice(0, 4);
  const qualifications = form.qualifications?.length ? `${joinNatural(form.qualifications)} qualified` : "UK tax and accounting professional";
  const years = form.years_experience ? ` with ${form.years_experience}+ years of experience` : "";
  const noteFocus = extractNoteFocus(form.bio_notes);
  const combinedSpecialisms = [...new Set([...services, ...uniqueServices(splitFocusItems(noteFocus))])].slice(0, 4);
  const specialisms = combinedSpecialisms.length ? joinNatural(combinedSpecialisms) : "UK tax and accounting work";
  const availability = AVAILABILITY_LABELS[form.availability] || "Available by arrangement";
  const remote = form.remote_work ? " Remote support is available." : "";
  const notesSentence = noteFocus
    ? ` Particular experience includes ${noteFocus}.`
    : form.bio_notes
      ? ` ${String(form.bio_notes).replace(/\.$/, "")}.`
      : "";
  const openings = [
    `UK tax and accounting professional${years}, ${form.qualifications?.length ? qualifications.toLowerCase() : "focused on practical support for individuals and small businesses"}.${notesSentence}`,
    `${qualifications.charAt(0).toUpperCase()}${qualifications.slice(1)}${years}, supporting UK clients with clear and reliable accounting and tax work.`,
    `I support UK clients with ${specialisms}, bringing${form.years_experience ? ` ${form.years_experience}+ years of` : ""} practical experience to compliance-focused work.`,
    `${qualifications.charAt(0).toUpperCase()}${qualifications.slice(1)}${years}, with a focus on ${specialisms}.`,
  ];

  return cleanBio(`${openings[variantIndex % openings.length]}

My approach is practical and well organised, with clear communication and reliable delivery for UK clients. ${availability}.${remote}`);
}

function buildPrompt(form, variant, requestId) {
  const services = uniqueServices(form.specialisations);
  const currentBio = cleanBio(form.bio);
  const noteFocus = extractNoteFocus(form.bio_notes);
  const combinedServices = [...new Set([...services, ...uniqueServices(splitFocusItems(noteFocus))])];

  return `Rewrite the ENTIRE professional marketplace bio from scratch for a UK tax/accounting professional.

Do not lightly edit the current bio. Do not preserve its sentence order. Create a cohesive new summary using all source details together.

Profile details:
- Marketplace role: ${form.user_role || "professional"}
- Internal full name, for context only: ${form.full_name || "Not provided"}
- Headline: ${form.headline || form.title || "Tax Professional"}
- Qualifications: ${form.qualifications?.join(", ") || "Not provided"}
- Years of experience: ${form.years_experience || "Not provided"}
- Selected specialties/services: ${services.join(", ") || "Not provided"}
- Combined specialty focus after reading notes: ${combinedServices.join(", ") || "UK tax and accounting services"}
- Software expertise: ${form.software_expertise?.join(", ") || "Not provided"}
- Availability: ${AVAILABILITY_LABELS[form.availability] || form.availability || "Not provided"}
- Remote work: ${form.remote_work ? "Available for remote work" : "Not remote-first"}
- Location: ${form.location || "UK"}
- Optional user notes, treat as priority context and merge naturally: ${form.bio_notes || "None"}
- Inferred niche focus from notes: ${noteFocus || "None"}
- Current bio to avoid copying, but do not edit it directly: ${currentBio || "None"}
- Regeneration variation seed: ${requestId}

Requirements:
- Preferred structure: ${variant.structure}
- Tone: ${variant.tone}.
- Max 2 short paragraphs.
- Concise, professional, trustworthy and UK tax/accounting focused.
- Similar to a LinkedIn or professional marketplace profile.
- Focus on credibility and clarity, not sales language.
- Use qualifications, experience, specialties, availability, niche expertise, work style and optional notes together.
- Optional notes are not an afterthought: use them to shape the core positioning, specialty wording and examples.
- If optional notes mention a specialist area, make that expertise visible in the first paragraph.
- Do not mention the professional's name unless it is essential; this should read as a public marketplace bio, not an email introduction.
- Do not exaggerate, invent claims, mention awards, or imply regulated status unless stated.
- Avoid generic AI fluff and phrases like "passionate", "dynamic", "seasoned expert", "unlock your potential", "tailored solutions".
- Avoid keyword stuffing, repeated service labels, fragmented lists, and phrases like "VAT, VAT Specialist".
- If VAT appears, mention it once naturally as "VAT compliance" unless a different user note clearly requires otherwise.
- Make the whole bio noticeably different from the current bio while preserving the same facts.
- Use complete sentences, clean spacing and mobile-friendly paragraph length.
- Output only the bio text. No title, quotes, bullets, preamble or markdown.`;
}

export default function AiBioGenerator({ form, onBioGenerated, autoGenerate = false, onLoadingChange }) {
  const [loading, setLoading] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  const generate = async (silent = false) => {
    const nextCount = generationCount + 1;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const variantIndex = (nextCount + Math.floor(Math.random() * BIO_VARIANTS.length)) % BIO_VARIANTS.length;
    const variant = BIO_VARIANTS[variantIndex];

    setGenerationCount(nextCount);
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(form, variant, requestId),
      });
      const generated = cleanBio(typeof result === "string" ? result : result?.text || result?.content || "");
      const nextBio = generated && generated !== cleanBio(form.bio)
        ? generated
        : buildFallbackBio(form, nextCount);
      onBioGenerated(nextBio);
      base44.analytics.track({ eventName: "ai_bio_generated" });
      if (!silent) toast.success("Bio generated! Edit it to make it your own.");
    } catch {
      onBioGenerated(buildFallbackBio(form, nextCount));
      if (!silent) toast.success("Draft bio created. Edit it to make it your own.");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
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
      {loading ? "Generating professional bio..." : form.bio ? "Regenerate bio" : "Generate bio"}
    </Button>
  );
}