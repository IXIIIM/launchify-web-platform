import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

interface DecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private prisma: PrismaClient;
  private userSocketMap: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private socketUserMap: Map<string, string> = new Map(); // socketId -> userId

  constructor(server: HttpServer, prisma: PrismaClient) {
    this.prisma = prisma;
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`New socket connection: ${socket.id}`);

      // Authenticate user via token
      socket.on('authenticate', (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
          const userId = decoded.userId;

          // Store socket mapping
          this.addUserSocket(userId, socket.id);
          
          // Join user to their personal room
          socket.join(`user:${userId}`);
          
          console.log(`User ${userId} authenticated on socket ${socket.id}`);
          
          // Acknowledge successful authentication
          socket.emit('authenticated', { success: true });

          // Handle disconnection
          socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            this.removeUserSocket(userId, socket.id);
          });

          // Handle joining chat rooms
          socket.on('join-chat-room', (roomId: string) => {
            socket.join(`chat:${roomId}`);
            console.log(`User ${userId} joined chat room ${roomId}`);
          });

          // Handle leaving chat rooms
          socket.on('leave-chat-room', (roomId: string) => {
            socket.leave(`chat:${roomId}`);
            console.log(`User ${userId} left chat room ${roomId}`);
          });

        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authenticated', { 
            success: false, 
            error: 'Authentication failed' 
          });
        }
      });
    });
  }

  // Add a socket ID to a user's list of active sockets
  private addUserSocket(userId: string, socketId: string): void {
    // Update userSocketMap
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, []);
    }
    this.userSocketMap.get(userId)?.push(socketId);

    // Update socketUserMap
    this.socketUserMap.set(socketId, userId);
  }

  // Remove a socket ID from a user's list of active sockets
  private removeUserSocket(userId: string, socketId: string): void {
    // Update userSocketMap
    const userSockets = this.userSocketMap.get(userId) || [];
    const updatedSockets = userSockets.filter(id => id !== socketId);
    
    if (updatedSockets.length === 0) {
      this.userSocketMap.delete(userId);
    } else {
      this.userSocketMap.set(userId, updatedSockets);
    }

    // Update socketUserMap
    this.socketUserMap.delete(socketId);
  }

  // Send a message to a specific chat room
  public sendMessageToRoom(roomId: string, event: string, data: any): void {
    this.io.to(`chat:${roomId}`).emit(event, data);
  }

  // Send a notification to a specific user
  public sendNotificationToUser(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Send a notification to multiple users
  public sendNotificationToUsers(userIds: string[], notification: any): void {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Update unread count for a user
  public updateUnreadCount(userId: string, count: number): void {
    this.io.to(`user:${userId}`).emit('unread-count', { count });
  }

  // Send typing indicator to a chat room
  public sendTypingIndicator(roomId: string, userId: string, isTyping: boolean): void {
    this.io.to(`chat:${roomId}`).emit('typing', { userId, isTyping });
  }

  // Send online status updates to interested parties
  public updateOnlineStatus(userId: string, isOnline: boolean): void {
    // Emit to all rooms the user is part of
    this.io.emit('user-status', { userId, isOnline });
  }

  // Check if a user is online (has at least one active socket)
  public isUserOnline(userId: string): boolean {
    return this.userSocketMap.has(userId) && 
           (this.userSocketMap.get(userId)?.length || 0) > 0;
  }

  // Get all online users
  public getOnlineUsers(): string[] {
    return Array.from(this.userSocketMap.keys());
  }

  // Get the socket server instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketService; 