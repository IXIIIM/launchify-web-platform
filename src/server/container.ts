import { createContainer, asClass, asValue, InjectionMode } from 'awilix';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';

// Import services
import { WebSocketService } from './services/websocket/WebSocketService';
import { EmailService } from './services/email/EmailService';
import { NotificationService } from './services/notifications/NotificationService';
import { ChatService } from './services/chat/ChatService';
import { DocumentService } from './services/document/DocumentService';
import { EscrowService } from './services/escrow';
import { VerificationService } from './services/verification';
import { MatchingService } from './services/matching/MatchingService';
import { SubscriptionService } from './services/subscription/SubscriptionService';
import { AdminWebSocketService } from './services/websocket/AdminWebSocketService';

// Import controllers
import { NotificationController } from './controllers/notification.controller';
import { ChatController } from './controllers/chat.controller';
import { DocumentController } from './controllers/document.controller';
import { EscrowController } from './controllers/escrow.controller';
import { VerificationController } from './controllers/verification.controller';
import { MatchingController } from './controllers/matching.controller';
import { SubscriptionController } from './controllers/subscription.controller';

// Create container
const container = createContainer({
  injectionMode: InjectionMode.CLASSIC
});

// Register services and controllers
export function registerDependencies(server: Server, jwtSecret: string) {
  // Create instances that need special initialization
  const prisma = new PrismaClient();
  const wsService = new WebSocketService(server, jwtSecret);
  const emailService = new EmailService();
  
  // Register services
  container.register({
    // Core services
    prisma: asValue(prisma),
    wsService: asValue(wsService),
    emailService: asValue(emailService),
    
    // Application services
    notificationService: asClass(NotificationService).singleton(),
    chatService: asClass(ChatService).singleton(),
    documentService: asClass(DocumentService).singleton(),
    escrowService: asClass(EscrowService).singleton(),
    verificationService: asClass(VerificationService).singleton(),
    matchingService: asClass(MatchingService).singleton(),
    subscriptionService: asClass(SubscriptionService).singleton(),
    
    // Controllers
    notificationController: asClass(NotificationController).singleton(),
    chatController: asClass(ChatController).singleton(),
    documentController: asClass(DocumentController).singleton(),
    escrowController: asClass(EscrowController).singleton(),
    verificationController: asClass(VerificationController).singleton(),
    matchingController: asClass(MatchingController).singleton(),
    subscriptionController: asClass(SubscriptionController).singleton()
  });
  
  // Register WebSocket services
  container.register('webSocketService', {
    useValue: new WebSocketService(server, process.env.JWT_SECRET || 'default-secret')
  });

  container.register('adminWebSocketService', {
    useFactory: (container) => {
      const wsService = container.resolve<WebSocketService>('webSocketService');
      return new AdminWebSocketService(wsService);
    }
  });
  
  return container;
}

export { container }; 