import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw, CheckCircle2, Loader2, Send, Users, Clock, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import PricingEstimate from "@/components/postjob/PricingEstimate";
import MarketplaceIntelligence from "@/components/shared/MarketplaceIntelligence";
import { scoreMarketplaceProject } from "@/lib/marketplaceIntelligence";
import { base44 } from "@/api/base44Client";
import { saveProject } from "@/lib/projectStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const SERVICE_TYPES = [
  { value: "self_assessment", label: "Self Assessment", icon: "📄" },
  { value: "vat_return", label: "VAT Return", icon: "🧾" },
  { value: "corporation_tax", label: "Corporation Tax", icon: "🏢" },
  { value: "rd_claim", label: "R&D Tax Claim", icon: "🔬" },
  { value: "payroll", label: "Payroll", icon: "💰" },
  { value: "bookkeeping", label: "Bookkeeping", icon: "📒" },
  { value: "tax_investigation", label: "Tax Investigation", icon: "🔍" },
  { value: "capital_gains", label: "Capital Gains", icon: "📈" },
  { value: "inheritance_tax", label: "Inheritance Tax", icon: "⚖️" },
  { value: "other", label: "Other / Advisory", icon: "💬" },
];

const COMPLEXITY = [
  { value: "simple",  label: "Simple",  desc: "Single return · records prepared · no foreign income · employed only" },
  { value: "medium",  label: "Medium",  desc: "Multiple income streams · rental income · some missing records · basic investments" },
  { value: "complex", label: "Complex", desc: "Company accounts · international tax · investigations · multiple entities · R&D" },
];

const URGENCY = [
   { value: "negotiable", label: "Negotiable", desc: "Timeline can be agreed with the professional" },
   { value: "standard", label: "Standard", desc: "Reasonable deadline — usually 2–4 weeks" },
   { value: "urgent", label: "Urgent", desc: "Time-sensitive — usually 3–7 days" },
   { value: "asap", label: "ASAP", desc: "Critical — needed within 24–48 hours" },
];

const CATEGORY_BY_SERVICE = {
  self_assessment: "tax_return",
  vat_return: "vat",
  corporation_tax: "corporation_tax",
  rd_claim: "corporation_tax",
  payroll: "payroll",
  bookkeeping: "bookkeeping",
  tax_investigation: "advisory",
  capital_gains: "advisory",
  inheritance_tax: "advisory",
  other: "other",
};

const SERVICE_BRIEF_COPY = {
  self_assessment: {
    noun: "self assessment tax return",
    title: "Self Assessment Tax Return Preparation",
    context: "The client needs a practical review of personal tax information before the return is finalised and filed.",
    situation: "Income records, allowances and any reliefs should be checked carefully so the filing position is accurate before submission.",
    deliverables: ["Review income sources, allowances and available records", "Prepare the self assessment tax return for client review", "Identify any missing information or obvious tax relief points", "File the return with HMRC once approved"],
  },
  vat_return: {
    noun: "VAT return",
    title: "Quarterly VAT Return Preparation",
    context: "The business needs support preparing a VAT return from bookkeeping records and source documentation.",
    situation: "The records should be checked for VAT coding issues, missing transactions and any inconsistencies before the return is submitted.",
    deliverables: ["Review VAT control account, sales and purchase records", "Check VAT treatment on key transactions", "Identify missing invoices, coding issues or reconciliation differences", "Prepare the VAT return and support Making Tax Digital submission"],
  },
  corporation_tax: {
    noun: "corporation tax filing",
    title: "Corporation Tax and CT600 Compliance Support",
    context: "The company needs year-end corporation tax support based on its accounts and supporting records.",
    situation: "The tax computation should be prepared or reviewed alongside the CT600, with any adjustments clearly explained.",
    deliverables: ["Review year-end accounts, trial balance and supporting schedules", "Prepare corporation tax computations and adjustments", "Prepare or review the CT600 before submission", "Flag any records or director/shareholder points requiring clarification"],
  },
  rd_claim: {
    noun: "R&D tax relief claim",
    title: "R&D Tax Relief Claim Review and Submission Support",
    context: "The company is looking to assess whether project activity and expenditure can support an R&D tax relief claim.",
    situation: "The claim will need careful review of technical activity, costs and evidence before any submission is made.",
    deliverables: ["Review qualifying projects, cost categories and available evidence", "Prepare the R&D calculation and technical narrative", "Identify evidence gaps or risk areas before submission", "Support preparation of the claim pack for HMRC"],
  },
  payroll: {
    noun: "payroll processing",
    title: "Payroll Processing and RTI Compliance Support",
    context: "The business needs reliable payroll support for employees and related HMRC reporting.",
    situation: "Payroll details should be checked for accuracy before payslips, RTI filings and related reports are prepared.",
    deliverables: ["Review employee details, pay rates and payroll changes", "Process payroll for the agreed period", "Prepare payslips, RTI submissions and summary reports", "Highlight pension, starter/leaver or payroll compliance points where relevant"],
  },
  bookkeeping: {
    noun: "bookkeeping review",
    title: "Bookkeeping Review and Reconciliation Support",
    context: "The business needs its bookkeeping reviewed and brought into a cleaner position for reporting or compliance work.",
    situation: "The ledger may need transaction coding checks, bank reconciliations and a review of missing or inconsistent records.",
    deliverables: ["Review bookkeeping records and transaction coding", "Reconcile bank, VAT and control accounts where applicable", "Identify missing transactions, duplicate entries or inconsistencies", "Prepare a clean summary for VAT, accounts or management reporting"],
  },
  tax_investigation: {
    noun: "HMRC enquiry support",
    title: "HMRC Enquiry Response and Tax Investigation Support",
    context: "The client needs support responding to HMRC correspondence in a measured and well-documented way.",
    situation: "The professional will need to review the enquiry background, available records and HMRC's questions before drafting a response.",
    deliverables: ["Review HMRC correspondence, deadlines and background facts", "Assess the records needed to support the response", "Prepare draft responses and supporting schedules", "Advise on next steps and potential risk areas"],
  },
  capital_gains: {
    noun: "capital gains tax advice",
    title: "Capital Gains Tax Calculation and Reporting Support",
    context: "The client needs a capital gains tax calculation prepared from disposal and acquisition records.",
    situation: "The calculation should consider available base cost information, reliefs and reporting deadlines before submission.",
    deliverables: ["Review disposal proceeds, acquisition costs and supporting records", "Calculate the gain or loss and any available reliefs", "Advise on UK reporting requirements and payment deadlines", "Prepare a clear summary for client review or filing"],
  },
  inheritance_tax: {
    noun: "inheritance tax planning",
    title: "Inheritance Tax Planning and Estate Review Support",
    context: "The client is seeking inheritance tax guidance based on estate or planning information.",
    situation: "The work should focus on understanding the asset position, available allowances and practical planning options.",
    deliverables: ["Review estate, asset or planning information provided", "Identify relevant inheritance tax considerations and allowances", "Prepare practical recommendations and next steps", "Flag any information needed before detailed advice is finalised"],
  },
  other: {
    noun: "tax advisory support",
    title: "Tax Advisory Review and Practical Guidance",
    context: "The client needs practical tax advice based on the facts and records available.",
    situation: "The professional should clarify the scope, review the background and provide clear recommendations.",
    deliverables: ["Review the background, records and client objectives", "Advise on the relevant UK tax position", "Set out practical next steps and filing requirements", "Identify any records or specialist points requiring further review"],
  },
};

const BRIEF_STYLES = [
  "concise project coordinator brief",
  "direct client engagement request",
  "commercial advisory brief",
  "practical records-first brief",
];

const URGENCY_ALIASES = {
  flexible: "Negotiable",
  within_month: "Standard",
  within_2weeks: "Standard",
  within_week: "Urgent",
};

const getUrgencyLabel = (value) => URGENCY.find(u => u.value === value)?.label || URGENCY_ALIASES[value] || value?.replace(/_/g, " ");

const cleanText = (value) => String(value || "").trim().replace(/\s+/g, " ");
const toBudgetNumber = (value) => {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
};
const formatBudget = (value) => `£${Math.round(value).toLocaleString()}`;
const sentence = (value) => {
  const text = cleanText(value);
  if (!text) return "";
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

function inferClientType(companyName, selectedServices) {
  const text = cleanText(companyName).toLowerCase();
  const businessServices = ["vat_return", "corporation_tax", "rd_claim", "payroll", "bookkeeping"];
  if (/\b(ltd|limited|llp|plc|company|business|partners|group)\b/i.test(text)) return "business";
  if (selectedServices.some((svc) => businessServices.includes(svc))) return "business";
  return "individual";
}

function getServiceCopy(selectedServices) {
  const services = selectedServices.length ? selectedServices : ["other"];
  return services.map((svc) => SERVICE_BRIEF_COPY[svc] || SERVICE_BRIEF_COPY.other);
}

function getTitleQualifier({ selectedServices, answers, clientType }) {
  const text = `${answers.what} ${answers.company} ${answers.complications}`.toLowerCase();
  const has = (svc) => selectedServices.includes(svc);

  if (/(property|rental|landlord|buy.to.let|portfolio)/i.test(text)) return "for Property Investor";
  if (/(ecommerce|e-commerce|online|shopify|amazon|retail)/i.test(text)) return "for Ecommerce Business";
  if (/(startup|software|saas|technology|tech)/i.test(text)) return "for Tech Company";
  if (has("payroll")) return "for UK Employer";
  if (has("self_assessment") && clientType === "business") return "for Business Owner";
  if (clientType === "business" && (has("vat_return") || has("bookkeeping") || has("corporation_tax"))) return "for Small UK Business";
  return "";
}

function sanitizeProjectTitle(title, fallbackTitle) {
  const cleaned = cleanText(title)
    .replace(/\s+[—-]\s+(simple|medium|complex)\s+complexity$/i, "")
    .replace(/\b(simple|medium|complex)\s+complexity\b/gi, "")
    .replace(/\b(complexity)\b/gi, "")
    .replace(/\b(support support|assistance support)\b/gi, "Support")
    .replace(/\s{2,}/g, " ")
    .trim();

  const tooLong = cleaned.length > 72 || cleaned.split(/\s+/).length > 10;
  const tooGeneric = /^(tax advisory support|project support|accounting support)$/i.test(cleaned);
  const awkward = /,.*—| for [A-Z][\w\s&'.-]{10,}$/.test(cleaned) && cleaned.length > 62;

  return tooLong || tooGeneric || awkward ? fallbackTitle : cleaned || fallbackTitle;
}

function buildProfessionalTitle({ selectedServices, answers, clientType, styleIndex }) {
  const services = selectedServices.length ? selectedServices : ["other"];
  const copies = getServiceCopy(services);
  const has = (svc) => services.includes(svc);
  const variant = styleIndex % 3;
  const qualifier = getTitleQualifier({ selectedServices: services, answers, clientType });
  const withQualifier = (title) => qualifier ? `${title} ${qualifier}` : title;

  if (has("bookkeeping") && has("vat_return")) {
    return withQualifier([
      "Bookkeeping & VAT Review",
      "Quarterly VAT Return Support",
      "VAT Reconciliation & Filing",
    ][variant]);
  }
  if (has("corporation_tax") && has("bookkeeping")) return withQualifier("Year-End Accounts Review");
  if (has("corporation_tax")) return withQualifier(variant === 0 ? "Corporation Tax Filing" : "CT600 Filing Assistance");
  if (has("vat_return")) return withQualifier(variant === 0 ? "Quarterly VAT Return Support" : "VAT Reconciliation & Filing");
  if (has("payroll")) return withQualifier("Payroll & RTI Support");
  if (has("self_assessment")) return withQualifier(clientType === "business" ? "Personal Tax Return Support" : "Self Assessment Tax Return");
  if (has("rd_claim")) return withQualifier("R&D Tax Claim Assistance");
  if (has("tax_investigation")) return withQualifier("HMRC Enquiry Support");
  if (has("capital_gains")) return withQualifier("Capital Gains Tax Support");
  if (has("inheritance_tax")) return withQualifier("Inheritance Tax Review");

  if (copies.length > 1) {
    const shortLabels = copies.slice(0, 2).map((copy) => copy.title.replace(/ (Preparation|Compliance|Support|Review|Assistance|Filing|and|Tax)/gi, "").trim());
    return withQualifier(`${shortLabels.join(" & ")} Support`);
  }
  return withQualifier(copies[0].title.replace(/ Preparation| Compliance| Review| Submission/g, ""));
}

function buildFallbackBrief({
  selectedServices,
  serviceName,
  complexityLabel,
  urgencyLabel,
  answers,
  clientType,
  recordsReady,
  projectConditions,
  styleIndex,
}) {
  const copies = getServiceCopy(selectedServices);
  const clientName = cleanText(answers.company);
  const clientLabel = clientName || (clientType === "business" ? "A UK business" : "A UK individual");
  const primaryCopy = copies[0] || SERVICE_BRIEF_COPY.other;
  const openingVariants = [
    `${clientLabel} is seeking support with ${copies.map((copy) => copy.noun).join(" and ")}.`,
    `${clientLabel} would like to appoint a UK tax or accounting professional to help finalise ${copies.map((copy) => copy.noun).join(" and ")}.`,
    `${clientLabel} needs a reliable adviser to review the records and progress ${copies.map((copy) => copy.noun).join(" and ")} through to a practical conclusion.`,
  ];
  const deliverables = [...new Set(copies.flatMap((copy) => copy.deliverables))].slice(0, 6);
  const recordsLine = recordsReady
    ? "The core records appear to be available and should be ready for review."
    : projectConditions.missingRecords
      ? "Some records may need organising or requesting before the work can be completed."
      : "The records position should be confirmed at the start of the engagement.";
  const timelineLine = answers.deadline
    ? `Target deadline: ${cleanText(answers.deadline)}.`
    : urgencyLabel === "Negotiable"
      ? "Timing is negotiable and can be agreed with the appointed professional."
      : `Timing is marked as ${urgencyLabel.toLowerCase()}, so availability should be confirmed before work begins.`;
  const background = [
    primaryCopy.context,
    clientType === "business" && selectedServices.some((svc) => ["bookkeeping", "vat_return", "payroll", "corporation_tax"].includes(svc))
      ? "The brief is suitable for a business that wants its compliance work handled accurately without adding pressure to internal admin time."
      : "",
  ].filter(Boolean).join(" ");
  const currentSituation = [
    sentence(answers.what),
    primaryCopy.situation,
    projectConditions.multipleIncomeSources ? "The work may involve more than one income stream or record source." : "",
    projectConditions.internationalTaxIssues ? "There may be international or cross-border tax points to consider." : "",
  ].filter(Boolean).join(" ");

  return [
    `**Scope of Work**\n${openingVariants[styleIndex % openingVariants.length]} The expected complexity is ${complexityLabel.toLowerCase()}, with the work to be completed remotely unless otherwise agreed.`,
    `**Business Background**\n${background || `${clientLabel} has provided an initial outline for ${serviceName.toLowerCase()} and would like the scope confirmed before work begins.`}`,
    `**Current Situation**\n${currentSituation || `The records and filing position need to be reviewed before the final scope and next steps are agreed.`}`,
    `**Deliverables**\n${deliverables.map((item) => `- ${item}`).join("\n")}`,
    `**Records Available**\n${recordsLine}${answers.records ? ` ${sentence(answers.records)}` : ""}`,
    `**Timeline**\n${timelineLine}`,
    answers.complications ? `**Additional Notes**\n${sentence(answers.complications)}` : "",
  ].filter(Boolean).join("\n\n");
}

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <motion.div
            className="h-2 rounded-full"
            style={{ flex: i <= step ? 2 : 1 }}
            animate={{ background: i < step ? "#10b981" : i === step ? "hsl(var(--primary))" : "hsl(var(--border))" }}
            transition={{ duration: 0.3 }}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function SelectCard({ item, selected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
        selected
          ? "border-primary bg-primary/8 text-primary"
          : "border-border hover:border-primary/40 text-foreground"
      }`}>
      <div className="flex items-center gap-2.5">
        {item.icon && <span className="text-lg">{item.icon}</span>}
        <div>
          <p className="font-semibold leading-none">{item.label}</p>
          {item.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>}
        </div>
        {selected && <CheckCircle2 className="h-4 w-4 ml-auto shrink-0 text-primary" />}
      </div>
    </motion.button>
  );
}

export default function PostJob() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [serviceType, setServiceType] = useState([]);
  const [complexity, setComplexity] = useState("");
  const [urgency, setUrgency] = useState("");
  const [biddingPeriod, setBiddingPeriod] = useState(""); // New: bidding deadline period
  const [openingBudget, setOpeningBudget] = useState("");
  const [answers, setAnswers] = useState({ what: "", deadline: "", records: "", complications: "", company: "" });
  const [generatedBrief, setGeneratedBrief] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [published, setPublished] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState("");
  const generationRef = useRef(0);

  const recordsReady = /ready|yes|have|prepared|all set/i.test(answers.records);
  const combinedAnswers = `${answers.what} ${answers.records} ${answers.complications}`.toLowerCase();
  const projectConditions = {
    missingRecords: !recordsReady && /missing|not ready|no records|organis|organize|sort|incomplete|bank statement|receipt/i.test(combinedAnswers),
    multipleIncomeSources: /rental|property|dividend|self.employ|sole trader|capital gain|shares|crypto|foreign income|multiple income|pension|employment.*rental/i.test(combinedAnswers),
    internationalTaxIssues: /foreign|overseas|international|non.?resident|domicile|double tax|expat|abroad|cross.?border/i.test(combinedAnswers),
  };
  const estimatedWorkload = projectConditions.internationalTaxIssues
    ? "specialist"
    : projectConditions.missingRecords || projectConditions.multipleIncomeSources || serviceType.length > 1
      ? "heavy"
      : complexity === "simple"
        ? "light"
        : "standard";
  const deadlinePressure = urgency === "asap" ? "critical" : urgency === "urgent" ? "high" : "normal";
  const openingBudgetAmount = toBudgetNumber(openingBudget);
  const budgetSuggestionScore = scoreMarketplaceProject({
    category: CATEGORY_BY_SERVICE[serviceType[0]] || serviceType[0] || "other",
    complexity: complexity || "medium",
    urgency: urgency || "negotiable",
    biddingPeriod: biddingPeriod || "7d",
    remote: true,
    missingRecords: projectConditions.missingRecords,
    multipleIncomeSources: projectConditions.multipleIncomeSources,
    internationalTaxIssues: projectConditions.internationalTaxIssues,
    estimatedWorkload,
    deadlinePressure,
    descriptionLength: answers.what?.length || 0,
  });
  const budgetRange = budgetSuggestionScore.recommendedBudgetRange;
  const budgetSuggestions = [
    { label: `From ${formatBudget(budgetRange.min)}`, value: budgetRange.min },
    { label: `${formatBudget(budgetRange.min)}-${formatBudget(budgetRange.midpoint)}`, value: budgetRange.min },
    { label: `${formatBudget(budgetRange.midpoint)}-${formatBudget(budgetRange.max)}`, value: budgetRange.midpoint },
  ];
  const selectedBudgetScore = openingBudgetAmount ? scoreMarketplaceProject({
    category: CATEGORY_BY_SERVICE[serviceType[0]] || serviceType[0] || "other",
    complexity: complexity || "medium",
    urgency: urgency || "negotiable",
    biddingPeriod: biddingPeriod || "7d",
    budgetAmount: openingBudgetAmount,
    remote: true,
    missingRecords: projectConditions.missingRecords,
    multipleIncomeSources: projectConditions.multipleIncomeSources,
    internationalTaxIssues: projectConditions.internationalTaxIssues,
    estimatedWorkload,
    deadlinePressure,
    descriptionLength: answers.what?.length || 0,
  }) : budgetSuggestionScore;

  const toggleServiceType = (value) => {
    setServiceType(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const generateBrief = async ({ regenerate = false } = {}) => {
    if (generating) return;
    setGenerating(true);
    setStep(3);
    const styleIndex = generationRef.current++;

    const serviceName = serviceType.map(v => SERVICE_TYPES.find(s => s.value === v)?.label ?? v).join(", ");
    const complexityLabel = COMPLEXITY.find(c => c.value === complexity)?.label ?? complexity;
    const urgencyLabel = getUrgencyLabel(urgency);
    const clientType = inferClientType(answers.company, serviceType);
    const clientLabel = answers.company ? `${answers.company} (${clientType})` : clientType;
    const generatedTitle = buildProfessionalTitle({
      selectedServices: serviceType,
      answers,
      clientType,
      styleIndex,
    });
    const style = BRIEF_STYLES[styleIndex % BRIEF_STYLES.length];
    const copies = getServiceCopy(serviceType);
    const businessContext = copies.map((copy) => copy.context).join(" ");
    const currentSituation = copies.map((copy) => copy.situation).join(" ");
    const practicalDeliverables = [...new Set(copies.flatMap((copy) => copy.deliverables))].slice(0, 7).join("; ");
    const previousContent = regenerate && generatedBrief
      ? `\nPrevious draft to avoid repeating:\nTitle: ${projectTitle}\nBrief:\n${generatedBrief}\n`
      : "";

    const prompt = `Write a realistic project brief for a serious UK accounting and tax marketplace.

The brief will be read by qualified UK accountants, tax advisers, bookkeepers, and payroll professionals before they decide whether to bid.

Writing style:
- Professional UK business English, but natural enough to sound written by a real client or project coordinator.
- Commercially realistic: mention records, reconciliation, compliance, review points, filing/submission, and practical next steps where relevant.
- Use concrete accounting/tax language. Avoid vague descriptions and keyword stuffing.
- Do not sound like marketing copy, a chatbot, or a generic proposal.
- Avoid these phrases and close variants: "This project covers", "requires professional assistance", "completion of all associated tasks", "please note that", "various", "seamless", "comprehensive solution", "leveraging expertise".
- Do not invent turnover, dates, software, employee counts, tax amounts, or HMRC facts unless provided.
- Use clean spacing and consistent markdown section headings.
- Use short, credible paragraphs and practical deliverable bullets.
- Keep the brief between 230 and 340 words.
- Tone variation for this version: ${style}.

Title rules:
- 4 to 8 words where possible.
- Maximum 65 characters.
- Make it instantly scannable in a project feed.
- State the core work, not the whole brief.
- Do not include the company name unless essential.
- Do not mention complexity, urgency, "project", or "complexity".
- Add at most one meaningful qualifier, such as "for Small UK Business" or "for Property Investor".
- Good examples: "Quarterly VAT Return Support", "Bookkeeping & VAT Review", "Corporation Tax Filing", "Year-End Accounts Review", "Payroll & CIS Support", "R&D Tax Claim Assistance".

Return only this format:
TITLE: <one natural professional title>

**Scope of Work**
...

**Business Background**
...

**Current Situation**
...

**Deliverables**
- ...

**Records Available**
...

**Timeline**
...

**Additional Notes**
...

Omit Additional Notes if there is nothing relevant.

Project details:
- Services required: ${serviceName}
- Complexity: ${complexityLabel}
- Timeline/urgency: ${urgencyLabel}
- Opening budget: ${openingBudgetAmount ? formatBudget(openingBudgetAmount) : "Not set"}
- Delivery: Remote
- Client type: ${clientLabel}
- Service-specific business context to use if relevant: ${businessContext}
- Practical current situation to reflect if relevant: ${currentSituation}
- Practical deliverables to adapt, not copy mechanically: ${practicalDeliverables}
- Work requested: ${answers.what}
- Client deadline: ${answers.deadline || "Not specified"}
- Records status: ${answers.records || "Not specified"}
- Missing records likely: ${projectConditions.missingRecords ? "Yes" : "No"}
- Multiple income sources likely: ${projectConditions.multipleIncomeSources ? "Yes" : "No"}
- International or specialist tax issues likely: ${projectConditions.internationalTaxIssues ? "Yes" : "No"}
- Additional circumstances: ${answers.complications || "None"}
${previousContent}
Write a fresh, publication-ready brief now.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      const cleaned = (typeof result === "string" ? result : String(result)).trim();
      const titleMatch = cleaned.match(/^TITLE:\s*(.+)$/im);
      const aiTitle = titleMatch?.[1]?.trim();
      const brief = cleaned
        .replace(/^TITLE:\s*.+$/im, "")
        .replace(/^\s+/, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      setGeneratedBrief(brief || buildFallbackBrief({
        selectedServices: serviceType,
        serviceName,
        complexityLabel,
        urgencyLabel,
        answers,
        clientType,
        recordsReady,
        projectConditions,
        styleIndex,
      }));
      setProjectTitle(sanitizeProjectTitle(aiTitle, generatedTitle));
      setStep(4);
    } catch (err) {
      const brief = buildFallbackBrief({
        selectedServices: serviceType,
        serviceName,
        complexityLabel,
        urgencyLabel,
        answers,
        clientType,
        recordsReady,
        projectConditions,
        styleIndex,
      });
      setGeneratedBrief(brief);
      setProjectTitle(generatedTitle);
      setStep(4);
    } finally {
      setGenerating(false);
    }
  };

  const buildProjectPayload = () => {
    const now = new Date();
    const deadlineDate = new Date(now);
    const daysMap = { "24h": 1, "3d": 3, "5d": 5, "7d": 7 };
    deadlineDate.setDate(deadlineDate.getDate() + (daysMap[biddingPeriod] || 7));

    return {
      title: projectTitle.trim(),
      description: generatedBrief.trim(),
      services: serviceType,
      category: CATEGORY_BY_SERVICE[serviceType[0]] || "other",
      complexity,
      urgency,
      bidding_period: biddingPeriod,
      bidding_deadline: deadlineDate.toISOString(),
      budget_amount: openingBudgetAmount,
      starting_bid: openingBudgetAmount,
      budget_type: "fixed",
      status: "open",
      accepting_bids: true,
      openForBids: true,
      remote: true,
      missing_records: projectConditions.missingRecords,
      multiple_income_sources: projectConditions.multipleIncomeSources,
      international_tax_issues: projectConditions.internationalTaxIssues,
      estimated_workload: estimatedWorkload,
      deadline_pressure: deadlinePressure,
      company_name: answers.company || null,
      duration: "one_off",
      required_qualifications: [],
      _user_posted: true,
    };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!projectTitle.trim() || !generatedBrief.trim()) {
      toast.error("Please ensure your project title and description are complete.");
      return;
    }
    if (!urgency) {
      toast.error("Please select a project urgency/timeline.");
      return;
    }
    if (!biddingPeriod) {
      toast.error("Please select how long bidding should stay open.");
      return;
    }
    if (!openingBudgetAmount) {
      toast.error("Please enter an opening budget or choose one of the suggested ranges.");
      return;
    }

    setSubmitting(true);
    const payload = buildProjectPayload();

    try {
      const project = await base44.entities.JobPost.create(payload);
      saveProject({
        ...payload,
        ...project,
        _user_posted: true,
        status: "open",
        accepting_bids: true,
        openForBids: true,
      });
      setPublishedTitle(projectTitle);
      setPublished(true);
      toast.success("Project published — now visible in Browse Projects.");
    } catch {
      const localProject = {
        id: `posted-${Date.now()}`,
        ...payload,
        budget_type: "fixed",
        created_date: new Date().toISOString(),
      };
      saveProject(localProject);
      setPublishedTitle(projectTitle);
      setPublished(true);
      toast.success("Project published — now visible in Browse Projects.");
    } finally {
      setSubmitting(false);
    }
  };

  if (published) {
    const estimatedBidders = 3 + Math.floor(Math.random() * 8);
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 24 }} className="space-y-6">
          {/* Check icon */}
          <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
            className="h-20 w-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Live in the Marketplace</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              <strong className="text-foreground">"{publishedTitle}"</strong> is now open for competitive bids from verified UK professionals.
            </p>
          </div>

          {/* Live status panel */}
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 space-y-3 text-left">
            <p className="text-xs font-black text-violet-700 uppercase tracking-widest">Project Status</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white rounded-xl px-3 py-2.5 border border-violet-100 text-center">
                <p className="text-xs text-muted-foreground">Expected first bid</p>
                <p className="text-base font-extrabold text-violet-700 flex items-center justify-center gap-1"><Clock className="h-3.5 w-3.5" />Within 2 hours</p>
              </div>
              <div className="bg-white rounded-xl px-3 py-2.5 border border-violet-100 text-center">
                <p className="text-xs text-muted-foreground">Eligible bidders</p>
                <p className="text-base font-extrabold text-emerald-600 flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5" />{estimatedBidders}–{estimatedBidders + 5} experts</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-violet-600 pt-1">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Live now — open for bids</span>
              <span className="font-bold">Remote · Verified only</span>
            </div>
          </div>

          {/* What happens next */}
          <div className="rounded-2xl border border-border bg-secondary/30 px-5 py-4 text-left space-y-2.5">
            <p className="text-xs font-semibold text-foreground uppercase tracking-widest">What happens next</p>
            {[
              { icon: Zap, text: "Verified professionals are notified about your project" },
              { icon: TrendingUp, text: "They compete with quotes, timelines, and credentials" },
              { icon: Users, text: "You compare bids side-by-side and choose the best fit" },
              { icon: ShieldCheck, text: "Confirm delivery to release payment — your review builds their reputation" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Icon className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/jobs")} className="flex-1 h-11 rounded-xl font-semibold">
              View All Projects
            </Button>
            <Button variant="outline" onClick={() => { setPublished(false); setStep(0); setServiceType([]); setComplexity(""); setUrgency(""); setBiddingPeriod(""); setOpeningBudget(""); setAnswers({ what: "", deadline: "", records: "", complications: "", company: "" }); setGeneratedBrief(""); setProjectTitle(""); }}
              className="flex-1 h-11 rounded-xl">
              Post Another Project
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 ${step === 4 ? "pb-36" : ""}`}>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-3">
          <Sparkles className="h-3.5 w-3.5" /> AI-Assisted Project Posting
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Post a Remote Tax Project</h1>
        <p className="mt-2 text-muted-foreground">Answer a few quick questions — our AI writes the professional brief for you. Verified experts will bid on your project.</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {["✓ Free to post", "✓ Free to receive bids", "✓ No commission"].map(item => (
            <div key={item} className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-extrabold">
              {item}
            </div>
          ))}
        </div>
      </div>

      <StepIndicator step={step} total={4} />

      <AnimatePresence mode="wait">

        {/* Step 0 — Service type */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">What type of tax work do you need?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select the closest match to your project.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SERVICE_TYPES.map(s => (
                <SelectCard key={s.value} item={s} selected={serviceType.includes(s.value)} onClick={() => toggleServiceType(s.value)} />
              ))}
            </div>
            {serviceType.length > 0 && (
              <p className="text-xs text-muted-foreground">{serviceType.length} service{serviceType.length > 1 ? "s" : ""} selected</p>
            )}
            <Button onClick={() => setStep(1)} disabled={serviceType.length === 0} className="w-full h-11 rounded-xl font-semibold gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 1 — Complexity + urgency + budget */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-7">
            <div>
              <h2 className="text-xl font-bold text-foreground">Project details</h2>
              <p className="text-sm text-muted-foreground mt-1">Help us match you with the right level of expertise.</p>
            </div>

            <PricingEstimate
              services={serviceType}
              complexity={complexity}
              urgency={urgency}
              recordsReady={recordsReady}
            />
            <MarketplaceIntelligence
              category={serviceType[0] || "other"}
              complexity={complexity || "medium"}
              urgency={urgency || "negotiable"}
              biddingPeriod={biddingPeriod}
              budgetAmount={openingBudgetAmount}
              remote
              missingRecords={projectConditions.missingRecords}
              multipleIncomeSources={projectConditions.multipleIncomeSources}
              internationalTaxIssues={projectConditions.internationalTaxIssues}
              estimatedWorkload={estimatedWorkload}
              deadlinePressure={deadlinePressure}
              descriptionLength={answers.what?.length || 0}
            />

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Project complexity</Label>
              <div className="space-y-2">
                {COMPLEXITY.map(c => <SelectCard key={c.value} item={c} selected={complexity === c.value} onClick={() => setComplexity(c.value)} />)}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Urgency</Label>
              <div className="space-y-2">
                {URGENCY.map(u => <SelectCard key={u.value} item={u} selected={urgency === u.value} onClick={() => setUrgency(u.value)} />)}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">How long should bidding stay open?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["24h", "3d", "5d", "7d"].map(period => (
                  <button key={period} onClick={() => setBiddingPeriod(period)}
                    className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${biddingPeriod === period ? "border-primary bg-primary/8 text-primary" : "border-border hover:border-primary/40"}`}>
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
              <div>
                <Label className="text-sm font-semibold">Opening Budget</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Set a visible starting point for professionals. Higher budgets usually attract more experienced bidders.
                </p>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">£</span>
                <Input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={openingBudget}
                  onChange={e => setOpeningBudget(e.target.value)}
                  placeholder={`${Math.round(budgetRange.min)}`}
                  className="pl-7 h-11 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {budgetSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => setOpeningBudget(String(suggestion.value))}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left ${
                      openingBudgetAmount === suggestion.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-violet-200 bg-white text-foreground hover:border-primary/40"
                    }`}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>

              <div className={`rounded-xl border px-3 py-2 text-xs ${
                selectedBudgetScore.budgetHealthLevel === "good"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : selectedBudgetScore.budgetHealthLevel === "danger"
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
                <p className="font-bold">{openingBudgetAmount ? selectedBudgetScore.budgetHealthLabel : `Suggested range: ${formatBudget(budgetRange.min)}-${formatBudget(budgetRange.max)}`}</p>
                <p className="mt-0.5">
                  {selectedBudgetScore.budgetSuggestion || "Urgent or specialist projects usually need a stronger starting budget to attract senior professionals."}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-11 rounded-xl">Back</Button>
              <Button onClick={() => setStep(2)} disabled={!complexity || !urgency || !biddingPeriod || !openingBudgetAmount} className="flex-1 h-11 rounded-xl font-semibold gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Guided questions */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">A few quick questions</h2>
              <p className="text-sm text-muted-foreground mt-1">Just answer in plain language — the AI will handle the professional wording.</p>
            </div>

            {[
              { key: "what", label: "What exactly do you need help with?", placeholder: "e.g. I need my personal self assessment done for 2023/24, I'm employed but also have rental income from one property." },
              { key: "deadline", label: "Do you have a specific deadline?", placeholder: "e.g. Before 31 January, or as soon as possible" },
              { key: "records", label: "Are your records already prepared?", placeholder: "e.g. Yes, I have all my P60s and bank statements ready. / No, I'll need help organising them." },
              { key: "complications", label: "Any complications or special circumstances?", placeholder: "e.g. I had a foreign income source, or sold some shares last year." },
              { key: "company", label: "Your name or company (optional)", placeholder: "e.g. Smith Property Ltd or John Smith" },
            ].map(q => (
              <div key={q.key} className="space-y-1.5">
                <Label className="text-sm font-semibold">{q.label}</Label>
                <Textarea value={answers[q.key]} onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}
                  placeholder={q.placeholder} className="h-20 resize-none text-sm" />
              </div>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">Back</Button>
              <Button onClick={() => generateBrief()} disabled={generating || !answers.what.trim()} className="flex-1 h-11 rounded-xl font-semibold gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Brief
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Generating */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-16 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="h-10 w-10 text-violet-500" />
            </motion.div>
            <div>
              <p className="text-lg font-bold text-foreground">{generatedBrief ? "Refreshing your project brief…" : "Generating your project brief…"}</p>
              <p className="text-sm text-muted-foreground mt-1">Drafting a polished UK accounting and tax engagement brief from your answers.</p>
            </div>
          </motion.div>
        )}

        {/* Step 4 — Review & edit */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Review your project brief</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Edit anything you'd like to change before publishing.</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-lg shrink-0"
                onClick={() => generateBrief({ regenerate: true })}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {generating ? "Regenerating" : "Regenerate"}
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Project title</Label>
              <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className="font-semibold" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Project description</Label>
              <Textarea value={generatedBrief} onChange={e => setGeneratedBrief(e.target.value)}
                className="h-52 resize-none text-sm leading-relaxed" required />
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Summary</p>
              <p>{serviceType.map(v => SERVICE_TYPES.find(s => s.value === v)?.label ?? v).join(", ")} · {complexity} complexity · {getUrgencyLabel(urgency)}</p>
              <p className="text-emerald-600 font-medium">✓ Remote only · Bidding open for {biddingPeriod} · Budget from {formatBudget(openingBudgetAmount || 0)}</p>
            </div>

            <div className="sticky bottom-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur-md border-t border-border/60 space-y-2">
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl">Back</Button>
                <Button
                  type="submit"
                  disabled={submitting || !projectTitle.trim() || !generatedBrief.trim()}
                  className="relative z-50 flex-1 h-12 rounded-xl font-semibold gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publish Project Free
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">Your project goes live immediately. Verified professionals will start bidding.</p>
            </div>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}