import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { requireAdmin } from '@/middleware/adminAuth';

const AdminInterface = lazy(() => import('@/components/admin/AdminInterface'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const SecurityAlertManagement = lazy(() => import('@/components/admin/SecurityAlertManagement'));
const VerificationQueueManagement = lazy(() => import('@/components/admin/VerificationQueueManagement'));
const SecurityLogViewer = lazy(() => import('@/components/admin/SecurityLogViewer'));

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: requireAdmin(<AdminInterface />),
    children: [
      {
        path: '',
        element: <AdminDashboard />
      },
      {
        path: 'alerts',
        element: <SecurityAlertManagement />
      },
      {
        path: 'verifications',
        element: <VerificationQueueManagement />
      },
      {
        path: 'security-logs',
        element: <SecurityLogViewer />
      }
    ]
  }
];

// Add to main routes.ts
export const routes: RouteObject[] = [
  // ... existing routes
  ...adminRoutes
];