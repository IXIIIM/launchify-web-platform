import { useState, useEffect, useCallback } from 'react';
import ChatService, { 
  Chat, 
  ChatMessage, 
  CreateChatRequest, 
  SendMessageRequest 
} from '../services/ChatService';

interface UseChatOptions {
  chatId?: string;
  autoFetch?: boolean;
}

interface UseChatReturn {
  // Chat list state
  chats: Chat[];
  loading: boolean;
  error: Error | null;
  refreshChats: () => Promise<void>;
  
  // Current chat state
  currentChat: Chat | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  messagesError: Error | null;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  
  // Actions
  createChat: (request: CreateChatRequest) => Promise<Chat>;
  sendMessage: (content: string, attachments?: File[], replyTo?: string) => Promise<ChatMessage>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  setTypingStatus: (isTyping: boolean) => void;
  
  // Typing indicators
  typingUsers: { [userId: string]: boolean };
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { chatId, autoFetch = true } = options;
  
  // Chat list state
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Current chat state
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: boolean }>({});
  
  // Fetch all chats
  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For development, use mock data
      // In production, this would use: const fetchedChats = await ChatService.getChats();
      const fetchedChats = ChatService.getMockChats();
      setChats(fetchedChats);
      
      // If chatId is provided, set the current chat
      if (chatId) {
        const chat = fetchedChats.find(c => c.id === chatId);
        if (chat) {
          setCurrentChat(chat);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch chats'));
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);
  
  // Fetch messages for the current chat
  const fetchMessages = useCallback(async (page: number = 1) => {
    if (!chatId) return;
    
    setMessagesLoading(true);
    setMessagesError(null);
    
    try {
      // For development, use mock data
      // In production, this would use: const response = await ChatService.getMessages(chatId, page);
      const mockMessages = ChatService.getMockMessages(chatId);
      
      if (page === 1) {
        setMessages(mockMessages);
      } else {
        // In a real implementation, we would append older messages at the beginning
        // For mock data, we'll just use the same messages
        setMessages(prev => [...mockMessages, ...prev]);
      }
      
      // For mock data, we'll say there are no more messages after page 1
      setHasMoreMessages(false);
      setCurrentPage(page);
    } catch (err) {
      setMessagesError(err instanceof Error ? err : new Error('Failed to fetch messages'));
      console.error(`Error fetching messages for chat ${chatId}:`, err);
    } finally {
      setMessagesLoading(false);
    }
  }, [chatId]);
  
  // Load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (messagesLoading || !hasMoreMessages) return Promise.resolve();
    return fetchMessages(currentPage + 1);
  }, [fetchMessages, currentPage, messagesLoading, hasMoreMessages]);
  
  // Create a new chat
  const createChat = useCallback(async (request: CreateChatRequest): Promise<Chat> => {
    try {
      const newChat = await ChatService.createChat(request);
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err) {
      console.error('Error creating chat:', err);
      throw err;
    }
  }, []);
  
  // Send a message in the current chat
  const sendMessage = useCallback(async (
    content: string, 
    attachments?: File[], 
    replyTo?: string
  ): Promise<ChatMessage> => {
    if (!chatId) {
      throw new Error('No chat selected');
    }
    
    const request: SendMessageRequest = {
      chatId,
      content,
      replyTo
    };
    
    if (attachments && attachments.length > 0) {
      request.attachments = attachments.map(file => ({
        name: file.name,
        type: file.type,
        data: file
      }));
    }
    
    try {
      const message = await ChatService.sendMessage(request);
      
      // Optimistically update the messages list
      setMessages(prev => [...prev, message]);
      
      // Update the last message in the chat list
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: message,
            updatedAt: message.timestamp
          };
        }
        return chat;
      }));
      
      return message;
    } catch (err) {
      console.error(`Error sending message to chat ${chatId}:`, err);
      throw err;
    }
  }, [chatId]);
  
  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]): Promise<void> => {
    if (!chatId || messageIds.length === 0) {
      return;
    }
    
    try {
      await ChatService.markAsRead(chatId, messageIds);
      
      // Update message status locally
      setMessages(prev => prev.map(msg => {
        if (messageIds.includes(msg.id)) {
          return { ...msg, status: 'read' };
        }
        return msg;
      }));
      
      // Update unread count in the chat list
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            unreadCount: Math.max(0, chat.unreadCount - messageIds.length)
          };
        }
        return chat;
      }));
    } catch (err) {
      console.error(`Error marking messages as read in chat ${chatId}:`, err);
      throw err;
    }
  }, [chatId]);
  
  // Set typing status
  const setTypingStatus = useCallback((isTyping: boolean): void => {
    if (!chatId) return;
    ChatService.sendTypingStatus(chatId, isTyping);
  }, [chatId]);
  
  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchChats();
    }
  }, [fetchChats, autoFetch]);
  
  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages(1);
      
      // Reset typing users when changing chats
      setTypingUsers({});
    }
  }, [chatId, fetchMessages]);
  
  // Subscribe to new messages
  useEffect(() => {
    if (!chatId) return;
    
    const unsubscribe = ChatService.onNewMessage(chatId, (message) => {
      // Add the new message to the messages list
      setMessages(prev => [...prev, message]);
      
      // Update the last message in the chat list
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: message,
            unreadCount: chat.unreadCount + 1,
            updatedAt: message.timestamp
          };
        }
        return chat;
      }));
    });
    
    return unsubscribe;
  }, [chatId]);
  
  // Subscribe to chat updates
  useEffect(() => {
    const unsubscribe = ChatService.onChatUpdate((updatedChat) => {
      setChats(prev => prev.map(chat => {
        if (chat.id === updatedChat.id) {
          return updatedChat;
        }
        return chat;
      }));
      
      // Update current chat if it's the one that was updated
      if (currentChat && currentChat.id === updatedChat.id) {
        setCurrentChat(updatedChat);
      }
    });
    
    return unsubscribe;
  }, [currentChat]);
  
  // Subscribe to typing status updates
  useEffect(() => {
    if (!chatId) return;
    
    const unsubscribe = ChatService.onTypingStatus(chatId, (userId, isTyping) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
      
      // Clear typing status after a timeout
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: false
          }));
        }, 5000); // Clear after 5 seconds of inactivity
      }
    });
    
    return unsubscribe;
  }, [chatId]);
  
  return {
    // Chat list state
    chats,
    loading,
    error,
    refreshChats: fetchChats,
    
    // Current chat state
    currentChat,
    messages,
    messagesLoading,
    messagesError,
    hasMoreMessages,
    loadMoreMessages,
    
    // Actions
    createChat,
    sendMessage,
    markAsRead,
    setTypingStatus,
    
    // Typing indicators
    typingUsers
  };
} 