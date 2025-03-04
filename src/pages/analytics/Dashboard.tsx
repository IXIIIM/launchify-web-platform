import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useDashboardAnalytics } from '../../hooks/useDashboardAnalytics';
import { AnalyticsFilters } from '../../services/AnalyticsService';
import { ExportFormat } from '../../types/export';
import MetricCard from '../../components/analytics/MetricCard';
import TimeSeriesChart from '../../components/analytics/TimeSeriesChart';
import DistributionChart from '../../components/analytics/DistributionChart';
import AnalyticsTable from '../../components/analytics/AnalyticsTable';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

const Dashboard: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Initialize analytics hook
  const {
    dashboardData,
    loading,
    error,
    filters,
    setFilters,
    investmentAnalytics,
    escrowAnalytics,
    userEngagementAnalytics,
    documentAnalytics,
    exportReport,
    isExporting
  } = useDashboardAnalytics();
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setFilters({
      ...filters,
      timeframe: event.target.value as string
    });
  };
  
  // Handle export
  const handleExport = (format: ExportFormat) => {
    exportReport(format);
  };
  
  if (loading && !dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading analytics: {error.message}
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Track your platform's performance, user engagement, and business metrics.
        </Typography>
        
        {/* Filters and Export */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
            <Select
              labelId="timeframe-select-label"
              id="timeframe-select"
              value={filters.timeframe}
              label="Timeframe"
              onChange={handleTimeframeChange}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          
          <Box>
            <Button 
              variant="outlined" 
              disabled={isExporting} 
              onClick={() => handleExport('PDF')}
              sx={{ mr: 1 }}
            >
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button 
              variant="outlined" 
              disabled={isExporting} 
              onClick={() => handleExport('CSV')}
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Overview Cards */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardData.overviewMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <MetricCard 
                title={metric.label}
                value={metric.value}
                change={metric.change}
                changeDirection={metric.changeDirection}
                icon={metric.icon}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="analytics tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Investments" {...a11yProps(1)} />
          <Tab label="Escrows" {...a11yProps(2)} />
          <Tab label="User Engagement" {...a11yProps(3)} />
          <Tab label="Documents" {...a11yProps(4)} />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          {dashboardData && (
            <>
              <Typography variant="h6" gutterBottom>
                Platform Activity
              </Typography>
              <Box sx={{ height: 300, mb: 4 }}>
                <TimeSeriesChart 
                  data={dashboardData.activityTimeSeries}
                  xAxisKey="date"
                  series={[
                    { dataKey: 'users', name: 'Active Users' },
                    { dataKey: 'investments', name: 'Investments' },
                    { dataKey: 'escrows', name: 'Escrows' }
                  ]}
                />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    User Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <DistributionChart 
                      data={dashboardData.userDistribution}
                      nameKey="category"
                      dataKey="value"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <AnalyticsTable 
                    data={dashboardData.recentActivity}
                    columns={[
                      { id: 'date', label: 'Date', format: (value) => new Date(value).toLocaleDateString() },
                      { id: 'user', label: 'User' },
                      { id: 'action', label: 'Action' },
                      { id: 'details', label: 'Details' }
                    ]}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </TabPanel>
        
        {/* Investments Tab */}
        <TabPanel value={activeTab} index={1}>
          {investmentAnalytics && (
            <>
              <Typography variant="h6" gutterBottom>
                Investment Trends
              </Typography>
              <Box sx={{ height: 300, mb: 4 }}>
                <TimeSeriesChart 
                  data={investmentAnalytics.trends}
                  xAxisKey="date"
                  series={[
                    { dataKey: 'count', name: 'Number of Investments' },
                    { dataKey: 'amount', name: 'Investment Amount ($)' }
                  ]}
                />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Investment by Category
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <DistributionChart 
                      data={investmentAnalytics.byCategory}
                      nameKey="category"
                      dataKey="value"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Top Investors
                  </Typography>
                  <AnalyticsTable 
                    data={investmentAnalytics.topInvestors}
                    columns={[
                      { id: 'rank', label: 'Rank' },
                      { id: 'name', label: 'Investor' },
                      { id: 'amount', label: 'Total Invested', format: (value) => `$${value.toLocaleString()}` },
                      { id: 'count', label: 'Investments' }
                    ]}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </TabPanel>
        
        {/* Escrows Tab */}
        <TabPanel value={activeTab} index={2}>
          {escrowAnalytics && (
            <>
              <Typography variant="h6" gutterBottom>
                Escrow Activity
              </Typography>
              <Box sx={{ height: 300, mb: 4 }}>
                <TimeSeriesChart 
                  data={escrowAnalytics.activity}
                  xAxisKey="date"
                  series={[
                    { dataKey: 'created', name: 'Created' },
                    { dataKey: 'completed', name: 'Completed' },
                    { dataKey: 'disputed', name: 'Disputed' }
                  ]}
                />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Escrow Status Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <DistributionChart 
                      data={escrowAnalytics.statusDistribution}
                      nameKey="status"
                      dataKey="count"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Recent Escrow Agreements
                  </Typography>
                  <AnalyticsTable 
                    data={escrowAnalytics.recentAgreements}
                    columns={[
                      { id: 'date', label: 'Date', format: (value) => new Date(value).toLocaleDateString() },
                      { id: 'parties', label: 'Parties' },
                      { id: 'amount', label: 'Amount', format: (value) => `$${value.toLocaleString()}` },
                      { id: 'status', label: 'Status' }
                    ]}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </TabPanel>
        
        {/* User Engagement Tab */}
        <TabPanel value={activeTab} index={3}>
          {userEngagementAnalytics && (
            <>
              <Typography variant="h6" gutterBottom>
                User Activity
              </Typography>
              <Box sx={{ height: 300, mb: 4 }}>
                <TimeSeriesChart 
                  data={userEngagementAnalytics.activity}
                  xAxisKey="date"
                  series={[
                    { dataKey: 'activeUsers', name: 'Active Users' },
                    { dataKey: 'newUsers', name: 'New Users' },
                    { dataKey: 'returningUsers', name: 'Returning Users' }
                  ]}
                />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Feature Usage
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <DistributionChart 
                      data={userEngagementAnalytics.featureUsage}
                      nameKey="feature"
                      dataKey="usageCount"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    User Retention
                  </Typography>
                  <AnalyticsTable 
                    data={userEngagementAnalytics.retention}
                    columns={[
                      { id: 'cohort', label: 'Cohort' },
                      { id: 'week1', label: 'Week 1', format: (value) => `${value}%` },
                      { id: 'week2', label: 'Week 2', format: (value) => `${value}%` },
                      { id: 'week4', label: 'Week 4', format: (value) => `${value}%` },
                      { id: 'week8', label: 'Week 8', format: (value) => `${value}%` }
                    ]}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </TabPanel>
        
        {/* Documents Tab */}
        <TabPanel value={activeTab} index={4}>
          {documentAnalytics && (
            <>
              <Typography variant="h6" gutterBottom>
                Document Activity
              </Typography>
              <Box sx={{ height: 300, mb: 4 }}>
                <TimeSeriesChart 
                  data={documentAnalytics.activity}
                  xAxisKey="date"
                  series={[
                    { dataKey: 'created', name: 'Created' },
                    { dataKey: 'edited', name: 'Edited' },
                    { dataKey: 'shared', name: 'Shared' }
                  ]}
                />
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Document Types
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <DistributionChart 
                      data={documentAnalytics.typeDistribution}
                      nameKey="type"
                      dataKey="count"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Popular Documents
                  </Typography>
                  <AnalyticsTable 
                    data={documentAnalytics.popularDocuments}
                    columns={[
                      { id: 'title', label: 'Document' },
                      { id: 'type', label: 'Type' },
                      { id: 'views', label: 'Views' },
                      { id: 'lastUpdated', label: 'Last Updated', format: (value) => new Date(value).toLocaleDateString() }
                    ]}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Dashboard; 