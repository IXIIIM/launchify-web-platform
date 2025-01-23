// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect } from 'react';
import ConversationList from './components/ConversationList';
import ChatWindow from './components/ChatWindow';
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

  useEffect(() => {
    fetchConversations();
    initializeWebSocket();
  }, []);

  // Rest of the component implementation...
  // (Previous implementation preserved)

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 border-r bg-white">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation}
          onSelectConversation={setActiveConversation}
          isLoading={isLoading}
        />
      </div>
      <div className="flex-1">
        {activeConversation ? (
          <ChatWindow
            conversationId={activeConversation}
            participant={conversations.find(c => c.id === activeConversation)?.participant}
          />
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