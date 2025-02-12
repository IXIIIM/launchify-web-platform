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

export const useChartOptimization = (rawData: ChartData[], metric: string) => {
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
    dataPoints: isMobile ? 15 : 30, // Reduce data points on mobile
    tickInterval: isMobile ? 2 : 1,
    barSize: isMobile ? 20 : 30,
    animationDuration: fps >= 30 ? 300 : 0 // Disable animations on low-end devices
  }), [isMobile, fps]);

  // Monitor device performance
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;
    
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
      animationFrameId = requestAnimationFrame(measureFps);
    };

    animationFrameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Optimize data based on device capabilities
  useEffect(() => {
    if (!rawData.length) return;

    const optimizeData = () => {
      // Reduce data points if needed
      let processedData = rawData;
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

  // Handle animations
  const startAnimation = () => {
    if (fps < 30) return; // Skip animation on low-end devices
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), config.animationDuration);
  };

  // Calculate optimal tick values
  const calculateTicks = useMemo(() => {
    const values = optimizedData.map(item => item[metric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const tickCount = isMobile ? 4 : 6;
    
    return Array.from({ length: tickCount }, (_, i) => {
      return Number((min + (max - min) * (i / (tickCount - 1))).toFixed(1));
    });
  }, [optimizedData, metric, isMobile]);

  // Format tooltip content
  const formatTooltip = (value: number, label: string) => {
    if (fps < 30) return `${label}: ${value}`; // Simplified tooltip for low-end devices
    
    return (
      <div className="bg-white p-2 rounded shadow-lg border">
        <div className="font-semibold">{label}</div>
        <div>{value}</div>
      </div>
    );
  };

  // Touch interaction handlers
  const getTouchHandlers = (onZoom?: (scale: number) => void) => {
    let initialDistance = 0;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        initialDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && onZoom) {
        const currentDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
        
        const scale = currentDistance / initialDistance;
        onZoom(scale);
      }
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove
    };
  };

  // Performance monitoring hooks
  const getPerformanceMetrics = () => {
    return {
      fps,
      supportsAnimation: fps >= 30,
      supportsComplexTooltips: fps >= 30,
      deviceCategory: fps >= 45 ? 'high' : fps >= 30 ? 'medium' : 'low'
    };
  };

  // Memory management
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (optimizedData.length > config.dataPoints * 2) {
        setOptimizedData(prev => prev.slice(-config.dataPoints));
      }
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, [config.dataPoints]);

  return {
    optimizedData,
    config,
    isAnimating,
    calculateTicks,
    formatTooltip,
    startAnimation,
    getTouchHandlers,
    performanceMetrics: getPerformanceMetrics(),
    deviceCapabilities: {
      supportsAnimation: fps >= 30,
      supportsComplexTooltips: fps >= 30,
      supportsTouchInteractions: 'ontouchstart' in window,
      supportsAdvancedEffects: fps >= 45
    }
  };
};

// Export types for use in components
export type { ChartData, ChartConfig, ChartDimensions };