/**
 * Manual localStorage backup/restore — move testing data between origins.
 * Does not change app data architecture; restores keys the app already reads.
 */

import { STORAGE_KEYS } from "@/lib/marketplaceState";

const BACKUP_VERSION = 3;

/** Canonical keys from marketplace + auth/session. */
const EXACT_STORAGE_KEYS = new Set([
  STORAGE_KEYS.bids,
  STORAGE_KEYS.workspaces,
  STORAGE_KEYS.projects,
  STORAGE_KEYS.sessionProEmail,
  STORAGE_KEYS.sessionClientEmail,
  STORAGE_KEYS.schemaVersion,
  STORAGE_KEYS.workflowBackup,
  STORAGE_KEYS.userRole,
  STORAGE_KEYS.myProfile,
  "taxlink_auth_session",
  "taxlink_cloud_session",
  "early_access_signup",
  "taxprouk_early_access_signups",
  "taxprouk_owner_messages",
  "taxprouk_bidder_public_profiles",
  "taxprouk_verified_reviews",
  "saved_profiles",
]);

/** Storage keys whose values are entity arrays merged by `id`. */
const ARRAY_ENTITY_KEYS = {
  [STORAGE_KEYS.bids]: "id",
  [STORAGE_KEYS.workspaces]: "id",
  [STORAGE_KEYS.projects]: "id",
  taxprouk_owner_messages: "id",
  taxprouk_verified_reviews: "id",
  taxprouk_early_access_signups: "id",
};

/**
 * @param {string} key
 * @returns {boolean}
 */
export function isTaxProStorageKey(key) {
  if (!key || typeof key !== "string") return false;
  if (EXACT_STORAGE_KEYS.has(key)) return true;
  const lower = key.toLowerCase();
  if (lower.startsWith("taxprouk_")) return true;
  if (lower.startsWith("taxlink_")) return true;
  if (lower.includes("workspace")) return true;
  if (lower.includes("bid")) return true;
  if (lower.includes("project")) return true;
  return false;
}

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

function recordKey(item, idField) {
  if (!item || typeof item !== "object") return null;
  const id = item[idField] ?? item.project_id ?? item.email;
  return id != null ? String(id) : null;
}

/**
 * Merge entity arrays: keep production rows; add incoming rows only when id is new.
 */
export function mergeRecordsById(existing, incoming, idField = "id") {
  const existingList = Array.isArray(existing) ? existing : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];
  const map = new Map();

  for (const item of existingList) {
    const key = recordKey(item, idField);
    if (key) map.set(key, item);
  }
  for (const item of incomingList) {
    const key = recordKey(item, idField);
    if (!key || map.has(key)) continue;
    map.set(key, item);
  }

  return [...map.values()];
}

function mergeStorageValue(key, existing, incoming, merge) {
  if (!merge) return incoming;

  const idField = ARRAY_ENTITY_KEYS[key];
  if (idField && Array.isArray(existing) && Array.isArray(incoming)) {
    return mergeRecordsById(existing, incoming, idField);
  }

  if (
    existing
    && incoming
    && typeof existing === "object"
    && typeof incoming === "object"
    && !Array.isArray(existing)
    && !Array.isArray(incoming)
  ) {
    return { ...incoming, ...existing };
  }

  if (existing !== null && existing !== undefined) {
    return existing;
  }

  return incoming;
}

/**
 * Unwrap export file shape; fix mistaken single-key dumps.
 * @param {unknown} input
 * @returns {Record<string, unknown>}
 */
export function normalizeBackupPayload(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid backup: expected a JSON object");
  }

  if (input.data && typeof input.data === "object" && !Array.isArray(input.data)) {
    return input.data;
  }

  const mistaken = input["taxpro-backup-import"] ?? input.taxpro_backup_import;
  if (mistaken) {
    return normalizeBackupPayload(mistaken);
  }

  const keys = Object.keys(input);
  const taxProKeys = keys.filter(isTaxProStorageKey);
  if (taxProKeys.length > 0) {
    return input;
  }

  throw new Error(
    "Invalid backup format. Use taxProExportBackup() or export from /dev/data-sync.",
  );
}

/**
 * @returns {{ version: number, exportedAt: string, origin: string, data: Record<string, unknown> }}
 */
export function exportLocalStorageData() {
  const data = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !isTaxProStorageKey(key)) continue;
    data[key] = parseStoredValue(localStorage.getItem(key));
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    origin: typeof window !== "undefined" ? window.location.origin : "",
    data,
  };
}

export function downloadExportedLocalStorageData(filename) {
  const snapshot = exportLocalStorageData();
  const safeOrigin = (snapshot.origin || "local").replace(/[^a-z0-9]+/gi, "-");
  const name = filename || `taxprouk-backup-${safeOrigin}-${snapshot.exportedAt.slice(0, 10)}.json`;
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
 * Restore each app localStorage key from backup payload.
 * @param {unknown} data
 * @param {{ merge?: boolean }} [options]
 */
export function importLocalStorageData(data, options = {}) {
  const { merge = true } = options;
  const payload = normalizeBackupPayload(data);

  let keysWritten = 0;
  const writtenKeys = [];

  for (const [key, incoming] of Object.entries(payload)) {
    if (!isTaxProStorageKey(key) || incoming === undefined) continue;

    const existing = parseStoredValue(localStorage.getItem(key));
    const next = mergeStorageValue(key, existing, incoming, merge);
    localStorage.setItem(key, serializeValue(next));
    keysWritten += 1;
    writtenKeys.push(key);
  }

  localStorage.removeItem("taxpro-backup-import");
  localStorage.removeItem("taxpro_backup_import");

  window.dispatchEvent(
    new CustomEvent("taxpro-data-imported", { detail: { keysWritten, writtenKeys, merge } }),
  );

  return { keysWritten, writtenKeys, merge };
}

/**
 * @param {File | string | Record<string, unknown>} fileData
 * @param {{ merge?: boolean }} [options]
 */
export async function parseImportInput(fileData) {
  if (fileData instanceof File) {
    const text = await fileData.text();
    return JSON.parse(text);
  }
  if (typeof fileData === "string") {
    return JSON.parse(fileData);
  }
  return fileData;
}

/**
 * Full import: parse JSON (file, string, or object) and restore all TaxPro keys.
 * @param {File | string | Record<string, unknown>} fileData
 * @param {{ merge?: boolean }} [options]
 */
export async function taxProImportBackup(fileData, options = {}) {
  const parsed = await parseImportInput(fileData);
  return importLocalStorageData(parsed, { merge: options.merge ?? true, ...options });
}

export function taxProExportBackup(filename) {
  return downloadExportedLocalStorageData(filename);
}

function registerGlobalConsoleHelpers() {
  if (typeof window === "undefined") return;

  window.taxProExportBackup = (filename) => taxProExportBackup(filename);

  window.taxProImportBackup = (fileData, options) => taxProImportBackup(fileData, options);
}

registerGlobalConsoleHelpers();
