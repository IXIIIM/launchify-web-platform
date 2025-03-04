import { useState, useEffect, useCallback } from 'react';
import AnalyticsService, {
  AnalyticsFilters,
  DashboardData,
  InvestmentAnalytics,
  EscrowAnalytics,
  UserEngagementAnalytics,
  DocumentAnalytics
} from '../services/AnalyticsService';
import { ExportFormat } from '../types/export';

interface UseDashboardAnalyticsOptions {
  initialFilters?: AnalyticsFilters;
  autoFetch?: boolean;
}

interface UseDashboardAnalyticsReturn {
  // Dashboard data
  dashboardData: DashboardData | null;
  loading: boolean;
  error: Error | null;
  
  // Filters
  filters: AnalyticsFilters;
  setFilters: (filters: AnalyticsFilters) => void;
  
  // Refresh functions
  refreshDashboard: () => Promise<void>;
  refreshInvestments: () => Promise<void>;
  refreshEscrows: () => Promise<void>;
  refreshUserEngagement: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  
  // Section data
  investmentAnalytics: InvestmentAnalytics | null;
  escrowAnalytics: EscrowAnalytics | null;
  userEngagementAnalytics: UserEngagementAnalytics | null;
  documentAnalytics: DocumentAnalytics | null;
  
  // Section loading states
  investmentsLoading: boolean;
  escrowsLoading: boolean;
  userEngagementLoading: boolean;
  documentsLoading: boolean;
  
  // Section errors
  investmentsError: Error | null;
  escrowsError: Error | null;
  userEngagementError: Error | null;
  documentsError: Error | null;
  
  // Event tracking
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  
  // Export functionality
  exportReport: (format: ExportFormat) => Promise<void>;
  isExporting: boolean;
}

const defaultFilters: AnalyticsFilters = {
  timeframe: '30d'
};

export const useDashboardAnalytics = (options: UseDashboardAnalyticsOptions = {}): UseDashboardAnalyticsReturn => {
  const { 
    initialFilters = defaultFilters,
    autoFetch = true
  } = options;
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  
  // Section data state
  const [investmentAnalytics, setInvestmentAnalytics] = useState<InvestmentAnalytics | null>(null);
  const [escrowAnalytics, setEscrowAnalytics] = useState<EscrowAnalytics | null>(null);
  const [userEngagementAnalytics, setUserEngagementAnalytics] = useState<UserEngagementAnalytics | null>(null);
  const [documentAnalytics, setDocumentAnalytics] = useState<DocumentAnalytics | null>(null);
  
  // Section loading states
  const [investmentsLoading, setInvestmentsLoading] = useState<boolean>(false);
  const [escrowsLoading, setEscrowsLoading] = useState<boolean>(false);
  const [userEngagementLoading, setUserEngagementLoading] = useState<boolean>(false);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);
  
  // Section errors
  const [investmentsError, setInvestmentsError] = useState<Error | null>(null);
  const [escrowsError, setEscrowsError] = useState<Error | null>(null);
  const [userEngagementError, setUserEngagementError] = useState<Error | null>(null);
  const [documentsError, setDocumentsError] = useState<Error | null>(null);
  
  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For development, use mock data
      // In production, this would use: const data = await AnalyticsService.getDashboardData(filters);
      const data = AnalyticsService.getMockDashboardData();
      setDashboardData(data);
      
      // Also update section data
      setInvestmentAnalytics(data.investments);
      setEscrowAnalytics(data.escrows);
      setUserEngagementAnalytics(data.userEngagement);
      setDocumentAnalytics(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // Fetch investment analytics
  const fetchInvestmentAnalytics = useCallback(async () => {
    setInvestmentsLoading(true);
    setInvestmentsError(null);
    
    try {
      // For development, use mock data
      // In production, this would use: const data = await AnalyticsService.getInvestmentAnalytics(filters);
      const data = AnalyticsService.getMockInvestmentAnalytics();
      setInvestmentAnalytics(data);
    } catch (err) {
      setInvestmentsError(err instanceof Error ? err : new Error('Failed to fetch investment analytics'));
      console.error('Error fetching investment analytics:', err);
    } finally {
      setInvestmentsLoading(false);
    }
  }, [filters]);
  
  // Fetch escrow analytics
  const fetchEscrowAnalytics = useCallback(async () => {
    setEscrowsLoading(true);
    setEscrowsError(null);
    
    try {
      // For development, use mock data
      // In production, this would use: const data = await AnalyticsService.getEscrowAnalytics(filters);
      const data = AnalyticsService.getMockEscrowAnalytics();
      setEscrowAnalytics(data);
    } catch (err) {
      setEscrowsError(err instanceof Error ? err : new Error('Failed to fetch escrow analytics'));
      console.error('Error fetching escrow analytics:', err);
    } finally {
      setEscrowsLoading(false);
    }
  }, [filters]);
  
  // Fetch user engagement analytics
  const fetchUserEngagementAnalytics = useCallback(async () => {
    setUserEngagementLoading(true);
    setUserEngagementError(null);
    
    try {
      // For development, use mock data
      // In production, this would use: const data = await AnalyticsService.getUserEngagementAnalytics(filters);
      const data = AnalyticsService.getMockUserEngagementAnalytics();
      setUserEngagementAnalytics(data);
    } catch (err) {
      setUserEngagementError(err instanceof Error ? err : new Error('Failed to fetch user engagement analytics'));
      console.error('Error fetching user engagement analytics:', err);
    } finally {
      setUserEngagementLoading(false);
    }
  }, [filters]);
  
  // Fetch document analytics
  const fetchDocumentAnalytics = useCallback(async () => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      // For development, use mock data
      // In production, this would use: const data = await AnalyticsService.getDocumentAnalytics(filters);
      const data = AnalyticsService.getMockDocumentAnalytics();
      setDocumentAnalytics(data);
    } catch (err) {
      setDocumentsError(err instanceof Error ? err : new Error('Failed to fetch document analytics'));
      console.error('Error fetching document analytics:', err);
    } finally {
      setDocumentsLoading(false);
    }
  }, [filters]);
  
  // Track an event
  const trackEvent = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    AnalyticsService.trackEvent(eventName, properties);
  }, []);
  
  // Export report
  const exportReport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);
    
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Exporting report in ${format} format with filters:`, filters);
      
      // Simulate download by creating a dummy file
      const blob = new Blob(['Dummy export data'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to export report'));
      console.error('Error exporting report:', err);
    } finally {
      setIsExporting(false);
    }
  }, [filters]);
  
  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, autoFetch]);
  
  // Update when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchDashboardData();
    }
  }, [filters, fetchDashboardData, autoFetch]);
  
  return {
    // Dashboard data
    dashboardData,
    loading,
    error,
    
    // Filters
    filters,
    setFilters,
    
    // Refresh functions
    refreshDashboard: fetchDashboardData,
    refreshInvestments: fetchInvestmentAnalytics,
    refreshEscrows: fetchEscrowAnalytics,
    refreshUserEngagement: fetchUserEngagementAnalytics,
    refreshDocuments: fetchDocumentAnalytics,
    
    // Section data
    investmentAnalytics,
    escrowAnalytics,
    userEngagementAnalytics,
    documentAnalytics,
    
    // Section loading states
    investmentsLoading,
    escrowsLoading,
    userEngagementLoading,
    documentsLoading,
    
    // Section errors
    investmentsError,
    escrowsError,
    userEngagementError,
    documentsError,
    
    // Event tracking
    trackEvent,
    
    // Export functionality
    exportReport,
    isExporting
  };
}; 