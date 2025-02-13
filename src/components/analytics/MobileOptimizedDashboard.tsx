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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const scaleRef = useRef<number>(1);

  // Use our optimization hook
  const {
    optimizedData,
    config,
    deviceCapabilities,
    calculateTicks,
    formatTooltip,
    startAnimation
  } = useChartOptimization(data, activeMetric);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e.touches.length === 2) {
      // Handle pinch start
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

      // Swipe detection for metric switching
      if (Math.abs(deltaX) > 50) {
        const currentIndex = metrics.findIndex(m => m.id === activeMetric);
        let newIndex;

        if (deltaX > 0 && currentIndex > 0) {
          newIndex = currentIndex - 1;
        } else if (deltaX < 0 && currentIndex < metrics.length - 1) {
          newIndex = currentIndex + 1;
        }

        if (newIndex !== undefined) {
          setActiveMetric(metrics[newIndex].id);
          onMetricChange?.(metrics[newIndex].id);
          startAnimation();
          touchStartRef.current = null;
        }
      }
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
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

  // Render current metric chart
  const renderChart = () => {
    const currentMetric = metrics.find(m => m.id === activeMetric)!;
    const chartProps = {
      width: "100%",
      height: isZoomed ? window.innerHeight * 0.7 : config.dimensions.height,
      data: optimizedData,
      margin: config.dimensions.margin
    };

    // Common props for axes and tooltips
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
        />
      </BarChart>
    );
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with timeframe selection */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">{metrics.find(m => m.id === activeMetric)?.label}</h2>
        <div className="flex space-x-2">
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
              setActiveMetric(metrics[currentIndex - 1].id);
              onMetricChange?.(metrics[currentIndex - 1].id);
              startAnimation();
            }
          }}
          disabled={activeMetric === metrics[0].id}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        
        <p className="text-sm text-gray-500">
          {metrics.find(m => m.id === activeMetric)?.description}
        </p>

        <button
          onClick={() => {
            const currentIndex = metrics.findIndex(m => m.id === activeMetric);
            if (currentIndex < metrics.length - 1) {
              setActiveMetric(metrics[currentIndex + 1].id);
              onMetricChange?.(metrics[currentIndex + 1].id);
              startAnimation();
            }
          }}
          disabled={activeMetric === metrics[metrics.length - 1].id}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Chart container */}
      <div className="relative">
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
};

export default MobileOptimizedDashboard;