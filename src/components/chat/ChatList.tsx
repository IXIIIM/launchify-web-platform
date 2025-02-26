// src/components/chat/ChatList.tsx

import React, { useState, useEffect } from 'react';
import { Archive, Pin, Mute, MoreHorizontal, Search } from 'lucide-react';
import { 
  SwipeableCard, 
  TouchButton, 
  TouchList, 
  TouchableOverlay,
  PullToRefresh 
} from '@/components/base/mobile';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Entrepreneur, Funder } from '@/types/user';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participant: Entrepreneur | Funder;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
}

interface ChatProps {
  onSelectConversation: (id: string) => void;
  activeConversationId?: string;
}

const ChatList: React.FC<ChatProps> = ({
  onSelectConversation,
  activeConversationId
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showOptions, setShowOptions] = useState(false);

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

  useEffect(() => {
    fetchConversations();
  }, []);

  const handlePin = async (conversation: Conversation) => {
    try {
      await fetch(`/api/conversations/${conversation.id}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned: !conversation.isPinned })
      });
      
      setConversations(prev => prev.map(c => 
        c.id === conversation.id ? { ...c, isPinned: !c.isPinned } : c
      ));
    } catch (error) {
      console.error('Error pinning conversation:', error);
    }
    setShowOptions(false);
  };

  const handleMute = async (conversation: Conversation) => {
    try {
      await fetch(`/api/conversations/${conversation.id}/mute`, {
        method: 'POST',
        body: JSON.stringify({ muted: !conversation.isMuted })
      });
      
      setConversations(prev => prev.map(c => 
        c.id === conversation.id ? { ...c, isMuted: !c.isMuted } : c
      ));
    } catch (error) {
      console.error('Error muting conversation:', error);
    }
    setShowOptions(false);
  };

  const handleArchive = async (conversation: Conversation) => {
    try {
      await fetch(`/api/conversations/${conversation.id}/archive`, {
        method: 'POST'
      });
      
      setConversations(prev => prev.map(c => 
        c.id === conversation.id ? { ...c, isArchived: true } : c
      ));
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
    setShowOptions(false);
  };

  const ConversationCard = ({ conversation }: { conversation: Conversation }) => (
    <SwipeableCard
      onSwipeLeft={() => setSelectedConversation(conversation)}
      onSwipeRight={() => conversation.isPinned ? handlePin(conversation) : handleArchive(conversation)}
      leftAction={
        <div className="bg-gray-500 text-white p-3 rounded-full">
          <MoreHorizontal className="h-6 w-6" />
        </div>
      }
      rightAction={
        <div className={`${conversation.isPinned ? 'bg-blue-500' : 'bg-gray-500'} text-white p-3 rounded-full`}>
          {conversation.isPinned ? <Pin className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
        </div>
      }
    >
      <button
        className={`w-full p-4 ${
          activeConversationId === conversation.id ? 'bg-blue-50' : ''
        }`}
        onClick={() => onSelectConversation(conversation.id)}
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={conversation.participant.photo}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover"
            />
            {conversation.unreadCount > 0 && !conversation.isMuted && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                {conversation.unreadCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className={`font-semibold truncate ${
                conversation.unreadCount > 0 && !conversation.isMuted ? 'text-black' : 'text-gray-700'
              }`}>
                {conversation.participant.type === 'entrepreneur'
                  ? (conversation.participant as Entrepreneur).projectName
                  : (conversation.participant as Funder).name}
              </h3>
              {conversation.lastMessage && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {conversation.isMuted && (
                <Mute className="h-3 w-3 text-gray-400" />
              )}
              {conversation.isPinned && (
                <Pin className="h-3 w-3 text-blue-500" />
              )}
              <p className={`text-sm truncate ${
                conversation.unreadCount > 0 && !conversation.isMuted ? 'text-black' : 'text-gray-500'
              }`}>
                {conversation.lastMessage?.content || 'No messages yet'}
              </p>
            </div>
          </div>
        </div>
      </button>
    </SwipeableCard>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filteredConversations = conversations
    .filter(c => !c.isArchived || showSearch)
    .filter(c => {
      if (!searchQuery) return true;
      const name = c.participant.type === 'entrepreneur'
        ? (c.participant as Entrepreneur).projectName
        : (c.participant as Funder).name;
      return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then sort by last message timestamp
      const aTime = a.lastMessage?.timestamp || '0';
      const bTime = b.lastMessage?.timestamp || '0';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Search Header */}
        <div className="p-4 bg-white border-b">
          {showSearch ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <TouchButton
                variant="ghost"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                Cancel
              </TouchButton>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Messages</h2>
              <TouchButton
                variant="ghost"
                size="small"
                icon={<Search className="h-5 w-5" />}
                onClick={() => setShowSearch(true)}
                aria-label="Search conversations"
              />
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <PullToRefresh onRefresh={fetchConversations}>
            <TouchList spacing="none" divider>
              {filteredConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
            </TouchList>
          </PullToRefresh>
        </div>
      </div>

      {/* Conversation Options Bottom Sheet */}
      <TouchableOverlay
        isOpen={!!selectedConversation}
        onClose={() => setSelectedConversation(null)}
        position="bottom"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Conversation Options</h3>
          <TouchList spacing="small">
            <TouchButton
              variant="ghost"
              fullWidth
              icon={<Pin className="h-5 w-5" />}
              onClick={() => selectedConversation && handlePin(selectedConversation)}
            >
              {selectedConversation?.isPinned ? 'Unpin' : 'Pin'} Conversation
            </TouchButton>
            <TouchButton
              variant="ghost"
              fullWidth
              icon={<Mute className="h-5 w-5" />}
              onClick={() => selectedConversation && handleMute(selectedConversation)}
            >
              {selectedConversation?.isMuted ? 'Unmute' : 'Mute'} Notifications
            </TouchButton>
            <TouchButton
              variant="ghost"
              fullWidth
              icon={<Archive className="h-5 w-5" />}
              onClick={() => selectedConversation && handleArchive(selectedConversation)}
              className="text-red-600"
            >
              Archive Conversation
            </TouchButton>
          </TouchList>
        </div>
      </TouchableOverlay>
    </>
  );
};

export default ChatList;