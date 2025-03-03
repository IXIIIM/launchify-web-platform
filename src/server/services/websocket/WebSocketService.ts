import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SocketUser {
  id: string;
  socketId: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private JWT_SECRET: string;

  constructor(server: HttpServer, jwtSecret: string) {
    this.JWT_SECRET = jwtSecret;
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Authenticate user on connection
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = verify(token, this.JWT_SECRET) as { id: string };
          const userId = decoded.id;

          // Store the connection
          this.addUserConnection(userId, socket.id);

          // Join user to their personal room
          socket.join(`user:${userId}`);

          // Notify client of successful authentication
          socket.emit('authenticated', { success: true });

          console.log(`User ${userId} authenticated on socket ${socket.id}`);

          // Update user's online status
          await this.updateUserOnlineStatus(userId, true);

          // Handle disconnection
          socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            this.removeUserConnection(userId, socket.id);

            // If user has no more active connections, update online status
            if (!this.getUserConnections(userId)?.length) {
              await this.updateUserOnlineStatus(userId, false);
            }
          });
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authenticated', { 
            success: false, 
            error: 'Authentication failed' 
          });
          socket.disconnect(true);
        }
      });

      // Handle joining chat rooms
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      // Handle leaving chat rooms
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      });

      // Handle typing indicators
      socket.on('typing', (data: { roomId: string, userId: string, isTyping: boolean }) => {
        socket.to(data.roomId).emit('user-typing', {
          userId: data.userId,
          isTyping: data.isTyping
        });
      });

      // Handle pings to keep connection alive
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Add a user connection to the tracking map
   */
  private addUserConnection(userId: string, socketId: string) {
    const connections = this.connectedUsers.get(userId) || [];
    if (!connections.includes(socketId)) {
      connections.push(socketId);
      this.connectedUsers.set(userId, connections);
    }
  }

  /**
   * Remove a user connection from the tracking map
   */
  private removeUserConnection(userId: string, socketId: string) {
    const connections = this.connectedUsers.get(userId) || [];
    const updatedConnections = connections.filter(id => id !== socketId);
    
    if (updatedConnections.length === 0) {
      this.connectedUsers.delete(userId);
    } else {
      this.connectedUsers.set(userId, updatedConnections);
    }
  }

  /**
   * Get all socket connections for a user
   */
  private getUserConnections(userId: string): string[] | undefined {
    return this.connectedUsers.get(userId);
  }

  /**
   * Update user's online status in the database
   */
  private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeen: isOnline ? undefined : new Date()
        }
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  /**
   * Send a message to a specific user
   */
  sendToUser(userId: string, data: any) {
    this.io.to(`user:${userId}`).emit('notification', data);
  }

  /**
   * Send a message to a specific room
   */
  sendToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Send a message to all connected clients
   */
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && 
           (this.connectedUsers.get(userId)?.length || 0) > 0;
  }

  /**
   * Get count of online users
   */
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get all online users
   */
  async getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }
} 