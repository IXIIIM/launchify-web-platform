import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import ConversationList from './components/ConversationList';
import ChatWindow from './components/ChatWindow';
import MobileMessageView from '@/components/chat/MobileMessageView';
import { Entrepreneur, Funder } from '@/types/user';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participant: Entrepreneur | Funder;
  lastMessage?: Message;
  unreadCount: number;
}

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetchCurrentUser();
    fetchConversations();
    initializeWebSocket();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/current');
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeWebSocket = () => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    return () => {
      ws.close();
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'NEW_MESSAGE':
        updateConversationWithNewMessage(data.conversationId, data.message);
        break;
      case 'MESSAGE_READ':
        updateMessageReadStatus(data.conversationId, data.messageId);
        break;
    }
  };

  const updateConversationWithNewMessage = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount: conv.id === activeConversation ? 0 : conv.unreadCount + 1
        };
      }
      return conv;
    }));
  };

  const updateMessageReadStatus = (conversationId: string, messageId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          unreadCount: 0
        };
      }
      return conv;
    }));
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const activeConversationData = conversations.find(c => c.id === activeConversation);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conversation List - Hidden on mobile when conversation is active */}
      <div className={`${
        isMobile && activeConversation ? 'hidden' : 'w-full md:w-1/3'
      } border-r bg-white`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation}
          onSelectConversation={setActiveConversation}
          isLoading={isLoading}
        />
      </div>

      {/* Chat Window */}
      <div className={`${
        isMobile && !activeConversation ? 'hidden' : 'flex-1'
      }`}>
        {activeConversation ? (
          isMobile ? (
            <MobileMessageView
              conversation={activeConversationData!}
              currentUser={currentUser}
              onBack={() => setActiveConversation(null)}
            />
          ) : (
            <ChatWindow
              conversationId={activeConversation}
              participant={activeConversationData?.participant}
              currentUser={currentUser}
            />
          )
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;