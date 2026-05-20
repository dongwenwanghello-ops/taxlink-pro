import React, { useRef, useState } from "react";
import { Upload, FileText, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MAX_FILE_BYTES } from "@/lib/workspaceStore";
import { getDocumentChecklist } from "@/lib/workspaceGuidance";
import { cn } from "@/lib/utils";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function WorkspaceFiles({
  files = [],
  projectCategory,
  onUpload,
  onRequestDocs,
  onMarkReviewed,
  userRole,
  disabled,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const checklist = getDocumentChecklist(projectCategory);

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file || disabled) return;
    setError("");
    setUploading(true);
    const result = await onUpload(file);
    if (result?.error) setError(result.error);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Documents</h3>
        </div>
        <span className="text-[11px] text-slate-500">Max {Math.round(MAX_FILE_BYTES / 1024)}KB per file</span>
      </div>

      {userRole === "client" && checklist.length > 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">Suggested uploads</p>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            {checklist.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {userRole === "client" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload document"}
          </Button>
        )}
        {userRole === "professional" && (
          <>
            <Button type="button" size="sm" variant="ghost" className="text-xs" disabled={disabled} onClick={onRequestDocs}>
              Request documents
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload deliverable
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {files.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            {userRole === "client"
              ? "Upload bank statements, invoices, payroll reports, VAT records, and supporting documents."
              : "Client documents will appear here once uploaded."}
          </p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  {file.uploaded_by_name} · {formatBytes(file.size)} ·{" "}
                  {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                </p>
                {file.reviewed_by_professional && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Reviewed
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {file.data_url && (
                  <a
                    href={file.data_url}
                    download={file.name}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
                {userRole === "professional" && !file.reviewed_by_professional && file.uploaded_by_role === "client" && (
                  <button
                    type="button"
                    onClick={() => onMarkReviewed?.(file.id)}
                    className="text-[10px] font-semibold text-slate-600 hover:text-teal-700 text-left"
                  >
                    Mark reviewed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
