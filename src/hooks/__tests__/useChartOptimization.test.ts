<<<<<<< HEAD
// src/hooks/__tests__/useChartOptimization.test.ts
=======
>>>>>>> feature/security-implementation
import { renderHook, act } from '@testing-library/react-hooks';
import { useChartOptimization } from '../useChartOptimization';

// Mock data
const mockData = [
  { date: '2025-01-01', value: 100 },
  { date: '2025-01-02', value: 150 },
  { date: '2025-01-03', value: 120 },
  { date: '2025-01-04', value: 180 },
  { date: '2025-01-05', value: 200 }
];

// Mock window.matchMedia for useMediaQuery dependency
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock window.performance
const mockPerformanceNow = jest.spyOn(performance, 'now');

describe('useChartOptimization', () => {
  beforeAll(() => {
    // Store original implementations
    Object.defineProperty(window, 'originalMatchMedia', {
      value: window.matchMedia,
      writable: true,
    });
    Object.defineProperty(window, 'originalInnerWidth', {
      value: window.innerWidth,
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original implementations
    Object.defineProperty(window, 'matchMedia', {
      value: window.originalMatchMedia,
      writable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: window.originalInnerWidth,
      writable: true,
    });
    mockPerformanceNow.mockRestore();
  });

  beforeEach(() => {
    // Reset performance mock
    mockPerformanceNow.mockReset();
    let time = 0;
    mockPerformanceNow.mockImplementation(() => time += 16.67); // Simulate 60fps
  });

  it('should optimize data points for mobile devices', () => {
    mockMatchMedia(true); // Simulate mobile device
    window.innerWidth = 375; // iPhone width

    const { result } = renderHook(() => useChartOptimization(mockData, 'value'));

    expect(result.current.optimizedData.length).toBeLessThanOrEqual(15); // Mobile data point limit
    expect(result.current.config.dimensions.height).toBe(200); // Mobile height
  });

  it('should maintain full data points for desktop devices', () => {
    mockMatchMedia(false); // Simulate desktop device
    window.innerWidth = 1024;

    const { result } = renderHook(() => useChartOptimization(mockData, 'value'));

    expect(result.current.optimizedData.length).toBe(mockData.length);
    expect(result.current.config.dimensions.height).toBe(300); // Desktop height
  });

  it('should calculate tick values correctly', () => {
    mockMatchMedia(false);
    
    const { result } = renderHook(() => useChartOptimization(mockData, 'value'));
    const ticks = result.current.calculateTicks();

    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0]).toBeLessThanOrEqual(Math.min(...mockData.map(d => d.value)));
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(Math.max(...mockData.map(d => d.value)));
  });

  it('should handle device performance based on FPS', async () => {
    mockMatchMedia(false);
    mockPerformanceNow
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => 100); // Simulate low FPS

    const { result } = renderHook(() => useChartOptimization(mockData, 'value'));

    // Wait for FPS calculation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.deviceCapabilities.supportsAnimation).toBe(false);
    expect(result.current.deviceCapabilities.supportsComplexTooltips).toBe(false);
  });

  it('should format tooltips based on device capabilities', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useChartOptimization(mockData, 'value'));

    const simpleTooltip = result.current.formatTooltip(100, 'Test');
    
    // High-performance device (mocked 60fps)
    expect(React.isValidElement(simpleTooltip)).toBe(true);
  });

  it('should handle animation states correctly', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useChartOptimization(mockData, 'value'));

    act(() => {
      result.current.startAnimation();
    });

    expect(result.current.isAnimating).toBe(true);

    // Wait for animation to complete
    act(() => {
      jest.advanceTimersByTime(result.current.config.animationDuration);
    });

    expect(result.current.isAnimating).toBe(false);
  });

  it('should handle empty data gracefully', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useChartOptimization([], 'value'));

    expect(result.current.optimizedData).toHaveLength(0);
    expect(result.current.calculateTicks()).toHaveLength(0);
    expect(() => result.current.formatTooltip(0, 'Test')).not.toThrow();
  });

  it('should debounce optimization on low-performance devices', async () => {
    mockMatchMedia(true);
    mockPerformanceNow
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => 500); // Simulate very low FPS

    const { result, rerender } = renderHook(
      ({ data }) => useChartOptimization(data, 'value'),
      { initialProps: { data: mockData } }
    );

    // Update data
    rerender({ data: [...mockData, { date: '2025-01-06', value: 220 }] });

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.optimizedData).toBeDefined();
  });

  it('should update config when screen size changes', () => {
    mockMatchMedia(false);
    const { result, rerender } = renderHook(() => useChartOptimization(mockData, 'value'));
    
    const initialConfig = { ...result.current.config };
    
    // Simulate screen size change
    mockMatchMedia(true);
    window.innerWidth = 375;
    rerender();

    expect(result.current.config).not.toEqual(initialConfig);
    expect(result.current.config.dimensions.width).toBeLessThan(initialConfig.dimensions.width);
  });

  describe('Performance optimizations', () => {
    it('should memoize tick calculations', () => {
      mockMatchMedia(false);
      const { result, rerender } = renderHook(() => useChartOptimization(mockData, 'value'));
      
      const firstTicks = result.current.calculateTicks();
      rerender();
      const secondTicks = result.current.calculateTicks();
      
      expect(firstTicks).toBe(secondTicks); // Same reference due to memoization
    });

    it('should skip animations on low-end devices', async () => {
      mockMatchMedia(true);
      mockPerformanceNow
        .mockImplementationOnce(() => 0)
        .mockImplementationOnce(() => 500); // Simulate low FPS

      const { result } = renderHook(() => useChartOptimization(mockData, 'value'));

      // Wait for FPS calculation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      act(() => {
        result.current.startAnimation();
      });

      expect(result.current.isAnimating).toBe(false); // Animation should be skipped
    });
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> feature/security-implementation
