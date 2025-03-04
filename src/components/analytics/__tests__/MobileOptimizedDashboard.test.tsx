<<<<<<< HEAD
// src/components/analytics/__tests__/MobileOptimizedDashboard.test.tsx
=======
>>>>>>> feature/security-implementation
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileOptimizedDashboard from '../MobileOptimizedDashboard';
import { useChartOptimization } from '@/hooks/useChartOptimization';

// Mock the useChartOptimization hook
jest.mock('@/hooks/useChartOptimization');

// Mock ResizeObserver for ResponsiveContainer
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock data
const mockData = [
  { date: '2025-01-01', matches: 10, messages: 50, connections: 5, engagement: 75 },
  { date: '2025-01-02', matches: 15, messages: 60, connections: 8, engagement: 80 },
  { date: '2025-01-03', matches: 12, messages: 45, connections: 6, engagement: 70 }
];

// Mock chart optimization hook result
const mockChartOptimization = {
  optimizedData: mockData,
  config: {
    dimensions: {
      height: 300,
      margin: { top: 20, right: 30, bottom: 60, left: 30 }
    },
    tickInterval: 1,
    barSize: 30
  },
  deviceCapabilities: {
    supportsAnimation: true,
    supportsComplexTooltips: true,
    isHighPerformance: true
  },
  calculateTicks: () => [0, 25, 50, 75, 100],
  formatTooltip: (value: number, label: string) => (
    <div data-testid="tooltip">{`${label}: ${value}`}</div>
  ),
  startAnimation: jest.fn()
};

describe('MobileOptimizedDashboard', () => {
  beforeEach(() => {
    (useChartOptimization as jest.Mock).mockReturnValue(mockChartOptimization);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard with initial metric', () => {
    render(<MobileOptimizedDashboard data={mockData} />);
    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('Daily matching activity')).toBeInTheDocument();
  });

  it('handles timeframe changes', () => {
    const onTimeframeChange = jest.fn();
    render(
      <MobileOptimizedDashboard 
        data={mockData} 
        onTimeframeChange={onTimeframeChange} 
      />
    );

    fireEvent.click(screen.getByText('30d'));
    expect(onTimeframeChange).toHaveBeenCalledWith('30d');
  });

  it('handles metric navigation with buttons', () => {
    const onMetricChange = jest.fn();
    render(
      <MobileOptimizedDashboard 
        data={mockData} 
        onMetricChange={onMetricChange} 
      />
    );

    // Navigate to next metric
    fireEvent.click(screen.getByLabelText('Next metric'));
    expect(onMetricChange).toHaveBeenCalledWith('messages');
    expect(mockChartOptimization.startAnimation).toHaveBeenCalled();
  });

  describe('Touch interactions', () => {
    const createTouchEvent = (x: number, y: number) => ({
      touches: [{ clientX: x, clientY: y }]
    });

    it('handles swipe gestures for metric navigation', () => {
      const onMetricChange = jest.fn();
      render(
        <MobileOptimizedDashboard 
          data={mockData} 
          onMetricChange={onMetricChange} 
        />
      );

      const container = screen.getByTestId('chart-container');

      // Simulate swipe right
      fireEvent.touchStart(container, createTouchEvent(0, 0));
      fireEvent.touchMove(container, createTouchEvent(100, 0));
      fireEvent.touchEnd(container);

      expect(onMetricChange).toHaveBeenCalled();
      expect(mockChartOptimization.startAnimation).toHaveBeenCalled();
    });

    it('handles pinch-to-zoom gestures', () => {
      render(<MobileOptimizedDashboard data={mockData} />);
      const container = screen.getByTestId('chart-container');

      // Simulate pinch gesture
      fireEvent.touchStart(container, {
        touches: [
          { clientX: 0, clientY: 0 },
          { clientX: 50, clientY: 50 }
        ]
      });

      fireEvent.touchMove(container, {
        touches: [
          { clientX: 0, clientY: 0 },
          { clientX: 100, clientY: 100 }
        ]
      });

      fireEvent.touchEnd(container);

      // Check if zoom state is updated
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    });
  });

  describe('Performance optimizations', () => {
    it('disables animations on low-performance devices', () => {
      (useChartOptimization as jest.Mock).mockReturnValue({
        ...mockChartOptimization,
        deviceCapabilities: {
          ...mockChartOptimization.deviceCapabilities,
          supportsAnimation: false
        }
      });

      render(<MobileOptimizedDashboard data={mockData} />);
      expect(screen.queryByLabelText('Zoom in')).not.toBeInTheDocument();
    });

    it('uses simplified tooltips on low-performance devices', () => {
      (useChartOptimization as jest.Mock).mockReturnValue({
        ...mockChartOptimization,
        deviceCapabilities: {
          ...mockChartOptimization.deviceCapabilities,
          supportsComplexTooltips: false
        }
      });

      render(<MobileOptimizedDashboard data={mockData} />);
      
      // Trigger tooltip
      const dataPoint = screen.getByTestId('data-point-0');
      fireEvent.mouseOver(dataPoint);
      
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveTextContent(/^\d+$/); // Simple number format
    });

    it('optimizes rendering for different screen sizes', () => {
      // Mock smaller screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375
      });

      render(<MobileOptimizedDashboard data={mockData} />);
      
      // Check if chart dimensions are adjusted
      const chart = screen.getByTestId('responsive-chart');
      expect(chart).toHaveStyle({ height: '200px' });
    });
  });

  describe('Accessibility', () => {
    it('provides keyboard navigation for metrics', () => {
      render(<MobileOptimizedDashboard data={mockData} />);
      
      const nextButton = screen.getByLabelText('Next metric');
      const prevButton = screen.getByLabelText('Previous metric');

      // Navigate with keyboard
      nextButton.focus();
      fireEvent.keyDown(nextButton, { key: 'Enter' });
      expect(screen.getByText('Messages')).toBeInTheDocument();

      prevButton.focus();
      fireEvent.keyDown(prevButton, { key: 'Enter' });
      expect(screen.getByText('Matches')).toBeInTheDocument();
    });

    it('maintains focus management during metric transitions', () => {
      render(<MobileOptimizedDashboard data={mockData} />);
      
      const nextButton = screen.getByLabelText('Next metric');
      nextButton.focus();
      fireEvent.click(nextButton);

      // Check if focus is maintained after transition
      expect(document.activeElement).toBe(nextButton);
    });

    it('announces metric changes to screen readers', () => {
      render(<MobileOptimizedDashboard data={mockData} />);
      
      const nextButton = screen.getByLabelText('Next metric');
      fireEvent.click(nextButton);

      const announcement = screen.getByRole('alert');
      expect(announcement).toHaveTextContent('Now showing Messages data');
    });
  });

  describe('Error handling', () => {
    it('handles missing data gracefully', () => {
      render(<MobileOptimizedDashboard data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('recovers from chart rendering errors', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Force a rendering error
      (useChartOptimization as jest.Mock).mockImplementation(() => {
        throw new Error('Chart error');
      });

      render(<MobileOptimizedDashboard data={mockData} />);
      
      expect(screen.getByText('Unable to display chart')).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('handles invalid metric data', () => {
      const invalidData = [
        { date: '2025-01-01', matches: 'invalid' }
      ];

      render(<MobileOptimizedDashboard data={invalidData} />);
      expect(screen.getByText('Invalid data format')).toBeInTheDocument();
    });
  });
});