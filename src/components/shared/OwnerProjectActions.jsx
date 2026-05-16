import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Pencil, Users, PauseCircle, PlayCircle, XCircle,
  RefreshCw, Copy, Trash2, Save, X, ChevronDown, ChevronUp
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColors = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reviewing: "bg-amber-50 text-amber-700 border-amber-200",
  awarded: "bg-violet-50 text-violet-700 border-violet-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-secondary text-muted-foreground border-border",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels = {
  open: "Open", reviewing: "Reviewing Bids", awarded: "Awarded", paused: "Paused", in_progress: "In Progress",
  completed: "Completed", closed: "Closed", expired: "Expired",
};

const normalizeUrgency = (urgency) => urgency === "flexible" ? "negotiable" : urgency || "";

export default function OwnerProjectActions({ job, onJobUpdated, bidCount }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    description: job.description || "",
    budget_amount: job.budget_amount || "",
    deadline: job.deadline || "",
    urgency: normalizeUrgency(job.urgency),
    required_qualifications: (job.required_qualifications || []).join(", "),
  });

  const update = async (patch) => {
    setSaving(true);
    const updated = await base44.entities.JobPost.update(job.id, patch);
    onJobUpdated(updated);
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    const patch = {
      description: editData.description,
      budget_amount: parseFloat(editData.budget_amount) || job.budget_amount,
      deadline: editData.deadline || null,
      urgency: editData.urgency || null,
      required_qualifications: editData.required_qualifications
        ? editData.required_qualifications.split(",").map(s => s.trim()).filter(Boolean)
        : [],
    };
    await update(patch);
    setEditing(false);
  };

  const handleDuplicate = async () => {
    const { id, created_date, updated_date, created_by, ...rest } = job;
    const copy = { ...rest, title: `Copy of ${job.title}`, status: "open", accepting_bids: true, openForBids: true, _user_posted: true };
    const created = await base44.entities.JobPost.create(copy);
    navigate(`/projects/${created.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this project permanently? This cannot be undone.")) return;
    await base44.entities.JobPost.delete(job.id);
    navigate("/my-projects");
  };

  const status = job.status || "open";

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-5 space-y-4">
      {/* Owner badge + status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Project</span>
        <Badge variant="outline" className={`text-xs ${statusColors[status] || ""}`}>
          {statusLabels[status] || status}
        </Badge>
      </div>

      {/* Bid count summary */}
      <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
        <Users className="h-4 w-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-violet-700">{bidCount} bid{bidCount !== 1 ? "s" : ""} received</span>
      </div>

      {/* Primary actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full gap-2 justify-start" onClick={() => navigate("/my-projects")}>
          <Users className="h-4 w-4" /> View Bids
        </Button>

        <Button variant="outline" className="w-full gap-2 justify-start" onClick={() => setEditing(!editing)}>
          {editing ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editing ? "Cancel Edit" : "Edit Project"}
        </Button>

        {status === "open" && (
          <Button variant="outline" className="w-full gap-2 justify-start text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => update({ status: "paused", accepting_bids: false, openForBids: false })} disabled={saving}>
            <PauseCircle className="h-4 w-4" /> Pause Project
          </Button>
        )}
        {status === "paused" && (
          <Button variant="outline" className="w-full gap-2 justify-start text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => update({ status: "open", accepting_bids: true, openForBids: true })} disabled={saving}>
            <PlayCircle className="h-4 w-4" /> Resume Project
          </Button>
        )}
        {(status === "open" || status === "paused") && (
          <Button variant="outline" className="w-full gap-2 justify-start text-muted-foreground"
            onClick={() => update({ status: "closed", accepting_bids: false, openForBids: false })} disabled={saving}>
            <XCircle className="h-4 w-4" /> Close Project
          </Button>
        )}
        {(status === "closed" || status === "expired") && (
          <Button variant="outline" className="w-full gap-2 justify-start text-primary border-primary/30 hover:bg-primary/5"
            onClick={() => update({ status: "open", accepting_bids: true, openForBids: true })} disabled={saving}>
            <RefreshCw className="h-4 w-4" /> Repost Project
          </Button>
        )}

        <Button variant="outline" className="w-full gap-2 justify-start" onClick={handleDuplicate} disabled={saving}>
          <Copy className="h-4 w-4" /> Duplicate Project
        </Button>

        <Button variant="outline" className="w-full gap-2 justify-start text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleDelete} disabled={saving}>
          <Trash2 className="h-4 w-4" /> Delete Project
        </Button>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-border/60 pt-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Edit Details</p>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea rows={4} value={editData.description}
              onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
              className="text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Budget (£)</label>
              <Input type="number" value={editData.budget_amount}
                onChange={e => setEditData(p => ({ ...p, budget_amount: e.target.value }))}
                className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
              <Input type="date" value={editData.deadline}
                onChange={e => setEditData(p => ({ ...p, deadline: e.target.value }))}
                className="text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Urgency</label>
            <select value={editData.urgency}
              onChange={e => setEditData(p => ({ ...p, urgency: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">— select —</option>
              <option value="negotiable">Negotiable</option>
              <option value="standard">Standard</option>
              <option value="urgent">Urgent</option>
              <option value="asap">ASAP</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Required Qualifications (comma-separated)</label>
            <Input value={editData.required_qualifications}
              onChange={e => setEditData(p => ({ ...p, required_qualifications: e.target.value }))}
              placeholder="ACA, ACCA, CTA" className="text-sm" />
          </div>

          <Button className="w-full gap-2" onClick={handleSaveEdit} disabled={saving}>
            {saving ? "Saving…" : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      )}
    </div>
  );
}