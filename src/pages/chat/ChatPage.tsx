<<<<<<< HEAD
// src/pages/chat/ChatPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Card, PageHeader } from './layout-components';
import { Send, User, Clock, Check, CheckCheck } from 'lucide-react';

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeWebSocket = () => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      // Attempt to reconnect after delay
      setTimeout(initializeWebSocket, 3000);
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'NEW_MESSAGE':
        handleNewMessage(data.message);
        break;
      case 'MESSAGE_READ':
        updateMessageReadStatus(data.messageId);
        break;
      default:
        break;
    }
  };

  const handleNewMessage = (message) => {
    if (message.matchId === activeConversation?.id) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update conversation list with latest message
    setConversations(prev => prev.map(conv => {
      if (conv.id === message.matchId) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount: conv.id === activeConversation?.id ? 0 : conv.unreadCount + 1
        };
      }
      return conv;
    }));
=======
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
>>>>>>> feature/security-implementation
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

<<<<<<< HEAD
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const sentMessage = await response.json();
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="flex space-x-4">
          <div className="w-1/3 h-[600px] bg-gray-200 rounded"></div>
          <div className="w-2/3 h-[600px] bg-gray-200 rounded"></div>
        </div>
=======
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
>>>>>>> feature/security-implementation
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="h-[calc(100vh-theme(space.16))]">
      <PageHeader title="Messages" />
      
      <div className="flex h-full space-x-4 bg-white rounded-lg shadow">
        {/* Conversation List */}
        <div className="w-1/3 border-r">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 ${
                    activeConversation?.id === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative">
                    {conversation.participant.photo ? (
                      <img
                        src={conversation.participant.photo}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">{conversation.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="font-medium truncate">
                        {conversation.participant.type === 'entrepreneur'
                          ? conversation.participant.projectName
                          : conversation.participant.name}
                      </p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="w-2/3 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center space-x-4">
                {activeConversation.participant.photo ? (
                  <img
                    src={activeConversation.participant.photo}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">
                    {activeConversation.participant.type === 'entrepreneur'
                      ? activeConversation.participant.projectName
                      : activeConversation.participant.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeConversation.participant.type === 'entrepreneur' 
                      ? 'Entrepreneur' 
                      : 'Funder'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === 'currentUser'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.senderId === 'currentUser' && (
                          message.read ? (
                            <CheckCheck className="w-4 h-4 opacity-75" />
                          ) : (
                            <Check className="w-4 h-4 opacity-75" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start chatting
            </div>
          )}
        </div>
=======
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
>>>>>>> feature/security-implementation
      </div>
    </div>
  );
};

export default ChatPage;