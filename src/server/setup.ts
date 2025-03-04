import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { initializeWebSocket } from './websocket';

/**
 * Initialize server services
 * This function should be called after the HTTP server is created
 * @param server HTTP server instance
 */
export const initializeServices = (server: HttpServer): void => {
  const prisma = new PrismaClient();
  
  // Initialize WebSocket service
  const webSocketService = initializeWebSocket(server, prisma);
  
  console.log('All services initialized successfully');
};

/**
 * Setup graceful shutdown
 * This function should be called to handle process termination
 */
export const setupGracefulShutdown = (): void => {
  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down services...');
    
    // Add cleanup code for services here
    
    console.log('All services shut down successfully');
    process.exit(0);
  };
  
  // Listen for termination signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

export default {
  initializeServices,
  setupGracefulShutdown
}; 