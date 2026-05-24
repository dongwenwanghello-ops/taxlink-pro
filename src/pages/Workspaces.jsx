import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid, ArrowRight, Loader2, MessageCircle, FileUp, Clock, LogIn,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { summarizeWorkspaceCard } from "@/lib/awardWorkflow";
import { getMarketplaceSession, setMarketplaceClientEmail, WORKFLOW_EVENTS } from "@/lib/marketplaceState";
import { useMarketplaceWorkflow } from "@/lib/MarketplaceWorkflowContext";
import {
  resolveWorkspaceUser,
  resolveWorkspaceListPriority,
  hasWorkspaceForAcceptedBid,
  loadAcceptedBidsForSession,
} from "@/lib/workspacePageUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function Workspaces() {
  const { snapshot, refresh } = useMarketplaceWorkflow();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("professional");
  const [acceptedBids, setAcceptedBids] = useState([]);
  const [authRequired, setAuthRequired] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const applyWorkspaceList = useCallback((nextSnapshot, session, expired) => {
    const list = resolveWorkspaceListPriority({
      snapshot: nextSnapshot,
      session,
      authRequired: expired,
    });
    setWorkspaces(list);
    setUserRole(session.role);
    setAcceptedBids(loadAcceptedBidsForSession(session));
  }, []);

  /** Snapshot is primary — always apply, including empty arrays (clears stale UI). */
  useEffect(() => {
    if (!authChecked || syncingRef.current || authRequired) return;

    const fromSnapshot = snapshot?.accessibleWorkspaces ?? [];
    setWorkspaces(fromSnapshot);
  }, [authChecked, authRequired, snapshot, snapshot?.accessibleWorkspaces, snapshot?.counts?.workspaces]);

  /** Initial auth + reconcile; expired sessions keep local fallback visible. */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { user, authRequired: needsAuth } = await resolveWorkspaceUser(() => base44.auth.me());
      if (cancelled) return;

      const session = getMarketplaceSession();
      let expired = false;

      if (user?.email) {
        setMarketplaceClientEmail(user.email);
        setAuthRequired(false);
        const refreshedSession = getMarketplaceSession();
        const report = refresh();
        if (!cancelled) {
          applyWorkspaceList(report?.snapshot ?? null, refreshedSession, false);
        }
      } else {
        expired = needsAuth;
        setAuthRequired(needsAuth);
        if (!cancelled) {
          applyWorkspaceList(null, session, needsAuth);
        }
      }

      if (!cancelled) {
        setAuthChecked(true);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh, applyWorkspaceList]);

  /** Workflow events: snapshot-only sync (reconcile already ran); guard manual sync. */
  useEffect(() => {
    if (!authChecked) return;

    const onWorkflowChange = (event) => {
      if (syncingRef.current || authRequired) return;
      const snap = event?.detail?.snapshot;
      if (snap) {
        setWorkspaces(snap.accessibleWorkspaces ?? []);
      }
    };

    const events = [
      WORKFLOW_EVENTS.reconciled,
      "workspaceCreated",
      "workspaceUpdated",
      "projectAwarded",
      "bidUpdated",
    ];
    events.forEach((e) => window.addEventListener(e, onWorkflowChange));
    return () => events.forEach((e) => window.removeEventListener(e, onWorkflowChange));
  }, [authChecked, authRequired]);

  const handleManualSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const report = await Promise.resolve(refresh());
      const session = getMarketplaceSession();
      applyWorkspaceList(report?.snapshot ?? null, session, authRequired);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refresh, applyWorkspaceList, authRequired]);

  const handleSignIn = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showEmpty = workspaces.length === 0;
  const hasWorkspaceForBid = hasWorkspaceForAcceptedBid(acceptedBids);
  const hasSelectedWithoutWorkspace = acceptedBids.length > 0 && showEmpty;
  const showExpiredWithLocal = authRequired && workspaces.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Workspaces</h1>
              <p className="text-sm text-muted-foreground">
                Active collaborations after a quote is selected — messaging, files, and delivery in one place
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {authRequired && (
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {showExpiredWithLocal ? "Your session expired" : "Sign in to sync cloud data"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {showExpiredWithLocal
                  ? "Local workspaces are temporarily available on this device. Sign in to restore cloud synchronization."
                  : "Sign in to load awarded projects and collaboration spaces from Base44."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button type="button" className="rounded-xl gap-2" onClick={handleSignIn}>
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" asChild>
                <Link to="/create-profile">Create profile</Link>
              </Button>
            </div>
          </div>
        )}

        {hasSelectedWithoutWorkspace && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
            You have a selected proposal but the workspace had not synced yet.
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 rounded-lg"
              disabled={isSyncing}
              onClick={handleManualSync}
            >
              {isSyncing ? "Syncing..." : "Sync workspace"}
            </Button>
          </div>
        )}

        {showEmpty ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center space-y-4">
            {authRequired && !showExpiredWithLocal && (
              <>
                <p className="text-sm font-semibold text-foreground">No workspaces yet</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to load your awarded projects and collaboration spaces from Base44.
                </p>
                <Button type="button" className="rounded-xl gap-2" onClick={handleSignIn}>
                  <LogIn className="h-4 w-4" />
                  Sign in to continue
                </Button>
              </>
            )}
            {!authRequired && userRole === "professional" && acceptedBids.length > 0 && (
              <>
                <p className="text-sm font-semibold text-foreground">Your proposal was selected</p>
                <p className="text-sm text-muted-foreground">
                  A workspace should open automatically. If it does not appear, sync below or open from My Bids.
                </p>
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={isSyncing}
                  onClick={handleManualSync}
                >
                  {isSyncing ? "Syncing..." : "Sync my workspace"}
                </Button>
                <Link to="/my-bids" className="block text-sm font-semibold text-primary hover:underline">
                  Go to My Bids
                </Link>
              </>
            )}
            {!authRequired && !(userRole === "professional" && acceptedBids.length > 0) && (
              <>
                <p className="text-sm text-muted-foreground">
                  {userRole === "client"
                    ? "When you accept a professional's quote, a workspace opens automatically for collaboration."
                    : "When a client selects your quote, your project workspace will appear here."}
                </p>
                <Link
                  to={userRole === "client" ? "/my-projects" : "/jobs"}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {userRole === "client" ? "Go to My Projects" : "Browse open projects"}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws) => {
              const card = summarizeWorkspaceCard(ws, userRole);
              const counterparty = userRole === "client" ? ws.professional_name : ws.client_name;
              return (
                <Link
                  key={ws.id}
                  to={`/workspace/${ws.project_id}`}
                  className="block rounded-2xl border border-border/70 bg-card p-5 hover:border-teal-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-xs ${card.workspaceStatus.badgeClass}`}>
                          {card.workspaceStatus.label}
                        </Badge>
                        {card.awaitingDocuments && (
                          <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800 gap-1">
                            <FileUp className="h-3 w-3" />
                            Awaiting documents
                          </Badge>
                        )}
                        {card.unreadMessages > 0 && (
                          <Badge className="text-xs bg-teal-600 gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {card.unreadMessages} message{card.unreadMessages !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-lg leading-snug">{ws.project_title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{counterparty}</p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{card.lastActivityText}</p>
                      {card.lastActivityAt && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(card.lastActivityAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right space-y-2">
                      <span className="text-xs font-semibold text-teal-700">Open workspace</span>
                      <ArrowRight className="h-5 w-5 text-teal-600 ml-auto" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!showEmpty && hasWorkspaceForBid && (
          <p className="text-center text-xs text-muted-foreground pt-2">
            Tip: You can also open workspaces from My Bids after a client selects your proposal.
          </p>
        )}
      </div>
    </div>
  );
}
