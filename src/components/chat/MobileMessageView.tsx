<<<<<<< HEAD
// src/components/chat/MobileMessageView.tsx
=======
>>>>>>> feature/security-implementation
import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import styles from './MobileMessageView.module.css';

// Message bubble component optimized for touch
const MessageBubble = ({ message, isSender, onSwipeAction }) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onSwipeAction('reply'),
    onSwipedRight: () => onSwipeAction('forward'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  return (
    <motion.div
      {...swipeHandlers}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end space-x-2 mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}
    >
      {!isSender && (
        <img
          src={message.senderPhoto}
          alt="Sender"
          className="w-8 h-8 rounded-full"
        />
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isSender
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="text-base">{message.content}</p>
        <span className="text-xs opacity-75 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </motion.div>
  );
};

// Media attachment preview
const MediaPreview = ({ files, onRemove }) => {
  return (
    <div className={styles.attachmentPreview}>
      {files.map((file, index) => (
        <div key={index} className={styles.attachmentItem}>
          <img
            src={URL.createObjectURL(file)}
            alt={`Preview ${index + 1}`}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

// Main mobile message view component
const MobileMessageView = ({ conversation, currentUser, onBack }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);
  const keyboardHeightRef = useRef(0);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  // Handle keyboard appearance
  useEffect(() => {
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      const keyboardHeight = window.innerHeight - visualViewport.height;
      if (keyboardHeight > 100) { // Keyboard is likely visible
        keyboardHeightRef.current = keyboardHeight;
        messageListRef.current.style.paddingBottom = `${keyboardHeight}px`;
        scrollToBottom();
      } else {
        messageListRef.current.style.paddingBottom = '0px';
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Message list scroll handling
  const handleScroll = () => {
    if (!messageListRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);

    // Load more messages when scrolling to top
    if (scrollTop === 0 && !isLoading) {
      loadMoreMessages();
    }
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoading || messages.length === 0) return;
    
    setIsLoading(true);
    const oldestMessageId = messages[0].id;
    
    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages?before=${oldestMessageId}`
      );
      if (!response.ok) throw new Error('Failed to load more messages');
      
      const olderMessages = await response.json();
      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        // Maintain scroll position
        const firstNewMessage = document.getElementById(olderMessages[0].id);
        if (firstNewMessage) {
          firstNewMessage.scrollIntoView();
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('content', message.trim());
      attachments.forEach(file => formData.append('attachments', file));

      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send message');

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setAttachments([]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length + attachments.length > 10) {
      alert('Maximum 10 attachments allowed');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
    event.target.value = null; // Reset input
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSwipeAction = (messageId, action) => {
    // Handle message actions (reply, forward)
    console.log(`Message ${messageId} action: ${action}`);
  };

  return (
    <div className={styles.mobileContainer}>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <button onClick={onBack} className="mr-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img
          src={conversation.participant.photo}
          alt="Profile"
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-semibold">
            {conversation.participant.name}
          </h3>
          <p className="text-sm text-gray-500">
            {conversation.participant.status}
          </p>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={messageListRef}
        onScroll={handleScroll}
        className={styles.messageList}
        data-testid="message-list"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isSender={message.senderId === currentUser.id}
              onSwipeAction={(action) => handleSwipeAction(message.id, action)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <MediaPreview
          files={attachments}
          onRemove={handleRemoveAttachment}
        />
      )}

      {/* Message Input */}
      <div className={styles.inputContainer}>
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-100 rounded-lg p-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className={styles.input}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAttachmentClick}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ImageIcon size={24} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Camera size={24} />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        data-testid="file-input"
      />

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="fixed bottom-20 right-4 bg-blue-600 text-white rounded-full p-2 shadow-lg"
          >
            ↓
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileMessageView;