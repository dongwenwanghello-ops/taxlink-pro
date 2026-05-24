import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  downloadExportedLocalStorageData,
  taxProImportBackup,
  exportLocalStorageData,
} from "@/lib/localStorageBackup";
import { reconcileMarketplaceState } from "@/lib/marketplaceState";

export default function DataSyncSettings() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [merge, setMerge] = useState(true);

  const handleExport = () => {
    const snapshot = downloadExportedLocalStorageData();
    toast({
      title: "Export started",
      description: `Saved ${Object.keys(snapshot.data).length} keys to JSON.`,
    });
  };

  const handleImport = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const result = await taxProImportBackup(file, { merge });
      try {
        reconcileMarketplaceState({ skipBackup: true });
      } catch (err) {
        console.warn("[data-sync] reconcile after import", err);
      }
      toast({
        title: "Import completed",
        description: `Restored ${result.keysWritten} localStorage keys. Refreshing…`,
      });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast({
        title: "Import failed",
        description: err?.message || "Could not parse backup file.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const keyCount = Object.keys(exportLocalStorageData().data).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Database className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Data sync</h1>
            <p className="text-sm text-muted-foreground">Manual localStorage backup (dev / staging)</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-8">
          Export testing data from localhost, then import the JSON on production. This restores
          projects, bids, workspaces, workflow, and session keys — not a database migration.
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Export data</p>
            <p className="text-xs text-muted-foreground mb-3">
              {keyCount} TaxProUK keys on this origin
            </p>
            <Button type="button" className="rounded-xl gap-2 w-full sm:w-auto" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-sm font-semibold text-foreground mb-1">Import data</p>
            <p className="text-xs text-muted-foreground mb-3">
              Upload a backup file from another environment
            </p>
            <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={merge}
                onChange={(e) => setMerge(e.target.checked)}
                className="rounded border-border"
              />
              Merge with existing data (keep production records when IDs clash)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 w-full sm:w-auto"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? "Importing…" : "Upload JSON"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Console: <code className="text-foreground">taxProExportBackup()</code>
          {" · "}
          <code className="text-foreground">taxProImportBackup(json, {"{ merge: true }"})</code>
        </p>
      </div>
    </div>
  );
}
