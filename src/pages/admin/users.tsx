import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  VerifiedUser as VerifiedUserIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { useAdmin } from '../../hooks/useAdmin';
import { UserRole, UserStatus } from '../../services/AdminService';
import { VerificationLevel } from '../../services/VerificationService';
import { SubscriptionTier } from '../../hooks/useSubscription';
import { Link as RouterLink } from 'react-router-dom';

const UserManagement: React.FC = () => {
  const {
    users,
    usersLoading,
    usersError,
    getUsers,
    updateUser,
    userFilters,
    setUserFilters,
    usersPagination,
    setUsersPagination
  } = useAdmin();

  // User edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editedRole, setEditedRole] = useState<UserRole | ''>('');
  const [editedStatus, setEditedStatus] = useState<UserStatus | ''>('');

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'ban' | 'delete' | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

  // Filter expansion state
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Load users on component mount
  useEffect(() => {
    getUsers();
  }, [getUsers, userFilters, usersPagination]);

  // Handle pagination change
  const handlePageChange = (event: unknown, newPage: number) => {
    setUsersPagination({
      ...usersPagination,
      page: newPage
    });
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsersPagination({
      ...usersPagination,
      limit: parseInt(event.target.value, 10),
      page: 0
    });
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserFilters({
      ...userFilters,
      searchTerm: event.target.value
    });
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: any) => {
    setUserFilters({
      ...userFilters,
      [field]: value
    });
    setUsersPagination({
      ...usersPagination,
      page: 0
    });
  };

  // Handle edit dialog open
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditedRole(user.role);
    setEditedStatus(user.status);
    setEditDialogOpen(true);
  };

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setEditedRole('');
    setEditedStatus('');
  };

  // Handle user update
  const handleUpdateUser = async () => {
    if (selectedUser && (editedRole !== '' || editedStatus !== '')) {
      const updates: any = {};
      if (editedRole !== '' && editedRole !== selectedUser.role) {
        updates.role = editedRole;
      }
      if (editedStatus !== '' && editedStatus !== selectedUser.status) {
        updates.status = editedStatus;
      }

      await updateUser(selectedUser.id, updates);
      handleEditDialogClose();
    }
  };

  // Handle confirmation dialog open
  const handleConfirmAction = (action: 'suspend' | 'ban' | 'delete', userId: string) => {
    setConfirmAction(action);
    setConfirmUserId(userId);
    setConfirmDialogOpen(true);
  };

  // Handle confirmation dialog close
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    setConfirmUserId(null);
  };

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    if (confirmUserId && confirmAction) {
      let updates: any = {};
      
      switch (confirmAction) {
        case 'suspend':
          updates = { status: UserStatus.SUSPENDED };
          break;
        case 'ban':
          updates = { status: UserStatus.BANNED };
          break;
        case 'delete':
          // In a real application, you might want to implement a soft delete
          // or have a separate API endpoint for deletion
          updates = { status: UserStatus.BANNED, isDeleted: true };
          break;
      }
      
      await updateUser(confirmUserId, updates);
      handleConfirmDialogClose();
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setUserFilters({
      searchTerm: '',
      role: undefined,
      status: undefined,
      verificationLevel: undefined,
      subscriptionTier: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setUsersPagination({
      page: 0,
      limit: 10
    });
  };

  // Get status chip color
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.SUSPENDED:
        return 'warning';
      case UserStatus.BANNED:
        return 'error';
      case UserStatus.PENDING:
        return 'info';
      default:
        return 'default';
    }
  };

  // Get verification level chip color
  const getVerificationColor = (level: VerificationLevel) => {
    switch (level) {
      case VerificationLevel.PREMIUM:
        return 'success';
      case VerificationLevel.ADVANCED:
        return 'info';
      case VerificationLevel.BASIC:
        return 'primary';
      case VerificationLevel.NONE:
      default:
        return 'default';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, filter, and manage user accounts.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <Box>
            <Button 
              startIcon={<FilterListIcon />} 
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              size="small"
              sx={{ mr: 1 }}
            >
              {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={handleResetFilters}
              size="small"
            >
              Reset
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Search"
            placeholder="Search by name, email, or ID"
            variant="outlined"
            size="small"
            value={userFilters.searchTerm || ''}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, mr: 2 }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button 
            variant="contained" 
            onClick={() => getUsers()}
            disabled={usersLoading}
          >
            Search
          </Button>
        </Box>

        {filtersExpanded && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={userFilters.role || ''}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {Object.values(UserRole).map((role) => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={userFilters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(UserStatus).map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Verification</InputLabel>
                <Select
                  value={userFilters.verificationLevel || ''}
                  label="Verification"
                  onChange={(e) => handleFilterChange('verificationLevel', e.target.value || undefined)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {Object.values(VerificationLevel).map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Subscription</InputLabel>
                <Select
                  value={userFilters.subscriptionTier || ''}
                  label="Subscription"
                  onChange={(e) => handleFilterChange('subscriptionTier', e.target.value || undefined)}
                >
                  <MenuItem value="">All Tiers</MenuItem>
                  {Object.values(SubscriptionTier).map((tier) => (
                    <MenuItem key={tier} value={tier}>{tier}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={userFilters.sortBy || 'createdAt'}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="createdAt">Registration Date</MenuItem>
                  <MenuItem value="lastLogin">Last Login</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={userFilters.sortOrder || 'desc'}
                  label="Sort Order"
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Users Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {usersError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {usersError.message}
          </Alert>
        )}

        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Typography variant="body1" color="text.secondary">
                No users found matching the criteria.
              </Typography>
            </Box>
          ) : (
            <Table stickyHeader aria-label="users table">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell>Subscription</TableCell>
                  <TableCell>Registered</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {user.id.substring(0, 8)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        color={user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status} 
                        size="small" 
                        color={getStatusColor(user.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.verificationLevel} 
                        size="small" 
                        color={getVerificationColor(user.verificationLevel) as any}
                        icon={<VerifiedUserIcon fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.subscriptionTier} 
                        size="small" 
                        color={user.subscriptionTier === SubscriptionTier.FREE ? 'default' : 'info'}
                        icon={<CreditCardIcon fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {user.status === UserStatus.ACTIVE && (
                          <Tooltip title="Suspend User">
                            <IconButton 
                              size="small" 
                              onClick={() => handleConfirmAction('suspend', user.id)}
                              sx={{ mr: 1 }}
                              color="warning"
                            >
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {user.status !== UserStatus.BANNED && (
                          <Tooltip title="Ban User">
                            <IconButton 
                              size="small" 
                              onClick={() => handleConfirmAction('ban', user.id)}
                              sx={{ mr: 1 }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {user.status !== UserStatus.ACTIVE && (
                          <Tooltip title="Activate User">
                            <IconButton 
                              size="small" 
                              onClick={() => updateUser(user.id, { status: UserStatus.ACTIVE })}
                              color="success"
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={usersPagination.totalItems || 0}
          rowsPerPage={usersPagination.limit}
          page={usersPagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedUser.email}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={editedRole}
                      label="Role"
                      onChange={(e) => setEditedRole(e.target.value as UserRole)}
                    >
                      {Object.values(UserRole).map((role) => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editedStatus}
                      label="Status"
                      onChange={(e) => setEditedStatus(e.target.value as UserStatus)}
                    >
                      {Object.values(UserStatus).map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  User Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Registered:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedUser.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Login:
                    </Typography>
                    <Typography variant="body2">
                      {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Verification Level:
                    </Typography>
                    <Typography variant="body2">
                      {selectedUser.verificationLevel}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Subscription Tier:
                    </Typography>
                    <Typography variant="body2">
                      {selectedUser.subscriptionTier}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained" 
            disabled={!selectedUser || (editedRole === selectedUser?.role && editedStatus === selectedUser?.status)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        <DialogTitle>
          {confirmAction === 'suspend' ? 'Suspend User' : 
           confirmAction === 'ban' ? 'Ban User' : 
           'Delete User'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {confirmAction === 'suspend' ? 
              'Are you sure you want to suspend this user? They will be temporarily unable to access the platform.' : 
             confirmAction === 'ban' ? 
              'Are you sure you want to ban this user? They will be permanently unable to access the platform.' : 
              'Are you sure you want to delete this user? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button 
            onClick={handleConfirmedAction} 
            variant="contained" 
            color="error"
          >
            {confirmAction === 'suspend' ? 'Suspend' : 
             confirmAction === 'ban' ? 'Ban' : 
             'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 