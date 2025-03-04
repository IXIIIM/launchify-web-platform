import { API_BASE_URL } from '../constants';
import { getAuthToken } from '../utils/auth';
import WebSocketService from './WebSocketService';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatType = 'direct' | 'group' | 'escrow';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  attachments?: Attachment[];
  replyTo?: string; // ID of the message being replied to
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  thumbnailUrl?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role?: 'admin' | 'member';
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  title?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  escrowId?: string; // For escrow-related chats
  documentId?: string; // For document-related chats
}

export interface CreateChatRequest {
  type: ChatType;
  title?: string;
  participantIds: string[];
  escrowId?: string;
  documentId?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  attachments?: {
    name: string;
    type: string;
    data: File | Blob;
  }[];
  replyTo?: string;
  metadata?: Record<string, any>;
}

class ChatService {
  private baseUrl: string;
  private messageListeners: Map<string, Set<(message: ChatMessage) => void>> = new Map();
  private chatUpdateListeners: Set<(chat: Chat) => void> = new Set();
  private typingStatusListeners: Map<string, Set<(userId: string, isTyping: boolean) => void>> = new Map();

  constructor() {
    this.baseUrl = `${API_BASE_URL}/chats`;
    this.initializeWebSocket();
  }

  private async getHeaders() {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private initializeWebSocket() {
    // Subscribe to message events
    WebSocketService.subscribe('message', (wsMessage) => {
      if (wsMessage.data && wsMessage.data.chatId) {
        const chatMessage = wsMessage.data as ChatMessage;
        this.notifyMessageListeners(chatMessage.chatId, chatMessage);
      }
    });

    // Subscribe to chat update events
    WebSocketService.subscribe('notification', (wsMessage) => {
      if (wsMessage.data && wsMessage.data.type === 'chat_update') {
        const chat = wsMessage.data.chat as Chat;
        this.notifyChatUpdateListeners(chat);
      }
    });

    // Subscribe to typing status events
    WebSocketService.subscribe('notification', (wsMessage) => {
      if (wsMessage.data && wsMessage.data.type === 'typing_status') {
        const { chatId, userId, isTyping } = wsMessage.data;
        this.notifyTypingStatusListeners(chatId, userId, isTyping);
      }
    });

    // Connect to WebSocket server
    WebSocketService.connect();
  }

  /**
   * Get all chats for the current user
   */
  async getChats(): Promise<Chat[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  /**
   * Get a specific chat by ID
   */
  async getChat(chatId: string): Promise<Chat> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${chatId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new chat
   */
  async createChat(request: CreateChatRequest): Promise<Chat> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to create chat: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific chat
   */
  async getMessages(chatId: string, page: number = 1, limit: number = 50): Promise<{ messages: ChatMessage[], total: number }> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${chatId}/messages?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message in a chat
   */
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      // For messages with attachments, use FormData
      if (request.attachments && request.attachments.length > 0) {
        const formData = new FormData();
        formData.append('content', request.content);
        
        if (request.replyTo) {
          formData.append('replyTo', request.replyTo);
        }
        
        if (request.metadata) {
          formData.append('metadata', JSON.stringify(request.metadata));
        }
        
        request.attachments.forEach((attachment, index) => {
          formData.append(`attachments[${index}]`, attachment.data, attachment.name);
        });
        
        const token = await getAuthToken();
        const response = await fetch(`${this.baseUrl}/${request.chatId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        return await response.json();
      } else {
        // For text-only messages, use JSON
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}/${request.chatId}/messages`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content: request.content,
            replyTo: request.replyTo,
            metadata: request.metadata
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        return await response.json();
      }
    } catch (error) {
      console.error(`Error sending message to chat ${request.chatId}:`, error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${chatId}/read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messageIds })
      });

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error marking messages as read in chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Send typing status
   */
  sendTypingStatus(chatId: string, isTyping: boolean): void {
    WebSocketService.sendMessage('notification', {
      type: 'typing_status',
      chatId,
      isTyping
    });
  }

  /**
   * Subscribe to new messages in a specific chat
   */
  onNewMessage(chatId: string, listener: (message: ChatMessage) => void): () => void {
    if (!this.messageListeners.has(chatId)) {
      this.messageListeners.set(chatId, new Set());
    }
    
    const listeners = this.messageListeners.get(chatId)!;
    listeners.add(listener);
    
    return () => {
      const listeners = this.messageListeners.get(chatId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.messageListeners.delete(chatId);
        }
      }
    };
  }

  /**
   * Subscribe to chat updates
   */
  onChatUpdate(listener: (chat: Chat) => void): () => void {
    this.chatUpdateListeners.add(listener);
    
    return () => {
      this.chatUpdateListeners.delete(listener);
    };
  }

  /**
   * Subscribe to typing status updates in a specific chat
   */
  onTypingStatus(chatId: string, listener: (userId: string, isTyping: boolean) => void): () => void {
    if (!this.typingStatusListeners.has(chatId)) {
      this.typingStatusListeners.set(chatId, new Set());
    }
    
    const listeners = this.typingStatusListeners.get(chatId)!;
    listeners.add(listener);
    
    return () => {
      const listeners = this.typingStatusListeners.get(chatId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.typingStatusListeners.delete(chatId);
        }
      }
    };
  }

  /**
   * Notify message listeners for a specific chat
   */
  private notifyMessageListeners(chatId: string, message: ChatMessage): void {
    const listeners = this.messageListeners.get(chatId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error(`Error in message listener for chat ${chatId}:`, error);
        }
      });
    }
  }

  /**
   * Notify chat update listeners
   */
  private notifyChatUpdateListeners(chat: Chat): void {
    this.chatUpdateListeners.forEach(listener => {
      try {
        listener(chat);
      } catch (error) {
        console.error('Error in chat update listener:', error);
      }
    });
  }

  /**
   * Notify typing status listeners for a specific chat
   */
  private notifyTypingStatusListeners(chatId: string, userId: string, isTyping: boolean): void {
    const listeners = this.typingStatusListeners.get(chatId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(userId, isTyping);
        } catch (error) {
          console.error(`Error in typing status listener for chat ${chatId}:`, error);
        }
      });
    }
  }

  // Mock data for development
  getMockChats(): Chat[] {
    const now = new Date();
    return [
      {
        id: 'chat-1',
        type: 'direct',
        participants: [
          {
            id: 'user-1',
            name: 'John Investor',
            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
            status: 'online'
          },
          {
            id: 'user-2',
            name: 'Jane Founder',
            avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
            status: 'offline',
            lastSeen: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
          }
        ],
        lastMessage: {
          id: 'msg-1-3',
          chatId: 'chat-1',
          senderId: 'user-1',
          senderName: 'John Investor',
          content: 'Looking forward to our meeting tomorrow!',
          timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
          status: 'delivered'
        },
        unreadCount: 0,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 'chat-2',
        type: 'escrow',
        title: 'Seed Investment Discussion',
        participants: [
          {
            id: 'user-1',
            name: 'John Investor',
            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
            status: 'online'
          },
          {
            id: 'user-3',
            name: 'Mike Startup',
            avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
            status: 'away',
            lastSeen: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
          }
        ],
        lastMessage: {
          id: 'msg-2-5',
          chatId: 'chat-2',
          senderId: 'user-3',
          senderName: 'Mike Startup',
          content: 'I\'ve updated the milestone details as requested.',
          timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          status: 'read'
        },
        unreadCount: 2,
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        escrowId: 'escrow-1'
      }
    ];
  }

  getMockMessages(chatId: string): ChatMessage[] {
    const now = new Date();
    
    if (chatId === 'chat-1') {
      return [
        {
          id: 'msg-1-1',
          chatId: 'chat-1',
          senderId: 'user-1',
          senderName: 'John Investor',
          content: 'Hi Jane, I\'m interested in your startup.',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'read'
        },
        {
          id: 'msg-1-2',
          chatId: 'chat-1',
          senderId: 'user-2',
          senderName: 'Jane Founder',
          content: 'Thanks John! I\'d be happy to discuss our vision and how your investment could help us grow.',
          timestamp: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(),
          status: 'read'
        },
        {
          id: 'msg-1-3',
          chatId: 'chat-1',
          senderId: 'user-1',
          senderName: 'John Investor',
          content: 'Looking forward to our meeting tomorrow!',
          timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
          status: 'delivered'
        }
      ];
    } else if (chatId === 'chat-2') {
      return [
        {
          id: 'msg-2-1',
          chatId: 'chat-2',
          senderId: 'user-1',
          senderName: 'John Investor',
          content: 'Mike, I\'ve reviewed your proposal and I\'m ready to set up an escrow agreement.',
          timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'read'
        },
        {
          id: 'msg-2-2',
          chatId: 'chat-2',
          senderId: 'user-3',
          senderName: 'Mike Startup',
          content: 'That\'s great news! What milestones are you thinking of?',
          timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'read'
        },
        {
          id: 'msg-2-3',
          chatId: 'chat-2',
          senderId: 'user-1',
          senderName: 'John Investor',
          content: 'I\'m thinking three milestones: MVP development, beta launch, and public release.',
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'read'
        },
        {
          id: 'msg-2-4',
          chatId: 'chat-2',
          senderId: 'user-1',
          senderName: 'John Investor',
          content: 'Can you update the milestone details in the escrow agreement?',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'read'
        },
        {
          id: 'msg-2-5',
          chatId: 'chat-2',
          senderId: 'user-3',
          senderName: 'Mike Startup',
          content: 'I\'ve updated the milestone details as requested.',
          timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          status: 'read'
        }
      ];
    }
    
    return [];
  }
}

export default new ChatService(); 