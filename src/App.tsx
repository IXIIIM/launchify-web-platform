import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme/ThemeProvider';
import Layout from './components/layout/Layout';

// Lazy-loaded route components
const Home = React.lazy(() => import('./pages/Home'));
const SignUp = React.lazy(() => import('./pages/auth/SignUp'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const ProfileSetup = React.lazy(() => import('./pages/profile/ProfileSetup'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const MatchFeed = React.lazy(() => import('./pages/matching/MatchFeed'));
const ChatPage = React.lazy(() => import('./pages/chat/ChatPage'));
const SubscriptionPage = React.lazy(() => import('./pages/subscription/SubscriptionPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const DevDashboard = React.lazy(() => import('./pages/dev/DevDashboard'));

interface User {
  id: string;
  email: string;
  userType: 'entrepreneur' | 'funder';
  subscriptionTier: string;
  profileCompleted: boolean;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <Layout>
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          }>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />

              {/* Protected routes */}
              <Route path="/profile-setup" element={
                user ? (
                  user.profileCompleted ? 
                    <Navigate to="/dashboard" /> : 
                    <ProfileSetup />
                ) : 
                <Navigate to="/login" />
              } />
              <Route path="/dashboard" element={
                user ? <Dashboard /> : <Navigate to="/login" />
              } />
              <Route path="/matches" element={
                user ? <MatchFeed /> : <Navigate to="/login" />
              } />
              <Route path="/chat" element={
                user ? <ChatPage /> : <Navigate to="/login" />
              } />
              <Route path="/subscription" element={
                user ? <SubscriptionPage /> : <Navigate to="/login" />
              } />
              <Route path="/settings" element={
                user ? <SettingsPage /> : <Navigate to="/login" />
              } />

              {/* Development routes */}
              {process.env.NODE_ENV === 'development' && (
                <Route path="/dev" element={
                  user ? <DevDashboard /> : <Navigate to="/login" />
                } />
              )}

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </Layout>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;