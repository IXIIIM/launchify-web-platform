// src/server/services/video/SignalingService.ts
import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { WebSocketServer } from '../websocket';

const prisma = new PrismaClient();

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-response';
  fromUserId: string;
  toUserId: string;
  matchId: string;
  data: any;
}

export class SignalingService {
  private wsServer: WebSocketServer;
  private activeConnections: Map<string, Set<string>> = new Map();
  private callRequests: Map<string, string> = new Map();

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wsServer.on('connection', (ws: WebSocket, userId: string) => {
      ws.on('message', async (message: string) => {
        try {
          const data: SignalingMessage = JSON.parse(message);
          await this.handleSignalingMessage(data, userId);
        } catch (error) {
          console.error('Error handling signaling message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(userId);
      });
    });
  }

  private async handleSignalingMessage(message: SignalingMessage, fromUserId: string) {
    // Verify that users are part of the same match
    const match = await prisma.match.findFirst({
      where: {
        id: message.matchId,
        OR: [
          { userId: fromUserId, matchedWithId: message.toUserId },
          { userId: message.toUserId, matchedWithId: fromUserId }
        ],
        status: 'accepted'
      }
    });

    if (!match) {
      console.error('Unauthorized signaling message');
      return;
    }

    switch (message.type) {
      case 'call-request':
        await this.handleCallRequest(message);
        break;
      case 'call-response':
        await this.handleCallResponse(message);
        break;
      case 'offer':
        await this.relayOffer(message);
        break;
      case 'answer':
        await this.relayAnswer(message);
        break;
      case 'ice-candidate':
        await this.relayIceCandidate(message);
        break;
    }
  }

  private async handleCallRequest(message: SignalingMessage) {
    // Check if recipient is available
    const recipientConnection = this.wsServer.getConnection(message.toUserId);
    if (!recipientConnection) {
      // Recipient is offline
      this.wsServer.sendToUser(message.fromUserId, {
        type: 'call-error',
        error: 'Recipient is offline'
      });
      return;
    }

    // Store call request
    this.callRequests.set(message.toUserId, message.fromUserId);

    // Send call request to recipient
    this.wsServer.sendToUser(message.toUserId, {
      type: 'incoming-call',
      fromUserId: message.fromUserId,
      matchId: message.matchId
    });

    // Set timeout to auto-reject call after 30 seconds
    setTimeout(() => {
      if (this.callRequests.has(message.toUserId)) {
        this.callRequests.delete(message.toUserId);
        this.wsServer.sendToUser(message.fromUserId, {
          type: 'call-rejected',
          reason: 'No answer'
        });
      }
    }, 30000);
  }

  private async handleCallResponse(message: SignalingMessage) {
    const callerId = this.callRequests.get(message.fromUserId);
    if (!callerId) {
      return; // Call request expired or doesn't exist
    }

    this.callRequests.delete(message.fromUserId);

    if (message.data.accepted) {
      // Add to active connections
      this.addActiveConnection(message.fromUserId, callerId);
      
      // Notify caller that call was accepted
      this.wsServer.sendToUser(callerId, {
        type: 'call-accepted',
        fromUserId: message.fromUserId
      });

      // Log call start
      await prisma.videoCall.create({
        data: {
          matchId: message.matchId,
          initiatedBy: callerId,
          acceptedBy: message.fromUserId,
          status: 'active'
        }
      });
    } else {
      // Notify caller that call was rejected
      this.wsServer.sendToUser(callerId, {
        type: 'call-rejected',
        reason: message.data.reason || 'Declined'
      });
    }
  }

  private async relayOffer(message: SignalingMessage) {
    if (!this.hasActiveConnection(message.fromUserId, message.toUserId)) {
      return; // No active call between these users
    }

    this.wsServer.sendToUser(message.toUserId, {
      type: 'offer',
      fromUserId: message.fromUserId,
      offer: message.data
    });
  }

  private async relayAnswer(message: SignalingMessage) {
    if (!this.hasActiveConnection(message.fromUserId, message.toUserId)) {
      return;
    }

    this.wsServer.sendToUser(message.toUserId, {
      type: 'answer',
      fromUserId: message.fromUserId,
      answer: message.data
    });
  }

  private async relayIceCandidate(message: SignalingMessage) {
    if (!this.hasActiveConnection(message.fromUserId, message.toUserId)) {
      return;
    }

    this.wsServer.sendToUser(message.toUserId, {
      type: 'ice-candidate',
      fromUserId: message.fromUserId,
      candidate: message.data
    });
  }

  private addActiveConnection(user1: string, user2: string) {
    // Add bidirectional connection
    if (!this.activeConnections.has(user1)) {
      this.activeConnections.set(user1, new Set());
    }
    if (!this.activeConnections.has(user2)) {
      this.activeConnections.set(user2, new Set());
    }
    this.activeConnections.get(user1)!.add(user2);
    this.activeConnections.get(user2)!.add(user1);
  }

  private hasActiveConnection(user1: string, user2: string): boolean {
    const connections1 = this.activeConnections.get(user1);
    return connections1?.has(user2) || false;
  }

  private handleDisconnection(userId: string) {
    // End all active calls for this user
    const connections = this.activeConnections.get(userId);
    if (connections) {
      for (const otherUserId of connections) {
        // Notify other user about disconnection
        this.wsServer.sendToUser(otherUserId, {
          type: 'peer-disconnected',
          userId
        });

        // Remove from other user's connections
        const otherConnections = this.activeConnections.get(otherUserId);
        otherConnections?.delete(userId);
      }
      this.activeConnections.delete(userId);
    }

    // Clear any pending call requests
    this.callRequests.delete(userId);
  }

  public async endCall(userId: string, matchId: string) {
    const connections = this.activeConnections.get(userId);
    if (connections) {
      for (const otherUserId of connections) {
        // Notify other user about call end
        this.wsServer.sendToUser(otherUserId, {
          type: 'call-ended',
          userId
        });

        // Update call record
        await prisma.videoCall.updateMany({
          where: {
            matchId,
            status: 'active',
            OR: [
              { initiatedBy: userId, acceptedBy: otherUserId },
              { initiatedBy: otherUserId, acceptedBy: userId }
            ]
          },
          data: {
            status: 'ended',
            endedAt: new Date()
          }
        });

        // Remove connection
        connections.delete(otherUserId);
        const otherConnections = this.activeConnections.get(otherUserId);
        otherConnections?.delete(userId);
      }
    }
  }
}