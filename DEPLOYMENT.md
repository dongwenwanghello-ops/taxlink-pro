# Deployment & environment parity

TaxPro UK is a **single Vite build** deployed to Vercel (`src/vercel.json`). Dev, preview, and production run the **same JavaScript bundle** after each deploy to `main`.

## Why live can look “behind” localhost

1. **Code not deployed** — fixes must be committed and pushed to `origin/main` (Vercel rebuilds from Git).
2. **Separate browser storage** — `localStorage` is per origin. Data saved on `localhost:5173` does **not** appear on `*.vercel.app` or your custom domain. Awards, bids, and workspaces must be created again on live (or use the same browser profile only on live).
3. **Base44 API** — set `VITE_BASE44_APP_ID` (and related env vars) in the Vercel project so live API calls match dev.

## Workflow data keys (local MVP)

| Key | Purpose |
|-----|---------|
| `taxprouk_bids` | Submitted bids |
| `taxprouk_workspaces` | Collaboration workspaces |
| `taxprouk_ws_access_{projectId}` | Access grants |
| `taxprouk_professional_email` | Session professional identity |
| `taxprouk_bidder_public_profiles` | Bid-linked profile cache |
| Posted projects store | See `projectStore.js` |

## After deploy

1. Hard refresh live (Ctrl+Shift+R) or open in a private window.
2. Re-run one award flow on live to populate workspace + permissions on that origin.
3. Confirm navbar routes: `/workspaces`, `/workspace/:projectId`, `/professionals/bid/:bidId`, `/my-projects/:projectId`.

## Marketplace state integrity (before deploying)

Do **not** push workflow migrations until local reconcile passes.

1. Open devtools on the target origin and run: `reconcileMarketplaceState()` is invoked on app load via `workflowBootstrap.js`.
2. Schema migrations auto-backup to `taxprouk_workflow_backup` (last 5 snapshots per origin).
3. Orphan audit logs appear in the console as `[marketplace-reconcile]` when inconsistencies exist.
4. All workspace sync runs only inside `reconcileMarketplaceState()` (`workflowSync.js`); pages use `getProjectWorkflowBundle()` or `useMarketplaceWorkflow()`.

| Key | Purpose |
|-----|---------|
| `taxprouk_workflow_schema_version` | Reconcile schema (currently `2`) |
| `taxprouk_workflow_backup` | Pre-migration localStorage backups |

## Deploy checklist

```bash
npm run build
# Verify award → /workspaces → /workspace/:id locally first
git push origin main
```

Vercel will rebuild automatically if the repo is connected.
