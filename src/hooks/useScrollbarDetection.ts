/**
 * 滚动条检测 Hook
 * 用于检测DOM元素是否显示滚动条，支持垂直和水平滚动条检测
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface ScrollbarState {
  /** 是否有垂直滚动条 */
  hasVerticalScrollbar: boolean;
  /** 是否有水平滚动条 */
  hasHorizontalScrollbar: boolean;
  /** 滚动容器的尺寸信息 */
  dimensions: {
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  };
}

export interface UseScrollbarDetectionOptions {
  /** 监听的目标元素，如果为null则不进行检测 */
  target: HTMLElement | null;
  /** 是否启用检测，默认为true */
  enabled?: boolean;
  /** 防抖延迟时间（毫秒），默认为30ms */
  debounceDelay?: number;
  /** 是否在内容变化时进行检测，默认为true */
  observeContent?: boolean;
  /** 是否在尺寸变化时进行检测，默认为true */
  observeResize?: boolean;
  /** 是否立即执行检测（不使用防抖），默认为false */
  immediate?: boolean;
}

/**
 * 滚动条检测Hook
 *
 * 使用方法：
 * ```tsx
 * const scrollContainerRef = useRef<HTMLDivElement>(null);
 * const { hasVerticalScrollbar } = useScrollbarDetection({
 *   target: scrollContainerRef.current,
 * });
 * ```
 */
export function useScrollbarDetection({
  target,
  enabled = true,
  debounceDelay = 30,
  observeContent = true,
  observeResize = true,
  immediate = false,
}: UseScrollbarDetectionOptions): ScrollbarState {
  const [scrollbarState, setScrollbarState] = useState<ScrollbarState>({
    hasVerticalScrollbar: false,
    hasHorizontalScrollbar: false,
    dimensions: {
      scrollWidth: 0,
      scrollHeight: 0,
      clientWidth: 0,
      clientHeight: 0,
    },
  });

  // 防抖定时器引用
  const debounceTimerRef = useRef<number | undefined>(undefined);
  // Observer引用
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  /**
   * 检测滚动条状态（优化版本）
   */
  const detectScrollbars = useCallback(() => {
    if (!target || !enabled) {
      return;
    }

    const { scrollWidth, scrollHeight, clientWidth, clientHeight } = target;

    // 检测垂直滚动条：内容高度大于可视高度
    const hasVerticalScrollbar = scrollHeight > clientHeight;

    // 检测水平滚动条：内容宽度大于可视宽度
    const hasHorizontalScrollbar = scrollWidth > clientWidth;

    // 立即更新状态，不等待React的批量更新
    setScrollbarState((prevState) => {
      const scrollbarStateChanged =
        prevState.hasVerticalScrollbar !== hasVerticalScrollbar ||
        prevState.hasHorizontalScrollbar !== hasHorizontalScrollbar;

      const dimensionsChanged =
        prevState.dimensions.scrollWidth !== scrollWidth ||
        prevState.dimensions.scrollHeight !== scrollHeight ||
        prevState.dimensions.clientWidth !== clientWidth ||
        prevState.dimensions.clientHeight !== clientHeight;

      // 如果滚动条状态发生变化，这是最重要的变化，应该优先处理
      const stateChanged = scrollbarStateChanged || dimensionsChanged;

      if (!stateChanged) {
        return prevState;
      }

      return {
        hasVerticalScrollbar,
        hasHorizontalScrollbar,
        dimensions: {
          scrollWidth,
          scrollHeight,
          clientWidth,
          clientHeight,
        },
      };
    });
  }, [target, enabled]);

  /**
   * 防抖或立即执行的滚动条检测
   */
  const triggerDetection = useCallback(() => {
    if (immediate) {
      // 立即执行，不使用防抖
      detectScrollbars();
    } else {
      // 使用防抖
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        detectScrollbars();
      }, debounceDelay);
    }
  }, [detectScrollbars, debounceDelay, immediate]);

  /**
   * 清理函数
   */
  const cleanup = useCallback(() => {
    // 清理防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = undefined;
    }

    // 清理ResizeObserver
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // 清理MutationObserver
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }
  }, []);

  // 主要的副作用Hook
  useEffect(() => {
    if (!target || !enabled) {
      cleanup();
      return;
    }

    // 初始检测
    detectScrollbars();

    // 设置ResizeObserver监听尺寸变化
    if (observeResize) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        // 检查是否是我们关心的目标元素
        const isTargetElement = entries.some(
          (entry) => entry.target === target
        );
        if (isTargetElement) {
          // 对于ResizeObserver，我们可以选择立即执行或使用防抖
          // 通常尺寸变化需要立即响应
          if (immediate || debounceDelay < 20) {
            detectScrollbars();
          } else {
            triggerDetection();
          }
        }
      });

      resizeObserverRef.current.observe(target);
    }

    // 设置MutationObserver监听内容变化
    if (observeContent) {
      mutationObserverRef.current = new MutationObserver((mutations) => {
        // 检查是否有影响布局的变化
        const hasLayoutChanges = mutations.some(
          (mutation) =>
            mutation.type === "childList" ||
            (mutation.type === "attributes" &&
              ["style", "class", "width", "height"].includes(
                mutation.attributeName || ""
              ))
        );

        if (hasLayoutChanges) {
          triggerDetection();
        }
      });

      mutationObserverRef.current.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "width", "height"],
      });
    }

    // 监听滚动事件（虽然不会改变滚动条状态，但可以确保准确性）
    const handleScroll = () => {
      // 滚动本身不会改变滚动条状态，但我们可以在这里做一些额外的检查
      // 目前暂时不需要特殊处理
    };

    target.addEventListener("scroll", handleScroll, { passive: true });

    // 清理函数
    return () => {
      target.removeEventListener("scroll", handleScroll);
      cleanup();
    };
  }, [
    target,
    enabled,
    observeResize,
    observeContent,
    detectScrollbars,
    triggerDetection,
    cleanup,
  ]);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return scrollbarState;
}

/**
 * 简化版本的Hook，仅检测垂直滚动条
 */
export function useVerticalScrollbarDetection(
  target: HTMLElement | null,
  options?: Omit<UseScrollbarDetectionOptions, "target">
): boolean {
  const { hasVerticalScrollbar } = useScrollbarDetection({
    target,
    ...options,
  });

  return hasVerticalScrollbar;
}

/**
 * 简化版本的Hook，仅检测水平滚动条
 */
export function useHorizontalScrollbarDetection(
  target: HTMLElement | null,
  options?: Omit<UseScrollbarDetectionOptions, "target">
): boolean {
  const { hasHorizontalScrollbar } = useScrollbarDetection({
    target,
    ...options,
  });

  return hasHorizontalScrollbar;
}
