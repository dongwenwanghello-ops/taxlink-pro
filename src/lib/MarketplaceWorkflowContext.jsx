import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildWorkflowSnapshot,
  reconcileMarketplaceState,
  WORKFLOW_EVENTS,
} from "@/lib/marketplaceState";

const MarketplaceWorkflowContext = createContext(null);

export function MarketplaceWorkflowProvider({ children }) {
  const [snapshot, setSnapshot] = useState(null);
  const [lastReconcile, setLastReconcile] = useState(null);

  const refresh = useCallback(() => {
    const result = reconcileMarketplaceState();
    setLastReconcile(result);
    setSnapshot(result.snapshot || buildWorkflowSnapshot());
    return result;
  }, []);

  useEffect(() => {
    refresh();
    const onWorkflow = () => {
      setSnapshot(buildWorkflowSnapshot());
      setLastReconcile((prev) => prev || { ok: true });
    };
    const events = [
      WORKFLOW_EVENTS.reconciled,
      WORKFLOW_EVENTS.projectAwarded,
      WORKFLOW_EVENTS.bidUpdated,
      WORKFLOW_EVENTS.workspaceCreated,
      WORKFLOW_EVENTS.workspaceUpdated,
      "projectPosted",
      "projectUpdated",
      "projectCompleted",
      "bidSubmitted",
    ];
    events.forEach((e) => window.addEventListener(e, onWorkflow));
    return () => events.forEach((e) => window.removeEventListener(e, onWorkflow));
  }, [refresh]);

  const value = useMemo(
    () => ({
      snapshot,
      lastReconcile,
      refresh,
      session: snapshot?.session ?? null,
      accessibleWorkspaces: snapshot?.accessibleWorkspaces ?? [],
    }),
    [snapshot, lastReconcile, refresh],
  );

  return (
    <MarketplaceWorkflowContext.Provider value={value}>
      {children}
    </MarketplaceWorkflowContext.Provider>
  );
}

export function useMarketplaceWorkflow() {
  const ctx = useContext(MarketplaceWorkflowContext);
  if (!ctx) {
    throw new Error("useMarketplaceWorkflow must be used within MarketplaceWorkflowProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (returns null). */
export function useMarketplaceWorkflowOptional() {
  return useContext(MarketplaceWorkflowContext);
}
