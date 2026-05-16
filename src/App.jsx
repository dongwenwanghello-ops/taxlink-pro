import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import PageTracker from './components/analytics/PageTracker';
import Home from './pages/Home';
import Professionals from './pages/Professionals';
import Jobs from './pages/Jobs';
import CreateProfile from './pages/CreateProfile';
import PostJob from './pages/PostJob';
import Reviews from './pages/Reviews';
import ProfileDetail from './pages/ProfileDetail';
import ProjectDetail from './pages/ProjectDetail';
import MyProjects from './pages/MyProjects';
import MyBidsDemo from './components/emptyStates/MyBidsDemo';
import MyProfile from './pages/MyProfile';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // For auth_required, don't redirect — let the app render publicly
    // Individual protected pages handle their own auth gate
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<><PageTracker /><AppLayout /></>}>
        <Route path="/" element={<Home />} />
        <Route path="/professionals" element={<Professionals />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/my-bids" element={<MyBidsDemo />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/professionals/:id" element={<ProfileDetail />} />

      </Route>
      <Route path="*" element={<PageNotFound />} />

    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App