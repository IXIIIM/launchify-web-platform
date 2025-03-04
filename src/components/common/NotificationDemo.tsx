import React from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material';
import { useNotificationService } from '../../services/NotificationService';
import { useNotification } from '../../context/NotificationContext';

const NotificationDemo: React.FC = () => {
  const notification = useNotificationService();
  const [message, setMessage] = React.useState('This is a notification message');
  const [title, setTitle] = React.useState('Notification Title');
  const [duration, setDuration] = React.useState(5000);
  const [showIcon, setShowIcon] = React.useState(true);
  const [position, setPosition] = React.useState<{
    vertical: 'top' | 'bottom',
    horizontal: 'left' | 'center' | 'right'
  }>({
    vertical: 'top',
    horizontal: 'right'
  });

  const handleShowSuccess = () => {
    notification.showSuccess(message, {
      title,
      autoHideDuration: duration,
      showIcon,
      anchorOrigin: position
    });
  };

  const handleShowError = () => {
    notification.showError(message, {
      title,
      autoHideDuration: duration,
      showIcon,
      anchorOrigin: position
    });
  };

  const handleShowWarning = () => {
    notification.showWarning(message, {
      title,
      autoHideDuration: duration,
      showIcon,
      anchorOrigin: position
    });
  };

  const handleShowInfo = () => {
    notification.showInfo(message, {
      title,
      autoHideDuration: duration,
      showIcon,
      anchorOrigin: position
    });
  };

  const handleShowApiError = () => {
    // Simulate different API error formats
    const errorTypes = [
      'Simple string error',
      { message: 'Error object with message property' },
      { error: 'Error object with error property' },
      { data: { message: 'Error object with data.message property' } },
      { 
        response: { 
          status: 404,
          data: { message: 'Not found error from API' } 
        } 
      },
      { 
        response: { 
          status: 500,
          data: null
        } 
      }
    ];
    
    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    notification.showApiError(randomError, 'Default fallback message');
  };

  const handleClearAll = () => {
    notification.clearAllNotifications();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Notification System Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Use this panel to test different types of notifications with various configurations.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Notification Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Notification Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Duration: {duration}ms
            </Typography>
            <Slider
              value={duration}
              onChange={(_, newValue) => setDuration(newValue as number)}
              min={1000}
              max={10000}
              step={500}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}ms`}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch 
                checked={showIcon} 
                onChange={(e) => setShowIcon(e.target.checked)} 
              />
            }
            label="Show Icon"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Position
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Vertical</InputLabel>
                <Select
                  value={position.vertical}
                  label="Vertical"
                  onChange={(e) => setPosition({
                    ...position,
                    vertical: e.target.value as 'top' | 'bottom'
                  })}
                >
                  <MenuItem value="top">Top</MenuItem>
                  <MenuItem value="bottom">Bottom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Horizontal</InputLabel>
                <Select
                  value={position.horizontal}
                  label="Horizontal"
                  onChange={(e) => setPosition({
                    ...position,
                    horizontal: e.target.value as 'left' | 'center' | 'right'
                  })}
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Preview
            </Typography>
            <Box 
              sx={{ 
                border: '1px dashed grey', 
                height: 150, 
                position: 'relative',
                borderRadius: 1
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: position.vertical === 'top' ? 10 : 'auto',
                  bottom: position.vertical === 'bottom' ? 10 : 'auto',
                  left: position.horizontal === 'left' ? 10 : 'auto',
                  right: position.horizontal === 'right' ? 10 : 'auto',
                  transform: position.horizontal === 'center' ? 'translateX(-50%)' : 'none',
                  ...(position.horizontal === 'center' ? { left: '50%' } : {}),
                  width: 200,
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="caption" fontWeight="bold" display="block">
                  {title}
                </Typography>
                <Typography variant="caption">
                  {message.length > 30 ? message.substring(0, 30) + '...' : message}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleShowSuccess}
          >
            Success
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleShowError}
          >
            Error
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            color="warning" 
            onClick={handleShowWarning}
          >
            Warning
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            color="info" 
            onClick={handleShowInfo}
          >
            Info
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleShowApiError}
          >
            API Error
          </Button>
        </Grid>
        <Grid item>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default NotificationDemo; 