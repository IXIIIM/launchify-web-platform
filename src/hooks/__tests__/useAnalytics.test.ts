import { renderHook, act } from '@testing-library/react-hooks';
import { useAnalytics, useRealTimeAnalytics, useAnalyticsExport } from '../useAnalytics';
import { analyticsApi } from '@/services/api/analytics';

// Mock the API
jest.mock('@/services/api/analytics');

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch overview successfully', async () => {
    const mockData = { users: { total: 1000 } };
    (analyticsApi.getOverview as jest.Mock).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await result.current.fetchOverview();
    });

    expect(result.current.metrics).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    (analyticsApi.getOverview as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await result.current.fetchOverview();
    });

    expect(result.current.metrics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch analytics overview');
  });
});

describe('useRealTimeAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch real-time stats on mount and interval', async () => {
    const mockStats = { activeUsers: 100 };
    (analyticsApi.getRealTimeStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useRealTimeAnalytics(1000));

    // Initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.stats).toEqual(mockStats);

    // Advance timers and check interval fetch
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(analyticsApi.getRealTimeStats).toHaveBeenCalledTimes(2);
  });
});

describe('useAnalyticsExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should handle export successfully', async () => {
    const mockBlob = new Blob(['test']);
    (analyticsApi.downloadReport as jest.Mock).mockResolvedValueOnce(mockBlob);

    const { result } = renderHook(() => useAnalyticsExport());

    await act(async () => {
      await result.current.exportReport('pdf');
    });

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });
});
