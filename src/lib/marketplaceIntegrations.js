/**
 * Cross-cutting hooks: onboarding → profile → advisor → workspace reconcile.
 */
import { reconcileMarketplaceState, WORKFLOW_EVENTS } from "@/lib/marketplaceState";
import { setSessionProfessionalEmail } from "@/lib/workspaceAccess";

export const INTEGRATION_EVENTS = {
  profileUpdated: "profileUpdated",
  earlyAccessSignup: "earlyAccessSignup",
};

/** After onboarding / profile save — sync session email and marketplace snapshot. */
export function syncMarketplaceAfterProfileSave(profile = {}) {
  if (profile.email) {
    setSessionProfessionalEmail(profile.email);
  }

  const report = reconcileMarketplaceState();

  window.dispatchEvent(
    new CustomEvent(INTEGRATION_EVENTS.profileUpdated, {
      detail: { profile, snapshot: report?.snapshot },
    }),
  );

  window.dispatchEvent(
    new CustomEvent(WORKFLOW_EVENTS.reconciled, {
      detail: report,
    }),
  );

  return report;
}

/** After posting a project — refresh workflow snapshot for jobs/workspaces lists. */
export function syncMarketplaceAfterProjectPost(project = {}) {
  const report = reconcileMarketplaceState();

  window.dispatchEvent(
    new CustomEvent("projectPosted", {
      detail: { project, snapshot: report?.snapshot },
    }),
  );

  window.dispatchEvent(
    new CustomEvent(WORKFLOW_EVENTS.reconciled, {
      detail: report,
    }),
  );

  return report;
}
