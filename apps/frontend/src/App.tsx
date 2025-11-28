import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Onboarding } from './pages/Onboarding';
import MapPage from './pages/MapPage';
import EventsPage from './pages/EventsPage';
import { EventDetail } from './pages/EventDetail';
import { MyEvents } from './pages/MyEvents';
import MessagesPage from './pages/MessagesPage';
import { Chat } from './pages/Chat';
import { Mingles } from './pages/Mingles';
import { MingleDetail } from './pages/MingleDetail';
import ProfilePage from './pages/ProfilePage';
import { UserProfile } from './pages/UserProfile';

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
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<MapPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="/mingles" element={<Mingles />} />
          <Route path="/mingles/:id" element={<MingleDetail />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
