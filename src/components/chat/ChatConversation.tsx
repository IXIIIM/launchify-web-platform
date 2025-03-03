import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  InputAdornment,
  CircularProgress,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  Chip
} from '@mui/material';
import { 
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  ArrowBack as BackIcon,
  MoreVert as MoreIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { Chat, ChatMessage as ChatMessageType } from '../../services/ChatService';
import ChatMessage from './ChatMessage';

interface ChatConversationProps {
  chat: Chat | null;
  messages: ChatMessageType[];
  loading: boolean;
  error: Error | null;
  currentUserId: string;
  onSendMessage: (content: string, attachments?: File[], replyTo?: string) => Promise<void>;
  onLoadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  typingUsers: { [userId: string]: boolean };
  onBack?: () => void;
  onMarkAsRead?: (messageIds: string[]) => Promise<void>;
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  chat,
  messages,
  loading,
  error,
  currentUserId,
  onSendMessage,
  onLoadMoreMessages,
  hasMoreMessages,
  typingUsers,
  onBack,
  onMarkAsRead
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<string | undefined>(undefined);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Mark messages as read when they become visible
  useEffect(() => {
    if (!chat || !onMarkAsRead) return;
    
    const unreadMessageIds = messages
      .filter(msg => msg.senderId !== currentUserId && msg.status !== 'read')
      .map(msg => msg.id);
    
    if (unreadMessageIds.length > 0) {
      onMarkAsRead(unreadMessageIds);
    }
  }, [messages, chat, currentUserId, onMarkAsRead]);
  
  // Handle scroll to load more messages
  useEffect(() => {
    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container || !hasMoreMessages || loading) return;
      
      if (container.scrollTop === 0) {
        // Save current scroll position and height
        const scrollHeight = container.scrollHeight;
        
        // Load more messages
        onLoadMoreMessages().then(() => {
          // After loading, restore scroll position
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - scrollHeight;
          }
        });
      }
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasMoreMessages, loading, onLoadMoreMessages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    setSending(true);
    try {
      await onSendMessage(newMessage, attachments.length > 0 ? attachments : undefined, replyToMessage);
      setNewMessage('');
      setAttachments([]);
      setReplyToMessage(undefined);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...fileList]);
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleReply = (messageId: string) => {
    setReplyToMessage(messageId);
    // Focus the text field
    const textField = document.getElementById('message-input');
    if (textField) {
      textField.focus();
    }
  };
  
  const getReplyToMessage = () => {
    if (!replyToMessage) return null;
    return messages.find(msg => msg.id === replyToMessage);
  };
  
  const getTypingIndicator = () => {
    if (!chat) return null;
    
    const typingParticipants = chat.participants.filter(
      p => p.id !== currentUserId && typingUsers[p.id]
    );
    
    if (typingParticipants.length === 0) return null;
    
    let text = '';
    if (typingParticipants.length === 1) {
      text = `${typingParticipants[0].name} is typing...`;
    } else if (typingParticipants.length === 2) {
      text = `${typingParticipants[0].name} and ${typingParticipants[1].name} are typing...`;
    } else {
      text = 'Several people are typing...';
    }
    
    return (
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
        <CircleIcon sx={{ fontSize: 8, mr: 1, color: 'text.secondary', animation: 'pulse 1s infinite' }} />
        <Typography variant="caption" color="text.secondary">
          {text}
        </Typography>
      </Box>
    );
  };
  
  const getChatHeader = () => {
    if (!chat) return null;
    
    // For direct chats, show the other participant
    const otherParticipant = chat.type === 'direct' 
      ? chat.participants.find(p => p.id !== currentUserId)
      : null;
    
    const title = chat.title || (otherParticipant ? otherParticipant.name : 'Chat');
    const status = otherParticipant?.status || null;
    
    return (
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        {onBack && (
          <IconButton edge="start" onClick={onBack} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
        )}
        
        {otherParticipant ? (
          <Avatar src={otherParticipant.avatar} sx={{ mr: 2 }}>
            {otherParticipant.name.charAt(0)}
          </Avatar>
        ) : (
          <Avatar sx={{ mr: 2 }}>
            {title.charAt(0)}
          </Avatar>
        )}
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {title}
          </Typography>
          
          {status && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: status === 'online' ? 'success.main' : 'text.disabled',
                  mr: 1
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {status === 'online' ? 'Online' : 'Offline'}
                {status === 'offline' && otherParticipant?.lastSeen && (
                  ` - Last seen ${new Date(otherParticipant.lastSeen).toLocaleString()}`
                )}
              </Typography>
            </Box>
          )}
        </Box>
        
        <IconButton>
          <MoreIcon />
        </IconButton>
      </Box>
    );
  };
  
  if (!chat) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 3,
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="h6" color="text.secondary" align="center">
          Select a conversation or start a new one
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {getChatHeader()}
      
      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          bgcolor: 'background.default'
        }}
      >
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>
            <Typography>Error loading messages: {error.message}</Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 3
            }}
          >
            <Typography variant="body1" color="text.secondary" align="center">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <>
            {hasMoreMessages && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Chip
                    label="Load more messages"
                    onClick={() => onLoadMoreMessages()}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            )}
            
            {messages.map((message, index) => {
              // Determine if we should show the avatar
              // Don't show avatar if the previous message is from the same sender
              const showAvatar = index === 0 || 
                messages[index - 1].senderId !== message.senderId;
              
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isCurrentUser={message.senderId === currentUserId}
                  showAvatar={showAvatar}
                  onReply={handleReply}
                />
              );
            })}
            
            {getTypingIndicator()}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      {/* Reply to message */}
      {replyToMessage && (
        <Box
          sx={{
            p: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              ml: 2,
              p: 1,
              borderLeft: 3,
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              borderRadius: 1
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Replying to {getReplyToMessage()?.senderName}
            </Typography>
            <Typography variant="body2" noWrap>
              {getReplyToMessage()?.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setReplyToMessage(undefined)}>
            <BackIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <Box
          sx={{
            p: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          {attachments.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => handleRemoveAttachment(index)}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}
      
      {/* Message input */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <TextField
          id="message-input"
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <IconButton 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <AttachIcon />
                </IconButton>
                <IconButton disabled={sending}>
                  <EmojiIcon />
                </IconButton>
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                >
                  {sending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default ChatConversation; 