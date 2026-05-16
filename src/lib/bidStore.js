const KEY = "taxprouk_bids";

export function getAllBids() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function getBidsForProject(projectId) {
  return getAllBids()
    .filter(b => b.project_id === projectId)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
}

export function saveBid(bid) {
  const existing = getAllBids();
  const newBid = {
    ...bid,
    id: `bid_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    status: "pending",
    created_date: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([newBid, ...existing]));
  window.dispatchEvent(new CustomEvent("bidSubmitted", { detail: newBid }));
  return newBid;
}

export function updateBidStatus(bidId, status) {
  const bids = getAllBids().map(b => b.id === bidId ? { ...b, status } : b);
  localStorage.setItem(KEY, JSON.stringify(bids));
  window.dispatchEvent(new CustomEvent("bidUpdated", { detail: { bidId, status } }));
}

export function getBidCountForProject(projectId) {
  return getBidsForProject(projectId).length;
}