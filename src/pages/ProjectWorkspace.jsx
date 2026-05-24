import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, ShieldCheck, Banknote, Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DEMO_JOBS } from "@/lib/demoData";
import { getPostedProjects, updateProject } from "@/lib/projectStore";
import { getBidsForProject } from "@/lib/bidStore";
import { enrichBidIdentity } from "@/lib/professionalIdentity";
import { resolveWorkspaceUser } from "@/lib/workspacePageUtils";
import { useMarketplaceWorkflow } from "@/lib/MarketplaceWorkflowContext";
import {
  resolveWorkspaceUserRole,
  getSessionProfessionalEmail,
  resolveWorkspaceActor,
} from "@/lib/workspaceAccess";
import {
  getWorkspaceByProjectId,
  updateWorkspaceStatus,
  addWorkspaceMessage,
  addWorkspaceFile,
  requestAdditionalDocuments,
  professionalMarkWorkComplete,
  clientConfirmCompletion,
  addProgressUpdate,
  markFileReviewed,
  submitWorkspaceReview,
  WORKFLOW_STATUSES,
  MESSAGE_TYPES,
} from "@/lib/workspaceStore";
import { normalizeWorkflowStatus } from "@/lib/workspaceGuidance";
import WorkspaceStatusTracker from "@/components/workspace/WorkspaceStatusTracker";
import WorkspaceMessages from "@/components/workspace/WorkspaceMessages";
import WorkspaceFiles from "@/components/workspace/WorkspaceFiles";
import WorkspaceTimeline from "@/components/workspace/WorkspaceTimeline";
import WorkspaceNextStepBanner from "@/components/workspace/WorkspaceNextStepBanner";
import WorkspaceProgressPanel from "@/components/workspace/WorkspaceProgressPanel";
import WorkspaceCompletionPanel from "@/components/workspace/WorkspaceCompletionPanel";
import WorkspaceMutualReviews from "@/components/workspace/WorkspaceMutualReviews";
import RecurringWorkSuggestions from "@/components/workspace/RecurringWorkSuggestions";
import { RevealedProfessionalContact } from "@/components/shared/ProtectedProfessionalIdentity";
import { IDENTITY_REVEAL_WORKSPACE_MESSAGE } from "@/lib/professionalIdentity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { refresh } = useMarketplaceWorkflow();
  const { toast } = useToast();
  const filesRef = useRef(null);
  const messagesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const refreshWorkspace = useCallback(() => {
    const ws = getWorkspaceByProjectId(projectId);
    if (ws) setWorkspace({ ...ws });
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { user: me } = await resolveWorkspaceUser();
        setUser(me);
        if (me?.email) {
          refresh();
        }

        let job =
          DEMO_JOBS.find((j) => j.id === projectId)
          || getPostedProjects().find((j) => j.id === projectId);
        if (!job) {
          try {
            job = await base44.entities.JobPost.get(projectId);
          } catch {
            job = null;
          }
        }
        setProject(job);

        const bids = getBidsForProject(projectId);
        let accepted = bids.find((b) => b.status === "accepted" || b.awarded);
        if (!accepted && job?.awarded_bid_id) {
          accepted = bids.find((b) => b.id === job.awarded_bid_id);
        }
        if (!accepted && projectId === "demo-project-selected") {
          accepted = {
            id: "demo-selected",
            project_id: projectId,
            project_title: job?.title || "HMRC Enquiry Support — Director",
            status: "accepted",
            awarded: true,
            bidder_email: getSessionProfessionalEmail() || "demo-professional@taxprouk.local",
          };
        }

        const ws = getWorkspaceByProjectId(projectId);
        if (ws) {
          const enrichedAccepted = accepted ? enrichBidIdentity(accepted) : null;
          const role = resolveWorkspaceUserRole({
            workspace: ws,
            project: job,
            user: me,
            winningBid: enrichedAccepted,
          });
          setUserRole(role);
        } else {
          setUserRole(null);
        }
        setWorkspace(ws);
      } catch (err) {
        console.warn("[ProjectWorkspace] load failed", err);
        setWorkspace(getWorkspaceByProjectId(projectId));
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    load();
    const onUpdate = () => refreshWorkspace();
    window.addEventListener("workspaceUpdated", onUpdate);
    window.addEventListener("workspaceCreated", onUpdate);
    window.addEventListener("workspaceCompleted", onUpdate);
    return () => {
      window.removeEventListener("workspaceUpdated", onUpdate);
      window.removeEventListener("workspaceCreated", onUpdate);
      window.removeEventListener("workspaceCompleted", onUpdate);
    };
  }, [projectId, refreshWorkspace]);

  const isFullyComplete =
    workspace?.completion_phase === "completed" || workspace?.workflow_status === "completed";
  const statusId = normalizeWorkflowStatus(workspace?.workflow_status);
  const statusLabel = WORKFLOW_STATUSES.find((s) => s.id === statusId)?.label;

  const handleGuidedAction = (action) => {
    if (action === "upload") filesRef.current?.querySelector("button")?.click();
    if (action === "message" || action === "request_docs") messagesRef.current?.scrollIntoView({ behavior: "smooth" });
    if (action === "request_docs") handleRequestDocs();
    if (action === "confirm_completion") handleClientConfirm();
    if (action === "mark_complete") handleProfessionalComplete();
    if (action === "review") messagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStatusChange = (status) => {
    const updated = updateWorkspaceStatus(projectId, status, {
      actorRole: userRole,
      actorName: user?.full_name || user?.email || "User",
    });
    if (updated) {
      setWorkspace(updated);
      toast({ title: "Status updated", description: WORKFLOW_STATUSES.find((s) => s.id === status)?.label });
    }
  };

  const handleSendMessage = async (body, messageType) => {
    if (!userRole || !body?.trim()) {
      throw new Error("Cannot send message");
    }
    const actor = resolveWorkspaceActor({ user, userRole, workspace });
    const updated = addWorkspaceMessage(projectId, {
      senderRole: userRole,
      senderName: actor.name,
      senderEmail: actor.email,
      body,
      messageType: messageType || "general",
    });
    if (!updated) {
      throw new Error("Workspace message not saved");
    }
    refreshWorkspace();
    toast({ title: "Message sent" });
  };

  const handleUpload = async (file) => {
    const actor = resolveWorkspaceActor({ user, userRole, workspace });
    const result = await addWorkspaceFile(projectId, {
      file,
      uploaderRole: userRole,
      uploaderName: actor.name,
      uploaderEmail: actor.email,
    });
    refreshWorkspace();
    if (!result?.error) toast({ title: "Document uploaded", description: file.name });
    return result;
  };

  const handleRequestDocs = () => {
    const type = MESSAGE_TYPES.find((t) => t.id === "document_request");
    const text = "Please upload the required documents (bank statements, invoices, and supporting records) so I can proceed.";
    requestAdditionalDocuments(projectId, {
      actorRole: userRole,
      actorName: user?.full_name || "Professional",
      requestText: text,
    });
    const actor = resolveWorkspaceActor({ user, userRole, workspace });
    addWorkspaceMessage(projectId, {
      senderRole: userRole,
      senderName: actor.name,
      senderEmail: actor.email,
      body: text,
      messageType: "document_request",
    });
    refreshWorkspace();
    toast({ title: "Document request sent", description: "Client notified in messages and timeline." });
  };

  const handleAddProgress = (milestoneId, note) => {
    addProgressUpdate(projectId, {
      milestoneId,
      note,
      actorName: user?.full_name || user.email,
      actorRole: userRole,
    });
    refreshWorkspace();
    toast({ title: "Progress updated" });
  };

  const handleMarkReviewed = (fileId) => {
    markFileReviewed(projectId, fileId, { actorName: user?.full_name || user.email });
    refreshWorkspace();
  };

  const handleProfessionalComplete = () => {
    if (!window.confirm("Mark your work as complete? The client will be asked to confirm.")) return;
    const updated = professionalMarkWorkComplete(projectId, { actorName: user?.full_name || user.email });
    if (updated) {
      setWorkspace(updated);
      toast({ title: "Awaiting client confirmation", description: "The client will confirm satisfactory completion." });
    }
  };

  const handleClientConfirm = async () => {
    if (!window.confirm("Confirm the work was completed to your satisfaction? This unlocks reviews for both parties.")) return;
    const updated = clientConfirmCompletion(projectId, { actorName: user?.full_name || user.email });
    if (updated) {
      setProject((p) => p ? { ...p, status: "completed", lifecycle_state: "completed", review_available: true } : p);
      updateProject(projectId, {
        status: "completed",
        lifecycle_state: "completed",
        completed_at: new Date().toISOString(),
        review_available: true,
      });
      try {
        await base44.entities.JobPost.update(projectId, {
          status: "completed",
          lifecycle_state: "completed",
        });
      } catch {
        /* local saved */
      }
      setWorkspace(updated);
      window.dispatchEvent(new CustomEvent("projectCompleted", { detail: { projectId } }));
      toast({ title: "Project completed", description: "You can now leave a verified review." });
    }
  };

  const handleSubmitReview = ({ rating, tags, comment }) => {
    const updated = submitWorkspaceReview(projectId, {
      reviewerRole: userRole,
      reviewerName: user?.full_name || user.email,
      rating,
      tags,
      comment,
    });
    if (updated) {
      setWorkspace(updated);
      toast({ title: "Review submitted", description: "Thank you for your feedback." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Workspace not available</h2>
          <p className="text-sm text-muted-foreground mb-6">
            A workspace opens automatically when a client accepts a professional&apos;s quote.
          </p>
          <Link to="/my-projects">
            <Button className="rounded-xl">Back to My Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldCheck className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access restricted</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Only the client and selected professional can access this workspace.
          </p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl">Go home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link
            to={userRole === "client" ? "/my-projects" : "/my-bids"}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {userRole === "client" ? "My Projects" : "My Bids"}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-teal-50 text-teal-800 border-teal-200">Collaboration workspace</Badge>
                {statusLabel && <Badge variant="outline">{statusLabel}</Badge>}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">{workspace.project_title}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                <Users className="h-4 w-4" />
                <span>{workspace.client_name}</span>
                <span className="text-slate-300">·</span>
                <span>{workspace.professional_name}</span>
              </div>
            </div>
            {workspace.awarded_amount && (
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agreed quote</p>
                <p className="text-2xl font-extrabold text-primary">£{Number(workspace.awarded_amount).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-900">
            <Banknote className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{workspace.payment_note}</p>
          </div>

          {userRole === "client" && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] text-teal-800">{IDENTITY_REVEAL_WORKSPACE_MESSAGE}</p>
              <RevealedProfessionalContact
                bid={{
                  bidder_full_name: workspace.professional_name,
                  bidder_email: workspace.professional_email,
                  bidder_phone: workspace.professional_phone,
                  bidder_firm_name: workspace.professional_firm,
                  bidder_linkedin: workspace.professional_linkedin,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <WorkspaceNextStepBanner workspace={workspace} userRole={userRole} onAction={handleGuidedAction} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <WorkspaceStatusTracker
              currentStatus={statusId}
              onStatusChange={handleStatusChange}
              canUpdate={!isFullyComplete && userRole === "professional"}
            />
            <WorkspaceProgressPanel
              progressUpdates={workspace.progress_updates || []}
              userRole={userRole}
              onAddProgress={handleAddProgress}
              disabled={isFullyComplete}
            />
            <WorkspaceCompletionPanel
              workspace={workspace}
              userRole={userRole}
              onProfessionalComplete={handleProfessionalComplete}
              onClientConfirm={handleClientConfirm}
              disabled={isFullyComplete}
            />
            <WorkspaceTimeline activities={workspace.activities || []} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div ref={filesRef}>
              <WorkspaceFiles
                files={workspace.files || []}
                projectCategory={workspace.project_category}
                userRole={userRole}
                onUpload={handleUpload}
                onRequestDocs={handleRequestDocs}
                onMarkReviewed={handleMarkReviewed}
                disabled={isFullyComplete}
              />
            </div>
            <div ref={messagesRef}>
              <WorkspaceMessages
                messages={workspace.messages || []}
                userRole={userRole}
                onSend={handleSendMessage}
                disabled={isFullyComplete}
                canSend={Boolean(userRole) && !isFullyComplete}
              />
            </div>
            <WorkspaceMutualReviews
              workspace={workspace}
              userRole={userRole}
              onSubmitReview={handleSubmitReview}
            />
            <RecurringWorkSuggestions workspace={workspace} />
          </div>
        </div>
      </div>
    </div>
  );
}

