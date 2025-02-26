<<<<<<< HEAD
// src/components/analytics/MobileOptimizedDashboard.tsx
=======
>>>>>>> feature/security-implementation
import React, { useState, useRef } from 'react';
import { useChartOptimization } from '@/hooks/useChartOptimization';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface MetricData {
  id: string;
  label: string;
  color: string;
  description: string;
  type: 'line' | 'bar';
}

const metrics: MetricData[] = [
  { id: 'matches', label: 'Matches', color: '#3B82F6', description: 'Daily matching activity', type: 'line' },
  { id: 'messages', label: 'Messages', color: '#10B981', description: 'Message volume', type: 'bar' },
  { id: 'connections', label: 'Connections', color: '#6366F1', description: 'New connections made', type: 'line' },
  { id: 'engagement', label: 'Engagement', color: '#F59E0B', description: 'Overall platform engagement', type: 'line' }
];

interface MobileOptimizedDashboardProps {
  data: any[];
  onTimeframeChange?: (timeframe: string) => void;
  onMetricChange?: (metric: string) => void;
}

const MobileOptimizedDashboard: React.FC<MobileOptimizedDashboardProps> = ({
  data,
  onTimeframeChange,
  onMetricChange
}) => {
  const [activeMetric, setActiveMetric] = useState<string>(metrics[0].id);
  const [isZoomed, setIsZoomed] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');
  const [error, setError] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const scaleRef = useRef<number>(1);
  const chartRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Validate data format
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg" role="alert">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  try {
    // Use our optimization hook
    const {
      optimizedData,
      config,
      deviceCapabilities,
      calculateTicks,
      formatTooltip,
      startAnimation
    } = useChartOptimization(data, activeMetric);

    // Error boundary for chart optimization
    if (!optimizedData) throw new Error('Failed to optimize data');

    // Touch gesture handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        scaleRef.current = distance;
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartRef.current.x;
        if (Math.abs(deltaX) > 50) {
          const currentIndex = metrics.findIndex(m => m.id === activeMetric);
          let newIndex;

          if (deltaX > 0 && currentIndex > 0) {
            newIndex = currentIndex - 1;
          } else if (deltaX < 0 && currentIndex < metrics.length - 1) {
            newIndex = currentIndex + 1;
          }

          if (newIndex !== undefined) {
            changeMetric(metrics[newIndex].id);
            touchStartRef.current = null;
          }
        }
      } else if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        
        const scale = distance / scaleRef.current;
        setIsZoomed(scale > 1.2);
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
      scaleRef.current = 1;
    };

    // Change metric with accessibility announcement
    const changeMetric = (newMetricId: string) => {
      setActiveMetric(newMetricId);
      onMetricChange?.(newMetricId);
      startAnimation();

      // Announce change to screen readers
      if (announceRef.current) {
        const newMetric = metrics.find(m => m.id === newMetricId);
        announceRef.current.textContent = `Now showing ${newMetric?.label} data`;
      }
    };

    // Render current metric chart
    const renderChart = () => {
      const currentMetric = metrics.find(m => m.id === activeMetric)!;
      const chartProps = {
        width: "100%",
        height: isZoomed ? window.innerHeight * 0.7 : config.dimensions.height,
        data: optimizedData,
        margin: config.dimensions.margin
      };

      const commonProps = {
        stroke: currentMetric.color,
        strokeWidth: 2,
        dot: !deviceCapabilities.isHighPerformance ? false : { r: 3 },
        activeDot: { r: 6 }
      };

      return currentMetric.type === 'line' ? (
        <LineChart {...chartProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={config.tickInterval}
          />
          <YAxis
            ticks={calculateTicks()}
            tick={{ fontSize: 12 }}
            width={40}
          />
          <Tooltip
            content={({ payload, label }) => 
              payload?.[0] ? formatTooltip(payload[0].value, label) : null
            }
          />
          <Line
            type="monotone"
            dataKey={currentMetric.id}
            {...commonProps}
            role="img"
            aria-label={`Line chart showing ${currentMetric.label.toLowerCase()} over time`}
          />
        </LineChart>
      ) : (
        <BarChart {...chartProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval={config.tickInterval}
          />
          <YAxis
            ticks={calculateTicks()}
            tick={{ fontSize: 12 }}
            width={40}
          />
          <Tooltip
            content={({ payload, label }) => 
              payload?.[0] ? formatTooltip(payload[0].value, label) : null
            }
          />
          <Bar
            dataKey={currentMetric.id}
            fill={currentMetric.color}
            radius={[4, 4, 0, 0]}
            barSize={config.barSize}
            role="img"
            aria-label={`Bar chart showing ${currentMetric.label.toLowerCase()} over time`}
          />
        </BarChart>
      );
    };

    const currentMetric = metrics.find(m => m.id === activeMetric)!;

    return (
      <div 
        className="bg-white rounded-lg shadow-lg p-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="chart-container"
        ref={chartRef}
      >
        {/* Screen reader announcements */}
        <div 
          ref={announceRef}
          role="alert"
          aria-live="polite"
          className="sr-only"
        />

        {/* Header with timeframe selection */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">{currentMetric.label}</h2>
          <div className="flex space-x-2" role="group" aria-label="Time period selection">
            {['7d', '30d', '90d'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeframe(t);
                  onTimeframeChange?.(t);
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  timeframe === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                aria-pressed={timeframe === t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Metric navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              const currentIndex = metrics.findIndex(m => m.id === activeMetric);
              if (currentIndex > 0) {
                changeMetric(metrics[currentIndex - 1].id);
              }
            }}
            disabled={activeMetric === metrics[0].id}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            aria-label="Previous metric"
          >
            <ChevronLeft size={20} />
          </button>
          
          <p className="text-sm text-gray-500">{currentMetric.description}</p>

          <button
            onClick={() => {
              const currentIndex = metrics.findIndex(m => m.id === activeMetric);
              if (currentIndex < metrics.length - 1) {
                changeMetric(metrics[currentIndex + 1].id);
              }
            }}
            disabled={activeMetric === metrics[metrics.length - 1].id}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            aria-label="Next metric"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Chart container */}
        <div className="relative" data-testid="responsive-chart">
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>

          {/* Zoom controls */}
          <AnimatePresence>
            {deviceCapabilities.supportsAnimation && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg"
                aria-label={isZoomed ? "Zoom out" : "Zoom in"}
              >
                {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Touch gesture hint */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Swipe left/right to change metrics • Pinch to zoom
        </p>
      </div>
    );
  } catch (err) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg" role="alert">
        <p className="text-gray-500">Unable to display chart</p>
      </div>
    );
  }
};

export default MobileOptimizedDashboard;