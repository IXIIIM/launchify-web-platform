import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DocumentIcon,
  Assignment as SignatureIcon,
  Message as MessageIcon,
  Verified as VerifiedIcon,
  Payment as PaymentIcon,
  Announcement as AnnouncementIcon,
  DeleteSweep as DeleteAllIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification, NotificationType } from '../../services/NotificationService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `notification-tab-${index}`,
    'aria-controls': `notification-tabpanel-${index}`,
  };
};

const NotificationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
    deleteAllNotifications,
    getNotifications
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    onSuccess: (message) => console.log(message),
    onError: (error) => console.error(error)
  });

  // Filter notifications based on tab
  const filteredNotifications = React.useMemo(() => {
    if (tabValue === 0) return notifications;
    if (tabValue === 1) return notifications.filter(n => !n.isRead);
    if (tabValue === 2) return notifications.filter(n => n.isRead);
    if (tabValue === 3) return notifications.filter(n => n.type.includes('document'));
    if (tabValue === 4) return notifications.filter(n => n.type.includes('signature'));
    if (tabValue === 5) return notifications.filter(n => n.type.includes('message'));
    return notifications;
  }, [notifications, tabValue]);

  // Pagination
  const paginatedNotifications = React.useMemo(() => {
    return filteredNotifications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredNotifications, page, rowsPerPage]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewNotification = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to the related entity if available
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDeleteClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedNotification) {
      deleteNotification(selectedNotification.id);
      setDeleteDialogOpen(false);
      setSelectedNotification(null);
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = () => {
    deleteAllNotifications();
    setDeleteAllDialogOpen(false);
  };

  const getNotificationIcon = (type: NotificationType) => {
    if (type.includes('document')) {
      return <DocumentIcon />;
    } else if (type.includes('signature')) {
      return <SignatureIcon />;
    } else if (type.includes('message')) {
      return <MessageIcon />;
    } else if (type.includes('verification')) {
      return <VerifiedIcon />;
    } else if (type.includes('payment')) {
      return <PaymentIcon />;
    } else {
      return <AnnouncementIcon />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    if (type.includes('document')) {
      return theme.palette.info.main;
    } else if (type.includes('signature')) {
      return theme.palette.success.main;
    } else if (type.includes('message')) {
      return theme.palette.secondary.main;
    } else if (type.includes('verification')) {
      return theme.palette.warning.main;
    } else if (type.includes('payment')) {
      return theme.palette.error.main;
    } else {
      return theme.palette.grey[500];
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    if (type.includes('document')) {
      return 'Document';
    } else if (type.includes('signature')) {
      return 'Signature';
    } else if (type.includes('message')) {
      return 'Message';
    } else if (type.includes('verification')) {
      return 'Verification';
    } else if (type.includes('payment')) {
      return 'Payment';
    } else {
      return 'System';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        {notifications.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteAllIcon />}
            onClick={handleDeleteAllClick}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="notification tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" {...a11yProps(0)} />
            <Tab label="Unread" {...a11yProps(1)} />
            <Tab label="Read" {...a11yProps(2)} />
            <Tab label="Documents" {...a11yProps(3)} />
            <Tab label="Signatures" {...a11yProps(4)} />
            <Tab label="Messages" {...a11yProps(5)} />
          </Tabs>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              Failed to load notifications
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => getNotifications()}
            >
              Retry
            </Button>
          </Box>
        )}

        {!loading && !error && (
          <>
            <TabPanel value={tabValue} index={tabValue}>
              {filteredNotifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    No notifications found
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="notifications table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Message</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedNotifications.map((notification) => (
                        <TableRow
                          key={notification.id}
                          sx={{
                            backgroundColor: notification.isRead ? 'inherit' : theme.palette.action.hover,
                            '&:hover': { backgroundColor: theme.palette.action.selected }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: getNotificationColor(notification.type),
                                  width: 32,
                                  height: 32,
                                  mr: 1
                                }}
                              >
                                {getNotificationIcon(notification.type)}
                              </Avatar>
                              <Typography variant="body2">
                                {getNotificationTypeLabel(notification.type)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                            >
                              {notification.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {notification.message}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={format(new Date(notification.createdAt), 'PPpp')}>
                              <Typography variant="body2">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={notification.isRead ? 'Read' : 'Unread'}
                              size="small"
                              color={notification.isRead ? 'default' : 'primary'}
                              variant={notification.isRead ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="View">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewNotification(notification)}
                                  disabled={!notification.link}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(notification)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredNotifications.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Notification</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this notification? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        aria-labelledby="delete-all-dialog-title"
        aria-describedby="delete-all-dialog-description"
      >
        <DialogTitle id="delete-all-dialog-title">Clear All Notifications</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-all-dialog-description">
            Are you sure you want to delete all notifications? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAllConfirm} color="error" autoFocus>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NotificationsPage; 