/**
 * Tiptap 编辑器性能监控和优化工具
 */

import { useCallback, useRef, useEffect } from "react";
import type { PerformanceMetrics } from "./types/index";

/**
 * 性能监控 Hook
 */
export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    updateTime: 0,
    charactersPerSecond: 0,
  });

  const startTime = useRef<number>(0);
  const characterCount = useRef<number>(0);

  const startMeasure = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endMeasure = useCallback((type: "render" | "update") => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;

    if (type === "render") {
      metricsRef.current.renderTime = duration;
    } else {
      metricsRef.current.updateTime = duration;
    }
  }, []);

  const updateCharacterMetrics = useCallback((newCount: number) => {
    const timeDiff = performance.now() - startTime.current;
    const charDiff = Math.abs(newCount - characterCount.current);

    if (timeDiff > 0) {
      metricsRef.current.charactersPerSecond = (charDiff / timeDiff) * 1000;
    }

    characterCount.current = newCount;
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  return {
    startMeasure,
    endMeasure,
    updateCharacterMetrics,
    getMetrics,
  };
}

/**
 * 优化的防抖 Hook
 */
export function useOptimizedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<number | undefined>(undefined);

  // 更新最新的回调函数
  useEffect(() => {
    callbackRef.current = callback;
  });

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay, ...deps]
  );
}

/**
 * 内存优化的编辑器内容缓存
 */
export class ContentCache {
  private cache = new Map<string, string>();
  private maxSize: number;
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // 移除最少使用的条目
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, value);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessOrder.set(key, ++this.accessCounter);
    }
    return value;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey = "";
    let lruCount = Infinity;

    for (const [key, count] of this.accessOrder) {
      if (count < lruCount) {
        lruCount = count;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.accessOrder.delete(lruKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * 全局内容缓存实例
 */
export const globalContentCache = new ContentCache(50);

/**
 * 虚拟化渲染优化 Hook
 */
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const visibleStart = useRef(0);
  const visibleEnd = useRef(0);

  const updateVisibleRange = useCallback(
    (scrollTop: number) => {
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        itemCount,
        start + Math.ceil(containerHeight / itemHeight) + 1
      );

      visibleStart.current = Math.max(0, start);
      visibleEnd.current = end;
    },
    [itemCount, itemHeight, containerHeight]
  );

  return {
    visibleStart: visibleStart.current,
    visibleEnd: visibleEnd.current,
    updateVisibleRange,
  };
}

/**
 * 批量更新优化
 */
export class BatchUpdater {
  private updates: (() => void)[] = [];
  private timeoutId?: number;
  private delay: number;

  constructor(delay = 16) {
    // 60fps
    this.delay = delay;
  }

  schedule(update: () => void): void {
    this.updates.push(update);

    if (!this.timeoutId) {
      this.timeoutId = window.setTimeout(() => {
        this.flush();
      }, this.delay);
    }
  }

  flush(): void {
    const updates = this.updates.splice(0);
    updates.forEach((update) => update());

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  cancel(): void {
    this.updates.length = 0;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}

/**
 * 全局批量更新器
 */
export const globalBatchUpdater = new BatchUpdater();
