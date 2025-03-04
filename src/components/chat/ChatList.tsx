// src/components/chat/ChatList.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  ListItemButton,
  Avatar, 
  Typography, 
  Badge, 
  Divider, 
  Box, 
  IconButton, 
  TextField, 
  InputAdornment,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { Chat } from '../../services/ChatService';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  chats: Chat[];
  loading: boolean;
  error: Error | null;
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
  onNewChat?: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  loading,
  error,
  onChatSelect,
  selectedChatId,
  onNewChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    
    // Search in chat title
    if (chat.title && chat.title.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in participant names
    return chat.participants.some(
      participant => participant.name.toLowerCase().includes(searchLower)
    );
  });
  
  // Get chat title or participant name for direct chats
  const getChatTitle = (chat: Chat): string => {
    if (chat.title) {
      return chat.title;
    }
    
    // For direct chats, show the other participant's name
    // This assumes the current user is always the first participant
    if (chat.type === 'direct' && chat.participants.length > 1) {
      return chat.participants[1].name;
    }
    
    return 'Unnamed Chat';
  };
  
  // Get chat avatar
  const getChatAvatar = (chat: Chat): string | undefined => {
    if (chat.type === 'direct' && chat.participants.length > 1) {
      return chat.participants[1].avatar;
    }
    return undefined;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };
  
  // Get online status indicator
  const getStatusIndicator = (chat: Chat): React.ReactNode => {
    if (chat.type === 'direct' && chat.participants.length > 1) {
      const otherParticipant = chat.participants[1];
      
      if (otherParticipant.status === 'online') {
        return (
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'success.main',
              border: '2px solid #fff',
              position: 'absolute',
              bottom: 0,
              right: 0
            }}
          />
        );
      }
    }
    
    return null;
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRight: 1, 
        borderColor: 'divider' 
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Messages</Typography>
          <Box>
            <IconButton size="small" onClick={() => {}} aria-label="filter">
              <FilterIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={onNewChat} 
              color="primary" 
              aria-label="new chat"
              sx={{ ml: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          placeholder="Search conversations..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, color: 'error.main' }}>
          <Typography>Error loading chats: {error.message}</Typography>
        </Box>
      ) : filteredChats.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary">
            {searchQuery ? 'No chats match your search' : 'No conversations yet'}
          </Typography>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {filteredChats.map((chat) => (
            <React.Fragment key={chat.id}>
              <ListItemButton
                onClick={() => onChatSelect(chat.id)}
                selected={selectedChatId === chat.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar src={getChatAvatar(chat)}>
                      {getChatTitle(chat).charAt(0)}
                    </Avatar>
                    {getStatusIndicator(chat)}
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight={chat.unreadCount > 0 ? 'bold' : 'normal'} noWrap>
                        {getChatTitle(chat)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {chat.lastMessage ? formatTimestamp(chat.lastMessage.timestamp) : ''}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        noWrap
                        sx={{ 
                          maxWidth: '80%',
                          fontWeight: chat.unreadCount > 0 ? 'medium' : 'normal'
                        }}
                      >
                        {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                      </Typography>
                      {chat.unreadCount > 0 && (
                        <Badge
                          badgeContent={chat.unreadCount}
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default ChatList;
