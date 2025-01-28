import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import { Redis, RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

// Initialize environment variables first
dotenv.config();

// Import local modules with proper paths
import { WebSocketServer } from './services/websocket/WebSocketServer';
import { NotificationProcessor } from './services/notifications/NotificationProcessor';
import { SubscriptionNotificationService } from './services/notifications/SubscriptionNotificationService';

// Import routes
import authRouter from './routes/auth/auth.routes';
import userRouter from './routes/users/users.routes';
import matchingRouter from './routes/matching/matching.routes';
import subscriptionRouter from './routes/subscriptions/subscriptions.routes';
import messagesRouter from './routes/messages/messages.routes';
import analyticsRouter from './routes/analytics/analytics.routes';
import notificationRouter from './routes/notifications/notifications.routes';
import uploadRouter from './routes/upload/upload.routes';
import verificationRouter from './routes/verification/verification.routes';
import usageRouter from './routes/usage/usage.routes';
import devRouter from './routes/dev/dev.routes';

// Import middleware
import { authenticateToken } from './middleware/auth/auth.middleware';

// Initialize database client
const prisma = new PrismaClient();

// Configure Redis options
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Initialize Redis client with proper configuration
const redis = new Redis(redisConfig);

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);
app.set('wsServer', wsServer);

// Set up notification services
const notificationProcessor = new NotificationProcessor(wsServer);
const subscriptionNotifications = new SubscriptionNotificationService(wsServer);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/users', authenticateToken, userRouter);
app.use('/api/matching', authenticateToken, matchingRouter);
app.use('/api/subscriptions', authenticateToken, subscriptionRouter);
app.use('/api/messages', authenticateToken, messagesRouter);
app.use('/api/analytics', authenticateToken, analyticsRouter);
app.use('/api/notifications', authenticateToken, notificationRouter);
app.use('/api/upload', authenticateToken, uploadRouter);
app.use('/api/verification', authenticateToken, verificationRouter);
app.use('/api/usage', authenticateToken, usageRouter);

// Development routes
if (process.env.NODE_ENV === 'development') {
  app.use('/api/dev', devRouter);
}

// Global error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle shutdown gracefully
const gracefulShutdown = async () => {
  console.log('Received shutdown signal...');
  
  try {
    // Close all WebSocket connections
    await wsServer.close();
    
    // Disconnect from Redis
    await redis.quit();
    
    // Disconnect from database
    await prisma.$disconnect();
    
    // Close HTTP server
    server.close(() => {
      console.log('Server shut down successfully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`WebSocket server initialized`);
});

export default server;