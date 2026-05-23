import { Toaster } from "@/components/ui/toaster"
import { MarketplaceWorkflowProvider } from "@/lib/MarketplaceWorkflowContext"
import WorkflowSyncIndicator from "@/components/shared/WorkflowSyncIndicator"

import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"

import { Routes, Route } from "react-router-dom"

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
import BidderPublicProfile from "./pages/BidderPublicProfile"
import ProjectDetail from "./pages/ProjectDetail"
import MyProjects from "./pages/MyProjects"
import ProjectOwnerBids from "./pages/ProjectOwnerBids"
import MyProfile from "./pages/MyProfile"
import Workspaces from "./pages/Workspaces"
import ProjectWorkspace from "./pages/ProjectWorkspace"
import MyBidsDemo from "./components/emptyStates/MyBidsDemo"

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
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/profile/:id" element={<ProfileDetail />} />
        <Route path="/professionals/bid/:bidId" element={<BidderPublicProfile />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/project-owner-bids/:id" element={<ProjectOwnerBids />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/my-bids" element={<MyBidsDemo />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/workspace/:projectId" element={<ProjectWorkspace />} />
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