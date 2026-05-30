# TaxLink — Permission Matrix Implementation Audit

**Status:** Documentation only (read-only review)  
**Date:** May 2026  
**Baseline:** [taxlink-permission-matrix.md](./taxlink-permission-matrix.md) · [current-architecture.md](./current-architecture.md)

This document compares the **as-built SPA** against the **target permission matrix**. Findings are grouped into security gaps, permission gaps, wrong-role route access, workspace issues, and bid visibility issues. Severity uses **Critical / High / Medium / Low**.

---

## Executive summary

| Category | Critical | High | Medium | Low |
|----------|:--------:|:----:|:------:|:---:|
| Security gaps | 2 | 4 | 3 | 2 |
| Permission gaps | 0 | 3 | 6 | 4 |
| Wrong-role routes | 0 | 2 | 5 | 2 |
| Workspace access | 0 | 2 | 4 | 1 |
| Bid visibility | 0 | 2 | 4 | 2 |

**Root cause (all areas):** Permissions are enforced only in React UI and `localStorage` helpers. There is **no server**, **no route-level RBAC**, and **`ProtectedRoute` is not wired** in `src/App.jsx`. Any motivated user can bypass UI gates via DevTools, direct URLs, or crafted `localStorage`.

---

## 1. Security gaps

Security gaps are issues that expose data, allow unauthorized state changes, or break trust boundaries regardless of intended UX.

### 1.1 Critical

| ID | Finding | Evidence | Matrix expectation |
|----|---------|----------|-------------------|
| **SEC-01** | **`/admin` has no authentication or role check** | `AdminDashboard.jsx` loads `User.list`, all projects, bids, workspaces on mount; `App.jsx` registers route with no guard | **Admin** only — View |
| **SEC-02** | **Anyone with `/project-owner-bids/:id` can shortlist, contact, and award** | `ProjectOwnerBids.jsx` loads project + bids; `executeAward` runs with no `created_by === user.email` check | **Client** owner — View, Edit (award) |

**Impact:** A guest (or any role) on a shared/demo browser can award contracts, reject all other bids, create workspaces, and read PII from admin tables (emails, signup dates, activity counts).

### 1.2 High

| ID | Finding | Evidence | Matrix expectation |
|----|---------|----------|-------------------|
| **SEC-03** | **All marketplace mutations are client-trusted** | `projectStore`, `bidStore`, `workspaceStore` write directly to `localStorage`; no API ACL | Server-enforced CRUD |
| **SEC-04** | **`/dev/data-sync` is a public route** | `DataSyncSettings.jsx` — export/import full `localStorage` backup; no role or env gate in router | Admin / dev only |
| **SEC-05** | **Import can replace entire marketplace state** | `taxProImportBackup` + `reconcileMarketplaceState` after import | Restricted backup/restore |
| **SEC-06** | **Early-access signup store readable via admin and entity layer** | `entityStore.collectUsers()` merges `taxprouk_early_access_signups`, `my_profile`, auth session | Admin View only; PII protected |

### 1.3 Medium

| ID | Finding | Evidence | Matrix expectation |
|----|---------|----------|-------------------|
| **SEC-07** | **`ProtectedRoute` exists but is unused** | `src/components/ProtectedRoute.jsx` vs `App.jsx` (all routes under `AppLayout` only) | Route guards per matrix |
| **SEC-08** | **No `admin` role in auth model** | `auth.js` roles: `professional` \| `client` from onboarding | Admin role in matrix |
| **SEC-09** | **`reconcileMarketplaceState()` can widen access without login** | Repairs workspaces, grants, bid/project alignment on load and manual refresh | Membership only via verified identity |

### 1.4 Low

| ID | Finding | Evidence | Matrix expectation |
|----|---------|----------|-------------------|
| **SEC-10** | **Workspace store functions do not verify membership** | `addWorkspaceMessage`, `addWorkspaceFile`, `updateWorkspaceStatus` only check workspace exists | Member-only mutations |
| **SEC-11** | **Bidder profile cache is world-readable in-browser** | `taxprouk_bidder_public_profiles` in `localStorage` | Scoped to owner review flow |

**Remediation theme:** Server-side auth, route guards, owner checks on award flows, hide `/admin` and `/dev/data-sync` behind Admin + non-production, and validate workspace mutations against membership server-side.

---

## 2. Permission gaps

Permission gaps are cases where the matrix defines a rule, but the implementation does not enforce it (or enforces it inconsistently).

### 2.1 High

| ID | Finding | Matrix rule | Actual behavior |
|----|---------|-------------|-----------------|
| **PERM-01** | **Review submission not tied to project owner** | **Client** creates review for **own** completed project | `Reviews.jsx` → `getReviewEligibleProjects()` filters by project status only; no `created_by === session.email`. Any browser with completed local projects can submit as `"Verified client"` |
| **PERM-02** | **Clients can submit bids** | **Professional** only — bid **Create** | `ProjectDetail.jsx`: bid CTA for all `!isOwner` users; `BidModal` does not check `user_role`. Clients see “Send Quick Quote” on others’ projects |
| **PERM-03** | **Professionals can post projects** | **Client** only — `/post-job` **Create** | `PostJob.jsx` has no role gate; navbar shows “Post a Project” to all roles |

### 2.2 Medium

| ID | Finding | Matrix rule | Actual behavior |
|----|---------|-------------|-----------------|
| **PERM-04** | **`/my-projects` not scoped to client role** | **Client** View **Own**; **Professional** No | Page is reachable by all; filters by `created_by` only when `auth.me()` succeeds; on failure uses **all** `getPostedProjects()` |
| **PERM-05** | **`/my-bids` not scoped to professional role** | **Professional** View **Own**; **Client** No | No role check; guests get demo bids via `loadMyBidsDisplay` |
| **PERM-06** | **Owner project edit/delete not gated by session** | **Own** client only | `OwnerProjectActions` shown when `isOwner` on `ProjectDetail`; `isOwner` requires `auth.me()` — if that fails, owner panel hidden but **owner URL paths still work** (SEC-02) |
| **PERM-07** | **Admin role not implemented** | **Admin** capabilities throughout | No admin identity; `/admin` behaves as guest-accessible |
| **PERM-08** | **V1 routes not implemented** | Lounge: pro only; Resources: public | N/A today — future permission work |

### 2.3 Low

| ID | Finding | Matrix rule | Actual behavior |
|----|---------|-------------|-----------------|
| **PERM-09** | **`/my-profile` is professional-centric** | Client: Cond | Clients can open page; copy assumes professional profile |
| **PERM-10** | **No bid delete / edit lifecycle enforcement** | **Own** bidder while pending | Not exposed; matrix delete not implemented |
| **PERM-11** | **Feedback widget** | Open create | No role restriction (acceptable if intentional) |
| **PERM-12** | **Onboarding allows role re-selection** | Create once | `/create-profile` always available; can overwrite `user_role` |

---

## 3. Routes accessible by the wrong roles

Router: `src/App.jsx` — no per-route role middleware. Table lists **who can load the route** and **what they can do** vs matrix.

| Route | Matrix (View) | Guest (actual) | Professional (actual) | Client (actual) | Gap |
|-------|---------------|----------------|-------------------------|-----------------|-----|
| `/admin` | Admin | **Full dashboard** | **Full** | **Full** | **SEC-01** — all roles |
| `/project-owner-bids/:id` | Client owner | **Manage + award** | **Manage + award** | **Manage + award*** | **SEC-02** — *even non-owners |
| `/post-job` | Client (+ create) | Post | **Post** | Post | **PERM-03** — pro/guest |
| `/my-projects` | Client own | All local projects** | **Full page** | Filtered own | **PERM-04** — pro/guest |
| `/my-bids` | Pro own | Demo + bids*** | Filtered/demo | **Full page** | **PERM-05** — client/guest |
| `/my-profile` | Pro own | Empty CTA | View/edit local | View (odd UX) | **PERM-09** |
| `/dev/data-sync` | Admin/dev | Import/export | Same | Same | **SEC-04** |
| `/workspaces` | Members | List† | List† | List† | **WS-01** — over-broad list |
| `/workspace/:projectId` | Members | Restricted UI‡ | Member UI if role resolved | Member UI | Route loads for all; **WS-02** |
| `/project/:id` | All | View; bid if !owner | View; **bid** | View; **bid on others’ jobs** | **PERM-02** |
| `/professionals/bid/:bidId` | All (public) | View if `bidId` known | View | View | OK for matrix; bid enumeration risk |
| `/reviews` | All | View; **submit** if eligible projects exist | Same | Same | **PERM-01** |
| `/create-profile` | All | Create | Create (role switch) | Create | By design; weak account binding |

\* No `created_by` verification.  
\** When `auth.me()` fails, `MyProjects` uses unfiltered `getPostedProjects()`.  
\*** `filterBidsForProfessional` includes bids with **empty** `bidder_email` when email filter is active.  
† See workspace section — `getAccessibleWorkspacesForUser` over-includes.  
‡ Non-members see workspace metadata shell + “Access restricted” (no redirect).

### 3.1 Broken / misleading navigation (access-adjacent)

| Issue | Location | Effect |
|-------|----------|--------|
| Compare bids link | `ProjectDetail.jsx` → `/my-projects/${job.id}` | Route **not defined** in `App.jsx` (likely 404). Owner flow should use `/project-owner-bids/:id` or inline my-projects expand |

---

## 4. Workspace access issues

### 4.1 High

| ID | Finding | Detail |
|----|---------|--------|
| **WS-01** | **Workspace list leaks non-member workspaces** | In `getAccessibleWorkspacesForUser` (`marketplaceState.js`): when building `selectedBids`, `if (!identities.length) return true` includes **every** selected bid in the store. `linkedProjectIds` then matches **any** workspace with those `project_id`s. User with empty email / guest session can see **other users’** awarded workspaces on `/workspaces` if local data exists |
| **WS-02** | **Non-members can load `/workspace/:projectId`** | `ProjectWorkspace.jsx` renders “Access restricted” but does not redirect; workspace title, client/pro names, agreed quote may render in header before role check in some load orders — primary leak is **list + localStorage** (WS-01) |

### 4.2 Medium

| ID | Finding | Detail |
|----|---------|--------|
| **WS-03** | **`resolveWorkspaceUserRole` grants professional without user** | Lines 278–280: single winning bid + no `user.email` + no session → returns `"professional"`. Edge case for demo; weak in shared-browser scenarios |
| **WS-04** | **`getSessionProfessionalEmail()` can grant pro access** | Session key `taxprouk_professional_email` set on award (`awardWorkflow`) — any tab with that key may resolve as professional |
| **WS-05** | **`hasStoredLocalIdentity` is very permissive** | `user_role` alone satisfies identity on `/workspaces` — suppresses cloud-expired banner and enables local list fallbacks without verified email |
| **WS-06** | **DEV-only role fallback in production builds** | `resolveDevLocalWorkspaceRoleFallback` disabled when `!import.meta.env.DEV` — OK in prod, but dev builds can mask membership bugs |

### 4.3 Low

| ID | Finding | Detail |
|----|---------|--------|
| **WS-07** | **Demo workspaces always visible to professionals** | `demo-project-*` ids included when `effectiveRole === "professional"` |
| **WS-08** | **Workspace mutations lack role checks in store layer** | UI passes `userRole`; direct `localStorage` edits bypass UI |

### 4.4 Workspace feature vs matrix (when `userRole` is resolved)

| Feature | Matrix | Implemented | Gap |
|---------|--------|-------------|-----|
| Status tracker Edit | Pro member | `canUpdate={userRole === "professional"}` | Aligned |
| Confirm completion | Client member | `handleClientConfirm` + panel | Aligned |
| Messages / files Create | Both members | Blocked if `!userRole` | Aligned in UI only (**SEC-10** at store layer) |
| View workspace | Member only | Non-member blocked in UI | List route still leaks (**WS-01**) |

---

## 5. Bid visibility issues

### 5.1 High

| ID | Finding | Detail |
|----|---------|--------|
| **BID-01** | **Owner bid review page is public** | `ProjectOwnerBids.jsx` loads `getBidsForProject(projectId)` + entity filter for **all** bids on project — no owner gate. Competitors or guests see proposals, amounts, masked identities |
| **BID-02** | **`MyProjects` loads all bids into state** | `loadBids()` calls `base44.entities.Bid.list` (entire store) merged with `getAllBids()`. UI filters per project, but **all bid records** exist client-side (DevTools, extensions) |

### 5.2 Medium

| ID | Finding | Detail |
|----|---------|--------|
| **BID-03** | **`filterBidsForProfessional` leaks unassigned bids** | `myBidsLoader.js`: if `!bidderEmail` → `return true` when filtering by email — bids without email appear for logged-in professionals |
| **BID-04** | **`getAcceptedBidsForUser` with empty email** | `if (!normalized) return true` in filter — all selected bids returned |
| **BID-05** | **Bidder public profile by `bidId` only** | `resolveBidderPublicProfile(bidId)` reads any bid from `getAllBids()` — URL guessing exposes bid-backed profile cards (identity masking depends on `isBidIdentityRevealed`) |
| **BID-06** | **Project detail shows bid count to everyone** | Public signal of competition; usually acceptable but not in matrix as explicit rule |

### 5.3 Low

| ID | Finding | Detail |
|----|---------|--------|
| **BID-07** | **Guests see demo bids on `/my-bids`** | `loadMyBidsDisplay` falls back to `getDemoBidsForDisplay()` | Matrix: guest **Cond** — documented demo behavior |
| **BID-08** | **Owner sees “Compare bids” on project detail** | Only when `isOwner && bidCount > 0`; link may 404 (see §3.1) | UX gap, not data leak |

### 5.4 Bid action vs matrix

| Action | Matrix | Implemented | Gap |
|--------|--------|-------------|-----|
| Submit bid | Pro, not owner, bidding open | `!isOwner` + `biddingOpen` only | **PERM-02** (client can bid) |
| View bids on project | Client owner | Anyone on owner routes | **BID-01** |
| Shortlist / award | Client owner | Anyone on `ProjectOwnerBids` | **SEC-02** |
| View own bids | Pro | Email filter + demo fallback | **BID-03**, **BID-07** |
| Public bidder profile | All (masked) | Public by `bidId` | Aligns if masking holds; **BID-05** enumeration |

---

## 6. Cross-reference: matrix §9 gaps vs this audit

| Matrix §9 item | Audit IDs | Status |
|----------------|-----------|--------|
| `/admin` open to Guest | SEC-01 | Confirmed Critical |
| `/project-owner-bids/:id` no owner check | SEC-02, BID-01 | Confirmed Critical |
| `/my-projects` without client session | PERM-04 | Confirmed Medium |
| `/workspace/:id` route not blocked | WS-02 | Confirmed Medium (+ WS-01 High) |
| Client-only permissions | SEC-03, SEC-10 | Confirmed Critical (systemic) |
| Professional `/post-job` | PERM-03 | Confirmed High |
| No admin in auth | SEC-08, PERM-07 | Confirmed |

**Additional findings not in matrix §9:** PERM-01 (reviews), PERM-02 (client bidding), WS-01 (workspace list), SEC-04/05 (data-sync), BID-02/03 (bid data scope).

---

## 7. Recommended remediation order

| Priority | Action | Closes |
|----------|--------|--------|
| P0 | Guard `/admin` and `/project-owner-bids/:id` with session + `created_by` / admin role | SEC-01, SEC-02, BID-01 |
| P0 | Server API with ACL (or minimum signed tokens per origin) | SEC-03, SEC-10 |
| P1 | Route wrappers: client-only (`/post-job`, `/my-projects`), pro-only (`/my-bids`) | PERM-03–05 |
| P1 | Fix `getAccessibleWorkspacesForUser` — never include `linkedProjectIds` when `identities.length === 0` | WS-01 |
| P1 | Bid **Create**: require `user_role === "professional"` and block clients | PERM-02 |
| P2 | Reviews: require `project.created_by === user.email` | PERM-01 |
| P2 | Redirect `/workspace/:id` when `userRole === null` | WS-02 |
| P2 | Restrict `/dev/data-sync` to dev + admin | SEC-04 |
| P3 | `MyProjects` / `loadBids` scope bids to owner’s `project_id`s only | BID-02 |
| P3 | Tighten `filterBidsForProfessional` (exclude empty `bidder_email`) | BID-03 |

---

## 8. Testing checklist (manual QA)

Use two browsers (or profiles) with different `user_role` and emails in `localStorage`:

1. Guest opens `/admin` — should **fail** after fix; today **passes** (SEC-01).  
2. Guest opens `/project-owner-bids/{known-project-id}` — should **fail**; today **passes** (SEC-02).  
3. Client opens `/project/{other-client-project}` — should not see bid modal; today **sees** bid CTA (PERM-02).  
4. Professional opens `/post-job` — should redirect; today **can post** (PERM-03).  
5. User A awards project; User B opens `/workspaces` — should not see A’s workspace; today may **see** (WS-01).  
6. Non-member opens `/workspace/{projectId}` — should redirect; today **restricted panel** (WS-02).  
7. Complete project as Client A; Client B submits review — should **fail**; today may **pass** (PERM-01).

---

## 9. Document history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | May 2026 | Initial audit vs permission matrix v1.0 |
