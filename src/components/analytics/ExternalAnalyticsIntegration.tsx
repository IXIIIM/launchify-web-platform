import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress, 
  Tabs, 
  Tab, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Grid, 
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { format, subDays } from 'date-fns';
import { 
  AnalyticsProvider, 
  AnalyticsProviderConfig, 
  AnalyticsQueryParams, 
  AnalyticsData, 
  createAnalyticsIntegration 
} from '../../utils/analyticsIntegration';
import { ErrorHandlingService } from '../../services/ErrorHandlingService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { exportToCSV, exportToExcel, exportToJSON } from '../../utils/exportUtils';

// Mock DatePicker component until we can install the actual dependencies
const DatePicker = ({ label, value, onChange, slotProps }: any) => (
  <TextField
    label={label}
    value={value ? format(value, 'yyyy-MM-dd') : ''}
    onChange={(e) => onChange(new Date(e.target.value))}
    type="date"
    fullWidth
    InputLabelProps={{ shrink: true }}
  />
);

// Mock LocalizationProvider component
const LocalizationProvider = ({ children }: any) => children;

// Mock ExportMenu component
const ExportMenu = ({ onExport, disabled }: { onExport: (format: string) => void, disabled: boolean }) => (
  <Box>
    <Button 
      disabled={disabled} 
      onClick={() => onExport('csv')}
      sx={{ mr: 1 }}
    >
      Export CSV
    </Button>
    <Button 
      disabled={disabled} 
      onClick={() => onExport('excel')}
      sx={{ mr: 1 }}
    >
      Export Excel
    </Button>
    <Button 
      disabled={disabled} 
      onClick={() => onExport('json')}
    >
      Export JSON
    </Button>
  </Box>
);

// Available metrics for selection
const AVAILABLE_METRICS = [
  { value: 'users', label: 'Users' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'pageviews', label: 'Page Views' },
  { value: 'bounceRate', label: 'Bounce Rate' },
  { value: 'avgSessionDuration', label: 'Avg. Session Duration' }
];

// Available dimensions for selection
const AVAILABLE_DIMENSIONS = [
  { value: 'date', label: 'Date' },
  { value: 'device', label: 'Device' },
  { value: 'country', label: 'Country' },
  { value: 'browser', label: 'Browser' }
];

// Chart colors for different metrics
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'
];

interface ExternalAnalyticsIntegrationProps {
  /**
   * Default analytics provider configurations
   */
  defaultProviders?: AnalyticsProviderConfig[];
  
  /**
   * Whether to allow adding/removing providers
   */
  allowProviderConfiguration?: boolean;
  
  /**
   * Whether to allow exporting data
   */
  allowExport?: boolean;
  
  /**
   * Default date range (in days from today)
   */
  defaultDateRange?: number;
  
  /**
   * Default metrics to display
   */
  defaultMetrics?: string[];
  
  /**
   * Default dimensions to segment by
   */
  defaultDimensions?: string[];
  
  /**
   * Card title
   */
  title?: string;
}

/**
 * Component for integrating with external analytics data sources
 */
const ExternalAnalyticsIntegration: React.FC<ExternalAnalyticsIntegrationProps> = ({
  defaultProviders = [],
  allowProviderConfiguration = true,
  allowExport = true,
  defaultDateRange = 30,
  defaultMetrics = ['users', 'sessions'],
  defaultDimensions = ['date'],
  title = 'External Analytics Integration'
}) => {
  // State for providers
  const [providers, setProviders] = useState<AnalyticsProviderConfig[]>(defaultProviders);
  
  // State for query parameters
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), defaultDateRange));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(defaultMetrics);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(defaultDimensions);
  
  // State for data and loading
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<number>(0);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (providers.length === 0) {
      setError(new Error('No analytics providers configured'));
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create query parameters
      const queryParams: AnalyticsQueryParams = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        metrics: selectedMetrics,
        dimensions: selectedDimensions,
        limit: 100
      };
      
      // Create analytics integrations
      const integrations = providers.map(config => createAnalyticsIntegration(config));
      
      // Fetch data from all providers
      if (integrations.length === 1) {
        const data = await integrations[0].fetchData(queryParams);
        setAnalyticsData(data);
      } else {
        // Combine data from multiple providers
        const dataArray = await Promise.all(integrations.map(integration => integration.fetchData(queryParams)));
        
        // Merge data from multiple providers
        const mergedData = dataArray.length > 0 
          ? dataArray[0] 
          : null;
          
        setAnalyticsData(mergedData);
      }
    } catch (err) {
      const enhancedError = ErrorHandlingService.createError({
        message: 'Failed to fetch analytics data',
        originalError: err as Error,
        errorCode: 'EXTERNAL_ANALYTICS_FETCH_ERROR'
      });
      
      setError(enhancedError);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new provider
  const addProvider = () => {
    setProviders([
      ...providers,
      {
        provider: AnalyticsProvider.GOOGLE_ANALYTICS,
        apiKey: '',
        debug: true
      }
    ]);
  };
  
  // Remove a provider
  const removeProvider = (index: number) => {
    const updatedProviders = [...providers];
    updatedProviders.splice(index, 1);
    setProviders(updatedProviders);
  };
  
  // Update a provider configuration
  const updateProvider = (index: number, field: keyof AnalyticsProviderConfig, value: any) => {
    const updatedProviders = [...providers];
    updatedProviders[index] = {
      ...updatedProviders[index],
      [field]: value
    };
    setProviders(updatedProviders);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Export data
  const handleExport = (exportFormat: string) => {
    if (!analyticsData) return;
    
    const fileName = `analytics_data_${format(new Date(), 'yyyy-MM-dd')}`;
    
    switch (exportFormat) {
      case 'csv':
        exportToCSV(analyticsData.rows, fileName);
        break;
      case 'excel':
        exportToExcel(analyticsData.rows, fileName);
        break;
      case 'json':
        exportToJSON(analyticsData.rows, fileName);
        break;
    }
  };
  
  // Render chart based on data
  const renderChart = () => {
    if (!analyticsData || analyticsData.rows.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      );
    }
    
    // Determine if we should use a line chart or bar chart
    const shouldUseLineChart = chartType === 'line' && selectedDimensions.includes('date');
    
    // Prepare chart data
    const chartData = analyticsData.rows;
    
    if (shouldUseLineChart) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMetrics.map((metric, index) => (
              <Line 
                key={metric} 
                type="monotone" 
                dataKey={metric} 
                stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                activeDot={{ r: 8 }} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={selectedDimensions[0] || 'date'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMetrics.map((metric, index) => (
              <Bar 
                key={metric} 
                dataKey={metric} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };
  
  // Render provider configuration
  const renderProviderConfiguration = () => {
    if (!allowProviderConfiguration) {
      return null;
    }
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analytics Providers
          </Typography>
          
          {providers.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No analytics providers configured. Add a provider to fetch data.
            </Alert>
          ) : (
            providers.map((provider, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Provider</InputLabel>
                      <Select
                        value={provider.provider}
                        label="Provider"
                        onChange={(e) => updateProvider(index, 'provider', e.target.value)}
                      >
                        <MenuItem value={AnalyticsProvider.GOOGLE_ANALYTICS}>Google Analytics</MenuItem>
                        <MenuItem value={AnalyticsProvider.MIXPANEL}>Mixpanel</MenuItem>
                        <MenuItem value={AnalyticsProvider.AMPLITUDE}>Amplitude</MenuItem>
                        <MenuItem value={AnalyticsProvider.SEGMENT}>Segment</MenuItem>
                        <MenuItem value={AnalyticsProvider.CUSTOM_API}>Custom API</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="API Key"
                      value={provider.apiKey || ''}
                      onChange={(e) => updateProvider(index, 'apiKey', e.target.value)}
                    />
                  </Grid>
                  
                  {provider.provider === AnalyticsProvider.CUSTOM_API && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="API Endpoint"
                        value={provider.apiEndpoint || ''}
                        onChange={(e) => updateProvider(index, 'apiEndpoint', e.target.value)}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => removeProvider(index)}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))
          )}
          
          <Button 
            variant="outlined" 
            onClick={addProvider} 
            sx={{ mt: 1 }}
          >
            Add Provider
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  // Render query parameters
  const renderQueryParameters = () => {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Query Parameters
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date: Date) => date && setStartDate(date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date: Date) => date && setEndDate(date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Metrics</InputLabel>
                <Select
                  multiple
                  value={selectedMetrics}
                  label="Metrics"
                  onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={AVAILABLE_METRICS.find(m => m.value === value)?.label || value} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {AVAILABLE_METRICS.map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Dimensions</InputLabel>
                <Select
                  multiple
                  value={selectedDimensions}
                  label="Dimensions"
                  onChange={(e) => setSelectedDimensions(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={AVAILABLE_DIMENSIONS.find(d => d.value === value)?.label || value} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {AVAILABLE_DIMENSIONS.map((dimension) => (
                    <MenuItem key={dimension.value} value={dimension.value}>
                      {dimension.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="contained" 
                  onClick={fetchAnalyticsData} 
                  disabled={isLoading || providers.length === 0 || selectedMetrics.length === 0}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Fetch Data'}
                </Button>
                
                <Box>
                  <Button
                    variant={chartType === 'line' ? 'contained' : 'outlined'}
                    onClick={() => setChartType('line')}
                    sx={{ mr: 1 }}
                  >
                    Line Chart
                  </Button>
                  <Button
                    variant={chartType === 'bar' ? 'contained' : 'outlined'}
                    onClick={() => setChartType('bar')}
                  >
                    Bar Chart
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // Render data visualization
  const renderDataVisualization = () => {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Data Visualization
            </Typography>
            
            {allowExport && analyticsData && (
              <ExportMenu 
                onExport={handleExport}
                disabled={!analyticsData || analyticsData.rows.length === 0}
              />
            )}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}
          
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Chart" />
            <Tab label="Table" />
            <Tab label="Raw Data" />
          </Tabs>
          
          <Divider sx={{ mb: 2 }} />
          
          {activeTab === 0 && renderChart()}
          
          {activeTab === 1 && (
            <Box sx={{ overflowX: 'auto' }}>
              {analyticsData && analyticsData.rows.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {Object.keys(analyticsData.rows[0]).map((key) => (
                        <th key={key} style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No data available
                </Typography>
              )}
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box sx={{ overflowX: 'auto' }}>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {analyticsData ? JSON.stringify(analyticsData, null, 2) : 'No data available'}
              </pre>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      
      {renderProviderConfiguration()}
      {renderQueryParameters()}
      {renderDataVisualization()}
    </Box>
  );
};

export default ExternalAnalyticsIntegration; 