import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import { ForgotPassword } from './pages/ForgotPassword';
import { Onboarding } from './pages/Onboarding';
import MapPage from './pages/MapPage';
import EventsPage from './pages/EventsPage';
import CreateEvent from './pages/CreateEvent';
import CreateMinglePage from './pages/CreateMinglePage';
import FindMinglerPage from './pages/FindMinglerPage';
import { EventDetail } from './pages/EventDetail';
import { EditEvent } from './pages/EditEvent';
import { MyEvents } from './pages/MyEvents';
import MessagesPage from './pages/MessagesPage';
import ActivityPage from './pages/ActivityPage';
import { Chat } from './pages/Chat';
import { Mingles } from './pages/Mingles';
import { MingleDetail } from './pages/MingleDetail';
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
import { AdminReports } from './pages/admin/AdminReports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<MapPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/:id/edit" element={<EditEvent />} />
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/activity" element={<ActivityPage />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
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
