// src/server/controllers/video-call.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebRTCConfigService } from '../services/video/WebRTCConfigService';
import { SignalingService } from '../services/video/SignalingService';

const prisma = new PrismaClient();
const webRTCConfig = new WebRTCConfigService();

interface AuthRequest extends Request {
  user: any;
}

export const getWebRTCConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = await webRTCConfig.getConfiguration();
    res.json(config);
  } catch (error) {
    console.error('Error getting WebRTC config:', error);
    res.status(500).json({ message: 'Error getting call configuration' });
  }
};

export const initiateCall = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, recipientId } = req.body;

    // Validate call access
    const hasAccess = await webRTCConfig.validateCallAccess(req.user.id, matchId);
    if (!hasAccess) {
      return res.status(403).json({
        message: 'Video calls require Gold or Platinum subscription for both users'
      });
    }

    // Check if recipient is in an active call
    const activeCall = await prisma.videoCall.findFirst({
      where: {
        OR: [
          { initiatedBy: recipientId },
          { acceptedBy: recipientId }
        ],
        status: 'active'
      }
    });

    if (activeCall) {
      return res.status(400).json({ message: 'Recipient is in another call' });
    }

    // Create call request record
    const call = await prisma.videoCall.create({
      data: {
        matchId,
        initiatedBy: req.user.id,
        status: 'requested'
      }
    });

    // Send call request through signaling service
    const signalingService = req.app.get('signalingService') as SignalingService;
    await signalingService.handleSignalingMessage({
      type: 'call-request',
      fromUserId: req.user.id,
      toUserId: recipientId,
      matchId,
      data: { callId: call.id }
    }, req.user.id);

    res.json({ callId: call.id });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ message: 'Error initiating call' });
  }
};

export const answerCall = async (req: AuthRequest, res: Response) => {
  try {
    const { callId, accept } = req.body;

    const call = await prisma.videoCall.findUnique({
      where: { id: callId },
      include: {
        match: true
      }
    });

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Verify user is the intended recipient
    if (call.match.userId !== req.user.id && call.match.matchedWithId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (accept) {
      // Update call status
      await prisma.videoCall.update({
        where: { id: callId },
        data: {
          status: 'active',
          acceptedBy: req.user.id
        }
      });

      // Send acceptance through signaling
      const signalingService = req.app.get('signalingService') as SignalingService;
      await signalingService.handleSignalingMessage({
        type: 'call-response',
        fromUserId: req.user.id,
        toUserId: call.initiatedBy,
        matchId: call.matchId,
        data: { accepted: true }
      }, req.user.id);
    } else {
      // Update call status as rejected
      await prisma.videoCall.update({
        where: { id: callId },
        data: {
          status: 'rejected',
          endedAt: new Date()
        }
      });

      // Send rejection through signaling
      const signalingService = req.app.get('signalingService') as SignalingService;
      await signalingService.handleSignalingMessage({
        type: 'call-response',
        fromUserId: req.user.id,
        toUserId: call.initiatedBy,
        matchId: call.matchId,
        data: { accepted: false }
      }, req.user.id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error answering call:', error);
    res.status(500).json({ message: 'Error answering call' });
  }
};

export const endCall = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;

    const call = await prisma.videoCall.findUnique({
      where: { id: callId }
    });

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Verify user is part of the call
    if (call.initiatedBy !== req.user.id && call.acceptedBy !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Calculate duration
    const duration = call.startedAt 
      ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000)
      : null;

    // Update call record
    await prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        duration
      }
    });

    // End call in signaling service
    const signalingService = req.app.get('signalingService') as SignalingService;
    await signalingService.endCall(req.user.id, call.matchId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ message: 'Error ending call' });
  }
};

export const logCallMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;
    const metrics = req.body;

    // Verify user is part of the call
    const call = await prisma.videoCall.findFirst({
      where: {
        id: callId,
        OR: [
          { initiatedBy: req.user.id },
          { acceptedBy: req.user.id }
        ]
      }
    });

    if (!call) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Log metrics
    await webRTCConfig.logCallQualityMetrics(callId, metrics);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging call metrics:', error);
    res.status(500).json({ message: 'Error logging metrics' });
  }
};

// src/server/routes/video-call.ts
import express from 'express';
import {
  getWebRTCConfig,
  initiateCall,
  answerCall,
  endCall,
  logCallMetrics
} from '../controllers/video-call.controller';
import { authenticateToken } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for call initiation
const callLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 call attempts per window
  message: 'Too many call attempts, please try again later'
});

// Routes
router.get('/config', authenticateToken, getWebRTCConfig);
router.post('/initiate', authenticateToken, callLimiter, initiateCall);
router.post('/answer', authenticateToken, answerCall);
router.post('/:callId/end', authenticateToken, endCall);
router.post('/:callId/metrics', authenticateToken, logCallMetrics);

export default router;