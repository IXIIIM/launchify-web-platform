import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import WebSocketService from './WebSocketService';

let webSocketService: WebSocketService | null = null;

/**
 * Initialize the WebSocket service with the HTTP server and Prisma client
 * @param server HTTP server instance
 * @param prisma Prisma client instance
 * @returns WebSocketService instance
 */
export const initializeWebSocket = (server: HttpServer, prisma: PrismaClient): WebSocketService => {
  if (!webSocketService) {
    console.log('Initializing WebSocket service...');
    webSocketService = new WebSocketService(server, prisma);
  }
  return webSocketService;
};

/**
 * Get the WebSocket service instance
 * @returns WebSocketService instance or null if not initialized
 */
export const getWebSocketService = (): WebSocketService | null => {
  return webSocketService;
};

export default {
  initializeWebSocket,
  getWebSocketService
}; 