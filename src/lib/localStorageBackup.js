/**
 * TaxPro UK — localStorage export / import for manual environment sync.
 *
 * Typical flow (localhost → production):
 * 1. On localhost: `taxProExportBackup()` — downloads JSON
 * 2. On production: `taxProImportBackup(file, { merge: false })` — paste/upload JSON
 * 3. Hard refresh the app
 *
 * Dev console helpers (import this module in Vite devtools or expose via window):
 *   taxProExportBackup()
 *   taxProImportBackup(jsonObject, { merge: true })
 */

const BACKUP_VERSION = 1;

/** Keys used by marketplace workflow (for filtered export). */
export const TAXPRO_STORAGE_PREFIXES = ["taxprouk_", "taxlink_", "my_profile", "user_role", "early_access", "saved_profiles"];

function parseStoredValue(raw) {
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function serializeValue(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/**
 * @param {{ taxProOnly?: boolean }} options
 * @returns {{ version: number, exportedAt: string, origin: string, taxProOnly: boolean, data: Record<string, unknown> }}
 */
export function exportLocalStorageSnapshot(options = {}) {
  const { taxProOnly = false } = options;
  const data = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (taxProOnly && !TAXPRO_STORAGE_PREFIXES.some((p) => key.startsWith(p) || key === p)) {
      continue;
    }
    data[key] = parseStoredValue(localStorage.getItem(key));
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    origin: typeof window !== "undefined" ? window.location.origin : "",
    taxProOnly,
    data,
  };
}

/**
 * @param {Record<string, unknown> | { data: Record<string, unknown> }} snapshot
 * @param {{ merge?: boolean, taxProOnly?: boolean }} options — merge: keep keys not in snapshot; replace: clear first
 */
export function importLocalStorageSnapshot(snapshot, options = {}) {
  const { merge = true, taxProOnly = false } = options;
  const payload = snapshot?.data && typeof snapshot.data === "object" ? snapshot.data : snapshot;

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid backup: expected { data: { ... } } or a flat key map");
  }

  if (!merge) {
    if (taxProOnly) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && TAXPRO_STORAGE_PREFIXES.some((p) => key.startsWith(p) || key === p)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } else {
      localStorage.clear();
    }
  }

  let imported = 0;
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    localStorage.setItem(key, serializeValue(value));
    imported += 1;
  }

  return { imported, merge, taxProOnly };
}

/** Trigger browser download of full localStorage backup. */
export function downloadLocalStorageBackup(filename) {
  const snapshot = exportLocalStorageSnapshot({ taxProOnly: false });
  const name =
    filename
    || `taxprouk-backup-${snapshot.origin.replace(/[^a-z0-9]+/gi, "-")}-${snapshot.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
  return snapshot;
}

/** TaxPro workflow keys only (smaller file for prod sync). */
export function downloadTaxProWorkflowBackup(filename) {
  const snapshot = exportLocalStorageSnapshot({ taxProOnly: true });
  const name = filename || `taxprouk-workflow-${snapshot.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
  return snapshot;
}

/**
 * Import from a File (e.g. <input type="file">) or parsed JSON object.
 * @param {File | object} source
 * @param {{ merge?: boolean, taxProOnly?: boolean }} options
 */
export async function importLocalStorageFromFile(source, options = {}) {
  let snapshot;
  if (source instanceof File) {
    const text = await source.text();
    snapshot = JSON.parse(text);
  } else {
    snapshot = source;
  }
  return importLocalStorageSnapshot(snapshot, options);
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.taxProExportBackup = () => downloadTaxProWorkflowBackup();
  window.taxProExportAllLocalStorage = () => downloadLocalStorageBackup();
  window.taxProImportBackup = (json, opts) => importLocalStorageSnapshot(json, { merge: false, taxProOnly: true, ...opts });
}
