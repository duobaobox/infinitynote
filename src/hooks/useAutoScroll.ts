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
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | number | undefined>(undefined);
  const lastScrollTopRef = useRef(0);

  // 滚动到底部
  const scrollToBottom = useCallback((element: HTMLDivElement) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      // 检查用户是否主动向上滚动了很多
      const currentScrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      // 如果用户明显向上滚动了一大段距离，则不自动滚动
      const userScrolledUp = lastScrollTopRef.current - currentScrollTop > 50;
      const isAtBottom = scrollHeight - currentScrollTop - clientHeight <= threshold;
      
      // 如果用户没有明显向上滚动，或者已经接近底部，就自动滚动
      if (!userScrolledUp || isAtBottom) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior,
        });
        lastScrollTopRef.current = element.scrollHeight;
      } else {
        // 更新记录的滚动位置，但不强制滚动
        lastScrollTopRef.current = currentScrollTop;
      }
    }, delay);
  }, [behavior, delay, threshold]);

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

  // 强制自动滚动（用于AI生成时）
  const forceAutoScroll = useCallback(() => {
    if (!enabled) return;
    
    const element = containerRef.current;
    if (!element) return;
    
    // 强制滚动到底部，不考虑用户滚动行为
    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });
    lastScrollTopRef.current = element.scrollHeight;
  }, [enabled, behavior]);

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
    forceAutoScroll,
  };
}