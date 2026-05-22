/**
 * App-load entry — delegates to centralized marketplaceState reconcile.
 */
import { reconcileMarketplaceState } from "@/lib/marketplaceState";

let bootstrapped = false;

export function bootstrapMarketplaceWorkflow() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  try {
    reconcileMarketplaceState();
  } catch (err) {
    console.warn("[TaxPro UK] Workflow bootstrap skipped:", err);
  }
}

export function refreshMarketplaceWorkflow() {
  try {
    reconcileMarketplaceState();
  } catch (err) {
    console.warn("[TaxPro UK] Workflow refresh skipped:", err);
  }
}
