import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import { User } from '../../types/user';
import authService, { PasswordChangeRequest } from '../../services/AuthService';

interface SecuritySettingsFormProps {
  user: User;
}

const SecuritySettingsForm: React.FC<SecuritySettingsFormProps> = ({ user }) => {
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Two-factor authentication state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled || false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Session management
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const passwordChangeRequest: PasswordChangeRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };
      
      // Call the auth service to change password
      await authService.changePassword(passwordChangeRequest);
      
      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Failed to change password. Please check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!twoFactorEnabled) {
        // Enable two-factor authentication
        const response = await authService.setupTwoFactor();
        setTwoFactorQrCode(response.qrCodeUrl);
        setTwoFactorSecret(response.secret);
        setShowTwoFactorDialog(true);
      } else {
        // Disable two-factor authentication
        await authService.disableTwoFactor();
        setTwoFactorEnabled(false);
        setSuccess('Two-factor authentication disabled');
      }
    } catch (err) {
      setError('Failed to update two-factor authentication settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.verifyTwoFactor({
        code: twoFactorCode,
        rememberDevice: true
      });
      
      setTwoFactorEnabled(true);
      setShowTwoFactorDialog(false);
      setSuccess('Two-factor authentication enabled');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTwoFactor = () => {
    setShowTwoFactorDialog(false);
    setTwoFactorCode('');
  };

  const handleViewActiveSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would be an API call to get active sessions
      // For now, we'll use mock data
      const mockSessions = [
        {
          id: '1',
          device: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          lastActive: new Date().toISOString(),
          current: true
        },
        {
          id: '2',
          device: 'Safari on iPhone',
          ipAddress: '192.168.1.2',
          lastActive: new Date(Date.now() - 86400000).toISOString(),
          current: false
        }
      ];
      
      setActiveSessions(mockSessions);
      setShowSessionsDialog(true);
    } catch (err) {
      setError('Failed to retrieve active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would be an API call to terminate a session
      // For now, we'll just update our mock data
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      setSuccess('Session terminated successfully');
    } catch (err) {
      setError('Failed to terminate session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateAllSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would be an API call to terminate all sessions except current
      // For now, we'll just update our mock data
      setActiveSessions(prev => prev.filter(session => session.current));
      setSuccess('All other sessions terminated successfully');
    } catch (err) {
      setError('Failed to terminate sessions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      {/* Password Change Section */}
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleChangePassword} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="currentPassword"
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    color="primary"
                  />
                }
                label="Show passwords"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={24} /> : <LockIcon />}
            >
              Change Password
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Two-Factor Authentication Section */}
      <Typography variant="h6" gutterBottom>
        Two-Factor Authentication
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Typography variant="body1">
              {twoFactorEnabled
                ? 'Two-factor authentication is enabled. This adds an extra layer of security to your account.'
                : 'Enable two-factor authentication to add an extra layer of security to your account.'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color={twoFactorEnabled ? 'secondary' : 'primary'}
              onClick={handleToggleTwoFactor}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={24} /> : <SecurityIcon />}
            >
              {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Account Security Section */}
      <Typography variant="h6" gutterBottom>
        Account Security
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <EmailIcon color={user.emailVerified ? 'success' : 'error'} />
            </ListItemIcon>
            <ListItemText
              primary="Email Verification"
              secondary={user.emailVerified ? 'Your email is verified' : 'Your email is not verified'}
            />
            {!user.emailVerified && (
              <Button variant="outlined" color="primary">
                Verify Email
              </Button>
            )}
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <PhoneIcon color={user.phoneVerified ? 'success' : 'error'} />
            </ListItemIcon>
            <ListItemText
              primary="Phone Verification"
              secondary={user.phoneVerified ? 'Your phone is verified' : 'Your phone is not verified'}
            />
            {!user.phoneVerified && (
              <Button variant="outlined" color="primary">
                Verify Phone
              </Button>
            )}
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText
              primary="Active Sessions"
              secondary="Manage your active sessions across devices"
            />
            <Button variant="outlined" color="primary" onClick={handleViewActiveSessions}>
              View Sessions
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* Account Deletion Section */}
      <Typography variant="h6" gutterBottom>
        Danger Zone
      </Typography>
      <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body1" color="error.dark">
                Deleting your account is permanent and cannot be undone.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="error">
              Delete Account
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={showTwoFactorDialog} onClose={handleCancelTwoFactor}>
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Scan this QR code with your authenticator app (like Google Authenticator or Authy).
          </Typography>
          {twoFactorQrCode && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <img src={twoFactorQrCode} alt="QR Code for 2FA" />
            </Box>
          )}
          <Typography variant="body2" paragraph>
            Or enter this code manually: <strong>{twoFactorSecret}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Verification Code"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            margin="normal"
            placeholder="Enter the 6-digit code from your app"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelTwoFactor} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyTwoFactor} 
            color="primary" 
            disabled={twoFactorCode.length !== 6 || isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Active Sessions Dialog */}
      <Dialog 
        open={showSessionsDialog} 
        onClose={() => setShowSessionsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Active Sessions</DialogTitle>
        <DialogContent>
          <List>
            {activeSessions.map((session) => (
              <ListItem key={session.id}>
                <ListItemText
                  primary={session.device}
                  secondary={`IP: ${session.ipAddress} • Last active: ${new Date(session.lastActive).toLocaleString()}`}
                />
                {session.current ? (
                  <Chip label="Current Session" color="primary" />
                ) : (
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => handleTerminateSession(session.id)}
                  >
                    Terminate
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSessionsDialog(false)} color="secondary">
            Close
          </Button>
          <Button 
            onClick={handleTerminateAllSessions} 
            color="primary"
            disabled={activeSessions.filter(s => !s.current).length === 0}
          >
            Terminate All Other Sessions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error and Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecuritySettingsForm; 