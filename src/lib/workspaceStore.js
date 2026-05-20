import {
  buildWorkspaceMemberPatch,
  persistWorkspaceAccessGrant,
  getWorkspaceAccessGrant,
  workspaceIncludesEmail,
} from "@/lib/workspaceAccess";

const KEY = "taxprouk_workspaces";
export const MAX_FILE_BYTES = 400 * 1024;
export const MAX_WORKSPACE_BYTES = 2 * 1024 * 1024;

export const WORKFLOW_STATUSES = [
  { id: "quote_accepted", label: "Quote Accepted", description: "Proposal accepted — collaboration has started" },
  { id: "awaiting_documents", label: "Awaiting Documents", description: "Waiting for client files and records" },
  { id: "in_progress", label: "In Progress", description: "Professional work is underway" },
  { id: "review", label: "Review Stage", description: "Deliverables under client review" },
  { id: "submission_ready", label: "Submission Ready", description: "Filing or final outputs prepared" },
  { id: "completed", label: "Completed", description: "Work confirmed complete by both parties" },
];

export const MESSAGE_TYPES = [
  { id: "general", label: "General message" },
  { id: "document_request", label: "Document request" },
  { id: "clarification", label: "Clarification request" },
  { id: "progress_update", label: "Progress update" },
  { id: "deadline_reminder", label: "Deadline reminder" },
];

export const PROGRESS_MILESTONES = [
  { id: "records_reviewed", label: "Records reviewed" },
  { id: "queries_sent", label: "Queries sent to client" },
  { id: "vat_draft_prepared", label: "VAT draft prepared" },
  { id: "awaiting_client_approval", label: "Awaiting client approval" },
  { id: "filing_submitted", label: "Filing submitted" },
  { id: "accounts_drafted", label: "Accounts drafted" },
  { id: "work_complete", label: "Work ready for sign-off" },
];

const CLIENT_REVIEW_TAGS = ["Strong communication", "Expert advice", "Delivered on time", "Professional", "Would hire again"];
const PROFESSIONAL_REVIEW_TAGS = ["Responsive", "Documents ready on time", "Clear communication", "Easy to work with", "Would work with again"];

function readAll() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(items) ? items.map(normalizeWorkspace) : [];
  } catch {
    return [];
  }
}

function normalizeWorkspace(ws) {
  if (!ws) return ws;
  const workflow_status = ws.workflow_status === "accepted" ? "quote_accepted" : ws.workflow_status;
  return {
    progress_updates: [],
    completion_phase: "active",
    reviews: {},
    members: [],
    ...ws,
    workflow_status,
    members: ws.members?.length ? ws.members : [],
  };
}

function persistWorkspace(workspace) {
  const all = readAll();
  const idx = all.findIndex((w) => w.project_id === workspace.project_id);
  const next = normalizeWorkspace({ ...workspace, updated_at: new Date().toISOString() });
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("workspaceUpdated", { detail: { workspace: next } }));
  return next;
}

function appendActivity(workspace, entry) {
  const activity = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    ...entry,
  };
  return {
    ...workspace,
    activities: [activity, ...(workspace.activities || [])].slice(0, 120),
  };
}

export function getAllWorkspaces() {
  return readAll();
}

export function getWorkspaceByProjectId(projectId) {
  return readAll().find((ws) => ws.project_id === projectId) || null;
}

export function getWorkspacesForUser({ email, role } = {}) {
  if (!email) return [];
  const normalized = email.toLowerCase();
  return readAll().filter((ws) => {
    if (!workspaceIncludesEmail(ws, normalized)) return false;
    if (role === "client") return getUserRoleInWorkspace(ws, normalized) === "client";
    if (role === "professional") return getUserRoleInWorkspace(ws, normalized) === "professional";
    return true;
  });
}

export function getUserRoleInWorkspace(workspace, userEmail) {
  if (!workspace || !userEmail) return null;
  const email = userEmail.toLowerCase();
  const member = (workspace.members || []).find((m) => m.email === email);
  if (member) return member.role;
  if (workspace.client_email?.toLowerCase() === email) return "client";
  if (
    workspace.professional_email?.toLowerCase() === email
    || workspace.selected_professional_email?.toLowerCase() === email
  ) {
    return "professional";
  }
  const grant = getWorkspaceAccessGrant(workspace.project_id);
  if (grant?.client_email === email) return "client";
  if (grant?.professional_email === email) return "professional";
  return null;
}

export function createWorkspaceOnAward({ project, bid, clientEmail }) {
  const memberPatch = buildWorkspaceMemberPatch({
    clientEmail: clientEmail || project.created_by,
    bid,
  });
  persistWorkspaceAccessGrant(project.id, {
    clientEmail: memberPatch.client_email,
    professionalEmail: memberPatch.professional_email,
    bidId: memberPatch.selected_bid_id,
  });

  const existing = getWorkspaceByProjectId(project.id);
  if (existing) {
    const needsRepair =
      memberPatch.professional_email
      && (
        !existing.members?.length
        || existing.professional_email !== memberPatch.professional_email
        || existing.bid_id !== memberPatch.bid_id
      );
    if (needsRepair) {
      return persistWorkspace({ ...existing, ...memberPatch });
    }
    return existing;
  }

  const now = new Date().toISOString();
  let workspace = {
    id: `ws-${project.id}`,
    project_id: project.id,
    project_title: project.title,
    project_category: project.category,
    project_duration: project.duration,
    client_email: memberPatch.client_email,
    client_name: project.company_name || project.client_name || "Client",
    professional_email: memberPatch.professional_email,
    selected_bid_id: memberPatch.selected_bid_id,
    selected_professional_email: memberPatch.selected_professional_email,
    members: memberPatch.members,
    professional_name: bid?.bidder_full_name || bid?.bidder_name || project.awarded_bidder_name || "Professional",
    professional_display_name: bid?.bidder_display_name || bid?.bidder_public_label || bid?.bidder_name,
    professional_firm: bid?.bidder_firm_name || bid?.firm_name || "",
    professional_phone: bid?.bidder_phone || "",
    professional_linkedin: bid?.bidder_linkedin || "",
    identity_revealed_at: now,
    bid_id: memberPatch.bid_id || bid?.id,
    awarded_amount: bid?.amount ?? project.awarded_amount,
    workflow_status: "quote_accepted",
    completion_phase: "active",
    payment_note: "Payments are arranged directly between client and professional (bank transfer or invoice). TaxPro UK does not hold funds.",
    messages: [],
    files: [],
    activities: [],
    progress_updates: [],
    reviews: {},
    created_at: now,
    updated_at: now,
  };

  workspace = appendActivity(workspace, {
    type: "award",
    actor_role: "system",
    actor_name: "TaxPro UK",
    message: `Quote accepted — workspace opened for ${workspace.professional_name}`,
  });
  workspace = appendActivity(workspace, {
    type: "workspace_ready",
    actor_role: "system",
    actor_name: "TaxPro UK",
    message: "Next step: client uploads documents · professional sends a welcome message",
  });

  const saved = persistWorkspace(workspace);
  window.dispatchEvent(new CustomEvent("workspaceCreated", { detail: { workspace: saved } }));
  return saved;
}

export function ensureWorkspaceForProject(project, bid, clientEmail) {
  const existing = getWorkspaceByProjectId(project?.id);
  if (existing) return existing;
  const isAwarded =
    project?.lifecycle_state === "awarded"
    || project?.status === "in_progress"
    || project?.awarded_bid_id;
  if (!isAwarded || !bid) return null;
  return createWorkspaceOnAward({ project, bid, clientEmail });
}

export function updateWorkspace(projectId, patch) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws) return null;
  return persistWorkspace({ ...ws, ...patch });
}

export function updateWorkspaceStatus(projectId, workflowStatus, { actorRole, actorName, note } = {}) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws) return null;
  const statusMeta = WORKFLOW_STATUSES.find((s) => s.id === workflowStatus);
  let next = { ...ws, workflow_status: workflowStatus };
  next = appendActivity(next, {
    type: "status_change",
    actor_role: actorRole || "system",
    actor_name: actorName || "User",
    message: note || `Status updated to ${statusMeta?.label || workflowStatus}`,
    meta: { workflow_status: workflowStatus },
  });
  return persistWorkspace(next);
}

export function addWorkspaceMessage(projectId, { senderRole, senderName, senderEmail, body, messageType = "general" }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws || !body?.trim()) return null;

  const typeMeta = MESSAGE_TYPES.find((t) => t.id === messageType) || MESSAGE_TYPES[0];
  const message = {
    id: `msg-${Date.now()}`,
    sender_role: senderRole,
    sender_name: senderName,
    sender_email: senderEmail,
    message_type: messageType,
    message_type_label: typeMeta.label,
    body: body.trim(),
    created_at: new Date().toISOString(),
  };

  let next = { ...ws, messages: [...(ws.messages || []), message] };
  next = appendActivity(next, {
    type: "message",
    actor_role: senderRole,
    actor_name: senderName,
    message: `${senderName}: ${typeMeta.label}`,
    meta: { message_type: messageType },
  });
  return persistWorkspace(next);
}

export function addWorkspaceFile(projectId, { file, uploaderRole, uploaderName, uploaderEmail, category }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws || !file) return Promise.resolve({ error: "Workspace not found" });

  if (file.size > MAX_FILE_BYTES) {
    return Promise.resolve({
      error: `File too large. Max ${Math.round(MAX_FILE_BYTES / 1024)}KB per file for MVP.`,
    });
  }

  const currentSize = (ws.files || []).reduce((sum, f) => sum + (f.size || 0), 0);
  if (currentSize + file.size > MAX_WORKSPACE_BYTES) {
    return Promise.resolve({ error: "Workspace storage limit reached." });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const record = {
        id: `file-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        category: category || "general",
        uploaded_by_role: uploaderRole,
        uploaded_by_name: uploaderName,
        uploaded_by_email: uploaderEmail,
        reviewed_by_professional: false,
        received: uploaderRole === "client",
        data_url: reader.result,
        created_at: new Date().toISOString(),
      };

      let next = { ...ws, files: [...(ws.files || []), record] };
      if (uploaderRole === "client" && ws.workflow_status === "quote_accepted") {
        next.workflow_status = "awaiting_documents";
      }
      next = appendActivity(next, {
        type: "file_upload",
        actor_role: uploaderRole,
        actor_name: uploaderName,
        message: `${uploaderName} uploaded ${file.name}`,
        meta: { file_name: file.name },
      });
      persistWorkspace(next);
      resolve({ file: record });
    };
    reader.onerror = () => resolve({ error: "Failed to read file" });
    reader.readAsDataURL(file);
  });
}

export function markFileReviewed(projectId, fileId, { actorName }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws) return null;
  const files = (ws.files || []).map((f) =>
    f.id === fileId ? { ...f, reviewed_by_professional: true, reviewed_at: new Date().toISOString() } : f,
  );
  let next = { ...ws, files };
  next = appendActivity(next, {
    type: "file_reviewed",
    actor_role: "professional",
    actor_name: actorName,
    message: `${actorName} reviewed a document`,
  });
  return persistWorkspace(next);
}

export function requestAdditionalDocuments(projectId, { actorName, actorRole, requestText }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws) return null;
  let next = { ...ws, workflow_status: "awaiting_documents" };
  next = appendActivity(next, {
    type: "document_request",
    actor_role: actorRole,
    actor_name: actorName,
    message: requestText || `${actorName} requested additional documents`,
  });
  return persistWorkspace(next);
}

export function addProgressUpdate(projectId, { milestoneId, note, actorName, actorRole }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws) return null;
  const milestone = PROGRESS_MILESTONES.find((m) => m.id === milestoneId);
  const update = {
    id: `prog-${Date.now()}`,
    milestone_id: milestoneId,
    label: milestone?.label || note,
    note: note || "",
    actor_role: actorRole,
    actor_name: actorName,
    created_at: new Date().toISOString(),
  };
  let next = {
    ...ws,
    progress_updates: [...(ws.progress_updates || []), update],
    workflow_status: ws.workflow_status === "quote_accepted" ? "in_progress" : ws.workflow_status,
  };
  next = appendActivity(next, {
    type: "progress",
    actor_role: actorRole,
    actor_name: actorName,
    message: `${actorName}: ${update.label}${note ? ` — ${note}` : ""}`,
  });
  return persistWorkspace(next);
}

export function professionalMarkWorkComplete(projectId, { actorName }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws) return null;
  let next = {
    ...ws,
    completion_phase: "awaiting_client_confirmation",
    professional_completed_at: new Date().toISOString(),
    workflow_status: "review",
  };
  next = appendActivity(next, {
    type: "completion_requested",
    actor_role: "professional",
    actor_name: actorName,
    message: `${actorName} marked work as complete — awaiting client confirmation`,
  });
  return persistWorkspace(next);
}

export function clientConfirmCompletion(projectId, { actorName }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws) return null;
  let next = {
    ...ws,
    completion_phase: "completed",
    workflow_status: "completed",
    client_confirmed_at: new Date().toISOString(),
  };
  next = appendActivity(next, {
    type: "completion_confirmed",
    actor_role: "client",
    actor_name: actorName,
    message: `${actorName} confirmed satisfactory completion`,
  });
  const saved = persistWorkspace(next);
  window.dispatchEvent(new CustomEvent("workspaceCompleted", { detail: { workspace: saved, projectId } }));
  return saved;
}

/** @deprecated use dual completion flow */
export function markWorkspaceCompleted(projectId, { actorName, actorRole }) {
  if (actorRole === "professional") return professionalMarkWorkComplete(projectId, { actorName });
  return clientConfirmCompletion(projectId, { actorName });
}

export function submitWorkspaceReview(projectId, { reviewerRole, reviewerName, rating, tags = [], comment = "" }) {
  const ws = getWorkspaceByProjectId(projectId);
  if (!ws || !rating) return null;
  const review = {
    id: `wrev-${Date.now()}`,
    reviewer_role: reviewerRole,
    reviewer_name: reviewerName,
    rating: Number(rating),
    tags,
    comment: comment.trim().slice(0, 500),
    created_at: new Date().toISOString(),
  };
  const reviews = { ...(ws.reviews || {}), [reviewerRole]: review };
  let next = { ...ws, reviews };
  next = appendActivity(next, {
    type: "review",
    actor_role: reviewerRole,
    actor_name: reviewerName,
    message: `${reviewerName} submitted a ${reviewerRole === "client" ? "professional" : "client"} review`,
  });
  const saved = persistWorkspace(next);
  window.dispatchEvent(new CustomEvent("workspaceReviewSubmitted", { detail: { workspace: saved, review } }));
  return saved;
}

export { CLIENT_REVIEW_TAGS, PROFESSIONAL_REVIEW_TAGS };
