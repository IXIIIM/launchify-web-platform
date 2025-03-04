import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Avatar,
  Typography,
  CircularProgress,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';

// Mock user data for demonstration
interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: string;
}

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateChat: (participantIds: string[], initialMessage?: string) => Promise<boolean>;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({
  open,
  onClose,
  onCreateChat
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Mock users for demonstration
  const mockUsers: User[] = [
    {
      id: 'user-2',
      name: 'Jane Founder',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      email: 'jane@example.com',
      role: 'Entrepreneur'
    },
    {
      id: 'user-3',
      name: 'Mike Startup',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      email: 'mike@example.com',
      role: 'Entrepreneur'
    },
    {
      id: 'user-4',
      name: 'Sarah Investor',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
      email: 'sarah@example.com',
      role: 'Investor'
    },
    {
      id: 'user-5',
      name: 'David Mentor',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
      email: 'david@example.com',
      role: 'Mentor'
    }
  ];

  // Simulate search API call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      const results = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setSearchLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const participantIds = selectedUsers.map(user => user.id);
      const success = await onCreateChat(participantIds, message || undefined);
      
      if (success) {
        handleReset();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedUsers([]);
    setMessage('');
    setIsGroup(false);
    setGroupName('');
    setSearchQuery('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>New Conversation</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
              />
            }
            label="Create group chat"
          />
        </Box>
        
        {isGroup && (
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            margin="normal"
          />
        )}
        
        <Autocomplete
          multiple
          options={searchResults}
          loading={searchLoading}
          getOptionLabel={(option) => option.name}
          value={selectedUsers}
          onChange={(_, newValue) => setSelectedUsers(newValue)}
          onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search users"
              margin="normal"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={option.avatar} 
                  alt={option.name}
                  sx={{ width: 32, height: 32, mr: 1 }}
                >
                  {option.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email} • {option.role}
                  </Typography>
                </Box>
              </Box>
            </li>
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                avatar={<Avatar src={option.avatar}>{option.name.charAt(0)}</Avatar>}
                label={option.name}
                {...getTagProps({ index })}
              />
            ))
          }
        />
        
        <TextField
          fullWidth
          label="Initial message (optional)"
          multiline
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          margin="normal"
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleCreateChat} 
          variant="contained" 
          disabled={selectedUsers.length === 0 || loading || (isGroup && !groupName.trim())}
        >
          {loading ? <CircularProgress size={24} /> : 'Start Chat'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewChatDialog; 