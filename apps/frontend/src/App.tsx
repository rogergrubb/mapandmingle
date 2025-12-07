import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ReportStatus from './pages/ReportStatus';
import { Onboarding } from './pages/Onboarding';
import { Join } from './pages/Join';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import EventsPage from './pages/EventsPage';
import CreateEvent from './pages/CreateEvent';
import CreateMinglePage from './pages/CreateMinglePage';
import FindMinglerPage from './pages/FindMinglerPage';
import { EventDetail } from './pages/EventDetail';
import { EditEvent } from './pages/EditEvent';
import { MyEvents } from './pages/MyEvents';
import MessagesPage from './pages/MessagesPage';
import ConnectionsPage from './pages/ConnectionsPage';
import { Chat } from './pages/Chat';
import { Mingles } from './pages/Mingles';
import MingleDetail from './pages/MingleDetail';
import ProfilePage from './pages/ProfilePage';
import { UserProfile } from './pages/UserProfile';
import EditProfile from './pages/settings/EditProfile';
import SavedPins from './pages/settings/SavedPins';
import PrivacySafety from './pages/settings/PrivacySafety';
import NotificationsSettings from './pages/settings/NotificationsSettings';
import Subscription from './pages/settings/Subscription';
import AccountSettings from './pages/settings/AccountSettings';
import HelpSupport from './pages/settings/HelpSupport';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import CommunityGuidelines from './pages/legal/CommunityGuidelines';
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicy';
import { AdminReports } from './pages/admin/AdminReports';
import ProfileInterestsSetup from './components/ProfileInterestsSetup';
import { useProfileSetup } from './hooks/useProfileSetup';
import { VideoCall, CallNotificationChecker } from './components/VideoCall';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function HomeRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/map" /> : <LandingPage />;
}

function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const { showInterestsSetup, closeInterestsSetup } = useProfileSetup();

  useEffect(() => {
    // Don't run fetchUser on auth callback page - let that page handle auth
    if (window.location.pathname === '/auth/callback') {
      return;
    }
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <ProfileInterestsSetup isOpen={showInterestsSetup} onComplete={closeInterestsSetup} />
      <VideoCall />
      <CallNotificationChecker />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Report Status */}
        <Route path="/report-status" element={<ReportStatus />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/legal/terms" element={<TermsOfService />} />
        <Route path="/legal/community-guidelines" element={<CommunityGuidelines />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        
        {/* Landing Page for non-authenticated users */}
        <Route path="/" element={<HomeRoute />} />
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/map" element={<MapPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/:id/edit" element={<EditEvent />} />
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/activity" element={<ConnectionsPage />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/mingles" element={<Mingles />} />
          <Route path="/mingles/create" element={<CreateMinglePage />} />
          <Route path="/find-mingler" element={<FindMinglerPage />} />
          <Route path="/mingles/:id" element={<MingleDetail />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/settings/edit-profile" element={<EditProfile />} />
          <Route path="/settings/saved-pins" element={<SavedPins />} />
          <Route path="/settings/privacy" element={<PrivacySafety />} />
          <Route path="/settings/notifications" element={<NotificationsSettings />} />
          <Route path="/settings/subscription" element={<Subscription />} />
          <Route path="/settings/account" element={<AccountSettings />} />
          <Route path="/settings/help" element={<HelpSupport />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

