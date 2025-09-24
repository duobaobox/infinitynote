/**
 * 自动滚动Hook
 * 用于AI生成时自动滚动到最新内容
 */

import { useEffect, useRef, useCallback } from "react";

export interface AutoScrollOptions {
  /** 是否启用自动滚动 */
  enabled: boolean;
  /** 滚动行为 */
  behavior?: ScrollBehavior;
  /** 滚动延迟（毫秒） */
  delay?: number;
  /** 滚动阈值，当距离底部小于此值时才自动滚动 */
  threshold?: number;
}

/**
 * 自动滚动Hook
 */
export function useAutoScroll(options: AutoScrollOptions) {
  const {
    enabled = true,
    behavior = "smooth",
    delay = 100,
    threshold = 100,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);
  const lastScrollTopRef = useRef(0);

  // 检查是否接近底部
  const isNearBottom = useCallback((element: HTMLDivElement): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, [threshold]);

  // 滚动到底部
  const scrollToBottom = useCallback((element: HTMLDivElement) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      // 只在用户没有主动滚动的情况下才自动滚动
      const wasNearBottom = isNearBottom(element);
      const hasUserScrolled = Math.abs(element.scrollTop - lastScrollTopRef.current) > 10;

      if (wasNearBottom || !hasUserScrolled) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior,
        });
        lastScrollTopRef.current = element.scrollHeight;
      }
    }, delay);
  }, [behavior, delay, isNearBottom]);

  // 手动触发滚动到底部
  const forceScrollToBottom = useCallback(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior,
      });
      lastScrollTopRef.current = element.scrollHeight;
    }
  }, [behavior]);

  // 监听内容变化并自动滚动
  const triggerAutoScroll = useCallback(() => {
    if (!enabled) return;
    
    const element = containerRef.current;
    if (!element) return;

    scrollToBottom(element);
  }, [enabled, scrollToBottom]);

  // 监听用户滚动行为
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleScroll = () => {
      lastScrollTopRef.current = element.scrollTop;
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    triggerAutoScroll,
    forceScrollToBottom,
  };
}