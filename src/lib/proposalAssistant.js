/**
 * AI proposal assistant — natural UK accountant tone, not consulting/AI copy.
 */

export const PROPOSAL_WORD_MIN = 70;
export const PROPOSAL_WORD_TARGET = "90-120";
export const PROPOSAL_WORD_MAX = 150;

export const PROPOSAL_TONES = [
  {
    id: "professional",
    label: "Practical",
    shortLabel: "Practical",
    wordTarget: PROPOSAL_WORD_TARGET,
    loadingMessage: "Drafting a practical proposal…",
    instructions:
      "Sound like an experienced UK accountant writing a quick bid message. Plain English, calm, direct. No consulting jargon.",
    structure: "Brief fit for the work, what you will actually do, clear communication.",
    openerExamples: ["Happy to help with this.", "I can take this on.", "This is the sort of work I handle regularly."],
  },
  {
    id: "friendly",
    label: "Friendly adviser",
    shortLabel: "Friendly",
    wordTarget: PROPOSAL_WORD_TARGET,
    loadingMessage: "Writing a friendly, approachable version…",
    instructions:
      "Warm local adviser tone — approachable but still professional. Like a trusted accountant emailing a client.",
    structure: "Friendly opening, simple explanation of next steps, invite questions.",
    openerExamples: ["Happy to discuss this.", "I'd be glad to help.", "Please feel free to ask any questions."],
  },
  {
    id: "concise",
    label: "Concise",
    shortLabel: "Concise",
    wordTarget: "70-95",
    loadingMessage: "Shortening to essentials…",
    instructions: "Very short. Two or three crisp sentences only. No filler words.",
    structure: "One line on fit, one on delivery, optional timeline.",
    openerExamples: ["I can assist with this.", "Happy to quote for this work."],
  },
  {
    id: "boutique",
    label: "Boutique practice",
    shortLabel: "Boutique",
    wordTarget: PROPOSAL_WORD_TARGET,
    loadingMessage: "Drafting boutique-practice tone…",
    instructions:
      "Small practice partner tone — personal, thorough, hands-on. Not corporate or Big 4 speak.",
    structure: "Personal attention, clear scope, direct partner-level communication.",
    openerExamples: ["I would handle this personally.", "We take a straightforward, hands-on approach."],
  },
  {
    id: "technical",
    label: "Technical specialist",
    shortLabel: "Technical",
    wordTarget: PROPOSAL_WORD_TARGET,
    loadingMessage: "Adding technical focus…",
    instructions:
      "Specialist tax technical tone — mention specific compliance steps naturally, but still plain English not jargon-heavy.",
    structure: "Relevant technical steps for this tax area, records needed, filing or response support.",
    openerExamples: ["I specialise in this area.", "I can review the technical position and advise on next steps."],
  },
];

export const MAX_PROPOSAL_VERSIONS = PROPOSAL_TONES.length;

const CATEGORY_LABELS = {
  tax_return: "Self Assessment",
  self_assessment: "Self Assessment",
  vat: "VAT",
  vat_return: "VAT",
  corporation_tax: "Corporation Tax",
  rd_claim: "R&D tax relief",
  payroll: "Payroll",
  bookkeeping: "Bookkeeping",
  tax_investigation: "HMRC enquiry",
  capital_gains: "Capital Gains Tax",
  inheritance_tax: "Inheritance Tax",
  advisory: "Tax advice",
  other: "UK tax and accounting",
};

/** Natural phrases to weave in — not bullet lists for the model */
const CATEGORY_CONTEXT = {
  vat: {
    mentions: ["review bookkeeping", "VAT return preparation", "adjustments if needed", "file on time"],
    avoid: ["commercial context", "compliance priorities", "workstream"],
  },
  vat_return: {
    mentions: ["reconcile sales and purchases", "VAT return filing", "HMRC submission"],
    avoid: ["strategic VAT framework"],
  },
  bookkeeping: {
    mentions: ["bank reconciliations", "tidy up records", "month-end reports", "handover to your accountant if needed"],
    avoid: ["financial transformation"],
  },
  payroll: {
    mentions: ["payroll run", "RTI submissions", "payslips", "PAYE/NI checks"],
    avoid: ["payroll optimisation journey"],
  },
  corporation_tax: {
    mentions: ["year-end accounts tie-in", "tax computation", "CT600 filing", "agree deadlines upfront"],
    avoid: ["enterprise tax strategy"],
  },
  rd_claim: {
    mentions: ["qualifying R&D costs", "technical narrative", "claim preparation", "HMRC enquiry readiness"],
    avoid: ["innovation leverage"],
  },
  tax_investigation: {
    mentions: ["HMRC correspondence", "gather supporting documents", "draft responses", "keep you updated on deadlines"],
    avoid: ["investigation workstream", "risk mitigation framework"],
  },
  capital_gains: {
    mentions: ["gain calculations", "available reliefs", "reporting on the return"],
    avoid: ["wealth optimisation"],
  },
  inheritance_tax: {
    mentions: ["estate review", "IHT position", "forms and deadlines"],
    avoid: ["succession planning excellence"],
  },
  self_assessment: {
    mentions: ["tax return preparation", "allowable expenses", "filing before the deadline"],
    avoid: ["holistic tax journey"],
  },
  tax_return: {
    mentions: ["Self Assessment return", "income and expenses review", "submission to HMRC"],
    avoid: [],
  },
  advisory: {
    mentions: ["review your position", "advise on options", "sensible next steps"],
    avoid: ["advisory excellence"],
  },
  other: {
    mentions: ["review the information provided", "confirm scope", "agree timescales"],
    avoid: [],
  },
};

const BUZZWORD_PATTERNS = [
  /\bcommercial context\b/gi,
  /\bcontrolled workplan\b/gi,
  /\bcompliance priorities\b/gi,
  /\bstrategic approach\b/gi,
  /\bstrategic advisory\b/gi,
  /\bleverage\b/gi,
  /\bleveraging\b/gi,
  /\boptimise\b/gi,
  /\boptimize\b/gi,
  /\boptimising\b/gi,
  /\bworkstream\b/gi,
  /\bvalue proposition\b/gi,
  /\bend-to-end solution\b/gi,
  /\bholistic\b/gi,
  /\bbest-in-class\b/gi,
  /\bworld[- ]class\b/gi,
  /\bpassionate\b/gi,
  /\bexcited to\b/gi,
  /\bthrilled\b/gi,
  /\blook no further\b/gi,
  /\bseamless\b/gi,
  /\bcomprehensive solution\b/gi,
  /\btailored solution\b/gi,
  /\bunlock\b/gi,
  /\bsynergy\b/gi,
  /\bparadigm\b/gi,
  /\bgoing forward\b/gi,
  /\bat this point in time\b/gi,
  /\bi am confident that\b/gi,
  /\byour satisfaction is my priority\b/gi,
  /\bprofessional oversight throughout\b/gi,
  /\bstructured compliance\b/gi,
  /\bmanagement consultant\b/gi,
  /\benterprise[- ]grade\b/gi,
];

const GOOD_PHRASE_HINTS = [
  "Happy to review the records provided and advise accordingly.",
  "I can talk through scope and timescales before starting.",
  "I'll keep you updated as we go.",
  "Happy to discuss next steps.",
  "I will confirm what documents you have and what is still needed.",
];

const STRUCTURE_VARIANTS = [
  "Open with willingness to help, then what you will do on this specific job.",
  "Open with relevant experience in this tax area, then practical next steps.",
  "Open with understanding the task, then how you will work with the client.",
  "Start with the deliverable (return, filing, enquiry response), then your process.",
];

export function getToneById(toneId) {
  const normalized = toneId === "premium" ? "boutique" : toneId;
  return PROPOSAL_TONES.find((t) => t.id === normalized) || PROPOSAL_TONES[0];
}

export function getNextToneId(currentToneId, generationIndex = 0) {
  const idx = PROPOSAL_TONES.findIndex((t) => t.id === currentToneId);
  const base = idx >= 0 ? idx : 0;
  return PROPOSAL_TONES[(base + 1 + generationIndex) % PROPOSAL_TONES.length].id;
}

function getCategoryLabel(job = {}) {
  return CATEGORY_LABELS[job.category] || CATEGORY_LABELS.other;
}

function getCategoryContext(job = {}) {
  const key = job.category || "other";
  return CATEGORY_CONTEXT[key] || CATEGORY_CONTEXT.other;
}

function formatExperience(yearsExperience = "") {
  const raw = String(yearsExperience || "").trim();
  if (!raw) return "";
  if (/year/i.test(raw)) return raw.replace(/\s*experience\s*$/i, "").trim();
  if (/^\d+\+?$/.test(raw)) return `${raw} years'`;
  if (/^\d+-\d+/.test(raw) || raw.includes("+")) return `${raw} years'`;
  return raw;
}

function formatCredentialIntro(qualifications = [], yearsExperience = "") {
  const quals = (qualifications || []).filter(Boolean).slice(0, 2);
  const exp = formatExperience(yearsExperience);
  if (quals.length && exp) {
    return `I am ${quals.join("/")}-qualified with ${exp} experience`;
  }
  if (quals.length) {
    return `I am ${quals.join("/")}-qualified`;
  }
  if (exp) {
    return `I am a UK tax adviser with ${exp} experience`;
  }
  return "I am a UK tax and accounting professional";
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function trimToWordLimit(text, maxWords = PROPOSAL_WORD_MAX) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}.`.replace(/\.\.$/, ".");
}

function removeDuplicatePhrases(text) {
  let result = String(text || "");
  BUZZWORD_PATTERNS.forEach((pattern) => {
    result = result.replace(pattern, "");
  });

  // Fix common broken credential patterns
  result = result
    .replace(/\bwith\s+(\d+)\s+experience\b/gi, "with $1 years' experience")
    .replace(/\b(\d+)\s+experience\b/gi, "$1 years' experience")
    .replace(/\bCTA\/ATT-qualified with (\d+) experience\b/gi, "CTA/ATT-qualified with $1 years' experience")
    .replace(/\bqualified with (\d+-\d+)\s+experience\b/gi, "qualified with $1 years' experience")
    .replace(/\s+and\s+and\s+/gi, " and ")
    .replace(/\bI am I am\b/gi, "I am")
    .replace(/\bI will I will\b/gi, "I will");

  // Remove repeated 4+ word sequences
  const sentences = result.split(/(?<=[.!?])\s+/).filter(Boolean);
  const seen = new Set();
  const unique = sentences.filter((sentence) => {
    const key = sentence.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (key.length < 20) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.join(" ").replace(/\s+/g, " ").trim();
}

export function cleanProposalText(value) {
  let text = String(value || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^proposal:\s*/i, "")
    .replace(/^(here(?:'s| is) (?:the|your) (?:rewritten )?proposal:?\s*)/i, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();

  text = removeDuplicatePhrases(text);

  // Ensure ends with single full stop
  if (text && !/[.!?]$/.test(text)) text = `${text}.`;

  return trimToWordLimit(text, PROPOSAL_WORD_MAX);
}

function tokenSet(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

export function isTooSimilarToPrevious(newText, previousTexts = []) {
  const next = tokenSet(newText);
  if (next.size < 8) return false;

  return previousTexts.some((prev) => {
    const prior = tokenSet(prev);
    if (prior.size < 8) return false;
    let overlap = 0;
    next.forEach((word) => {
      if (prior.has(word)) overlap += 1;
    });
    const ratio = overlap / Math.min(next.size, prior.size);
    return ratio > 0.68;
  });
}

function countBuzzwords(text) {
  return BUZZWORD_PATTERNS.reduce((count, pattern) => {
    const matches = String(text || "").match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
}

export function validateProposalQuality(text, { qualifications = [], yearsExperience = "" } = {}) {
  const issues = [];
  const words = wordCount(text);

  if (words < 40) issues.push("too_short");
  if (words > PROPOSAL_WORD_MAX) issues.push("too_long");
  if (countBuzzwords(text) > 0) issues.push("buzzwords");
  if (/\bwith\s+\d+\s+experience\b/i.test(text) && !/years?'?\s+experience/i.test(text)) {
    issues.push("broken_experience_phrase");
  }
  if ((text.match(/\bI am\b/gi) || []).length > 2) issues.push("repetitive_opener");
  if (!/[.!?]/.test(text)) issues.push("no_sentence_end");

  const qualPattern = qualifications.slice(0, 2).join("|");
  if (qualPattern) {
    const qualMentions = (text.match(new RegExp(qualPattern, "gi")) || []).length;
    if (qualMentions > 2) issues.push("repeated_qualifications");
  }

  return { valid: issues.length === 0, issues, wordCount: words };
}

function getProjectSpecificHooks(job = {}) {
  const ctx = getCategoryContext(job);
  const category = getCategoryLabel(job);
  const lines = [
    `Work type: ${category}`,
    `Naturally reference (where relevant): ${ctx.mentions.join("; ")}`,
    `Do NOT use phrases like: ${[...ctx.avoid, "commercial context", "workplan", "leverage", "optimise"].join("; ")}`,
  ];

  if (job.urgency === "asap" || job.urgency === "urgent") {
    lines.push("Acknowledge tight timing in one short phrase — do not overpromise same-day unless notes say so.");
  }
  if (job.complexity === "complex" || job.complexity === "high") {
    lines.push("Mention confirming scope and records first — one short phrase only.");
  }
  if (/enquir|investigation|hmrc/i.test(`${job.title} ${job.description}`)) {
    lines.push("This may be HMRC enquiry work — mention correspondence, documents, and response deadlines.");
  }

  const desc = String(job.description || "").slice(0, 350);
  if (desc) lines.push(`Client brief excerpt: ${desc}`);

  return lines.join("\n");
}

export function buildFallbackProposal({
  proposal = "",
  job = {},
  qualifications = [],
  yearsExperience = "",
  toneId = "professional",
  variantIndex = 0,
}) {
  const category = getCategoryLabel(job);
  const intro = formatCredentialIntro(qualifications, yearsExperience);
  const ctx = getCategoryContext(job);
  const mention = ctx.mentions[variantIndex % ctx.mentions.length] || ctx.mentions[0];
  const notes = cleanProposalText(proposal);
  const noteBit = notes
    ? `Based on your note, I would focus on ${notes.replace(/\.$/, "").slice(0, 90)}.`
    : "";
  const urgent = job.urgency === "asap" || job.urgency === "urgent";
  const urgentBit = urgent ? " I can make a prompt start once I have seen the records." : "";

  const templates = {
    professional: [
      `${intro} and regularly work on ${category.toLowerCase()} jobs. I would ${mention}, agree the scope with you, and keep you updated throughout.${urgentBit} Happy to discuss next steps.`,
      `${intro}. For this ${category.toLowerCase()} project I would review what you have sent over, confirm timescales, and ${mention}.${urgentBit} ${noteBit}`.trim(),
    ],
    friendly: [
      `Hi — ${intro.toLowerCase()}. I'd be glad to help with this ${category.toLowerCase()} work. I will ${mention} and explain things in plain English as we go.${urgentBit} Happy to discuss next steps.`,
      `${intro} — happy to help here. I usually start by looking at the records provided, then ${mention}. I'll keep communication straightforward.${urgentBit}`,
    ],
    concise: [
      `${intro} — ${category} work is a good fit. I will ${mention} and agree deadlines upfront.${urgentBit}`,
      `Happy to quote for this ${category.toLowerCase()} work. ${mention.charAt(0).toUpperCase() + mention.slice(1)}. Clear updates throughout.`,
    ],
    boutique: [
      `${intro} and would handle this directly rather than passing it on. For this ${category.toLowerCase()} job I would ${mention} and stay in close contact with you.${urgentBit}`,
      `As a smaller practice we keep this simple: review your records, ${mention}, and agree a sensible timetable.${urgentBit} ${noteBit}`.trim(),
    ],
    technical: [
      `${intro} with a focus on ${category.toLowerCase()}. I would ${mention}, check the figures, and make sure filings or responses are ready on time.${urgentBit}`,
      `For this ${category.toLowerCase()} matter I would ${mention}, document the key points, and advise on anything that needs your sign-off before submission.${urgentBit}`,
    ],
  };

  const pool = templates[toneId] || templates.professional;
  return cleanProposalText(pool[variantIndex % pool.length]);
}

export function buildProposalPrompt({
  job = {},
  proposal = "",
  qualifications = [],
  yearsExperience = "",
  toneId = "professional",
  variantIndex = 0,
  previousSuggestions = [],
  regenerate = false,
  requestId = "",
}) {
  const tone = getToneById(toneId);
  const category = getCategoryLabel(job);
  const structure = STRUCTURE_VARIANTS[variantIndex % STRUCTURE_VARIANTS.length];
  const projectHooks = getProjectSpecificHooks(job);
  const credHint = formatCredentialIntro(qualifications, yearsExperience);

  const previousBlock = previousSuggestions.length
    ? `\nDo NOT repeat wording from these earlier versions:\n${previousSuggestions.map((t, i) => `[${i + 1}] ${t}`).join("\n")}\n`
    : "";

  const badExamples = [
    "I will establish a structured compliance workstream.",
    "After clarifying commercial context and compliance priorities, I will execute a controlled workplan.",
    "I am excited to leverage my expertise to optimise your tax position.",
  ].join("\n- ");

  const goodExamples = GOOD_PHRASE_HINTS.join("\n- ");

  return `Write a short bid message for a UK tax/accounting marketplace.

You are a real CTA/ATT/ACCA-qualified accountant or tax adviser — NOT a management consultant, NOT a marketing writer, NOT ChatGPT.

Voice: ${tone.label}
${tone.instructions}
Suggested opening style (vary — do not copy exactly): ${tone.openerExamples.join(" / ")}
Structure hint: ${structure}

LENGTH (strict):
- Target ${tone.wordTarget} words.
- Minimum ${PROPOSAL_WORD_MIN} words, maximum ${PROPOSAL_WORD_MAX} words.
- One paragraph only. No bullet points, no headings, no "Dear client".

PROJECT (make it specific to this job):
${projectHooks}

BIDDER (use accurately — do not garble grammar):
- Suggested credential line (use ONCE only, or paraphrase cleanly): ${credHint}
- Experience field: ${yearsExperience || "not provided — do not invent years"}
- Bidder's rough notes: ${proposal || "none — infer from project only"}

BANNED — never use these or similar consulting/AI phrases:
- ${badExamples}

GOOD examples of natural UK marketplace tone:
- ${goodExamples}

RULES:
1. Return ONLY the proposal paragraph.
2. Plain UK English. Short sentences are fine.
3. Sound like a busy but competent accountant typing a bid — not a pitch deck.
4. Mention the actual work (${category}) and at least one concrete task (records, filing, HMRC letter, VAT return, etc.).
5. Mention qualifications at most once, naturally.
6. No invented clients, fees, guarantees, or awards.
7. No enthusiasm clichés ("excited", "thrilled", "passionate").
${regenerate ? "8. REGENERATE: use a clearly different opening and sentence rhythm from previous versions." : ""}
${previousBlock}
Seed: ${requestId || `${Date.now()}-${variantIndex}`}

Write the proposal:`;
}

export async function generateProposalSuggestion({
  base44Client,
  job,
  proposal,
  qualifications,
  yearsExperience,
  toneId,
  variantIndex,
  previousSuggestions,
  regenerate,
}) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const prompt = buildProposalPrompt({
    job,
    proposal,
    qualifications,
    yearsExperience,
    toneId,
    variantIndex,
    previousSuggestions,
    regenerate,
    requestId,
  });

  const result = await base44Client.integrations.Core.InvokeLLM({ prompt });
  const raw = typeof result === "string" ? result : result?.text || result?.content || "";
  return cleanProposalText(raw);
}

export function resolveProposalOutput({
  generatedText,
  fallbackParams,
  previousSuggestions,
  variantIndex,
}) {
  const tryFallback = (index) => cleanProposalText(
    buildFallbackProposal({ ...fallbackParams, variantIndex: index })
  );

  const assess = (text) => {
    const cleaned = cleanProposalText(text);
    const quality = validateProposalQuality(cleaned, {
      qualifications: fallbackParams.qualifications,
      yearsExperience: fallbackParams.yearsExperience,
    });
    const similar = isTooSimilarToPrevious(cleaned, previousSuggestions);
    return { text: cleaned, quality, similar };
  };

  if (generatedText) {
    const first = assess(generatedText);
    if (first.quality.valid && !first.similar) {
      return { text: first.text, usedFallback: false };
    }
  }

  for (let i = 0; i < 4; i += 1) {
    const candidate = assess(tryFallback(variantIndex + i));
    if (candidate.quality.valid && !candidate.similar) {
      return { text: candidate.text, usedFallback: true };
    }
    if (!candidate.similar && candidate.quality.issues.length <= 1) {
      return { text: candidate.text, usedFallback: true };
    }
  }

  return { text: tryFallback(variantIndex), usedFallback: true };
}
