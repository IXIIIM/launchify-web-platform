// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import { AuthProvider } from './context/AuthContext';
import NotificationProvider from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import ErrorBoundary from './components/error/ErrorBoundary';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import Login from './pages/auth/Login';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Error Pages
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import ServerErrorPage from './pages/ServerErrorPage';
import MaintenancePage from './pages/MaintenancePage';

// Main Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotificationDemoPage from './pages/demo/NotificationDemoPage';
// Import other pages as needed

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

const App: React.FC = () => {
  // If in maintenance mode, show maintenance page for all routes
  if (MAINTENANCE_MODE) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenancePage 
          estimatedCompletionTime="June 15, 2023 at 12:00 PM EST"
          maintenanceMessage="We're upgrading our systems to bring you new features. We'll be back online soon!"
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/login-legacy" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/forgot-password" 
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/reset-password" 
                  element={
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  } 
                />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/demo/notifications" element={
                  <ProtectedRoute>
                    <NotificationDemoPage />
                  </ProtectedRoute>
                } />
                {/* Add other protected routes here */}

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
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;