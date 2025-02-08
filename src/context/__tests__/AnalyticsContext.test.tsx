// Continuing from previous implementation...
    act(() => {
      result.current.updateFilter({ userType: 'entrepreneur' });
      result.current.resetFilter();
    });

    expect(result.current.state.filter).toEqual({
      startDate: expect.any(Date),
      endDate: expect.any(Date),
      timeframe: 'month',
      userType: undefined,
      subscriptionTier: undefined
    });
  });

  it('should set metrics', () => {
    const { result } = renderHook(() => useAnalyticsContext(), { wrapper });
    const mockMetrics = {
      users: { total: 1000 },
      timestamp: new Date()
    };

    act(() => {
      result.current.setMetrics(mockMetrics as any);
    });

    expect(result.current.state.metrics).toEqual(mockMetrics);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useAnalyticsContext(), { wrapper });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.state.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const { result } = renderHook(() => useAnalyticsContext(), { wrapper });
    const errorMessage = 'Test error';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.state.error).toBe(errorMessage);
  });

  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => useAnalyticsContext());
    expect(result.error).toEqual(
      Error('useAnalyticsContext must be used within an AnalyticsProvider')
    );
  });
});