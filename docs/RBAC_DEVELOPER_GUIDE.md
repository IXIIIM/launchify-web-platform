# Role-Based Access Control (RBAC) Developer Guide

## Overview

The Launchify Web Platform implements a comprehensive role-based access control (RBAC) system to secure both client-side and server-side resources. This guide explains how to use the RBAC system in your development work.

## Role Hierarchy

The platform uses a hierarchical role system where higher roles inherit the permissions of lower roles:

```
SUPER_ADMIN > ADMIN > MODERATOR > USER
```

The roles are defined in the `UserRole` enum, which is available in both client and server code:

```typescript
enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}
```

## Client-Side RBAC

### Using the RoleBasedAccess Component

The `RoleBasedAccess` component provides declarative access control for UI components. It renders its children only if the current user has the required role or higher.

```tsx
import RoleBasedAccess from '@/components/admin/RoleBasedAccess';
import { UserRole } from '@/services/AdminService';

function AdminDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Only visible to ADMIN and SUPER_ADMIN users */}
      <RoleBasedAccess requiredRole={UserRole.ADMIN} fallback={<AccessDenied />}>
        <AdminControls />
      </RoleBasedAccess>
      
      {/* Only visible to MODERATOR, ADMIN, and SUPER_ADMIN users */}
      <RoleBasedAccess requiredRole={UserRole.MODERATOR} fallback={<AccessDenied />}>
        <ModeratorControls />
      </RoleBasedAccess>
    </div>
  );
}
```

#### Props

- `requiredRole`: The minimum role required to access the content
- `fallback` (optional): Component to render if the user doesn't have access
- `children`: The content to render if the user has access

### Using the useRoleAccess Hook

For more programmatic control, use the `useRoleAccess` hook:

```tsx
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';

function AdminFeature() {
  const { hasAccess, isLoading, isAuthenticated } = useRoleAccess(UserRole.ADMIN);
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  if (!hasAccess) return <AccessDenied />;
  
  return (
    <div>
      {/* Admin-only content */}
    </div>
  );
}
```

#### Return Values

- `hasAccess`: Boolean indicating if the user has the required role
- `isLoading`: Boolean indicating if the auth state is still loading
- `isAuthenticated`: Boolean indicating if the user is authenticated

## Server-Side RBAC

### Using the roleAuth Middleware

The server-side RBAC is implemented using Express middleware. There are two main middleware functions:

#### requireRole

Requires the user to have a specific role or higher:

```typescript
import { requireRole, UserRole } from '@/server/middleware/roleAuth';

// In your Express router:
router.get('/admin/dashboard', requireRole(UserRole.ADMIN), adminController.getDashboard);
```

#### requireAnyRole

Requires the user to have any of the specified roles:

```typescript
import { requireAnyRole, UserRole } from '@/server/middleware/roleAuth';

// In your Express router:
router.get('/moderation', 
  requireAnyRole([UserRole.MODERATOR, UserRole.ADMIN]), 
  moderationController.getQueue
);
```

### Access Logging

All access attempts (successful or failed) are automatically logged to the `SecurityLog` table and sent as real-time notifications via WebSockets to admin users.

## Database Schema

The User model in the Prisma schema includes a `role` field:

```prisma
model User {
  // ... other fields
  role UserRole @default(USER)
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}
```

## Applying Database Migration

When deploying to a new environment, you need to apply the migration that adds the role field:

```bash
# Apply the migration
npx prisma migrate deploy

# Run the user role update script
npx ts-node scripts/update_user_roles.ts
```

The `update_user_roles.ts` script assigns roles to existing users based on predefined criteria.

## Testing RBAC

### Testing Client-Side RBAC

Use the testing utilities to mock the authentication context:

```typescript
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/AdminService';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Set up the mock to return a user with a specific role
mockUseAuth.mockReturnValue({
  user: { id: '1', role: UserRole.ADMIN },
  isAuthenticated: true,
  isLoading: false,
  // ... other required properties
});

// Now test your component that uses RBAC
```

### Testing Server-Side RBAC

Use Express request/response mocks:

```typescript
import { requireRole, UserRole } from '@/server/middleware/roleAuth';

// Mock Express objects
const mockRequest = {
  user: { id: '1', role: UserRole.ADMIN },
  path: '/admin/dashboard',
  ip: '127.0.0.1'
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
};

const mockNext = jest.fn();

// Test the middleware
await requireRole(UserRole.ADMIN)(mockRequest, mockResponse, mockNext);
expect(mockNext).toHaveBeenCalled(); // Should pass through
```

## Best Practices

1. **Always use both client and server RBAC**: Never rely solely on client-side RBAC for security.

2. **Follow the principle of least privilege**: Assign the minimum role necessary for each feature.

3. **Test RBAC thoroughly**: Include tests for both allowed and denied access scenarios.

4. **Use the role hierarchy**: Take advantage of the role hierarchy to avoid redundant checks.

5. **Monitor access logs**: Regularly review the security logs for unauthorized access attempts.

## Troubleshooting

### Common Issues

1. **User has no role assigned**:
   - Check if the migration was applied correctly
   - Verify that the user role update script was run
   - Check if the user was created after the migration and has the default role

2. **Access denied unexpectedly**:
   - Verify the user's current role in the database
   - Check if the required role is set correctly in the component or middleware
   - Look for typos in role names (they are case-sensitive)

3. **RBAC not working on new routes**:
   - Ensure the middleware is applied to the route
   - Verify the route is registered correctly
   - Check for middleware order issues (auth middleware must run before RBAC)

### Debugging

For debugging RBAC issues, check the security logs:

```typescript
// Query security logs for a specific user
const logs = await prisma.securityLog.findMany({
  where: {
    userId: 'user-id',
    eventType: 'ROLE_ACCESS_ATTEMPT'
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 10
});
```

## Further Resources

- [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md) - Technical details of the implementation
- [AUDIT.md](./AUDIT.md) - Project audit including RBAC implementation status
- [NEXT_STEPS.md](./NEXT_STEPS.md) - Upcoming RBAC enhancements 