/**
 * Runs once per session on any environment (dev, preview, production).
 * Keeps localStorage-backed workflow state aligned before pages render lists.
 */
import { syncWorkspacesFromAwardedProjects, syncWorkspacesFromAcceptedBids } from "@/lib/awardWorkflow";

let bootstrapped = false;

export function bootstrapMarketplaceWorkflow() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;

  try {
    syncWorkspacesFromAwardedProjects();
    syncWorkspacesFromAcceptedBids();
  } catch (err) {
    console.warn("[TaxPro UK] Workflow bootstrap skipped:", err);
  }
}

/** Re-run after award/bid events (safe; sync functions are idempotent). */
export function refreshMarketplaceWorkflow() {
  try {
    syncWorkspacesFromAwardedProjects();
    syncWorkspacesFromAcceptedBids();
  } catch (err) {
    console.warn("[TaxPro UK] Workflow refresh skipped:", err);
  }
}
