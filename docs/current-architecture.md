# TaxLink / TaxPro UK — Current Architecture Audit

**Audit date:** May 2026  
**Stack:** React 18 + Vite 6, React Router, TanStack Query, Tailwind + Radix UI  
**Deployment:** Static SPA (e.g. Vercel) with client-side routing

Read-only documentation of the codebase as implemented. No code changes implied.

---

## Context

TaxLink is a **UK tax & accounting marketplace** (UI brand: TaxPro UK). Data is **local-first**: projects, bids, workspaces, and signups persist in **browser `localStorage`**.

The **`base44` import** (`src/api/base44Client.js`) is a **compatibility shim** → `src/services/api.js` + `src/services/entityStore.js`. There is **no live Base44 cloud SDK** or external auth redirect in the current build.

**Auth:** TaxLink local session via `src/services/auth.js` + `AuthContext`.  
**Workflow:** `reconcileMarketplaceState()` in `src/lib/marketplaceState.js`; UI uses `MarketplaceWorkflowProvider` snapshots.

---

## 1. Existing routes

Defined in `src/App.jsx`. Most routes sit under `AppLayout` + `PageTracker`.

| Route | Component | Notes |
|-------|-----------|--------|
| `/` | `Home` | |
| `/professionals` | `Professionals` | |
| `/jobs` | `Jobs` | |
| `/create-profile` | `CreateProfile` | Minimal onboarding navbar |
| `/post-job` | `PostJob` | |
| `/reviews` | `Reviews` | |
| `/profile/:id` | `ProfileDetail` | |
| `/advisor/:id` | `AdvisorDetail` | |
| `/professionals/:advisorId` | `AdvisorRedirect` → `/advisor/:advisorId` | |
| `/professionals/bid/:bidId` | `BidderPublicProfile` | |
| `/project/:id` | `ProjectDetail` | |
| `/my-projects` | `MyProjects` | |
| `/project-owner-bids/:id` | `ProjectOwnerBids` | |
| `/my-profile` | `MyProfile` | |
| `/my-bids` | `MyBidsDemo` | |
| `/workspaces` | `Workspaces` | |
| `/workspace/:projectId` | `ProjectWorkspace` | |
| `/dev/data-sync` | `DataSyncSettings` | localStorage backup |
| `/admin` | `AdminDashboard` | **No route guard** in code |
| `*` | `PageNotFound` | Catch-all |

**Provider tree:** `AuthProvider` → `QueryClientProvider` → `MarketplaceWorkflowProvider` → routes.

**Special auth UI:** `UserNotRegisteredError` when `authError.type === "user_not_registered"`.

---

## 2. Existing pages

| Page | Route | Purpose |
|------|-------|---------|
| `Home` | `/` | Marketing landing |
| `Professionals` | `/professionals` | Professional directory (demo + stored) |
| `Jobs` | `/jobs` | Browse open projects |
| `CreateProfile` | `/create-profile` | Early-access onboarding |
| `PostJob` | `/post-job` | Client project posting wizard |
| `Reviews` | `/reviews` | Reviews list / submit |
| `ProfileDetail` | `/profile/:id` | Legacy profile by id |
| `AdvisorDetail` | `/advisor/:id` | Public adviser profile |
| `BidderPublicProfile` | `/professionals/bid/:bidId` | Bidder public card |
| `ProjectDetail` | `/project/:id` | Project view + bid entry |
| `MyProjects` | `/my-projects` | Client project & bid management |
| `ProjectOwnerBids` | `/project-owner-bids/:id` | Bid comparison / award |
| `MyProfile` | `/my-profile` | Own professional profile summary |
| `MyBidsDemo` | `/my-bids` | Professional bids dashboard |
| `Workspaces` | `/workspaces` | Workspace list |
| `ProjectWorkspace` | `/workspace/:projectId` | Collaboration hub |
| `DataSyncSettings` | `/dev/data-sync` | Export/import localStorage |
| `AdminDashboard` | `/admin` | Founder metrics |
| `PageNotFound` | `*` | 404 |
| `UserNotRegisteredError` | (auth branch) | Registration error state |

**Global UI (not routes):** `WorkflowSyncIndicator`, `FeedbackWidget`, modals (`BidModal`, award dialogs, etc.).

---

## 3. Existing entities

Accessed as **`base44.entities.*`** (shim). `list` / `filter` / `get` read local data; `create` / `update` often return objects while pages persist via `*Store` modules.

| Entity | Storage / source | Primary use |
|--------|------------------|-------------|
| **User** | `taxprouk_early_access_signups`, `my_profile`, `taxlink_auth_session` (merged by email) | Signups, admin, identity |
| **ProfessionalProfile** | Derived from professional users + `my_profile` | Directory, profiles, bids |
| **JobPost** | `taxprouk_posted_projects` (`projectStore`) | Projects, jobs, owner flows |
| **Bid** | `taxprouk_bids` (`bidStore`) | Bidding, award, my-bids |
| **Workspace** | `taxprouk_workspaces` (`workspaceStore`) | Post-award collaboration |
| **Review** | Entity stub empty; some data in `taxprouk_verified_reviews` | Reviews page (partial) |
| **FeedbackEntry** | Entity stub empty | Feedback widget |

**Related local keys (not always entity-wrapped):**

| Key | Module / role |
|-----|----------------|
| `taxprouk_bids` | `bidStore.js` |
| `taxprouk_posted_projects` | `projectStore.js` |
| `taxprouk_workspaces` | `workspaceStore.js` |
| `taxprouk_professional_email` / `taxprouk_client_email` | Marketplace session emails |
| `taxprouk_ws_access_{projectId}` | Per-project access grants |
| `taxlink_auth_session` / `taxlink_cloud_session` | Auth session flags |
| `user_role` | `professional` \| `client` |
| `my_profile` | Active profile JSON |
| `taxprouk_early_access_signups` | Onboarding registry |
| Demo data | `demoData.js`, `demoBidTemplates.js` per `DEMO_POLICY` |

**API entry:** `import { auth, api } from '@/config/providers'` (preferred over `base44Client` in new code).

---

## 4. Existing user roles

| Role | How set | Typical journey |
|------|---------|-----------------|
| **`professional`** | Onboarding `user_role`, `user_role` localStorage, auth `user.role` | Profile → `/jobs` → bid → `/my-bids` → `/workspaces` |
| **`client`** | Same keys | Profile → `/post-job` → `/my-projects` → award → workspace |
| **`both`** | Label in `MyProfile` only | Not selected in onboarding (binary choice) |

**Profile visibility (professionals only):**

| Value | Effect |
|-------|--------|
| `private` | Default; not in public search |
| `hidden` | Hidden from search; AI-matchable |
| `public` | Visible in directory / search |

Stored as `visibility`, `profile_public`, `visible_to_clients` on signup / `my_profile`.

**Marketplace session** (`getMarketplaceSession()`): `role`, `email`, `professionalEmail`, `clientEmail`, `authEmail`, `profileEmail`.

---

## 5. Existing workflows

### 5.1 Onboarding / signup

`/create-profile` → role → multi-step form → `taxprouk_early_access_signups` + `my_profile` (pro) + `user_role` → optional `auth.login()`.

### 5.2 Post project (client)

`/post-job` → `JobPost.create` + `saveProject()` → `projectPosted` event.

### 5.3 Submit bid (professional)

`BidModal` → `Bid.create` or `saveBid()` → status `pending` → `bidSubmitted`.

### 5.4 Owner review & award

`/my-projects` or `/project-owner-bids/:id` → shortlist / reject / award → `executeAward` → workspace creation → `projectAwarded`.

### 5.5 Marketplace reconcile (system)

`reconcileMarketplaceState()` on load + manual refresh:

- Schema version / backup (`WORKFLOW_SCHEMA_VERSION = 2`)
- Orphan detection & workspace repair
- Project ↔ winning bid alignment
- `buildWorkflowSnapshot()` for UI

**Events:** `workflowReconciled`, `projectAwarded`, `bidUpdated`, `workspaceCreated`, `workspaceUpdated`, `projectPosted`, `bidSubmitted`, integration events.

### 5.6 Bid statuses

`pending` → `shortlisted` → `selected` (incl. `accepted` / `awarded`) | `rejected`

### 5.7 Project statuses

`open` → `reviewing` → `awarded` / `in_progress` → `completed` / `closed`

### 5.8 Workspace collaboration

Award → `createWorkspaceOnAward` → list `/workspaces` → detail `/workspace/:projectId`.

### 5.9 Manual data sync

`/dev/data-sync` — export/import localStorage between origins.

---

## 6. Existing workspace functionality

**Model:** One workspace per `project_id` in `taxprouk_workspaces`.

**Creation / repair**

- `createWorkspaceOnAward({ project, bid, clientEmail })`
- `ensureWorkspaceForSelectedBid` (via reconcile only — `workflowSync.js`)
- `buildWorkspaceMemberPatch`, `persistWorkspaceAccessGrant`

**Workflow statuses**

`quote_accepted` → `awaiting_documents` → `in_progress` → `review` → `submission_ready` → `completed`

**Features**

| Area | Implementation |
|------|----------------|
| Status | `updateWorkspaceStatus`, `WorkspaceStatusTracker` |
| Messages | `addWorkspaceMessage`, `WorkspaceMessages`, `MESSAGE_TYPES` |
| Files | `addWorkspaceFile` (400 KB/file, 2 MB/workspace cap) |
| Doc requests | `requestAdditionalDocuments` |
| Progress | `addProgressUpdate`, `WorkspaceProgressPanel` |
| Completion | `professionalMarkWorkComplete`, `clientConfirmCompletion` |
| Reviews | `submitWorkspaceReview`, `WorkspaceMutualReviews` |
| Timeline | `appendActivity`, `WorkspaceTimeline` |
| Guidance | `WorkspaceNextStepBanner`, `workspaceGuidance.js` |
| Identity | Post-award professional reveal (`professionalIdentity.js`) |

**List page (`/workspaces`)**

- Resolves user via `auth.restoreSession()` / local fallback
- Lists via `getAccessibleWorkspacesForUser` + workflow snapshot
- Cloud-expired banner when no local identity/data
- Manual reconcile refresh

**Detail page (`/workspace/:projectId`)**

- Loads project + workspace; resolves `userRole` for UI
- Role-specific actions (status, messages, uploads, completion)

---

## 7. Current permission model

There is **no centralized RBAC** or server-enforced ACL. Permissions are **client-side**, based on **localStorage identity**, **workspace membership**, and **page-level checks**.

### 7.1 Route & app access

| Layer | Behavior |
|-------|----------|
| **Routes** | Almost all routes are **public** (no `ProtectedRoute`). Any visitor can open `/admin`, `/my-projects`, `/workspace/:id`, etc. |
| **AuthContext** | Tracks `user`, `isAuthenticated` from `auth.restoreSession()`; does **not** block routing globally. |
| **Auth gate (soft)** | `/workspaces` shows “cloud session expired” / login prompts when no user and no local data — but can continue in **local-only mode**. |
| **Admin** | `/admin` has **no authentication** check. |

### 7.2 Authentication identity

| Source | Purpose |
|--------|---------|
| `taxlink_auth_session` | Canonical logged-in user (`email`, `role`, `full_name`) |
| `taxlink_cloud_session` | `active` \| `expired` — legacy cloud banner semantics |
| `taxprouk_professional_email` | Professional marketplace session email |
| `taxprouk_client_email` | Client marketplace session email |
| `user_role` | `professional` or `client` for marketplace UX |
| `my_profile` / early-access signups | Profile and signup records |

`syncSessionIdentityFromUser(user)` writes role-appropriate email keys on login.

### 7.3 Workspace list visibility

`getAccessibleWorkspacesForUser({ email, role })` returns workspaces if **any** of:

1. User email matches `workspaceIncludesEmail` and `getUserRoleInWorkspace` matches marketplace `role`
2. **Professional fast path:** `professional_email` / `selected_professional_email` matches any identity email
3. Project linked to a **selected** bid for that professional
4. Demo project ids (`demo-project-*`) for professionals

Identity emails collected via `collectWorkspaceIdentityEmails()` (auth, session, profile).

`resolveWorkspaceListPriority()` prefers non-empty workflow snapshot; falls back to local filter (never shows empty snapshot over local data).

### 7.4 Workspace membership (in-room access)

`isEmailWorkspaceMember(workspace, email)` grants **client** or **professional** if email matches:

- `workspace.members[]` entry
- `workspace.client_email`
- `workspace.professional_email` / `selected_professional_email`
- Per-project grant: `taxprouk_ws_access_{projectId}` (`client_email`, `professional_email`)

`resolveWorkspaceUserRole({ workspace, project, user, winningBid })` order:

1. Candidate emails (user, session pro, winning bid pro, grant emails) → member check
2. Winning bid + session/email match → **professional**
3. Demo project / demo bid heuristics
4. `project.created_by === user.email` → **client**
5. **`resolveDevLocalWorkspaceRoleFallback`** — **development only** (`import.meta.env.DEV`)

If role is `null`, workspace UI may limit actions; there is no hard redirect away from `/workspace/:projectId`.

### 7.5 Project & bid permissions (UI-level)

| Action | Typical check |
|--------|----------------|
| View project | Public for open projects |
| Submit bid | Bidding open on project; professional flow |
| Owner bid management | `project.created_by === currentUser.email` (`ProjectDetail`, `MyProjects`) |
| Award bid | Owner on project-owner flows |
| Edit/delete project | Owner actions via `OwnerProjectActions` |

No server validates ownership; checks are in React components against stored `created_by`.

### 7.6 Professional profile visibility

| Visibility | Who can discover |
|------------|------------------|
| `public` | Directory / search (`Professionals`) |
| `hidden` | Not in public search; matching may still apply |
| `private` | Not public; apply-to-project model |

`reveal_contact_after_award` controls contact exposure timing on profiles.

### 7.7 Development-only overrides

`resolveDevLocalWorkspaceRoleFallback`:

- Incomplete workspace ownership → grant role from `user_role`
- Client email alignment with onboarding / project owner
- Professional + winning bid email alignment

**Disabled in production builds.**

### 7.8 Permission model summary

```
┌─────────────────────────────────────────────────────────┐
│  Browser localStorage (per origin)                      │
│  ├── taxlink_auth_session (who is "logged in")          │
│  ├── user_role (professional | client)                  │
│  ├── session emails (pro / client)                      │
│  └── entity data (projects, bids, workspaces, grants)   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Client-side checks only (no API enforcement)           │
│  ├── Route: mostly open                                 │
│  ├── Workspace list: getAccessibleWorkspacesForUser       │
│  ├── Workspace room: isEmailWorkspaceMember + role       │
│  └── Project owner: created_by === user.email           │
└─────────────────────────────────────────────────────────┘
```

**Implications for founders / engineering:**

- Permissions **do not travel across browsers** or users without shared localStorage backup.
- **Trust boundary is the client** — treat `/admin` and owner actions as internal/demo until server auth exists.
- Reconcile repair can **expand** workspace access when bids/projects are awarded, independent of login state.

---

## Appendix: Key modules

| Path | Responsibility |
|------|----------------|
| `src/App.jsx` | Routes |
| `src/services/auth.js` | Local session |
| `src/services/api.js` | Platform API facade |
| `src/services/entityStore.js` | Entity reads |
| `src/lib/marketplaceState.js` | Reconcile + snapshot |
| `src/lib/workflowSync.js` | Workspace sync (reconcile-only) |
| `src/lib/workspaceAccess.js` | Membership & grants |
| `src/lib/workspaceStore.js` | Workspace CRUD & features |
| `src/lib/workspacePageUtils.js` | List auth / cloud banner |
| `src/lib/awardWorkflow.js` | Award + lifecycle UI |
| `src/lib/MarketplaceWorkflowContext.jsx` | Snapshot provider |

---

## Appendix: Operational constraints

1. Data is **per-browser / per-origin** — use `/dev/data-sync` to move between environments.  
2. **No server database** in current architecture.  
3. **Demo content** merged per `DEMO_POLICY` when stores are empty.  
4. **`base44.analytics.track`** is a no-op; GA4 handles product analytics separately.
