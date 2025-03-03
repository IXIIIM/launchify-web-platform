import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, useMediaQuery, useTheme, Drawer, IconButton, Fab } from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon } from '@mui/icons-material';
import ChatList from '../../components/chat/ChatList';
import ChatConversation from '../../components/chat/ChatConversation';
import { useChat } from '../../hooks/useChat';
import NewChatDialog from '../../components/chat/NewChatDialog';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  
  // Mock current user ID
  const currentUserId = 'user-1';
  
  const {
    chats,
    loading,
    error,
    refreshChats,
    currentChat,
    messages,
    messagesLoading,
    messagesError,
    hasMoreMessages,
    loadMoreMessages,
    createChat,
    sendMessage,
    markAsRead,
    typingUsers
  } = useChat({
    chatId,
    autoFetch: true
  });
  
  // Handle chat selection
  const handleChatSelect = (selectedChatId: string) => {
    navigate(`/chat/${selectedChatId}`);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };
  
  // Handle back button on mobile
  const handleBack = () => {
    navigate('/chat');
  };
  
  // Handle new chat creation
  const handleCreateChat = async (participantIds: string[], initialMessage?: string) => {
    try {
      const newChat = await createChat({
        type: participantIds.length > 1 ? 'group' : 'direct',
        participantIds,
        initialMessage
      });
      
      navigate(`/chat/${newChat.id}`);
      setNewChatDialogOpen(false);
      return true;
    } catch (error) {
      console.error('Error creating chat:', error);
      return false;
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async (content: string, attachments?: File[], replyTo?: string) => {
    if (!chatId) return;
    
    try {
      await sendMessage(content, attachments, replyTo);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Toggle mobile drawer
  useEffect(() => {
    if (isMobile && chatId) {
      setMobileDrawerOpen(false);
    } else if (isMobile && !chatId) {
      setMobileDrawerOpen(true);
    }
  }, [isMobile, chatId]);
  
  // Render chat list for desktop or as a drawer for mobile
  const renderChatList = () => (
    <ChatList
      chats={chats}
      loading={loading}
      error={error}
      onChatSelect={handleChatSelect}
      selectedChatId={chatId}
      onNewChat={() => setNewChatDialogOpen(true)}
    />
  );
  
  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {isMobile ? (
        <>
          <Drawer
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            sx={{
              width: 320,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 320,
                boxSizing: 'border-box',
              },
            }}
          >
            {renderChatList()}
          </Drawer>
          
          {!chatId && !mobileDrawerOpen && (
            <Fab
              color="primary"
              aria-label="open chat list"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
            >
              <ChatIcon />
            </Fab>
          )}
        </>
      ) : (
        <Grid container sx={{ height: '100%' }}>
          <Grid item xs={4} sx={{ height: '100%', borderRight: 1, borderColor: 'divider' }}>
            {renderChatList()}
          </Grid>
          <Grid item xs={8} sx={{ height: '100%' }}>
            <ChatConversation
              chat={currentChat}
              messages={messages}
              loading={messagesLoading}
              error={messagesError}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
              onLoadMoreMessages={loadMoreMessages}
              hasMoreMessages={hasMoreMessages}
              typingUsers={typingUsers}
              onMarkAsRead={markAsRead}
              onBack={isMobile ? handleBack : undefined}
            />
          </Grid>
        </Grid>
      )}
      
      {isMobile && chatId && (
        <Box sx={{ height: '100%', width: '100%' }}>
          <ChatConversation
            chat={currentChat}
            messages={messages}
            loading={messagesLoading}
            error={messagesError}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            onLoadMoreMessages={loadMoreMessages}
            hasMoreMessages={hasMoreMessages}
            typingUsers={typingUsers}
            onMarkAsRead={markAsRead}
            onBack={handleBack}
          />
        </Box>
      )}
      
      <NewChatDialog
        open={newChatDialogOpen}
        onClose={() => setNewChatDialogOpen(false)}
        onCreateChat={handleCreateChat}
      />
    </Box>
  );
};

export default ChatPage; 