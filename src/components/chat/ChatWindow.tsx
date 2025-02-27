<<<<<<< HEAD
// src/components/chat/ChatWindow.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Paperclip, Image } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Entrepreneur, Funder } from '@/types/user';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatWindowProps {
  participant: Entrepreneur | Funder;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ participant, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Handle keyboard events on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleKeyboardShow = () => {
      // Use viewport height to detect keyboard
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const keyboardHeight = window.innerHeight - viewportHeight;
      setKeyboardHeight(keyboardHeight);
      setTimeout(scrollToBottom, 100); // Scroll after layout updates
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    // Listen for viewport changes (keyboard show/hide)
    window.visualViewport?.addEventListener('resize', handleKeyboardShow);
    window.addEventListener('focusout', handleKeyboardHide);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleKeyboardShow);
      window.removeEventListener('focusout', handleKeyboardHide);
    };
  }, [isMobile]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${participant.id}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [participant.id]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'NEW_MESSAGE':
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
        break;
      case 'TYPING_STATUS':
        setIsTyping(data.isTyping);
        break;
      // Handle other message types
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      content: newMessage,
      senderId: 'currentUser',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      const response = await fetch(`/api/messages/${participant.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const sentMessage = await response.json();
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? sentMessage : msg)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error state for failed message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'error' as Message['status'] }
            : msg
        )
      );
    }
  };

  const handleAttachment = async (type: 'file' | 'image') => {
    setShowAttachmentOptions(false);
    // Implement file/image upload
  };

  const MessageStatusIcon = ({ status }: { status: Message['status'] }) => {
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-gray-400 animate-spin" />;
      case 'sent':
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
      case 'delivered':
        return <div className="w-2 h-2 rounded-full bg-blue-400" />;
      case 'read':
        return <div className="w-2 h-2 rounded-full bg-green-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        {isMobile && onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <img
          src={participant.photo}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="ml-3">
          <h3 className="font-semibold">
            {participant.type === 'entrepreneur'
              ? (participant as Entrepreneur).projectName
              : (participant as Funder).name}
          </h3>
          {isTyping ? (
            <p className="text-sm text-blue-600">Typing...</p>
          ) : (
            <p className="text-sm text-gray-500">
              {participant.type === 'entrepreneur' ? 'Entrepreneur' : 'Funder'}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ paddingBottom: isMobile ? `${keyboardHeight}px` : undefined }}
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg space-y-1 ${
                message.senderId === 'currentUser'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border'
              }`}
            >
              <p className="break-words">{message.content}</p>
              <div className="flex items-center justify-end space-x-1">
                <span className="text-xs opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {message.senderId === 'currentUser' && (
                  <MessageStatusIcon status={message.status} />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachmentOptions(true)}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 max-h-32 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="px-4"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Attachment Options Bottom Sheet */}
      <BottomSheet
        isOpen={showAttachmentOptions}
        onClose={() => setShowAttachmentOptions(false)}
        title="Add Attachment"
      >
        <div className="p-4 space-y-4">
          <button
            onClick={() => handleAttachment('image')}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
          >
            <Image className="h-6 w-6 text-blue-600" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => handleAttachment('file')}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
          >
            <Paperclip className="h-6 w-6 text-blue-600" />
            <span>Upload File</span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default ChatWindow;
=======
// Content of mobile-optimized ChatWindow.tsx as shown above
>>>>>>> feature/security-implementation
