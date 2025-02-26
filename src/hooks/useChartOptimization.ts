// src/hooks/useChartOptimization.ts
import { useState, useEffect, useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';

interface ChartData {
  date: string;
  [key: string]: any;
}

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface ChartConfig {
  dimensions: ChartDimensions;
  dataPoints: number;
  tickInterval: number;
  barSize?: number;
  animationDuration: number;
}

export interface ChartOptimizationResult {
  optimizedData: ChartData[];
  config: ChartConfig;
  isAnimating: boolean;
  deviceCapabilities: {
    supportsAnimation: boolean;
    supportsComplexTooltips: boolean;
    isHighPerformance: boolean;
  };
  calculateTicks: () => number[];
  formatTooltip: (value: number, label: string) => React.ReactNode;
  startAnimation: () => void;
}

export const useChartOptimization = (
  rawData: ChartData[], 
  metric: string
): ChartOptimizationResult => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [optimizedData, setOptimizedData] = useState<ChartData[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fps, setFps] = useState(60);

  // Define chart configuration based on device capabilities and screen size
  const config: ChartConfig = useMemo(() => ({
    dimensions: {
      width: isMobile ? window.innerWidth - 32 : window.innerWidth - 64,
      height: isMobile ? 200 : 300,
      margin: isMobile
        ? { top: 10, right: 10, bottom: 40, left: 10 }
        : { top: 20, right: 30, bottom: 60, left: 30 }
    },
    dataPoints: isMobile ? 15 : 30,
    tickInterval: isMobile ? 2 : 1,
    barSize: isMobile ? 20 : 30,
    animationDuration: fps >= 30 ? 300 : 0
  }), [isMobile, fps]);

  // Monitor device performance
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFps = () => {
      const now = performance.now();
      const elapsed = now - lastTime;
      
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / elapsed);
        setFps(currentFps);
        frameCount = 0;
        lastTime = now;
      }
      
      frameCount++;
      requestAnimationFrame(measureFps);
    };

    const handle = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(handle);
  }, []);

  // Data optimization
  useEffect(() => {
    if (!rawData.length) return;

    const optimizeData = () => {
      let processedData = rawData;
      
      // Reduce data points if needed
      if (rawData.length > config.dataPoints) {
        const interval = Math.ceil(rawData.length / config.dataPoints);
        processedData = rawData.filter((_, index) => index % interval === 0);
      }

      // Round values to reduce unnecessary precision
      processedData = processedData.map(item => ({
        ...item,
        [metric]: Number(item[metric].toFixed(2))
      }));

      setOptimizedData(processedData);
    };

    // Debounce optimization on low-end devices
    if (fps < 30) {
      const timeout = setTimeout(optimizeData, 100);
      return () => clearTimeout(timeout);
    }

    optimizeData();
  }, [rawData, metric, config.dataPoints, fps]);

  // Calculate optimal tick values
  const calculateTicks = useMemo(() => () => {
    if (!optimizedData.length) return [];

    const values = optimizedData.map(item => item[metric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const tickCount = isMobile ? 4 : 6;
    
    // Calculate nice tick values
    const range = max - min;
    const roughStep = range / (tickCount - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const step = Math.ceil(roughStep / magnitude) * magnitude;
    
    // Generate tick values
    const ticks = [];
    let currentTick = Math.floor(min / magnitude) * magnitude;
    
    while (currentTick <= max && ticks.length < tickCount) {
      ticks.push(Number(currentTick.toFixed(2)));
      currentTick += step;
    }

    return ticks;
  }, [optimizedData, metric, isMobile]);

  // Format tooltip content
  const formatTooltip = useMemo(() => (value: number, label: string): React.ReactNode => {
    // Simple tooltip for low-performance devices
    if (fps < 30) {
      return `${label}: ${value}`;
    }
    
    // Enhanced tooltip for high-performance devices
    return (
      <div className="bg-white p-2 rounded shadow-lg border">
        <div className="font-semibold">{label}</div>
        <div className="flex items-baseline space-x-1">
          <span className="text-lg">{value}</span>
          {fps >= 45 && (
            <span className="text-xs text-gray-500">
              {calculateGrowth(value, label)}
            </span>
          )}
        </div>
        {fps >= 45 && <div className="w-24 h-1 bg-gray-100 rounded-full mt-1">
          <div 
            className="h-full bg-blue-600 rounded-full" 
            style={{ width: `${calculateProgress(value, label)}%` }}
          />
        </div>}
      </div>
    );
  }, [fps]);

  // Helper functions for enhanced tooltips
  const calculateGrowth = (value: number, label: string): string => {
    if (!optimizedData.length) return '';
    
    const previousValue = optimizedData
      .slice(0, -1)
      .find(item => item[metric] !== undefined)?.[metric] ?? value;
    
    const growth = ((value - previousValue) / previousValue) * 100;
    return growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  };

  const calculateProgress = (value: number, label: string): number => {
    if (!optimizedData.length) return 0;
    
    const values = optimizedData.map(item => item[metric]);
    const max = Math.max(...values);
    return (value / max) * 100;
  };

  // Animation control
  const startAnimation = () => {
    if (fps < 30) return; // Skip animation on low-end devices
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), config.animationDuration);
  };

  return {
    optimizedData,
    config,
    isAnimating,
    deviceCapabilities: {
      supportsAnimation: fps >= 30,
      supportsComplexTooltips: fps >= 30,
      isHighPerformance: fps >= 45
    },
    calculateTicks,
    formatTooltip,
    startAnimation
  };
};