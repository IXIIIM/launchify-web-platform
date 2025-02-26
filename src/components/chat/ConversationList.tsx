<<<<<<< HEAD
// src/components/chat/ConversationList.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Archive, Star, MoreHorizontal, RefreshCcw } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Entrepreneur, Funder } from '@/types/user';

interface Conversation {
  id: string;
  participant: Entrepreneur | Funder;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  isStarred: boolean;
  isArchived: boolean;
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  activeConversationId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  activeConversationId
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const pullToRefreshRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetchConversations();
  }, []);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  };

  // Pull to refresh functionality
  useEffect(() => {
    if (!isMobile) return;

    const element = pullToRefreshRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        pullStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (pullStartY.current === 0) return;

      const pullDistance = e.touches[0].clientY - pullStartY.current;
      if (pullDistance > 0 && element.scrollTop === 0) {
        e.preventDefault();
        if (pullDistance > 70 && !isRefreshing) {
          handleRefresh();
        }
      }
    };

    const handleTouchEnd = () => {
      pullStartY.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isRefreshing]);

  const handleSwipe = async (
    conversationId: string,
    direction: 'left' | 'right',
    info: PanInfo
  ) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    if (direction === 'left' && Math.abs(info.offset.x) > 100) {
      // Archive conversation
      try {
        await fetch(`/api/conversations/${conversationId}/archive`, {
          method: 'POST'
        });
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId ? { ...c, isArchived: true } : c
          )
        );
      } catch (error) {
        console.error('Error archiving conversation:', error);
      }
    } else if (direction === 'right' && Math.abs(info.offset.x) > 100) {
      // Star conversation
      try {
        await fetch(`/api/conversations/${conversationId}/star`, {
          method: 'POST'
        });
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId ? { ...c, isStarred: !c.isStarred } : c
          )
        );
      } catch (error) {
        console.error('Error starring conversation:', error);
      }
    }
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const controls = useAnimation();

    return (
      <motion.div
        drag={isMobile ? 'x' : false}
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.7}
        onDragEnd={(event, info) => {
          const direction = info.offset.x > 0 ? 'right' : 'left';
          handleSwipe(conversation.id, direction, info);
          controls.start({ x: 0 });
        }}
        animate={controls}
        className="relative"
      >
        {/* Swipe Action Indicators */}
        <div className="absolute inset-y-0 left-0 w-full flex justify-between items-center px-4 pointer-events-none">
          <div className="bg-yellow-500 text-white p-2 rounded">
            <Star className="h-5 w-5" />
          </div>
          <div className="bg-gray-500 text-white p-2 rounded">
            <Archive className="h-5 w-5" />
          </div>
        </div>

        {/* Conversation Content */}
        <div
          className={`bg-white p-4 flex items-center space-x-4 border-b ${
            activeConversationId === conversation.id ? 'bg-blue-50' : ''
          }`}
          onClick={() => onSelectConversation(conversation.id)}
        >
          <div className="relative">
            <img
              src={conversation.participant.photo}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover"
            />
            {conversation.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                {conversation.unreadCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className="font-semibold truncate">
                {conversation.participant.type === 'entrepreneur'
                  ? (conversation.participant as Entrepreneur).projectName
                  : (conversation.participant as Funder).name}
              </h3>
              {conversation.lastMessage && (
                <span className="text-xs text-gray-500">
                  {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
          </div>

          <button
            className="p-2 hover:bg-gray-100 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedConversation(conversation);
              setShowOptions(true);
            }}
          >
            <MoreHorizontal className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </motion.div>
    );
  };

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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>

      {/* Refresh Indicator */}
      {isRefreshing && (
        <div className="flex justify-center items-center py-2 bg-gray-100">
          <RefreshCcw className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      )}

      {/* Conversations List */}
      <div
        ref={pullToRefreshRef}
        className="flex-1 overflow-y-auto overscroll-y-contain"
      >
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
          />
        ))}
      </div>

      {/* Conversation Options Bottom Sheet */}
      <BottomSheet
        isOpen={showOptions}
        onClose={() => {
          setShowOptions(false);
          setSelectedConversation(null);
        }}
        title="Conversation Options"
      >
        <div className="p-4 space-y-4">
          <button
            onClick={() => {
              if (selectedConversation) {
                handleSwipe(selectedConversation.id, 'right', { offset: { x: 150, y: 0 } } as PanInfo);
              }
              setShowOptions(false);
            }}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
          >
            <Star className="h-6 w-6 text-yellow-500" />
            <span>{selectedConversation?.isStarred ? 'Unstar' : 'Star'}</span>
          </button>
          <button
            onClick={() => {
              if (selectedConversation) {
                handleSwipe(selectedConversation.id, 'left', { offset: { x: -150, y: 0 } } as PanInfo);
              }
              setShowOptions(false);
            }}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
          >
            <Archive className="h-6 w-6 text-gray-500" />
            <span>Archive</span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default ConversationList;
=======
// Content of mobile-optimized ConversationList.tsx as shown above
>>>>>>> feature/security-implementation
