import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/api/analytics';
import { PlatformMetrics, AnalyticsFilter } from '@/types/analytics';
import { ExportFormat } from '@/types/export';

export const useAnalytics = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await analyticsApi.getOverview();
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch analytics overview');
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedMetrics = async (filter: AnalyticsFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await analyticsApi.getDetailedMetrics(filter);
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch detailed metrics');
      console.error('Error fetching detailed metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = async (startDate: Date, endDate: Date, format: ExportFormat) => {
    try {
      setIsLoading(true);
      setError(null);
      const blob = await analyticsApi.exportData(startDate, endDate, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${startDate.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export analytics data');
      console.error('Error exporting analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    metrics,
    isLoading,
    error,
    fetchOverview,
    fetchDetailedMetrics,
    exportAnalytics
  };
};

export const useRealTimeAnalytics = (refreshInterval = 5000) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await analyticsApi.getRealTimeStats();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch real-time stats');
      console.error('Error fetching real-time stats:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up polling interval
    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { stats, isLoading, error, refetch: fetchStats };
};

export const useAnalyticsExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = async (format: ExportFormat = 'pdf') => {
    try {
      setIsExporting(true);
      setError(null);
      const blob = await analyticsApi.downloadReport(format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export report');
      console.error('Error exporting report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportReport, isExporting, error };
};