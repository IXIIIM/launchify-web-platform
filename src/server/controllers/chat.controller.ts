import { Request, Response } from 'express';
import { ChatService, ChatRoomType } from '../services/chat/ChatService';
import { WebSocketService } from '../websocket/WebSocketService';
import { NotificationService } from '../notifications/NotificationService';
import { AuthRequest } from '../middleware/auth';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    const wsService = new WebSocketService();
    const notificationService = new NotificationService();
    this.chatService = new ChatService(wsService, notificationService);
  }

  /**
   * Create a new chat room
   * @route POST /api/chat/rooms
   */
  async createChatRoom(req: AuthRequest, res: Response) {
    try {
      const { name, type, participantIds, matchId } = req.body;
      const userId = req.user.id;

      if (!name || !type || !participantIds) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and participant IDs are required'
        });
      }

      if (!Object.values(ChatRoomType).includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid chat room type'
        });
      }

      if (!Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one participant is required'
        });
      }

      const chatRoom = await this.chatService.createChatRoom(
        name,
        type,
        userId,
        participantIds,
        matchId
      );

      return res.status(201).json({
        success: true,
        message: 'Chat room created successfully',
        data: chatRoom
      });
    } catch (error: any) {
      console.error('Error creating chat room:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create chat room'
      });
    }
  }

  /**
   * Get all chat rooms for the current user
   * @route GET /api/chat/rooms
   */
  async getChatRooms(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;
      const chatRooms = await this.chatService.getChatRooms(userId);

      return res.status(200).json({
        success: true,
        data: chatRooms
      });
    } catch (error: any) {
      console.error('Error getting chat rooms:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get chat rooms'
      });
    }
  }

  /**
   * Get a chat room by ID
   * @route GET /api/chat/rooms/:id
   */
  async getChatRoom(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const chatRoom = await this.chatService.getChatRoom(id, userId);

      return res.status(200).json({
        success: true,
        data: chatRoom
      });
    } catch (error: any) {
      console.error('Error getting chat room:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get chat room'
      });
    }
  }

  /**
   * Send a message to a chat room
   * @route POST /api/chat/rooms/:id/messages
   */
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content, attachments } = req.body;
      const userId = req.user.id;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      const message = await this.chatService.sendMessage(
        id,
        userId,
        content,
        attachments || []
      );

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message'
      });
    }
  }

  /**
   * Get messages for a chat room
   * @route GET /api/chat/rooms/:id/messages
   */
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { page = '1', limit = '20' } = req.query;
      const userId = req.user.id;

      const messages = await this.chatService.getMessages(
        id,
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error: any) {
      console.error('Error getting messages:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get messages'
      });
    }
  }

  /**
   * Mark messages as read
   * @route POST /api/chat/rooms/:id/read
   */
  async markMessagesAsRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.chatService.markMessagesAsRead(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Messages marked as read',
        data: result
      });
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark messages as read'
      });
    }
  }

  /**
   * Add participants to a chat room
   * @route POST /api/chat/rooms/:id/participants
   */
  async addParticipants(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      const userId = req.user.id;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs are required'
        });
      }

      const chatRoom = await this.chatService.addParticipants(id, userIds, userId);

      return res.status(200).json({
        success: true,
        message: 'Participants added successfully',
        data: chatRoom
      });
    } catch (error: any) {
      console.error('Error adding participants:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to add participants'
      });
    }
  }

  /**
   * Remove a participant from a chat room
   * @route DELETE /api/chat/rooms/:id/participants/:userId
   */
  async removeParticipant(req: AuthRequest, res: Response) {
    try {
      const { id, userId: participantId } = req.params;
      const userId = req.user.id;

      const result = await this.chatService.removeParticipant(id, participantId, userId);

      return res.status(200).json({
        success: true,
        message: 'Participant removed successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error removing participant:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove participant'
      });
    }
  }

  /**
   * Leave a chat room
   * @route DELETE /api/chat/rooms/:id/leave
   */
  async leaveChatRoom(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.chatService.leaveChatRoom(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Left chat room successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error leaving chat room:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to leave chat room'
      });
    }
  }

  /**
   * Create a chat room for a match
   * @route POST /api/chat/match/:matchId
   */
  async createMatchChatRoom(req: AuthRequest, res: Response) {
    try {
      const { matchId } = req.params;
      const { entrepreneurId, funderId } = req.body;
      
      if (!entrepreneurId || !funderId) {
        return res.status(400).json({
          success: false,
          message: 'Entrepreneur ID and funder ID are required'
        });
      }

      const chatRoom = await this.chatService.createMatchChatRoom(
        matchId,
        entrepreneurId,
        funderId
      );

      return res.status(201).json({
        success: true,
        message: 'Match chat room created successfully',
        data: chatRoom
      });
    } catch (error: any) {
      console.error('Error creating match chat room:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create match chat room'
      });
    }
  }
} 