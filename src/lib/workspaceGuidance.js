import { WORKFLOW_STATUSES } from "@/lib/workspaceStore";
import { getRecurringWorkSignals } from "@/lib/guidedPricing";

/** Normalize legacy status ids */
export function normalizeWorkflowStatus(status) {
  if (status === "accepted") return "quote_accepted";
  return status || "quote_accepted";
}

export function getNextStepGuidance(workspace, userRole) {
  if (!workspace || !userRole) return null;

  const status = normalizeWorkflowStatus(workspace.workflow_status);
  const files = workspace.files || [];
  const clientFiles = files.filter((f) => f.uploaded_by_role === "client");
  const phase = workspace.completion_phase || "active";
  const hasClientReview = Boolean(workspace.reviews?.client);
  const hasProReview = Boolean(workspace.reviews?.professional);

  if (phase === "completed" || status === "completed") {
    if (userRole === "client" && !hasClientReview) {
      return {
        tone: "violet",
        title: "Leave a verified review",
        description: "Share feedback on communication, expertise, and timeliness to help other clients.",
        action: "review",
      };
    }
    if (userRole === "professional" && !hasProReview) {
      return {
        tone: "violet",
        title: "Review your client",
        description: "Rate responsiveness and document readiness — builds your professional reputation.",
        action: "review",
      };
    }
    return {
      tone: "emerald",
      title: "Project completed",
      description: "Thank you for collaborating on TaxPro UK. Consider ongoing work below.",
      action: "recurring",
    };
  }

  if (phase === "awaiting_client_confirmation") {
    if (userRole === "client") {
      return {
        tone: "amber",
        title: "Confirm satisfactory completion",
        description: `${workspace.professional_name} marked work as complete. Review deliverables, then confirm completion.`,
        action: "confirm_completion",
      };
    }
    return {
      tone: "blue",
      title: "Awaiting client confirmation",
      description: "You've marked work as complete. The client will confirm when satisfied.",
      action: null,
    };
  }

  const guidanceByStatus = {
    quote_accepted: {
      client: {
        tone: "teal",
        title: "Upload your documents",
        description: "Share bank statements, invoices, payroll files, VAT records, and any prior accounts so work can begin.",
        action: "upload",
      },
      professional: {
        tone: "blue",
        title: "Introduce yourself",
        description: "Send a welcome message and list the documents you need from the client.",
        action: "message",
      },
    },
    awaiting_documents: {
      client: {
        tone: "amber",
        title: "Documents requested",
        description: "Your accountant needs additional files. Upload them in the Documents section below.",
        action: "upload",
      },
      professional: {
        tone: "amber",
        title: "Waiting for client documents",
        description: "Follow up with a document request message if files are still missing.",
        action: "request_docs",
      },
    },
    in_progress: {
      client: {
        tone: "blue",
        title: "Work in progress",
        description: "Your professional is working on the project. Reply to messages or upload any extra files promptly.",
        action: null,
      },
      professional: {
        tone: "teal",
        title: "Update progress",
        description: "Post a progress update so the client knows where things stand.",
        action: "progress",
      },
    },
    review: {
      client: {
        tone: "violet",
        title: "Review deliverables",
        description: "Check drafts or outputs from your accountant and reply with any clarifications.",
        action: "message",
      },
      professional: {
        tone: "violet",
        title: "Client review stage",
        description: "Share deliverables and note anything you need approved before submission.",
        action: "progress",
      },
    },
    submission_ready: {
      client: {
        tone: "emerald",
        title: "Submission ready",
        description: "Filing or final deliverables are ready. Confirm once you've received everything.",
        action: null,
      },
      professional: {
        tone: "emerald",
        title: "Ready for submission",
        description: "Mark filing submitted via progress update, then mark work complete when done.",
        action: "mark_complete",
      },
    },
  };

  const block = guidanceByStatus[status]?.[userRole];
  if (!block) {
    return {
      tone: "slate",
      title: "Collaboration in progress",
      description: "Use messages and documents to keep work on-platform.",
      action: null,
    };
  }

  if (userRole === "client" && clientFiles.length === 0 && ["quote_accepted", "awaiting_documents"].includes(status)) {
    return { ...block, title: "Upload required documents", description: block.description };
  }

  return block;
}

export function getDocumentChecklist(category) {
  const common = ["Bank statements", "Sales & purchase invoices", "Prior year accounts (if applicable)"];
  const byCategory = {
    vat: ["VAT returns / MTD records", "Quarterly VAT summaries"],
    bookkeeping: ["Bookkeeping exports (Xero / QuickBooks)", "Expense receipts"],
    payroll: ["Payroll reports", "P45/P60 records", "Pension contribution details"],
    tax_return: ["P60 / employment income", "Dividend vouchers", "Rental income summary"],
    corporation_tax: ["Trial balance", "Fixed asset register", "Directors' loan account"],
  };
  return [...common, ...(byCategory[category] || [])];
}

export function getRecurringSuggestions(workspace) {
  const job = { category: workspace.project_category, duration: workspace.project_duration };
  return getRecurringWorkSignals(job);
}
