// src/App.tsx

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import { AuthProvider, useAuth } from './context/AuthContext';
import NotificationProvider from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import ErrorBoundary from './components/error/ErrorBoundary';
import LazyLoadingFallback from './components/ui/LazyLoadingFallback';
import { lazyLoad, preloadByRoute } from './utils/lazyLoad';
import { UserRole } from './types/user';
import InstallPrompt from './components/pwa/InstallPrompt';
import OfflineIndicator from './components/pwa/OfflineIndicator';
import CriticalPathOptimizer from './components/performance/CriticalPathOptimizer';

// Error Pages - Keep these non-lazy for better error handling
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import ServerErrorPage from './pages/ServerErrorPage';
import MaintenancePage from './pages/MaintenancePage';

// Lazy loaded pages
const LoginPage = lazyLoad(() => import('./pages/auth/LoginPage'));
const Login = lazyLoad(() => import('./pages/auth/Login'));
const RegisterPage = lazyLoad(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazyLoad(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyLoad(() => import('./pages/auth/ResetPasswordPage'));

const DashboardPage = lazyLoad(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = lazyLoad(() => import('./pages/profile/ProfilePage'));
const NotificationDemoPage = lazyLoad(() => import('./pages/demo/NotificationDemoPage'));

// Admin pages
const AdminDashboard = lazyLoad(() => import('./pages/admin/Dashboard'));
// Check if analytics dashboard exists, if not, use a fallback
const AnalyticsDashboard = lazyLoad(() => 
  import('./pages/admin/Dashboard').then(module => module)
);

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// For development/testing - set to true to show maintenance page
const MAINTENANCE_MODE = false;

// Component to handle route-based preloading
const RoutePreloader: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // Preload dashboard related components when on login page
    preloadByRoute(
      location.pathname,
      ['/login', '/register'],
      [DashboardPage, ProfilePage]
    );
    
    // Preload admin components when on dashboard for admin users
    if (user?.roles?.includes(UserRole.ADMIN) || user?.roles?.includes(UserRole.SUPER_ADMIN)) {
      preloadByRoute(
        location.pathname,
        ['/dashboard'],
        [AdminDashboard, AnalyticsDashboard]
      );
    }
  }, [location.pathname, user?.roles]);
  
  return null;
};

const App: React.FC = () => {
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  // Define critical resources for preloading
  const criticalCssUrls = [
    '/static/css/main.chunk.css'
  ];
  
  const criticalScriptUrls = [
    '/static/js/main.chunk.js'
  ];
  
  const criticalImageUrls = [
    '/logo192.png',
    '/logo512.png'
  ];
  
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.launchify.com'
  ];

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <CssBaseline />
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <CriticalPathOptimizer
                criticalCssUrls={criticalCssUrls}
                criticalScriptUrls={criticalScriptUrls}
                criticalImageUrls={criticalImageUrls}
                preconnectDomains={preconnectDomains}
                enableRoutePrioritization={true}
                addGlobalHints={true}
              >
                <RoutePreloader />
                {/* PWA Components */}
                <InstallPrompt 
                  variant="banner" 
                  position="bottom" 
                  autoShow={true} 
                  showDelay={5000}
                />
                <OfflineIndicator 
                  variant="banner" 
                  position="top" 
                  showOnlineStatus={true}
                />
                <Suspense fallback={<LazyLoadingFallback message="Loading application..." />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route 
                      path="/login" 
                      element={
                        <PublicRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading login page..." />}>
                            <LoginPage />
                          </Suspense>
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/register" 
                      element={
                        <PublicRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading registration page..." />}>
                            <RegisterPage />
                          </Suspense>
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/login-legacy" 
                      element={
                        <PublicRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading legacy login..." />}>
                            <Login />
                          </Suspense>
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/forgot-password" 
                      element={
                        <PublicRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading password recovery..." />}>
                            <ForgotPasswordPage />
                          </Suspense>
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/reset-password" 
                      element={
                        <PublicRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading password reset..." />}>
                            <ResetPasswordPage />
                          </Suspense>
                        </PublicRoute>
                      } 
                    />

                    {/* Protected Routes */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading dashboard..." />}>
                            <DashboardPage />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading profile..." />}>
                            <ProfilePage />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/demo/notifications" element={
                      <ProtectedRoute>
                        <Suspense fallback={<LazyLoadingFallback message="Loading notifications demo..." />}>
                          <NotificationDemoPage />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin Routes */}
                    <Route 
                      path="/admin/*" 
                      element={
                        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <Suspense fallback={<LazyLoadingFallback message="Loading admin dashboard..." />}>
                            <AdminDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Analytics Routes */}
                    <Route 
                      path="/analytics/*" 
                      element={
                        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                          <Suspense fallback={<LazyLoadingFallback message="Loading analytics..." />}>
                            <AnalyticsDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      } 
                    />

                    {/* Error Pages */}
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    <Route path="/server-error" element={<ServerErrorPage />} />

                    {/* Redirect root to dashboard or login */}
                    <Route 
                      path="/" 
                      element={<Navigate to="/dashboard" replace />} 
                    />

                    {/* 404 - Not Found */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </CriticalPathOptimizer>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;