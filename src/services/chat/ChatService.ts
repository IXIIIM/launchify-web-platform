import { PrismaClient } from '@prisma/client';
import { WebSocketServer } from '../websocket';
import { UsageService } from '../usage';

const prisma = new PrismaClient();

export class ChatService {
  private wsServer: WebSocketServer;
  private usageService: UsageService;

  constructor(wsServer: WebSocketServer, usageService: UsageService) {
    this.wsServer = wsServer;
    this.usageService = usageService;
  }

  async getConversations(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchedWithId: userId }
        ],
        status: 'accepted'
      },
      include: {
        user: {
          include: {
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        matchedWith: {
          include: {
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Format conversations
    const conversations = matches.map(match => {
      const otherUser = match.userId === userId ? match.matchedWith : match.user;
      const profile = otherUser.userType === 'entrepreneur' 
        ? otherUser.entrepreneurProfile 
        : otherUser.funderProfile;

      return {
        id: match.id,
        participant: {
          id: otherUser.id,
          type: otherUser.userType,
          ...profile
        },
        lastMessage: match.messages[0] || null,
        unreadCount: 0 // Will be updated below
      };
    });

    // Get unread counts
    const unreadCounts = await prisma.message.groupBy({
      by: ['matchId'],
      where: {
        receiverId: userId,
        read: false
      },
      _count: {
        id: true
      }
    });

    // Update unread counts
    unreadCounts.forEach(count => {
      const conversation = conversations.find(c => c.id === count.matchId);
      if (conversation) {
        conversation.unreadCount = count._count.id;
      }
    });

    return conversations;
  }

  async getMessages(matchId: string, userId: string, page = 1, limit = 50) {
    // Verify user is part of the match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId },
          { matchedWithId: userId }
        ]
      }
    });

    if (!match) {
      throw new Error('Not authorized to view these messages');
    }

    const messages = await prisma.message.findMany({
      where: {
        matchId
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        matchId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true
      }
    });

    // Notify senders about read status
    messages
      .filter(msg => !msg.read && msg.receiverId === userId)
      .forEach(msg => {
        this.wsServer.sendNotification(msg.senderId, {
          type: 'MESSAGE_READ',
          messageId: msg.id,
          conversationId: matchId
        });
      });

    return messages;
  }

  async sendMessage(matchId: string, senderId: string, content: string) {
    // Check if user can send messages (usage limits)
    const canSendMessage = await this.usageService.canSendMessage(senderId);
    if (!canSendMessage) {
      throw new Error('Message limit reached for your subscription tier');
    }

    // Get match details
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId: senderId },
          { matchedWithId: senderId }
        ],
        status: 'accepted'
      }
    });

    if (!match) {
      throw new Error('Not authorized to send messages in this conversation');
    }

    // Determine receiver
    const receiverId = match.userId === senderId ? match.matchedWithId : match.userId;

    // Create message
    const message = await prisma.message.create({
      data: {
        matchId,
        senderId,
        receiverId,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });

    // Track message in usage service
    await this.usageService.trackMessage(senderId);

    // Send real-time notification
    await this.wsServer.sendNotification(receiverId, {
      type: 'NEW_MESSAGE',
      content: 'You have a new message',
      messageData: message
    });

    return message;
  }

  async markAsRead(messageIds: string[], userId: string) {
    const messages = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: userId
      },
      data: {
        read: true
      }
    });

    // Notify senders
    const readMessages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        receiverId: userId
      }
    });

    readMessages.forEach(msg => {
      this.wsServer.sendNotification(msg.senderId, {
        type: 'MESSAGE_READ',
        messageId: msg.id,
        conversationId: msg.matchId
      });
    });

    return messages;
  }

  async handleTypingStatus(userId: string, matchId: string, isTyping: boolean) {
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId },
          { matchedWithId: userId }
        ]
      }
    });

    if (!match) return;

    // Send typing status to the other participant
    const recipientId = match.userId === userId ? match.matchedWithId : match.userId;
    
    this.wsServer.sendNotification(recipientId, {
      type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
      conversationId: matchId,
      userId
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId // Only sender can delete their message
      }
    });

    if (!message) {
      throw new Error('Message not found or not authorized to delete');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: '[Message deleted]',
        deleted: true
      }
    });

    // Notify the recipient
    this.wsServer.sendNotification(message.receiverId, {
      type: 'MESSAGE_DELETED',
      messageId,
      conversationId: message.matchId
    });

    return { success: true };
  }

  async searchMessages(userId: string, query: string) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        content: {
          contains: query,
          mode: 'insensitive'
        },
        deleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        match: true
      },
      take: 50
    });

    return messages;
  }
}