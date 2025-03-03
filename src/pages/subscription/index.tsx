import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Container, 
  Divider, 
  Grid, 
  LinearProgress, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper, 
  Tab, 
  Tabs, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Check, 
  CreditCard, 
  History, 
  Info, 
  Receipt, 
  Settings, 
  Star, 
  StarBorder, 
  Warning, 
  X 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSubscription, SubscriptionTier } from '../../hooks/useSubscription';

// Define the subscription tier details
const subscriptionTiers = {
  [SubscriptionTier.BASIC]: {
    name: 'Basic',
    priceEntrepreneur: 0,
    priceFunder: 0,
    features: [
      'Basic profile visibility',
      'Connect with Basic users',
      'Limited matches per month',
    ],
    accessLevels: ['Basic']
  },
  [SubscriptionTier.CHROME]: {
    name: 'Chrome',
    priceEntrepreneur: 25,
    priceFunder: 100,
    features: [
      'Enhanced profile visibility',
      'Connect with Chrome and Basic users',
      'Increased match limit',
      'Basic analytics'
    ],
    accessLevels: ['Chrome', 'Basic']
  },
  [SubscriptionTier.BRONZE]: {
    name: 'Bronze',
    priceEntrepreneur: 50,
    priceFunder: 200,
    features: [
      'Priority profile visibility',
      'Connect with Bronze and lower tiers',
      'Advanced analytics',
      'Priority support'
    ],
    accessLevels: ['Bronze', 'Chrome', 'Basic']
  },
  [SubscriptionTier.SILVER]: {
    name: 'Silver',
    priceEntrepreneur: 75,
    priceFunder: 300,
    features: [
      'Premium profile visibility',
      'Connect with Silver and lower tiers',
      'Premium analytics',
      'Priority support',
      'Verified badge'
    ],
    accessLevels: ['Silver', 'Bronze', 'Chrome', 'Basic']
  },
  [SubscriptionTier.GOLD]: {
    name: 'Gold',
    priceEntrepreneur: 100,
    priceFunder: 500,
    features: [
      'Elite profile visibility',
      'Connect with Gold and lower tiers',
      'Advanced matching algorithm',
      'Dedicated account manager',
      'Verified badge',
      'Featured profile'
    ],
    accessLevels: ['Gold', 'Silver', 'Bronze', 'Chrome', 'Basic']
  },
  [SubscriptionTier.PLATINUM]: {
    name: 'Platinum',
    priceEntrepreneur: 200,
    priceFunder: 1000,
    features: [
      'Ultimate profile visibility',
      'Connect with all users',
      'Premium matching algorithm',
      'Dedicated account manager',
      'Verified badge',
      'Featured profile',
      'Exclusive events access',
      'Unlimited matches'
    ],
    accessLevels: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Chrome', 'Basic']
  }
};

// Define the tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subscription-tabpanel-${index}`}
      aria-labelledby={`subscription-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Subscription page component
const SubscriptionPage: React.FC = () => {
  const { 
    subscription, 
    usage, 
    billingHistory, 
    paymentMethods, 
    loading, 
    error, 
    createCheckoutSession, 
    cancelSubscription, 
    createBillingPortalSession 
  } = useSubscription();
  
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle subscription upgrade
  const handleUpgrade = async (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setUpgradeDialogOpen(true);
  };
  
  // Confirm subscription upgrade
  const confirmUpgrade = async () => {
    if (!selectedTier) return;
    
    try {
      setProcessingAction(true);
      const checkoutUrl = await createCheckoutSession(selectedTier);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    } finally {
      setProcessingAction(false);
      setUpgradeDialogOpen(false);
    }
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = () => {
    setCancelDialogOpen(true);
  };
  
  // Confirm subscription cancellation
  const confirmCancellation = async () => {
    try {
      setProcessingAction(true);
      await cancelSubscription();
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle billing portal navigation
  const handleManagePaymentMethods = async () => {
    try {
      setProcessingAction(true);
      const portalUrl = await createBillingPortalSession();
      window.location.href = portalUrl;
    } catch (err) {
      console.error('Failed to create billing portal session:', err);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'canceled':
        return 'error';
      case 'past_due':
      case 'unpaid':
        return 'warning';
      case 'trialing':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Render subscription details
  const renderSubscriptionDetails = () => {
    if (!subscription) {
      return (
        <Card>
          <CardHeader title="No Active Subscription" />
          <CardContent>
            <Typography variant="body1">
              You don't have an active subscription. Choose a plan below to get started.
            </Typography>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader 
          title="Current Subscription" 
          action={
            <Button 
              color="secondary" 
              variant="outlined" 
              onClick={handleCancelSubscription}
              disabled={subscription.status !== 'active' || processingAction}
            >
              {subscription.cancelAtPeriodEnd ? 'Resume' : 'Cancel'}
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {subscriptionTiers[subscription.tier].name} Plan
              </Typography>
              <Typography variant="body1" gutterBottom>
                Status: <Chip 
                  label={subscription.status.toUpperCase()} 
                  color={getStatusColor(subscription.status) as any} 
                  size="small" 
                />
              </Typography>
              {subscription.cancelAtPeriodEnd && (
                <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
                  Your subscription will be canceled at the end of the current billing period.
                </Alert>
              )}
              <Typography variant="body2" color="textSecondary">
                Current period: {format(new Date(subscription.currentPeriodStart), 'MMM d, yyyy')} - {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Usage
              </Typography>
              {usage && (
                <>
                  <Typography variant="body2" gutterBottom>
                    Matches: {usage.matches.used} / {usage.matches.limit}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={usage.matches.percentage} 
                    sx={{ mb: 1 }} 
                  />
                  
                  <Typography variant="body2" gutterBottom>
                    Messages: {usage.messages.used} / {usage.messages.limit}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={usage.messages.percentage} 
                    sx={{ mb: 1 }} 
                  />
                  
                  <Typography variant="body2" gutterBottom>
                    Active Chats: {usage.activeChats.count} / {usage.activeChats.limit}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={usage.activeChats.percentage} 
                    sx={{ mb: 1 }} 
                  />
                </>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // Render subscription plans
  const renderSubscriptionPlans = () => {
    return (
      <Grid container spacing={2}>
        {Object.entries(subscriptionTiers).map(([tier, details]) => (
          <Grid item xs={12} sm={6} md={4} key={tier}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: subscription?.tier === tier ? '2px solid #3f51b5' : 'none'
              }}
            >
              <CardHeader 
                title={details.name} 
                titleTypographyProps={{ align: 'center' }}
                action={subscription?.tier === tier ? <Star color="primary" /> : undefined}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography component="h2" variant="h3" color="textPrimary">
                    ${details.priceEntrepreneur}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    /mo
                  </Typography>
                </Box>
                <Divider />
                <List dense>
                  {details.features.map((feature) => (
                    <ListItem key={feature}>
                      <ListItemIcon>
                        <Check color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant={subscription?.tier === tier ? "outlined" : "contained"}
                  color="primary"
                  disabled={subscription?.tier === tier || processingAction}
                  onClick={() => handleUpgrade(tier as SubscriptionTier)}
                >
                  {subscription?.tier === tier ? 'Current Plan' : 'Upgrade'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render billing history
  const renderBillingHistory = () => {
    return (
      <Card>
        <CardHeader 
          title="Billing History" 
          action={
            <Button 
              startIcon={<Receipt />}
              onClick={handleManagePaymentMethods}
              disabled={processingAction}
            >
              Manage Billing
            </Button>
          }
        />
        <CardContent>
          {billingHistory.length === 0 ? (
            <Typography variant="body1">No billing history available.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billingHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">${(item.amount / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status.toUpperCase()} 
                          color={
                            item.status === 'paid' ? 'success' : 
                            item.status === 'pending' ? 'warning' : 'error'
                          } 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {item.receiptUrl && (
                          <Button 
                            size="small" 
                            href={item.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Render payment methods
  const renderPaymentMethods = () => {
    return (
      <Card>
        <CardHeader 
          title="Payment Methods" 
          action={
            <Button 
              startIcon={<CreditCard />}
              onClick={handleManagePaymentMethods}
              disabled={processingAction}
            >
              Manage Payment Methods
            </Button>
          }
        />
        <CardContent>
          {paymentMethods.length === 0 ? (
            <Typography variant="body1">No payment methods available.</Typography>
          ) : (
            <List>
              {paymentMethods.map((method) => (
                <ListItem key={method.id}>
                  <ListItemIcon>
                    <CreditCard />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${method.brand.toUpperCase()} •••• ${method.last4}`} 
                    secondary={`Expires ${method.expMonth}/${method.expYear}`} 
                  />
                  {method.isDefault && (
                    <Chip label="Default" color="primary" size="small" />
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscription Management
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        {renderSubscriptionDetails()}
      </Box>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="subscription tabs">
            <Tab label="Plans" icon={<Star />} iconPosition="start" />
            <Tab label="Billing History" icon={<History />} iconPosition="start" />
            <Tab label="Payment Methods" icon={<CreditCard />} iconPosition="start" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {renderSubscriptionPlans()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {renderBillingHistory()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {renderPaymentMethods()}
        </TabPanel>
      </Box>
      
      {/* Cancel Subscription Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>
          {subscription?.cancelAtPeriodEnd ? "Resume Subscription" : "Cancel Subscription"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {subscription?.cancelAtPeriodEnd 
              ? "Are you sure you want to resume your subscription? You will continue to be billed at the end of your current billing period."
              : "Are you sure you want to cancel your subscription? You will still have access to your current plan until the end of your billing period."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={processingAction}>
            No, Go Back
          </Button>
          <Button 
            onClick={confirmCancellation} 
            color={subscription?.cancelAtPeriodEnd ? "primary" : "error"} 
            disabled={processingAction}
            autoFocus
          >
            {processingAction ? <CircularProgress size={24} /> : (subscription?.cancelAtPeriodEnd ? "Yes, Resume" : "Yes, Cancel")}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Upgrade Subscription Dialog */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
      >
        <DialogTitle>Upgrade Subscription</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to upgrade to the {selectedTier && subscriptionTiers[selectedTier].name} plan? 
            You will be redirected to the payment page to complete your subscription.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)} disabled={processingAction}>
            No, Go Back
          </Button>
          <Button 
            onClick={confirmUpgrade} 
            color="primary" 
            disabled={processingAction}
            autoFocus
          >
            {processingAction ? <CircularProgress size={24} /> : "Yes, Upgrade"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionPage; 