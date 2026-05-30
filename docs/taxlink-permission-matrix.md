# TaxLink Permission Matrix

**Status:** Documentation only  
**Date:** May 2026  
**Related:** [current-architecture.md](./current-architecture.md) · [taxlink-v1-architecture.md](./taxlink-v1-architecture.md)

This matrix defines **who may View, Create, Edit, and Delete** for every route and major feature across four roles. It includes **target (V1) permissions** — the intended access model — and **as-built notes** where the current SPA differs (client-side checks only, no server RBAC).

---

## 1. Roles

| Role | Definition | Identity signals (current / target) |
|------|------------|-------------------------------------|
| **Guest** | Not signed in; no `taxlink_auth_session`. May use local-only demo data in the same browser. | No auth session |
| **Professional** | Marketplace participant bidding on projects. | `user_role === "professional"`, `taxprouk_professional_email`, auth `role: "professional"`, onboarding signup |
| **Client** | Marketplace participant posting projects and awarding bids. | `user_role === "client"`, `taxprouk_client_email`, auth `role: "client"`, project `created_by` |
| **Admin** | Platform operator (founders, support). **Not implemented as a distinct role today**; `/admin` is open to any visitor. | Target: `auth.role === "admin"` or allowlist; server-enforced on admin APIs |

**Notes**

- A user is **either** Professional **or** Client in onboarding (`/create-profile`); there is no dual-role selection in the wizard (though `MyProfile` can display label “both”).
- **Ownership** overrides role for project-scoped actions: `project.created_by === user.email` → client-owner capabilities on that project regardless of stored `user_role` if misaligned.
- **Workspace membership** is a second axis: client or professional **in that workspace** via email match, grants, or winning bid.

---

## 2. Legend

| Symbol | Meaning |
|--------|---------|
| **Yes** | Allowed (target model) |
| **No** | Not allowed |
| **Own** | Allowed only on records the user owns or is assigned to |
| **Member** | Allowed only as workspace client or professional member |
| **Cond** | Conditional (see Access restrictions) |
| **—** | Not applicable for this role |

**CRUD columns**

| Column | Meaning |
|--------|---------|
| **View** | Open route / read data |
| **Create** | Create new records (posts, bids, messages, etc.) |
| **Edit** | Update existing records |
| **Delete** | Remove records |

---

## 3. Enforcement summary

| Layer | Target (V1) | As-built (today) |
|-------|-------------|------------------|
| Routes | Role guards + ownership checks | Almost all routes **public**; no `ProtectedRoute` on marketplace pages |
| Admin | Admin role required | **No check** on `/admin` |
| Project owner | `created_by === email` | UI-only in components |
| Workspace | Member email + resolved role | UI blocks actions when `userRole === null`; route still loads |
| API / storage | Server ACL | **localStorage only**; permissions do not cross browsers |

---

## 4. Route permission matrix

### 4.1 Marketing & discovery

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/` Home | View | View | View | View | Public |
| `/professionals` Find Experts | View | View | View | View | Lists profiles with `visibility === "public"` (or unset). Hidden/private profiles excluded from directory |
| `/advisor/:id` | View | View | View | View | Public adviser profile; contact details may be **Cond** (`reveal_contact_after_award`, visibility) |
| `/profile/:id` | View | View | View | View | Legacy profile route |
| `/professionals/:advisorId` | — | — | — | — | Redirect only; no CRUD |

### 4.2 Onboarding & account

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/create-profile` | View, Create | View, Create | View, Create | View | Anyone can complete onboarding; **role chosen in form** sets Professional vs Client. Edit/Delete of signup: **No** (append-only local signup list) |
| `/my-profile` | View: No | View: **Own** | View: Cond | View: Yes | Reads `my_profile` from localStorage. **Guest:** empty state + CTA. **Client:** page exists but copy assumes professional; limited value |

### 4.3 Projects (marketplace)

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/jobs` Browse projects | View | View | View | View | Public listing of open projects |
| `/post-job` | View, Create | View: No*, Create: No | View, Create | View | *Professional may open URL but should not post client projects. **Target:** redirect or block by role |
| `/project/:id` | View | View | View | View | Public project brief. **Create** bid: Professional only, **Cond** (bidding open, not owner). **Edit/Delete** project: **Own** (client owner) via owner panel |
| `/my-projects` | View: Cond | View: No | View: **Own** | View: Yes | Lists `JobPost` where `created_by === user.email`. **Guest:** sees local/demo projects without email filter. **Target:** require client session |
| `/project-owner-bids/:id` | View: Cond | View: No | View: **Own** | View: Yes | **Target:** client owner of `projectId` only. **As-built:** no owner check on route; any visitor with URL can view/manage bids |

### 4.4 Bids

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/my-bids` | View: Cond | View: **Own** | View: No | View: Yes | Bid list filtered by `bidder_email === user.email` when logged in; **Guest** may see demo bids. **Target:** professional session required |
| `/professionals/bid/:bidId` Bidder public profile | View | View | View | View | Shown in owner bid review; identity partially masked until award |

### 4.5 Workspace (delivery)

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/workspaces` | View: Cond | View: **Member** | View: **Member** | View: Yes | List from `getAccessibleWorkspacesForUser`. **Guest:** empty / auth banner / local-only continue. Demo workspaces for pros |
| `/workspace/:projectId` | View: Cond | View: **Member** | View: **Member** | View: Yes | **Target:** workspace member only. **As-built:** non-members see “Access restricted” UI but route is not blocked at router level |

### 4.6 Trust & community

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/reviews` | View | View | View | View | Public feed + demo reviews. **Create:** **Cond** — completed project + accepted bid + not already reviewed |

### 4.7 V1 proposed routes ([taxlink-v1-architecture.md](./taxlink-v1-architecture.md))

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/resources` Resources Hub | View | View | View | View, Edit | Public read. **Admin:** manage articles (CMS). **Create** bookmark: authenticated users (target) |
| `/resources/:slug` | View | View | View | View, Edit | Public article |
| `/lounge` Professional Lounge | View: teaser | View | View: No | View, Edit | **Target:** full access professionals only; clients redirected to `/resources` |
| `/lounge/discussions` | No | View, Create | No | View, Edit, Delete | Professional auth required; moderation by admin |
| `/lounge/announcements` | No | View | No | Create, Edit, Delete | Admin-authored announcements |

### 4.8 Internal & system

| Route | Guest | Professional | Client | Admin | Access restrictions |
|-------|:-----:|:------------:|:------:|:-----:|---------------------|
| `/admin` | **Target:** No | **Target:** No | **Target:** No | View | **As-built: Guest = View** (full dashboard). Aggregated signups, projects, bids, workspaces |
| `/dev/data-sync` | View, Create, Delete* | Same | Same | Same | *Import overwrites/merges localStorage. **Target:** dev env or admin only |
| `*` 404 | View | View | View | View | Public |

---

## 5. Feature permission matrix

### 5.1 Onboarding & identity

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| Complete early-access signup | Create | Create | Create | — | Writes `taxprouk_early_access_signups`, `my_profile` (pro), `user_role` |
| Choose role in onboarding | Create | Create | Create | — | Binary: professional \| client |
| Set profile visibility (`public` / `hidden` / `private`) | — | Create, Edit | — | View | Professionals only |
| Auth login / session | Create | Create | Create | Create | `taxlink_auth_session` |
| View own signup in admin metrics | No | No | No | View | Via `/admin` |

### 5.2 Professional directory & profiles

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| Search / browse public directory | View | View | View | View | `visibility === "public"` |
| View hidden-profile professional via direct link | Cond | Cond | Cond | View | Not in search; may match projects |
| View private-profile professional | No | Own | No | View | Apply-to-project model |
| Edit own professional profile (`my_profile`) | No | Edit: **Own** | No | — | Local storage |
| View revealed contact after award | No | Member | Member | View | Workspace / award flows |

### 5.3 Projects (JobPost)

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| Browse open projects | View | View | View | View | `/jobs` |
| View project detail | View | View | View | View | `/project/:id` |
| Post new project | No | No | Create | Create | `/post-job` wizard |
| Edit project (title, description, budget, etc.) | No | No | Edit: **Own** | Edit | Owner via `OwnerProjectActions` |
| Pause / resume / close project | No | No | Edit: **Own** | Edit | Owner; affects `accepting_bids` |
| Duplicate project | No | No | Create: **Own** | Create | Owner; creates copy |
| Delete project | No | No | Delete: **Own** | Delete | Owner |
| View owner bid-management UI | No | No | View: **Own** | View | `isOwner` on `ProjectDetail`; `/my-projects`, `/project-owner-bids/:id` |

### 5.4 Bids

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| Submit bid (Quick Quote) | No | Create | No | — | **Cond:** `biddingOpen`, not project owner, required fields. Sets `bidder_email` |
| View bids on own project | No | No | View: **Own** | View | All bids for `project_id` |
| View own submitted bids | Cond | View: **Own** | No | View | `/my-bids`; filter by email |
| Shortlist / unshortlist bid | No | No | Edit: **Own** | Edit | Client owner |
| Reject bid (via award flow) | No | No | Edit: **Own** | Edit | Non-winning bids marked rejected on award |
| Award bid | No | No | Edit: **Own** | Edit | **Cond:** no prior award; project not completed/closed. Creates workspace |
| Contact bidder (dialog) | No | No | Create: **Own** | — | Client owner during review |
| View bidder public profile | No | No | View: **Own** | View | From owner bid UI |
| Edit bid after submit | No | Edit: **Own** | No | Edit | **Target:** while `pending` and bidding open. **As-built:** limited UI |
| Delete bid | No | Delete: **Own** | No | Delete | **Target:** owner or bidder before award. **As-built:** not exposed in UI |

### 5.5 Workspace collaboration

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| List accessible workspaces | Cond | View: **Member** | View: **Member** | View | `getAccessibleWorkspacesForUser` |
| Open workspace room | Cond | View: **Member** | View: **Member** | View | `/workspace/:projectId` |
| Send messages | No | Create: **Member** | Create: **Member** | — | Requires resolved `userRole` |
| Upload files | No | Create: **Member** | Create: **Member** | — | Caps: 400 KB/file, 2 MB/workspace |
| Request additional documents | No | Create: **Member** (pro) | — | — | Typically professional-initiated |
| Mark file reviewed | No | Edit: **Member** (pro) | — | — | Professional reviews client uploads |
| Update workflow status | No | Edit: **Member** (pro) | No | Edit | `canUpdate` = professional && not completed |
| Add progress updates | No | Create: **Member** (pro) | No | — | `WorkspaceProgressPanel` |
| Mark work complete | No | Edit: **Member** (pro) | No | — | `professionalMarkWorkComplete` |
| Confirm completion | No | — | Edit: **Member** (client) | — | `clientConfirmCompletion`; unlocks reviews |
| Submit in-workspace mutual review | No | Create: **Member** | Create: **Member** | — | After completion phase |
| View workspace timeline / activity | No | View: **Member** | View: **Member** | View | Read-only audit |

### 5.6 Reviews (marketplace)

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| Browse public reviews feed | View | View | View | View | `/reviews` + demo data |
| Submit marketplace review | No | Cond | Cond | Create | **Cond:** project `completed` / `review_available`, accepted bid exists, not `alreadyReviewed`. Typically **client** reviews **professional** |
| View review eligibility list | No | View: **Own** | View: **Own** | View | `getReviewEligibleProjects()` |

### 5.7 Platform & feedback

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| Feedback widget (reaction + comment) | Create | Create | Create | View | `FeedbackEntry` stub; stored locally |
| Manual marketplace reconcile | No | Cond | Cond | Yes | Refresh on `/workspaces`; `reconcileMarketplaceState()` |
| Export localStorage backup | Cond | Cond | Cond | Yes | `/dev/data-sync` |
| Import localStorage backup | Cond | Cond | Cond | Yes | Can overwrite data; **Target:** admin/dev only |
| View admin dashboard metrics | **As-built: View** | **As-built: View** | **As-built: View** | View | **Target:** Admin only |
| GA4 / analytics events | Create | Create | Create | Create | Client-side tracking |

### 5.8 V1 proposed — Resources Hub

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| Browse articles & categories | View | View | View | View | Public |
| Search resources | View | View | View | View | Public |
| Save article bookmark | No | Create: **Own** | Create: **Own** | — | Requires auth (target) |
| Publish / edit article | No | No | No | Create, Edit, Delete | CMS / admin |

### 5.9 V1 proposed — Professional Lounge

| Feature | Guest | Professional | Client | Admin | Access restrictions |
|---------|:-----:|:------------:|:------:|:-----:|---------------------|
| View lounge home | Teaser | View | No | View | Client redirect |
| Read announcements | No | View | No | Create, Edit, Delete | Admin-authored |
| Create discussion post | No | Create | No | Delete | Professional auth |
| Reply to thread | No | Create | No | Delete | Professional auth |
| Moderate content | No | No | No | Edit, Delete | Admin moderation |

---

## 6. Workspace sub-matrix (member roles)

When `userRole` is resolved as **client** or **professional** inside a workspace:

| Feature | Workspace client | Workspace professional | Access restrictions |
|---------|:----------------:|:------------------------:|---------------------|
| View workspace | Yes | Yes | Member email match |
| Messages | Create | Create | Not available if `userRole === null` |
| Upload files | Create | Create | Same caps for both |
| Request documents | — | Create | Pro initiates doc request message |
| Mark files reviewed | — | Edit | Pro only |
| Workflow status | View | Edit | Pro advances status until completed |
| Progress updates | View | Create | Pro only |
| Mark work complete | — | Edit | Pro |
| Confirm completion | Edit | View | Client only |
| Mutual review submit | Create | Create | After completion unlocked |
| View agreed quote & parties | Yes | Yes | Read-only header |

---

## 7. Conditional rules reference

| Condition | Affects |
|-----------|---------|
| `biddingOpen` / deadline not passed | Bid **Create** on `/project/:id` |
| `project.created_by === user.email` | Owner **Edit/Delete**, bid review, award |
| `project.status` in `awarded`, `in_progress`, `completed`, `closed` | Award **No**; bid **Create** **No** |
| `bid.status === pending` | Shortlist toggle |
| Workspace exists for `project_id` | `/workspace/:projectId` **View** (member) |
| `resolveWorkspaceUserRole` returns `null` | Workspace actions **No**; “Access restricted” UI |
| `visibility === public` | Directory **View** |
| `project.review_available` or completed lifecycle | Review **Create** |
| `import.meta.env.DEV` | Dev workspace role fallback (not in production) |

---

## 8. Role capability summary

| Capability | Guest | Professional | Client | Admin |
|------------|:-----:|:------------:|:------:|:-----:|
| Post projects | No | No | Yes | Yes |
| Bid on projects | No | Yes | No | — |
| Award bids | No | No | Own projects | Yes |
| Collaborate in workspace | No | If member (pro) | If member (client) | View all |
| Public directory listing | View | If `public` visibility | — | View all |
| Professional Lounge (V1) | Teaser | Yes | No | Moderate |
| Resources Hub (V1) | Read | Read | Read | Manage |
| Admin dashboard | **As-built: Yes** | **As-built: Yes** | **As-built: Yes** | Yes |
| Cross-browser data trust | No | No | No | No (until server auth) |

---

## 9. As-built gaps (priority for hardening)

| Gap | Risk | Target fix |
|-----|------|------------|
| `/admin` open to Guest | High — exposes all signups/metrics | Admin role guard |
| `/project-owner-bids/:id` no owner check | High — anyone can award with URL | Verify `created_by === session.email` |
| `/my-projects` without client session | Medium — leaks local projects | Require client auth |
| `/workspace/:id` route not blocked | Medium — brief UI exposure | Redirect non-members |
| Permissions are client-only | High — tampering via DevTools | Server ACL + API tokens |
| Professional can open `/post-job` | Low — UX confusion | Role-based redirect |
| No `admin` in auth model | Medium | Extend `auth.js` roles |

---

## 10. Matrix changelog

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | May 2026 | Initial matrix: all current routes + V1 proposed Lounge/Resources |
