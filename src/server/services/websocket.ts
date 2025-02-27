// src/server/services/websocket.ts
import WebSocket from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

export class WebSocketService {
  private wss: WebSocket.Server;
  private clients: Map<string, Set<WebSocketClient>>;
  private pingInterval: NodeJS.Timeout;

  constructor(server: http.Server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();

    this.wss.on('connection', this.handleConnection.bind(this));

    // Setup ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((client: WebSocketClient) => {
        if (!client.isAlive) {
          client.terminate();
          return;
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000); // Check every 30 seconds

    // Clean up interval on server shutdown
    process.on('SIGTERM', () => {
      clearInterval(this.pingInterval);
      this.wss.close();
    });
  }

  private async handleConnection(ws: WebSocketClient, req: http.IncomingMessage) {
    try {
      // Extract token from query string
      const token = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('token');
      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      ws.userId = decoded.userId;
      ws.isAlive = true;

      // Add client to clients map
      if (!this.clients.has(decoded.userId)) {
        this.clients.set(decoded.userId, new Set());
      }
      this.clients.get(decoded.userId)!.add(ws);

      // Setup event handlers
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (message: string) => {
        try {
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });

      // Send pending notifications
      await this.sendPendingNotifications(ws);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(4002, 'Authentication failed');
    }
  }

  private async handleMessage(ws: WebSocketClient, message: string) {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'read':
        await this.markNotificationRead(ws.userId!, data.notificationId);
        break;

      case 'dismiss':
        await this.dismissNotification(ws.userId!, data.notificationId);
        break;

      case 'subscribe':
        await this.handleSubscription(ws.userId!, data.topics);
        break;

      default:
        throw new Error('Unknown message type');
    }
  }

  private handleDisconnection(ws: WebSocketClient) {
    if (ws.userId && this.clients.has(ws.userId)) {
      const userClients = this.clients.get(ws.userId)!;
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  private async markNotificationRead(userId: string, notificationId: string) {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId
      },
      data: { read: true }
    });

    // Broadcast update to all user's connections
    this.broadcastToUser(userId, {
      type: 'notification_updated',
      notificationId,
      update: { read: true }
    });
  }

  private async dismissNotification(userId: string, notificationId: string) {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId
      },
      data: { dismissed: true }
    });

    this.broadcastToUser(userId, {
      type: 'notification_dismissed',
      notificationId
    });
  }

  private async handleSubscription(userId: string, topics: string[]) {
    await redis.sadd(`user:${userId}:topics`, ...topics);
  }

  private async sendPendingNotifications(ws: WebSocketClient) {
    if (!ws.userId) return;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: ws.userId,
        dismissed: false,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (notifications.length > 0) {
      ws.send(JSON.stringify({
        type: 'pending_notifications',
        notifications
      }));
    }
  }

  public async sendNotification(userId: string, notification: any) {
    // Store notification in database
    const storedNotification = await prisma.notification.create({
      data: {
        ...notification,
        userId
      }
    });

    // Send to all connected clients for this user
    this.broadcastToUser(userId, {
      type: 'new_notification',
      notification: storedNotification
    });

    // If user not connected, queue for push notification
    if (!this.clients.has(userId) || this.clients.get(userId)!.size === 0) {
      await this.queuePushNotification(userId, notification);
    }
  }

  private async queuePushNotification(userId: string, notification: any) {
    const pushSubscription = await prisma.pushSubscription.findFirst({
      where: { userId }
    });

    if (pushSubscription) {
      await redis.lpush('push_notification_queue', JSON.stringify({
        subscription: pushSubscription.subscription,
        notification
      }));
    }
  }

  private broadcastToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const messageString = JSON.stringify(message);
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }

  public broadcastToTopic(topic: string, message: any) {
    redis.smembers(`topic:${topic}:users`).then(userIds => {
      userIds.forEach(userId => {
        this.broadcastToUser(userId, message);
      });
    });
  }

  public async getUserConnections(userId: string): Promise<number> {
    return this.clients.get(userId)?.size || 0;
  }

  public async disconnectUser(userId: string) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(client => {
        client.close(4000, 'User session ended');
      });
      this.clients.delete(userId);
    }
  }
}