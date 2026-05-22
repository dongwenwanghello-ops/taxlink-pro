/** Canonical bid/project status labels — no storage or sync dependencies. */

export const BID_STATUSES = {
  pending: "pending",
  shortlisted: "shortlisted",
  selected: "selected",
  rejected: "rejected",
};

export const BID_STATUS_UI = {
  pending: {
    label: "Pending Review",
    badgeClass: "bg-amber-50 border-amber-200 text-amber-800",
    layer: "bid",
  },
  shortlisted: {
    label: "Shortlisted",
    badgeClass: "bg-violet-50 border-violet-200 text-violet-800",
    layer: "bid",
  },
  selected: {
    label: "Selected",
    badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800",
    layer: "bid",
  },
  rejected: {
    label: "Not selected",
    badgeClass: "bg-rose-50 border-rose-200 text-rose-700",
    layer: "bid",
  },
};

export const PROJECT_STATUS_UI = {
  open: { label: "Open", badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  reviewing: { label: "Reviewing Bids", badgeClass: "bg-amber-50 border-amber-200 text-amber-800" },
  awarded: { label: "Awarded", badgeClass: "bg-violet-50 border-violet-200 text-violet-800" },
  in_progress: { label: "In Progress", badgeClass: "bg-blue-50 border-blue-200 text-blue-800" },
  completed: { label: "Completed", badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  closed: { label: "Closed", badgeClass: "bg-secondary border-border text-muted-foreground" },
};

export function normalizeBidStatus(status, bid = {}) {
  if (bid.awarded || bid.status === "accepted") return BID_STATUSES.selected;
  if (status === "accepted" || status === "awarded") return BID_STATUSES.selected;
  return status || BID_STATUSES.pending;
}

export function getBidStatusUI(bid) {
  const key = normalizeBidStatus(bid?.status, bid);
  return BID_STATUS_UI[key] || BID_STATUS_UI.pending;
}

export function getProjectStatusUI(project = {}) {
  if (project.lifecycle_state === "awarded" || project.awarded_bid_id) {
    return project.status === "in_progress"
      ? PROJECT_STATUS_UI.in_progress
      : PROJECT_STATUS_UI.awarded;
  }
  const key = project.status || "open";
  return PROJECT_STATUS_UI[key] || PROJECT_STATUS_UI.open;
}

export function getWorkspaceStatusUI(workspace) {
  if (!workspace) return { label: "No workspace", badgeClass: "bg-muted border-border text-muted-foreground" };
  const map = {
    quote_accepted: { label: "Workspace Active", badgeClass: "bg-teal-50 border-teal-200 text-teal-800" },
    awaiting_documents: { label: "Awaiting Documents", badgeClass: "bg-amber-50 border-amber-200 text-amber-800" },
    in_progress: { label: "In Progress", badgeClass: "bg-blue-50 border-blue-200 text-blue-800" },
    review: { label: "Under Review", badgeClass: "bg-violet-50 border-violet-200 text-violet-800" },
    submission_ready: { label: "Submission Ready", badgeClass: "bg-indigo-50 border-indigo-200 text-indigo-800" },
    completed: { label: "Completed", badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  };
  return map[workspace.workflow_status] || map.quote_accepted;
}
