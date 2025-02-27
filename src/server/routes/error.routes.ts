import express from 'express';
import {
  getErrorLogs,
  getErrorLogDetails,
  exportErrorLogs,
  getErrorStats
} from '../controllers/error.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for error log endpoints
const errorLogLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests to error log endpoints, please try again later'
});

// Apply rate limiting to all error routes
router.use(errorLogLimiter);

// Require authentication for all error routes
router.use(authenticateToken);

// Get paginated error logs with filtering
router.get(
  '/',
  checkFeatureAccess('canAccessErrorLogs'),
  getErrorLogs
);

// Get detailed view of a specific error log
router.get(
  '/:id',
  checkFeatureAccess('canAccessErrorLogs'),
  getErrorLogDetails
);

// Export error logs
router.get(
  '/export',
  checkFeatureAccess('canExportErrorLogs'),
  exportErrorLogs
);

// Get error statistics
router.get(
  '/stats/overview',
  checkFeatureAccess('canAccessErrorLogs'),
  getErrorStats
);

export default router;

// Register routes in src/server/index.ts
//
// import errorRoutes from './routes/error.routes';
// app.use('/api/errors', errorRoutes);