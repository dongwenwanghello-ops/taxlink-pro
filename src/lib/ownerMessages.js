const KEY = "taxprouk_owner_messages";

export function getOwnerMessages(projectId = null) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!projectId) return all;
    return all.filter((m) => m.project_id === projectId);
  } catch {
    return [];
  }
}

export function saveOwnerMessage({ projectId, bidId, bidderLabel, type = "contact", message }) {
  const entry = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    project_id: projectId,
    bid_id: bidId,
    bidder_label: bidderLabel,
    type,
    message: String(message || "").trim(),
    created_date: new Date().toISOString(),
    status: "submitted",
  };
  const all = getOwnerMessages();
  localStorage.setItem(KEY, JSON.stringify([entry, ...all]));
  window.dispatchEvent(new CustomEvent("ownerMessageSubmitted", { detail: entry }));
  return entry;
}
