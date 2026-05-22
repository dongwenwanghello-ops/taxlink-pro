import React from "react";
import { useMarketplaceWorkflowOptional } from "@/lib/MarketplaceWorkflowContext";
import { WORKFLOW_SCHEMA_VERSION } from "@/lib/marketplaceState";

/** Dev-only: confirms same workflow engine + storage counts on this origin. */
export default function WorkflowSyncIndicator() {
  if (!import.meta.env.DEV) return null;

  const ctx = useMarketplaceWorkflowOptional();
  if (!ctx) return null;

  const { snapshot } = ctx;
  if (!snapshot) return null;
  const { counts, environment, session } = snapshot;

  return (
    <div
      className="fixed bottom-2 left-2 z-[100] max-w-xs rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-[10px] text-slate-300 font-mono shadow-lg"
      title="Workflow sync (dev only) — not shown on production builds"
    >
      <p className="text-slate-400 uppercase tracking-wider mb-1">Workflow v{WORKFLOW_SCHEMA_VERSION}</p>
      <p>env: {environment} · role: {session.role}</p>
      <p>
        P{counts.projects} B{counts.bids} W{counts.workspaces} accessible:{counts.accessibleWorkspaces}
      </p>
    </div>
  );
}
