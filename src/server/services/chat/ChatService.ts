import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/WebSocketService';
import { NotificationService } from '../notifications/NotificationService';

const prisma = new PrismaClient();

export enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

export class ChatService {
  private wsService: WebSocketService;
  private notificationService: NotificationService;

  constructor(wsService: WebSocketService, notificationService: NotificationService) {
    this.wsService = wsService;
    this.notificationService = notificationService;
  }

  /**
   * Create a new chat room
   */
  async createChatRoom(
    name: string,
    type: ChatRoomType,
    createdById: string,
    participantIds: string[],
    matchId?: string
  ) {
    try {
      // Ensure creator is included in participants
      if (!participantIds.includes(createdById)) {
        participantIds.push(createdById);
      }

      // Create chat room
      const chatRoom = await prisma.chatRoom.create({
        data: {
          name,
          type,
          createdById,
          matchId,
          participants: {
            create: participantIds.map(userId => ({
              userId,
              joinedAt: new Date()
            }))
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true
                }
              }
            }
          }
        }
      });

      // Notify participants about the new chat room
      for (const participantId of participantIds) {
        if (participantId !== createdById) {
          await this.notificationService.createNotification(
            participantId,
            'chat_room_created',
            `You've been added to a new chat: ${name}`,
            { chatRoomId: chatRoom.id }
          );

          // Send real-time notification via WebSocket
          this.wsService.sendToUser(participantId, {
            type: 'CHAT_ROOM_CREATED',
            data: {
              chatRoomId: chatRoom.id,
              name: chatRoom.name
            }
          });
        }
      }

      return chatRoom;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  /**
   * Send a message to a chat room
   */
  async sendMessage(
    chatRoomId: string,
    senderId: string,
    content: string,
    attachments: any[] = []
  ) {
    try {
      // Verify sender is a participant in the chat room
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          chatRoomId,
          userId: senderId
        }
      });

      if (!participant) {
        throw new Error('User is not a participant in this chat room');
      }

      // Create message
      const message = await prisma.chatMessage.create({
        data: {
          chatRoomId,
          senderId,
          content,
          attachments,
          status: MessageStatus.SENT
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true
            }
          }
        }
      });

      // Update chat room's last activity
      await prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: {
          lastActivityAt: new Date()
        }
      });

      // Get all participants except sender
      const participants = await prisma.chatParticipant.findMany({
        where: {
          chatRoomId,
          userId: { not: senderId }
        },
        include: {
          user: true
        }
      });

      // Send real-time message to all participants
      for (const participant of participants) {
        this.wsService.sendToUser(participant.userId, {
          type: 'NEW_MESSAGE',
          data: {
            chatRoomId,
            message
          }
        });

        // Create notification for offline users
        await this.notificationService.createNotification(
          participant.userId,
          'new_message',
          `New message from ${message.sender.name}`,
          {
            chatRoomId,
            messageId: message.id
          }
        );
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat room with pagination
   */
  async getMessages(chatRoomId: string, userId: string, page = 1, limit = 20) {
    try {
      // Verify user is a participant in the chat room
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          chatRoomId,
          userId
        }
      });

      if (!participant) {
        throw new Error('User is not a participant in this chat room');
      }

      // Get messages with pagination
      const messages = await prisma.chatMessage.findMany({
        where: {
          chatRoomId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      // Mark messages as read
      await this.markMessagesAsRead(chatRoomId, userId);

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatRoomId: string, userId: string) {
    try {
      // Update all unread messages from other users
      await prisma.chatMessage.updateMany({
        where: {
          chatRoomId,
          senderId: { not: userId },
          status: { not: MessageStatus.READ },
          recipients: {
            some: {
              userId,
              readAt: null
            }
          }
        },
        data: {
          status: MessageStatus.READ
        }
      });

      // Update recipient read status
      await prisma.messageRecipient.updateMany({
        where: {
          message: {
            chatRoomId
          },
          userId,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get chat rooms for a user
   */
  async getChatRooms(userId: string) {
    try {
      const chatRooms = await prisma.chatRoom.findMany({
        where: {
          participants: {
            some: {
              userId
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true
                }
              }
            }
          },
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          match: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          lastActivityAt: 'desc'
        }
      });

      // Get unread message counts for each chat room
      const chatRoomsWithUnreadCounts = await Promise.all(
        chatRooms.map(async (room) => {
          const unreadCount = await prisma.chatMessage.count({
            where: {
              chatRoomId: room.id,
              senderId: { not: userId },
              recipients: {
                some: {
                  userId,
                  readAt: null
                }
              }
            }
          });

          return {
            ...room,
            unreadCount
          };
        })
      );

      return chatRoomsWithUnreadCounts;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      throw error;
    }
  }

  /**
   * Get a chat room by ID
   */
  async getChatRoom(chatRoomId: string, userId: string) {
    try {
      const chatRoom = await prisma.chatRoom.findUnique({
        where: {
          id: chatRoomId
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                  userType: true
                }
              }
            }
          },
          match: true
        }
      });

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      // Verify user is a participant
      const isParticipant = chatRoom.participants.some(p => p.userId === userId);
      if (!isParticipant) {
        throw new Error('User is not a participant in this chat room');
      }

      // Get unread count
      const unreadCount = await prisma.chatMessage.count({
        where: {
          chatRoomId,
          senderId: { not: userId },
          recipients: {
            some: {
              userId,
              readAt: null
            }
          }
        }
      });

      return {
        ...chatRoom,
        unreadCount
      };
    } catch (error) {
      console.error('Error getting chat room:', error);
      throw error;
    }
  }

  /**
   * Add participants to a chat room
   */
  async addParticipants(chatRoomId: string, userIds: string[], addedById: string) {
    try {
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          participants: true
        }
      });

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      // Verify the user adding participants is a participant
      const isParticipant = chatRoom.participants.some(p => p.userId === addedById);
      if (!isParticipant) {
        throw new Error('User is not a participant in this chat room');
      }

      // Filter out users who are already participants
      const existingParticipantIds = chatRoom.participants.map(p => p.userId);
      const newUserIds = userIds.filter(id => !existingParticipantIds.includes(id));

      if (newUserIds.length === 0) {
        return chatRoom;
      }

      // Add new participants
      await prisma.chatParticipant.createMany({
        data: newUserIds.map(userId => ({
          chatRoomId,
          userId,
          joinedAt: new Date(),
          addedById
        }))
      });

      // Notify new participants
      for (const userId of newUserIds) {
        await this.notificationService.createNotification(
          userId,
          'added_to_chat',
          `You've been added to the chat: ${chatRoom.name}`,
          { chatRoomId }
        );

        this.wsService.sendToUser(userId, {
          type: 'ADDED_TO_CHAT',
          data: {
            chatRoomId,
            chatRoomName: chatRoom.name
          }
        });
      }

      // Get updated chat room
      return prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error adding participants:', error);
      throw error;
    }
  }

  /**
   * Remove a participant from a chat room
   */
  async removeParticipant(chatRoomId: string, userId: string, removedById: string) {
    try {
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          participants: true
        }
      });

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      // Verify the user removing participants is a participant
      const isParticipant = chatRoom.participants.some(p => p.userId === removedById);
      if (!isParticipant) {
        throw new Error('User is not a participant in this chat room');
      }

      // Remove participant
      await prisma.chatParticipant.deleteMany({
        where: {
          chatRoomId,
          userId
        }
      });

      // Notify removed user
      await this.notificationService.createNotification(
        userId,
        'removed_from_chat',
        `You've been removed from the chat: ${chatRoom.name}`,
        { chatRoomId }
      );

      this.wsService.sendToUser(userId, {
        type: 'REMOVED_FROM_CHAT',
        data: {
          chatRoomId,
          chatRoomName: chatRoom.name
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  /**
   * Leave a chat room
   */
  async leaveChatRoom(chatRoomId: string, userId: string) {
    try {
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          participants: true
        }
      });

      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      // Verify user is a participant
      const isParticipant = chatRoom.participants.some(p => p.userId === userId);
      if (!isParticipant) {
        throw new Error('User is not a participant in this chat room');
      }

      // Remove participant
      await prisma.chatParticipant.deleteMany({
        where: {
          chatRoomId,
          userId
        }
      });

      // Notify other participants
      for (const participant of chatRoom.participants) {
        if (participant.userId !== userId) {
          await this.notificationService.createNotification(
            participant.userId,
            'user_left_chat',
            `A user has left the chat: ${chatRoom.name}`,
            { chatRoomId }
          );

          this.wsService.sendToUser(participant.userId, {
            type: 'USER_LEFT_CHAT',
            data: {
              chatRoomId,
              userId
            }
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error leaving chat room:', error);
      throw error;
    }
  }

  /**
   * Create a chat room for a match
   */
  async createMatchChatRoom(matchId: string, entrepreneurId: string, funderId: string) {
    try {
      // Check if a chat room already exists for this match
      const existingChatRoom = await prisma.chatRoom.findFirst({
        where: {
          matchId
        }
      });

      if (existingChatRoom) {
        return existingChatRoom;
      }

      // Get user details
      const [entrepreneur, funder] = await Promise.all([
        prisma.user.findUnique({
          where: { id: entrepreneurId },
          select: {
            name: true,
            entrepreneurProfile: {
              include: {
                company: true
              }
            }
          }
        }),
        prisma.user.findUnique({
          where: { id: funderId },
          select: {
            name: true,
            funderProfile: {
              include: {
                company: true
              }
            }
          }
        })
      ]);

      if (!entrepreneur || !funder) {
        throw new Error('User not found');
      }

      // Create chat room name
      const entrepreneurName = entrepreneur.entrepreneurProfile?.company?.name || entrepreneur.name;
      const funderName = funder.funderProfile?.company?.name || funder.name;
      const chatRoomName = `${entrepreneurName} & ${funderName}`;

      // Create chat room
      return this.createChatRoom(
        chatRoomName,
        ChatRoomType.DIRECT,
        entrepreneurId, // Creator is the entrepreneur
        [entrepreneurId, funderId],
        matchId
      );
    } catch (error) {
      console.error('Error creating match chat room:', error);
      throw error;
    }
  }
} 