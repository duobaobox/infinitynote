/**
 * 性能优化工具函数集合
 * 
 * 包含防抖、节流、虚拟化、内存管理等性能优化工具
 */

/**
 * 防抖函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(later, wait) as unknown as number;
    
    if (callNow) func(...args);
  };
}

/**
 * 节流函数
 * 规定在一个单位时间内，只能触发一次函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 请求动画帧节流
 * 使用 requestAnimationFrame 来节流函数调用
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...args);
        rafId = null;
      });
    }
  };
}

/**
 * 空闲时间执行
 * 在浏览器空闲时执行函数
 */
export function runWhenIdle(
  callback: () => void,
  timeout = 5000
): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    // 降级到 setTimeout
    setTimeout(callback, 1);
  }
}

/**
 * 批量执行任务
 * 将大量任务分批执行，避免阻塞主线程
 */
export function batchExecute<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  batchSize = 100,
  delay = 0
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    
    function processBatch() {
      const endIndex = Math.min(index + batchSize, items.length);
      
      for (let i = index; i < endIndex; i++) {
        processor(items[i], i);
      }
      
      index = endIndex;
      
      if (index < items.length) {
        if (delay > 0) {
          setTimeout(processBatch, delay);
        } else {
          runWhenIdle(processBatch);
        }
      } else {
        resolve();
      }
    }
    
    processBatch();
  });
}

/**
 * 内存清理工具
 */
export class MemoryManager {
  private static cleanupTasks: (() => void)[] = [];
  
  /**
   * 注册清理任务
   */
  static registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task);
  }
  
  /**
   * 执行所有清理任务
   */
  static cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('清理任务执行失败:', error);
      }
    });
    this.cleanupTasks = [];
  }
  
  /**
   * 强制垃圾回收（仅在开发环境）
   */
  static forceGC(): void {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
    }
  }
}

/**
 * 图片懒加载工具
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  
  constructor(options: IntersectionObserverInit = {}) {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px',
          threshold: 0.1,
          ...options,
        }
      );
    }
  }
  
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          this.observer?.unobserve(img);
        }
      }
    });
  }
  
  observe(element: HTMLImageElement): void {
    this.observer?.observe(element);
  }
  
  unobserve(element: HTMLImageElement): void {
    this.observer?.unobserve(element);
  }
  
  disconnect(): void {
    this.observer?.disconnect();
  }
}

/**
 * 虚拟滚动计算工具
 */
export class VirtualScrollCalculator {
  constructor(
    private itemHeight: number,
    private containerHeight: number,
    private overscan = 5
  ) {}
  
  /**
   * 计算可见范围
   */
  calculateVisibleRange(scrollTop: number, totalItems: number): {
    startIndex: number;
    endIndex: number;
    offsetY: number;
  } {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / this.itemHeight) - this.overscan
    );
    
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + visibleCount + this.overscan * 2
    );
    
    const offsetY = startIndex * this.itemHeight;
    
    return { startIndex, endIndex, offsetY };
  }
  
  /**
   * 计算总高度
   */
  getTotalHeight(totalItems: number): number {
    return totalItems * this.itemHeight;
  }
}

/**
 * 缓存管理器
 */
export class CacheManager<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private maxSize: number;
  
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }
  
  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl = 300000): void { // 默认5分钟
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 性能监控工具
 */
export const PerformanceMonitor = {
  /**
   * 监控长任务
   */
  observeLongTasks(callback: (entries: PerformanceEntry[]) => void): PerformanceObserver | null {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
        return observer;
      } catch (error) {
        console.warn('Long task observation not supported');
        return null;
      }
    }
    return null;
  },
  
  /**
   * 监控内存使用
   */
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  },
  
  /**
   * 获取页面加载性能
   */
  getNavigationTiming(): PerformanceNavigationTiming | null {
    if ('getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('navigation');
      return entries[0] as PerformanceNavigationTiming | null;
    }
    return null;
    return null;
  },
};
