import { Toaster } from "@/components/ui/toaster"
import { MarketplaceWorkflowProvider } from "@/lib/MarketplaceWorkflowContext"
import WorkflowSyncIndicator from "@/components/shared/WorkflowSyncIndicator"

import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"

import { Routes, Route, Navigate, useParams } from "react-router-dom"

import PageNotFound from "./lib/PageNotFound"
import { AuthProvider, useAuth } from "@/lib/AuthContext"
import UserNotRegisteredError from "@/components/UserNotRegisteredError"

import AppLayout from "./components/layout/AppLayout"
import PageTracker from "./components/analytics/PageTracker"

import Home from "./pages/Home"
import Professionals from "./pages/Professionals"
import Jobs from "./pages/Jobs"
import CreateProfile from "./pages/CreateProfile"
import PostJob from "./pages/PostJob"
import Reviews from "./pages/Reviews"
import ProfileDetail from "./pages/ProfileDetail"
import AdvisorDetail from "./pages/AdvisorDetail"
import BidderPublicProfile from "./pages/BidderPublicProfile"
import ProjectDetail from "./pages/ProjectDetail"
import MyProjects from "./pages/MyProjects"
import ProjectOwnerBids from "./pages/ProjectOwnerBids"
import MyProfile from "./pages/MyProfile"
import Workspaces from "./pages/Workspaces"
import ProjectWorkspace from "./pages/ProjectWorkspace"
import MyBidsDemo from "./components/emptyStates/MyBidsDemo"
import DataSyncSettings from "./pages/DataSyncSettings"
import AdminDashboard from "./pages/AdminDashboard"
import ComingSoonPage from "./components/foundation/ComingSoonPage"

function AdvisorRedirect() {
  const { advisorId } = useParams();
  return <Navigate to={`/advisor/${advisorId}`} replace />;
}

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
  } = useAuth()

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />
    }
  }

  return (
    <Routes>
      <Route
        element={
          <>
            <PageTracker />
            <AppLayout />
          </>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/professionals" element={<Professionals />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route
          path="/projects"
          element={
            <ComingSoonPage
              title="Projects"
              layer="Acquisition"
              description="Unified projects hub — browse, post, and manage marketplace work. Use Browse Projects in the nav for the live listing."
              backTo="/jobs"
              backLabel="Browse live projects"
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ComingSoonPage
              title="Dashboard"
              layer="Foundation"
              description="Role-specific home for professionals and clients — activity summary, next steps, and shortcuts."
            />
          }
        />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/profile/:id" element={<ProfileDetail />} />
        <Route path="/advisor/:id" element={<AdvisorDetail />} />
        <Route path="/professionals/:advisorId" element={<AdvisorRedirect />} />
        <Route path="/professionals/bid/:bidId" element={<BidderPublicProfile />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/project-owner-bids/:id" element={<ProjectOwnerBids />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/my-bids" element={<MyBidsDemo />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/workspace/:projectId" element={<ProjectWorkspace />} />
        <Route path="/dev/data-sync" element={<DataSyncSettings />} />
        <Route path="/compliance" element={<ComingSoonPage title="Compliance" layer="Compliance" description="Engagement readiness, CDD, AML, and client onboarding — central hub for regulatory workflows." />} />
        <Route path="/compliance/engagement-letter" element={<ComingSoonPage title="Engagement Letters" layer="Compliance" description="Engagement letter templates and status tracking. Generation automation is planned for a later phase." backTo="/compliance" backLabel="Back to Compliance" />} />
        <Route path="/compliance/cdd" element={<ComingSoonPage title="Customer Due Diligence (CDD)" layer="Compliance" description="CDD checklists and evidence collection. Automation is planned for a later phase." backTo="/compliance" backLabel="Back to Compliance" />} />
        <Route path="/compliance/aml" element={<ComingSoonPage title="Anti-Money Laundering (AML)" layer="Compliance" description="AML policy alignment and risk flags. Automation is planned for a later phase." backTo="/compliance" backLabel="Back to Compliance" />} />
        <Route path="/lounge" element={<ComingSoonPage title="Professional Lounge" layer="Community" description="Professional-only community — updates, peer discussion, and practice resources between projects." />} />
        <Route path="/resources" element={<ComingSoonPage title="Resources Hub" layer="Community" description="Guides, templates, and reference content for clients and professionals." />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ComingSoonPage title="User Management" layer="Admin" description="Manage platform users, roles, and account status." backTo="/admin" backLabel="Admin overview" />} />
        <Route path="/admin/projects" element={<ComingSoonPage title="Project Administration" layer="Admin" description="View and manage all marketplace projects." backTo="/admin" backLabel="Admin overview" />} />
        <Route path="/admin/audit-logs" element={<ComingSoonPage title="Audit Logs" layer="Admin" description="Platform audit trail — auth, awards, compliance events, and admin actions." backTo="/admin" backLabel="Admin overview" />} />
        <Route path="/admin/settings" element={<ComingSoonPage title="Platform Settings" layer="Admin" description="TaxLink configuration, feature flags, and environment settings." backTo="/admin" backLabel="Admin overview" />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <MarketplaceWorkflowProvider>

          <Routes>
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>

          <WorkflowSyncIndicator />
          <Toaster />

        </MarketplaceWorkflowProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App