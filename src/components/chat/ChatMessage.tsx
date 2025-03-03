import React from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  Tooltip, 
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  CheckCircle as ReadIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ChatMessage as ChatMessageType } from '../../services/ChatService';

interface ChatMessageProps {
  message: ChatMessageType;
  isCurrentUser: boolean;
  onReply?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  showAvatar?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  onReply,
  onDelete,
  onCopy,
  showAvatar = true
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleReply = () => {
    if (onReply) {
      onReply(message.id);
    }
    handleClose();
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    handleClose();
  };
  
  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content)
        .then(() => console.log('Message copied to clipboard'))
        .catch(err => console.error('Failed to copy message: ', err));
    }
    handleClose();
  };
  
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return '';
    }
  };
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return null;
      case 'sent':
        return <ReadIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />;
      case 'delivered':
        return <ReadIcon fontSize="small" sx={{ color: 'info.main', fontSize: 14 }} />;
      case 'read':
        return <ReadIcon fontSize="small" sx={{ color: 'success.main', fontSize: 14 }} />;
      case 'failed':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main', fontSize: 14 }} />;
      default:
        return null;
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        mb: 2,
        px: 2
      }}
    >
      {showAvatar && !isCurrentUser ? (
        <Avatar
          src={message.senderAvatar}
          alt={message.senderName}
          sx={{ mr: 1, width: 36, height: 36 }}
        >
          {message.senderName.charAt(0)}
        </Avatar>
      ) : (
        <Box sx={{ width: 36, height: 36, mr: 1 }} />
      )}
      
      <Box sx={{ maxWidth: '70%' }}>
        {!isCurrentUser && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ ml: 1, mb: 0.5, display: 'block' }}
          >
            {message.senderName}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: isCurrentUser ? 'primary.main' : 'grey.100',
              color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
              position: 'relative',
              wordBreak: 'break-word'
            }}
          >
            {message.replyTo && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  mb: 1,
                  borderLeft: '3px solid',
                  borderColor: isCurrentUser ? 'primary.light' : 'primary.main',
                }}
              >
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {/* This would be the replied-to message content */}
                  Reply reference
                </Typography>
              </Box>
            )}
            
            <Typography variant="body1">
              {message.content}
            </Typography>
            
            {message.attachments && message.attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {message.attachments.map(attachment => (
                  <Box
                    key={attachment.id}
                    component="a"
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: 'inherit',
                      textDecoration: 'none',
                      mt: 1
                    }}
                  >
                    {/* File icon would go here based on type */}
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2" noWrap>
                        {attachment.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
          
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{ 
              ml: 0.5, 
              opacity: 0, 
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 1 },
              '.message-container:hover &': { opacity: 0.5 }
            }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
            mt: 0.5,
            ml: 1
          }}
        >
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
            {formatTime(message.timestamp)}
          </Typography>
          
          {isCurrentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
              {getStatusIcon()}
            </Box>
          )}
        </Box>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isCurrentUser ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: isCurrentUser ? 'right' : 'left',
        }}
      >
        <MenuItem onClick={handleReply}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        {isCurrentUser && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ChatMessage; 