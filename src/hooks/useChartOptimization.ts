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

  return {
    optimizedData,
    config,
    isAnimating,
    deviceCapabilities: {
      supportsAnimation: fps >= 30,
      supportsComplexTooltips: fps >= 30,
      isHighPerformance: fps >= 45
    },
    calculateTicks: () => [], // Will be implemented in next part
    formatTooltip: () => null, // Will be implemented in next part
    startAnimation: () => {} // Will be implemented in next part
  };
};