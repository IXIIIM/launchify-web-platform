import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Initialize environment variables first
dotenv.config();

// Initialize database client
const prisma = new PrismaClient();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Launchify API',
    version: '1.0.0',
    description: 'API server for the Launchify platform',
    endpoints: {
      '/': 'This documentation',
      '/health': 'Server health status',
      '/api/auth': 'Authentication endpoints',
      '/api/users': 'User management',
      '/api/matching': 'Match finding and management',
      '/api/messages': 'Messaging system',
      '/api/subscriptions': 'Subscription management'
    }
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      database: 'connected'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

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
});

export default server;