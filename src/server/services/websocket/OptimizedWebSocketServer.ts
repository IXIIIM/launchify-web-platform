<<<<<<< HEAD
// src/server/services/websocket/OptimizedWebSocketServer.ts
import WebSocket from 'ws';
import http from 'http';
import { Redis } from 'ioredis';
import { RateLimiter } from '../utils/RateLimiter';
import { MessageBatcher } from '../utils/MessageBatcher';

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive: boolean;
  rateLimiter: RateLimiter;
}

export class OptimizedWebSocketServer {
  private wss: WebSocket.Server;
  private redis: Redis;
  private messageBatcher: MessageBatcher;
  private clients: Map<string, WebSocketClient>;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: http.Server, redisUrl: string) {
    this.wss = new WebSocket.Server({ server });
    this.redis = new Redis(redisUrl);
    this.clients = new Map();
    this.messageBatcher = new MessageBatcher(100); // Batch size of 100ms

    // Initialize WebSocket server
    this.setupWebSocketServer();
    
    // Start heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.checkConnections();
    }, 30000); // Check every 30 seconds
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocketClient) => {
      ws.isAlive = true;
      ws.rateLimiter = new RateLimiter(100, 60000); // 100 messages per minute

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data: string) => {
        try {
          if (!ws.rateLimiter.tryConsume()) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Rate limit exceeded'
            }));
            return;
          }

          const message = JSON.parse(data);
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
        }
      });
    });
  }

  private async handleMessage(ws: WebSocketClient, message: any) {
    // Add to message batch for processing
    this.messageBatcher.add({
      clientId: ws.userId!,
      message
    });
  }

  private checkConnections() {
    this.wss.clients.forEach((ws: WebSocketClient) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }

  public async sendNotification(userId: string, notification: any) {
    const client = this.clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      // Add to Redis pub/sub for multi-server support
      await this.redis.publish('notifications', JSON.stringify({
        userId,
        notification
      }));
    }
  }

  public async broadcastToAdmins(message: any) {
    const adminClients = Array.from(this.clients.values())
      .filter(client => client.isAdmin);

    // Batch admin messages
    this.messageBatcher.add({
      type: 'admin_broadcast',
      recipients: adminClients.map(client => client.userId!),
      message
    });
  }

  public shutdown() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    this.redis.disconnect();
  }
}

// src/server/utils/MessageBatcher.ts
export class MessageBatcher {
  private batchSize: number;
  private batch: any[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(batchSize: number) {
    this.batchSize = batchSize;
  }

  public add(message: any) {
    this.batch.push(message);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flush(), 100);
    }
  }

  private flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batch.length === 0) return;

    // Process batch
    this.processBatch([...this.batch]);
    this.batch = [];
  }

  private processBatch(messages: any[]) {
    // Group messages by type
    const groupedMessages = messages.reduce((acc, message) => {
      const key = message.type || 'default';
      acc[key] = acc[key] || [];
      acc[key].push(message);
      return acc;
    }, {});

    // Process each group
    Object.entries(groupedMessages).forEach(([type, messages]) => {
      switch (type) {
        case 'admin_broadcast':
          this.processAdminBroadcast(messages);
          break;
        case 'notification':
          this.processNotifications(messages);
          break;
        default:
          this.processDefaultMessages(messages);
      }
    });
  }

  private processAdminBroadcast(messages: any[]) {
    // Combine admin messages where possible
    const combinedMessage = {
      type: 'admin_broadcast',
      messages: messages.map(m => m.message)
    };

    // Send to all unique recipients
    const recipients = new Set(messages.flatMap(m => m.recipients));
    recipients.forEach(userId => {
      // Send combined message
    });
  }

  private processNotifications(messages: any[]) {
    // Group notifications by user
    const userNotifications = messages.reduce((acc, message) => {
      const userId = message.clientId;
      acc[userId] = acc[userId] || [];
      acc[userId].push(message.notification);
      return acc;
    }, {});

    // Send bundled notifications to each user
    Object.entries(userNotifications).forEach(([userId, notifications]) => {
      const bundledNotification = {
        type: 'notification_bundle',
        notifications,
        timestamp: new Date().toISOString()
      };
      // Send bundled notification
    });
  }

  private processDefaultMessages(messages: any[]) {
    // Process any other message types
    messages.forEach(message => {
      // Handle individual messages
    });
  }
}

// src/server/utils/RateLimiter.ts
export class RateLimiter {
  private limit: number;
  private window: number;
  private tokens: number;
  private lastRefill: number;

  constructor(limit: number, window: number) {
    this.limit = limit;
    this.window = window;
    this.tokens = limit;
    this.lastRefill = Date.now();
  }

  public tryConsume(): boolean {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }

  private refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.window * this.limit);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.limit, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

// src/server/utils/ConnectionManager.ts
export class ConnectionManager {
  private connections: Map<string, Set<WebSocket>>;
  private maxConnectionsPerUser: number;

  constructor(maxConnectionsPerUser: number = 5) {
    this.connections = new Map();
    this.maxConnectionsPerUser = maxConnectionsPerUser;
  }

  public addConnection(userId: string, connection: WebSocket): boolean {
    let userConnections = this.connections.get(userId);

    if (!userConnections) {
      userConnections = new Set();
      this.connections.set(userId, userConnections);
    }

    if (userConnections.size >= this.maxConnectionsPerUser) {
      return false;
    }

    userConnections.add(connection);
    return true;
  }

  public removeConnection(userId: string, connection: WebSocket) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(connection);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  public getUserConnections(userId: string): Set<WebSocket> | undefined {
    return this.connections.get(userId);
  }

  public broadcast(message: any, filter?: (userId: string) => boolean) {
    this.connections.forEach((connections, userId) => {
      if (!filter || filter(userId)) {
        connections.forEach(connection => {
          if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(message));
          }
        });
      }
    });
  }
}

// src/server/utils/MemoryStore.ts
export class MemoryStore {
  private store: Map<string, any>;
  private expirations: Map<string, number>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) {
    this.store = new Map();
    this.expirations = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  public set(key: string, value: any, ttlMs?: number) {
    this.store.set(key, value);
    if (ttlMs) {
      this.expirations.set(key, Date.now() + ttlMs);
    }
  }

  public get(key: string): any {
    const value = this.store.get(key);
    const expiration = this.expirations.get(key);

    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.expirations.delete(key);
      return undefined;
    }

    return value;
  }

  public delete(key: string) {
    this.store.delete(key);
    this.expirations.delete(key);
  }

  private cleanup() {
    const now = Date.now();
    this.expirations.forEach((expiration, key) => {
      if (now > expiration) {
        this.store.delete(key);
        this.expirations.delete(key);
      }
    });
  }

  public shutdown() {
    clearInterval(this.cleanupInterval);
  }
}

// src/server/services/websocket/WebSocketMetrics.ts
export class WebSocketMetrics {
  private metrics: Map<string, number>;
  private redis: Redis;

  constructor(redis: Redis) {
    this.metrics = new Map();
    this.redis = redis;
  }

  public async incrementMetric(metric: string, value: number = 1) {
    // Update local metrics
    const currentValue = this.metrics.get(metric) || 0;
    this.metrics.set(metric, currentValue + value);

    // Update Redis for cluster-wide metrics
    await this.redis.hincrby('websocket_metrics', metric, value);
  }

  public async getMetrics(): Promise<Record<string, number>> {
    // Combine local and cluster metrics
    const clusterMetrics = await this.redis.hgetall('websocket_metrics');
    const metrics: Record<string, number> = {};

    // Convert cluster metrics from string to number
    Object.entries(clusterMetrics).forEach(([key, value]) => {
      metrics[key] = parseInt(value, 10);
    });

    // Add local metrics
    this.metrics.forEach((value, key) => {
      metrics[key] = (metrics[key] || 0) + value;
    });

    return metrics;
  }

  public async resetMetrics() {
    this.metrics.clear();
    await this.redis.del('websocket_metrics');
  }
}
=======
[Previously created optimization code]
>>>>>>> feature/security-implementation
