// src/server/services/video/WebRTCConfigService.ts
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class WebRTCConfigService {
  private readonly turnServerRefreshInterval = 12 * 60 * 60 * 1000; // 12 hours
  private cachedConfiguration: RTCConfiguration | null = null;
  private lastConfigUpdate: number = 0;

  async getConfiguration(): Promise<RTCConfiguration> {
    // Check if we need to refresh the configuration
    if (
      !this.cachedConfiguration ||
      Date.now() - this.lastConfigUpdate > this.turnServerRefreshInterval
    ) {
      await this.refreshConfiguration();
    }

    return this.cachedConfiguration!;
  }

  private async refreshConfiguration() {
    try {
      // Get Twilio Network Traversal Service credentials
      const token = await twilioClient.tokens.create();

      this.cachedConfiguration = {
        iceServers: [
          // Include free STUN servers
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:stun3.l.google.com:19302',
              'stun:stun4.l.google.com:19302'
            ]
          },
          // Add Twilio TURN servers
          ...token.iceServers
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        // Configure for optimal video chat
        iceCandidatePoolSize: 10
      };

      this.lastConfigUpdate = Date.now();
    } catch (error) {
      console.error('Error refreshing WebRTC configuration:', error);
      
      // Fallback to basic configuration if Twilio fails
      this.cachedConfiguration = {
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302'
            ]
          }
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 10
      };
      
      this.lastConfigUpdate = Date.now();
    }
  }

  async validateCallAccess(userId: string, matchId: string): Promise<boolean> {
    // Verify user has access to this match and subscription allows video calls
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId },
          { matchedWithId: userId }
        ],
        status: 'accepted'
      },
      include: {
        user: {
          select: {
            subscriptionTier: true
          }
        },
        matchedWith: {
          select: {
            subscriptionTier: true
          }
        }
      }
    });

    if (!match) return false;

    // Check if both users' subscription tiers allow video calls
    const allowedTiers = ['Gold', 'Platinum'];
    return (
      allowedTiers.includes(match.user.subscriptionTier) &&
      allowedTiers.includes(match.matchedWith.subscriptionTier)
    );
  }

  async logCallQualityMetrics(callId: string, metrics: CallQualityMetrics) {
    await prisma.callQualityMetric.create({
      data: {
        callId,
        packetLoss: metrics.packetLoss,
        jitter: metrics.jitter,
        roundTripTime: metrics.roundTripTime,
        audioLevel: metrics.audioLevel,
        frameRate: metrics.frameRate,
        resolution: metrics.resolution,
        timestamp: new Date()
      }
    });
  }
}

interface CallQualityMetrics {
  packetLoss: number;
  jitter: number;
  roundTripTime: number;
  audioLevel: number;
  frameRate: number;
  resolution: string;
}

// Update Prisma schema
/*
model VideoCall {
  id          String   @id @default(uuid())
  matchId     String
  initiatedBy String
  acceptedBy  String
  status      String   // active, ended, failed
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  duration    Int?     // in seconds
  quality     CallQualityMetric[]

  match       Match    @relation(fields: [matchId], references: [id])
}

model CallQualityMetric {
  id            String   @id @default(uuid())
  callId        String
  packetLoss    Float
  jitter        Float
  roundTripTime Float
  audioLevel    Float
  frameRate     Float
  resolution    String
  timestamp     DateTime

  call          VideoCall @relation(fields: [callId], references: [id])
}
*/