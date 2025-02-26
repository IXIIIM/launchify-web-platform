<<<<<<< HEAD
// src/server/middleware/securityLogging.ts
=======
>>>>>>> feature/security-implementation
import { logSecurityEvent } from '../services/SecurityLoggingService';

// Authentication logging
export const logAuthAttempt = logSecurityEvent(
  'auth_attempt',
  'low',
  (req) => `Authentication attempt for user: ${req.body.email}`,
  (req) => ({
    success: false,
    method: 'password',
    emailProvided: req.body.email
  })
);

export const logFailedLogin = logSecurityEvent(
  'failed_login',
  'medium',
  (req) => `Failed login attempt for user: ${req.body.email}`,
  (req) => ({
    method: 'password',
    emailProvided: req.body.email,
    reason: req.authError || 'Invalid credentials'
  })
);

export const logSuccessfulLogin = logSecurityEvent(
  'successful_login',
  'low',
  (req) => `Successful login for user: ${req.user.email}`,
  (req) => ({
    userId: req.user.id,
    method: 'password'
  })
);

// API rate limiting
export const logRateLimit = logSecurityEvent(
  'api_rate_limit',
  'medium',
  (req) => `Rate limit exceeded for endpoint: ${req.originalUrl}`,
  (req) => ({
    endpoint: req.originalUrl,
    method: req.method,
    limit: req.rateLimit
  })
);

// Profile changes
export const logProfileChange = logSecurityEvent(
  'profile_update',
  'medium',
  (req) => `Profile update for user: ${req.user.id}`,
  (req) => ({
    userId: req.user.id,
    changedFields: Object.keys(req.body),
    previousValues: req.previousProfile
  })
);

// Subscription changes
export const logSubscriptionChange = logSecurityEvent(
  'subscription_change',
  'medium',
  (req) => `Subscription change for user: ${req.user.id}`,
  (req) => ({
    userId: req.user.id,
    previousTier: req.user.subscriptionTier,
    newTier: req.body.tier,
    reason: req.body.reason
  })
);

// Admin actions
export const logAdminAction = logSecurityEvent(
  'admin_action',
  'high',
  (req) => `Admin action performed by: ${req.user.id}`,
  (req) => ({
    adminId: req.user.id,
    action: req.adminAction,
    targetId: req.params.id,
    changes: req.body
  })
);

// Document access
export const logDocumentAccess = logSecurityEvent(
  'document_access',
  'medium',
  (req) => `Document access: ${req.params.documentId}`,
  (req) => ({
    userId: req.user.id,
    documentId: req.params.documentId,
    documentType: req.documentType,
    accessType: req.method
  })
);

// Data export
export const logDataExport = logSecurityEvent(
  'data_export',
  'high',
  (req) => `Data export by user: ${req.user.id}`,
  (req) => ({
    userId: req.user.id,
    dataType: req.params.type,
    format: req.query.format,
    filters: req.query
  })
);

// Verification actions
export const logVerificationAction = logSecurityEvent(
  'verification_action',
  'medium',
  (req) => `Verification ${req.body.action} for user: ${req.params.userId}`,
  (req) => ({
    userId: req.params.userId,
    action: req.body.action,
    verificationType: req.body.type,
    reviewerId: req.user.id,
    decision: req.body.decision
  })
);