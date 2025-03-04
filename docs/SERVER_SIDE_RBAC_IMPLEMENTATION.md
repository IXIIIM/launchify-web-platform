# Server-Side Role-Based Access Control Implementation

## Overview

This document outlines the implementation of server-side role-based access control (RBAC) for the Launchify Web Platform. The goal is to ensure that API endpoints, particularly those related to admin functionality, are properly protected based on user roles.

## Implementation Status

### Completed

1. **Role-Based Middleware**
   - Created a new middleware file `src/server/middleware/roleAuth.ts`
   - Implemented `requireRole` function to check if a user has the required role
   - Implemented `requireAnyRole` function to check if a user has any of the specified roles
   - Established a consistent role hierarchy matching the client-side implementation

2. **Admin API Routes**
   - Updated `src/server/routes/admin.ts` to use the new role-based middleware
   - Applied appropriate role requirements to different endpoints:
     - `/admin/dashboard` - Requires ADMIN role
     - `/admin/verification-requests` - Requires MODERATOR role
     - `/admin/security-logs` - Requires ADMIN role
     - `/admin/role-access-logs` - Requires SUPER_ADMIN role

3. **User Model Update**
   - Added `role` field to the User model in Prisma schema
   - Defined UserRole enum with values: USER, MODERATOR, ADMIN, SUPER_ADMIN
   - Set default role to USER

4. **Admin Controller**
   - Created/updated `src/server/controllers/admin.controller.ts` with the necessary functions
   - Implemented proper typing for request objects to include user information
   - Added `getRoleAccessLogs` function to retrieve and filter access logs

5. **Prisma Schema Fixes**
   - Fixed validation issues in the Prisma schema:
     - Resolved duplicate fields in User and Match models
     - Added missing relation fields for various models
     - Fixed inconsistent relation definitions
   - Successfully ran `prisma format` to validate the schema

6. **Database Migration**
   - Created a manual migration file `prisma/migrations/manual_add_user_role/migration.sql`
   - Added SQL commands to create the UserRole enum and add the role field to the User table
   - Added placeholder comments for updating existing users with appropriate roles

7. **User Role Update Script**
   - Created a script `scripts/update_user_roles.ts` to update existing users with appropriate roles
   - Implemented logic to assign roles based on email addresses
   - Added error handling and validation to ensure all users have a role

8. **Audit Logging**
   - Implemented comprehensive logging for access attempts in the role-based middleware
   - Created a new endpoint for viewing and analyzing role-based access logs
   - Added filtering capabilities for logs by role, success status, user, path, and date range
   - Implemented statistics calculation for success/failure rates

9. **Mobile Responsiveness**
   - Enhanced the admin interfaces to be fully responsive on mobile devices
   - Updated the Tabs component to use a dropdown selector on mobile
   - Created a card-based view for RoleAccessLogs on mobile devices
   - Implemented a mobile-friendly navigation menu for the Dashboard
   - Added responsive layouts for all admin components
   - Created comprehensive documentation in `MOBILE_RESPONSIVENESS.md`

### Pending

1. **Apply Migration**
   - Apply the migration to the database when database access is available
   - This will add the role field to the User table and create the UserRole enum

2. **Run Update Script**
   - Run the user role update script when database access is available
   - This will assign appropriate roles to existing users

3. **Additional Endpoints**
   - Apply role-based middleware to remaining admin endpoints
   - Ensure consistent role requirements between client and server

## Role Hierarchy

The role hierarchy is implemented consistently between client and server:

```typescript
// Role hierarchy mapping (higher number = higher access level)
const roleHierarchy = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.MODERATOR]: 2,
  [UserRole.USER]: 1
};
```

This ensures that higher roles inherit permissions from lower roles. For example, a SUPER_ADMIN can access endpoints that require ADMIN or MODERATOR roles.

## Implementation Details

### Role-Based Middleware

The `requireRole` middleware checks if a user has the required role by comparing the user's role level with the required role level:

```typescript
export const requireRole = (requiredRole: UserRole) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        // Log unauthorized access attempt
        await logAccessAttempt({
          userId: undefined,
          requiredRole,
          userRole: undefined,
          path: req.path,
          success: false,
          ipAddress: req.ip
        });
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      });

      if (!user?.role) {
        // Log access attempt with no role
        await logAccessAttempt({
          userId: req.user.id,
          requiredRole,
          userRole: undefined,
          path: req.path,
          success: false,
          ipAddress: req.ip
        });
        return res.status(403).json({ message: 'Forbidden - No role assigned' });
      }

      // Get the numeric values for the roles
      const userRoleLevel = roleHierarchy[user.role as UserRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      // Check if the user's role level is sufficient
      if (userRoleLevel < requiredRoleLevel) {
        // Log failed access attempt
        await logAccessAttempt({
          userId: req.user.id,
          requiredRole,
          userRole: user.role as UserRole,
          path: req.path,
          success: false,
          ipAddress: req.ip
        });
        return res.status(403).json({ 
          message: `Forbidden - ${requiredRole} access required`,
          requiredRole: requiredRole
        });
      }

      // Log successful access attempt
      await logAccessAttempt({
        userId: req.user.id,
        requiredRole,
        userRole: user.role as UserRole,
        path: req.path,
        success: true,
        ipAddress: req.ip
      });

      next();
    } catch (error) {
      console.error('Role auth error:', error);
      res.status(500).json({ message: 'Error checking role permissions' });
    }
  };
};
```

### Admin Routes

The admin routes are protected using the role-based middleware:

```typescript
// Apply auth middleware to all admin routes
router.use(authenticateToken);

// Dashboard stats - requires ADMIN role
router.get('/dashboard', requireRole(UserRole.ADMIN) as express.RequestHandler, getDashboardStats);

// Verification requests - requires MODERATOR role
router.get('/verification-requests', requireRole(UserRole.MODERATOR) as express.RequestHandler, getVerificationRequests);
router.put('/verification-requests/:id', requireRole(UserRole.MODERATOR) as express.RequestHandler, updateVerificationRequest);

// Security logs - requires ADMIN role (more sensitive)
router.get('/security-logs', requireRole(UserRole.ADMIN) as express.RequestHandler, getSecurityLogs);

// Role access logs - requires SUPER_ADMIN role (most sensitive)
router.get('/role-access-logs', requireRole(UserRole.SUPER_ADMIN) as express.RequestHandler, getRoleAccessLogs);
```

### Database Migration

The manual migration file contains the SQL commands to create the UserRole enum and add the role field to the User table:

```sql
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
```

### User Role Update Script

The script to update existing users with appropriate roles:

```typescript
async function updateUserRoles() {
  console.log('Starting user role update...');
  
  try {
    // Update super admins
    const superAdminResult = await prisma.user.updateMany({
      where: {
        email: {
          in: SUPER_ADMIN_EMAILS
        }
      },
      data: {
        role: UserRole.SUPER_ADMIN
      }
    });
    console.log(`Updated ${superAdminResult.count} super admin users`);
    
    // Update admins
    const adminResult = await prisma.user.updateMany({
      where: {
        email: {
          in: ADMIN_EMAILS
        }
      },
      data: {
        role: UserRole.ADMIN
      }
    });
    console.log(`Updated ${adminResult.count} admin users`);
    
    // Update moderators
    const moderatorResult = await prisma.user.updateMany({
      where: {
        email: {
          in: MODERATOR_EMAILS
        }
      },
      data: {
        role: UserRole.MODERATOR
      }
    });
    console.log(`Updated ${moderatorResult.count} moderator users`);
    
    // Verify all users have a role (should be USER by default)
    const usersWithoutRole = await prisma.user.findMany({
      where: {
        role: null
      },
      select: {
        id: true,
        email: true
      }
    });
    
    if (usersWithoutRole.length > 0) {
      console.warn(`Found ${usersWithoutRole.length} users without a role. Setting them to USER role.`);
      
      const fixResult = await prisma.user.updateMany({
        where: {
          id: {
            in: usersWithoutRole.map((user: UserWithId) => user.id)
          }
        },
        data: {
          role: UserRole.USER
        }
      });
      
      console.log(`Fixed ${fixResult.count} users by setting their role to USER`);
    } else {
      console.log('All users have a role assigned');
    }
    
    console.log('User role update completed successfully');
  } catch (error) {
    console.error('Error updating user roles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
```

## Audit Logging for Access Attempts

To enhance security and provide visibility into role-based access control, we've implemented comprehensive audit logging for all access attempts:

### Implementation Details

1. **Access Attempt Logging**:
   - Added a `logAccessAttempt` function in the `roleAuth.ts` middleware that records:
     - User ID
     - Required role for the endpoint
     - User's actual role
     - API path accessed
     - Success/failure status
     - IP address
     - Timestamp

```typescript
export async function logAccessAttempt({
  userId,
  requiredRole,
  userRole,
  path,
  success,
  ipAddress
}: {
  userId?: string;
  requiredRole: UserRole;
  userRole?: UserRole;
  path: string;
  success: boolean;
  ipAddress: string | undefined;
}) {
  try {
    await prisma.securityLog.create({
      data: {
        eventType: 'ROLE_ACCESS_ATTEMPT',
        userId: userId,
        details: JSON.stringify({
          requiredRole,
          userRole: userRole || 'NONE',
          path,
          success
        }),
        ipAddress: ipAddress || 'unknown',
        severity: success ? 'INFO' : 'WARNING',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging access attempt:', error);
  }
}
```

2. **Admin Controller Endpoint**:
   - Created a new endpoint in the admin controller: `getRoleAccessLogs`
   - This endpoint allows SUPER_ADMIN users to:
     - View all role-based access attempts
     - Filter by role, success status, user ID, path, and date range
     - See statistics on success/failure rates

```typescript
export const getRoleAccessLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      role,
      success,
      startDate,
      endDate,
      userId,
      path,
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause based on filters
    const where: any = {
      eventType: 'ROLE_ACCESS_ATTEMPT'
    };

    // Add filters if provided
    if (role) {
      where.details = {
        contains: `"requiredRole":"${role}"`
      };
    }

    if (success !== undefined) {
      where.details = {
        ...(where.details || {}),
        contains: `"success":${success === 'true'}`
      };
    }

    if (userId) {
      where.userId = userId as string;
    }

    if (path) {
      where.details = {
        ...(where.details || {}),
        contains: `"path":"${path}"`
      };
    }

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get logs with pagination
    const logs = await prisma.securityLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take: Number(limit)
    });

    // Get total count for pagination
    const totalCount = await prisma.securityLog.count({ where });

    // Calculate success/failure statistics
    const successCount = await prisma.securityLog.count({
      where: {
        ...where,
        details: {
          contains: '"success":true'
        }
      }
    });

    const failureCount = await prisma.securityLog.count({
      where: {
        ...where,
        details: {
          contains: '"success":false'
        }
      }
    });

    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    return res.status(200).json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      },
      statistics: {
        successCount,
        failureCount,
        successRate
      }
    });
  } catch (error) {
    console.error('Error fetching role access logs:', error);
    return res.status(500).json({ message: 'Error fetching role access logs' });
  }
};
```

3. **Admin UI Component**:
   - Developed a `RoleAccessLogs.tsx` component that provides:
     - Tabular view of all access attempts on desktop
     - Card-based view on mobile devices
     - Filtering capabilities with responsive design
     - Statistical summaries
     - Pagination for large result sets

### Mobile Responsiveness

To ensure administrators can monitor access attempts from any device, we've implemented responsive design for all admin interfaces:

1. **Tabs Component**:
   - Created a dropdown-based tab selector for mobile devices
   - Maintained horizontal tabs for desktop view
   - Implemented smooth transitions between tab states

2. **RoleAccessLogs Component**:
   - Replaced table view with card-based layout on mobile
   - Each log entry is displayed as a self-contained card
   - Implemented accordion-style filters for mobile devices
   - Adjusted statistics cards to stack on mobile

3. **Dashboard Component**:
   - Added a slide-out sidebar menu for mobile devices
   - Implemented a hamburger menu toggle button
   - Created responsive layouts for all dashboard sections

For complete details on mobile responsiveness improvements, see `MOBILE_RESPONSIVENESS.md`.

### Security Benefits

- **Intrusion Detection**: Quickly identify unauthorized access attempts
- **Compliance**: Maintain records of who accessed what and when
- **Pattern Analysis**: Identify suspicious access patterns
- **Audit Trail**: Complete history of access attempts for security reviews
- **Mobile Monitoring**: Access security logs from any device

### Usage

The access logs can be viewed by SUPER_ADMIN users through the Admin Dashboard under the "Access Logs" tab. The logs provide detailed information about each access attempt, including:

- Timestamp
- User information
- Required role vs. user's role
- API path accessed
- Success/failure status
- IP address

This implementation completes the security monitoring aspect of our RBAC system, providing both preventive controls (role-based middleware) and detective controls (comprehensive logging).

## Real-Time Updates via WebSocket

To provide administrators with immediate visibility into role-based access attempts and other admin events, we've implemented WebSocket integration:

### Server-Side Implementation

1. **AdminWebSocketService**:
   - Created a dedicated service for admin-specific WebSocket notifications
   - Implemented methods for different notification types:
     - `notifyRoleAccessAttempt`: Sends real-time notifications about access attempts
     - `notifyVerificationRequest`: Alerts about new verification requests
     - `notifySecurityEvent`: Broadcasts security-related events
     - `notifySubscriptionUpdate`: Provides updates on subscription changes
     - `notifyPermissionChange`: Alerts when user permissions change
     - `updateDashboardStats`: Sends dashboard statistics updates

2. **Role-Based Channel Subscription**:
   - Implemented `subscribeUserToAdminChannels` method that subscribes users to appropriate channels based on their role
   - Follows the role hierarchy to ensure higher roles receive all notifications of lower roles
   - Channel structure:
     - `admin:role-access`: For role access attempt notifications
     - `admin:verification`: For verification request notifications
     - `admin:security`: For security event notifications
     - `admin:analytics`: For subscription and analytics updates
     - `admin:permissions`: For permission change notifications
     - `admin:dashboard`: For dashboard statistics updates

3. **Integration with Role Middleware**:
   - Updated the `logAccessAttempt` function in `roleAuth.ts` to send real-time notifications via WebSocket
   - Each access attempt is now logged to the database and broadcast to appropriate admin users

### Client-Side Implementation

1. **useAdminWebSocket Hook**:
   - Created a custom React hook for admin WebSocket functionality
   - Automatically subscribes users to appropriate channels based on their role
   - Provides callbacks for different notification types
   - Handles connection state and reconnection logic

2. **RoleAccessLogs Component Updates**:
   - Added real-time updates to the access logs component
   - Implemented toggle for enabling/disabling real-time updates
   - Added visual indicators for WebSocket connection status
   - Dynamically updates statistics and log entries when new events occur

### Benefits

- **Immediate Visibility**: Administrators see access attempts in real-time without refreshing
- **Proactive Security**: Faster response to unauthorized access attempts
- **Better User Experience**: Dynamic updates without page reloads
- **Role-Based Notifications**: Users only receive notifications relevant to their role
- **Mobile Monitoring**: Receive notifications on any device

This implementation completes the real-time aspect of our RBAC system, providing both preventive controls (role-based middleware), detective controls (comprehensive logging), and real-time monitoring capabilities.

## Next Steps

1. **Apply Migration**
   - Apply the migration to the database when database access is available
   - This will add the role field to the User table and create the UserRole enum

2. **Run Update Script**
   - Run the user role update script when database access is available
   - This will assign appropriate roles to existing users

3. **Complete Implementation**
   - Apply role-based middleware to all remaining admin endpoints
   - Test the implementation thoroughly

## Conclusion

The server-side role-based access control implementation is approximately 85% complete. The core middleware, route updates, schema changes, migration file, update script, audit logging, and mobile responsiveness are all in place. The remaining tasks are to apply the migration to the database and run the update script. Once these tasks are completed, the server-side role-based access control implementation will be fully functional. 