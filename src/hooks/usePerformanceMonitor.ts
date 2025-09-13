import { useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

interface PerformanceConfig {
  enabled: boolean;
  threshold: number; // 性能警告阈值（毫秒）
  sampleRate: number; // 采样率 (0-1)
}

const defaultConfig: PerformanceConfig = {
  enabled: process.env.NODE_ENV === "development",
  threshold: 16, // 16ms (60fps)
  sampleRate: 0.1, // 10% 采样
};

/**
 * 性能监控 Hook
 * 
 * 功能特性：
 * - 监控组件渲染时间
 * - 检测性能瓶颈
 * - 提供性能警告
 * - 支持采样率控制
 * 
 * 使用方法：
 * ```tsx
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent');
 *   // 组件逻辑...
 * }
 * ```
 */
export const usePerformanceMonitor = (
  componentName: string,
  config: Partial<PerformanceConfig> = {}
) => {
  const finalConfig = { ...defaultConfig, ...config };
  const renderStartTime = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // 开始性能测量
  const startMeasure = useCallback(() => {
    if (!finalConfig.enabled || Math.random() > finalConfig.sampleRate) {
      return;
    }
    renderStartTime.current = performance.now();
  }, [finalConfig.enabled, finalConfig.sampleRate]);

  // 结束性能测量
  const endMeasure = useCallback(() => {
    if (!finalConfig.enabled || renderStartTime.current === 0) {
      return;
    }

    const renderTime = performance.now() - renderStartTime.current;
    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now(),
    };

    // 存储性能指标
    metricsRef.current.push(metrics);

    // 保持最近100条记录
    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100);
    }

    // 性能警告
    if (renderTime > finalConfig.threshold) {
      console.warn(
        `🐌 Performance Warning: ${componentName} took ${renderTime.toFixed(2)}ms to render (threshold: ${finalConfig.threshold}ms)`
      );
    }

    // 重置开始时间
    renderStartTime.current = 0;
  }, [componentName, finalConfig.enabled, finalConfig.threshold]);

  // 获取性能统计
  const getStats = useCallback(() => {
    const metrics = metricsRef.current;
    if (metrics.length === 0) {
      return null;
    }

    const renderTimes = metrics.map(m => m.renderTime);
    const avg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const max = Math.max(...renderTimes);
    const min = Math.min(...renderTimes);

    return {
      componentName,
      count: metrics.length,
      averageRenderTime: avg,
      maxRenderTime: max,
      minRenderTime: min,
      slowRenders: metrics.filter(m => m.renderTime > finalConfig.threshold).length,
    };
  }, [componentName, finalConfig.threshold]);

  // 组件挂载时开始测量
  useEffect(() => {
    startMeasure();
  });

  // 组件更新后结束测量
  useEffect(() => {
    endMeasure();
  });

  return {
    getStats,
    clearStats: () => {
      metricsRef.current = [];
    },
  };
};

/**
 * 内存使用监控 Hook
 */
export const useMemoryMonitor = (interval: number = 5000) => {
  const memoryInfoRef = useRef<any>(null);

  useEffect(() => {
    if (!('memory' in performance)) {
      return;
    }

    const checkMemory = () => {
      const memInfo = (performance as any).memory;
      memoryInfoRef.current = {
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
        timestamp: Date.now(),
      };

      // 内存使用率超过80%时警告
      const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
      if (usageRatio > 0.8) {
        console.warn(
          `🧠 Memory Warning: JS heap usage is ${(usageRatio * 100).toFixed(1)}%`
        );
      }
    };

    checkMemory();
    const timer = setInterval(checkMemory, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return {
    getMemoryInfo: () => memoryInfoRef.current,
  };
};

/**
 * FPS 监控 Hook
 */
export const useFPSMonitor = () => {
  const fpsRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;

      if (now - lastTimeRef.current >= 1000) {
        fpsRef.current = Math.round(
          (frameCountRef.current * 1000) / (now - lastTimeRef.current)
        );
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // FPS低于30时警告
        if (fpsRef.current < 30) {
          console.warn(`📉 FPS Warning: Current FPS is ${fpsRef.current}`);
        }
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return {
    getFPS: () => fpsRef.current,
  };
};

/**
 * 性能监控工具函数
 */
export const PerformanceUtils = {
  // 测量函数执行时间
  measureFunction: <T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      console.log(
        `⏱️ Function ${name || fn.name} took ${(end - start).toFixed(2)}ms`
      );
      
      return result;
    }) as T;
  },

  // 测量异步函数执行时间
  measureAsyncFunction: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name?: string
  ): T => {
    return (async (...args: Parameters<T>) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      console.log(
        `⏱️ Async function ${name || fn.name} took ${(end - start).toFixed(2)}ms`
      );
      
      return result;
    }) as T;
  },

  // 获取页面性能指标
  getPageMetrics: () => {
    if (!('getEntriesByType' in performance)) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
    };
  },
};
