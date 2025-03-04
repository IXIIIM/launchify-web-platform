import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import matchingRoutes from './matching';
import subscriptionRoutes from './subscription';
import chatRoutes from './chat';
import analyticsRoutes from './analytics';
import settingsRoutes from './settings';
import verificationsRoutes from './verifications';
import notificationRoutes from './notifications';
import escrowRoutes from './escrow';
import documentRoutes from './documents';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', authenticateToken, userRoutes);
router.use('/matching', authenticateToken, matchingRoutes);
router.use('/subscription', authenticateToken, subscriptionRoutes);
router.use('/chat', authenticateToken, chatRoutes);
router.use('/analytics', authenticateToken, analyticsRoutes);
router.use('/settings', authenticateToken, settingsRoutes);
router.use('/verifications', authenticateToken, verificationsRoutes);
router.use('/notifications', authenticateToken, notificationRoutes);
router.use('/escrow', authenticateToken, escrowRoutes);
router.use('/documents', authenticateToken, documentRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;