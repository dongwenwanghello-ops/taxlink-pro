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

export function updateBidsForProject(projectId, updater) {
  const updatedBids = getAllBids().map((bid) => {
    if (bid.project_id !== projectId) return bid;
    return typeof updater === "function" ? updater(bid) : { ...bid, ...updater };
  });
  localStorage.setItem(KEY, JSON.stringify(updatedBids));
  window.dispatchEvent(new CustomEvent("bidUpdated", { detail: { projectId } }));
  return updatedBids.filter((bid) => bid.project_id === projectId);
}

export function awardProjectBid(projectId, winningBidId) {
  const awardedAt = new Date().toISOString();
  return updateBidsForProject(projectId, (bid) => ({
    ...bid,
    status: bid.id === winningBidId ? "accepted" : "rejected",
    awarded: bid.id === winningBidId,
    awarded_at: bid.id === winningBidId ? awardedAt : bid.awarded_at,
    rejection_reason: bid.id === winningBidId ? undefined : "Project awarded to another professional",
  }));
}

export function getBidCountForProject(projectId) {
  return getBidsForProject(projectId).length;
}