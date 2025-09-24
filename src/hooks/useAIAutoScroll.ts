/**
 * AI流式生成自动滚动Hook
 * 专门针对AI生成时的自动滚动优化
 */

import { useEffect, useRef, useCallback } from "react";

export interface AIAutoScrollOptions {
  /** 是否启用自动滚动 */
  enabled: boolean;
  /** 滚动行为 */
  behavior?: ScrollBehavior;
  /** 滚动延迟（毫秒） */
  delay?: number;
  /** 是否为AI生成模式（更积极的滚动策略） */
  isAIGenerating?: boolean;
}

/**
 * AI生成时的自动滚动Hook
 * 使用更智能的滚动策略，专门优化AI流式生成体验
 */
export function useAIAutoScroll(options: AIAutoScrollOptions) {
  const {
    enabled = true,
    behavior = "smooth",
    delay = 100,
    isAIGenerating = false,
  } = options;

  const scrollTimeoutRef = useRef<number | undefined>(undefined);
  const lastScrollHeightRef = useRef(0);

  /**
   * 查找最近的可滚动父元素
   */
  const findScrollableParent = useCallback((element: HTMLElement): HTMLElement | null => {
    let parent = element.parentElement;
    
    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      
      if (overflowY === 'auto' || overflowY === 'scroll') {
        // 检查是否真的有滚动内容
        if (parent.scrollHeight > parent.clientHeight) {
          return parent;
        }
      }
      
      parent = parent.parentElement;
    }
    
    return null;
  }, []);

  /**
   * 智能滚动到底部
   * 针对AI生成场景优化
   */
  const scrollToBottom = useCallback((targetElement: HTMLElement) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      // 查找实际的滚动容器
      const scrollContainer = findScrollableParent(targetElement) || targetElement;
      
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const currentScrollHeight = scrollHeight;
      
      // AI生成模式：更积极的滚动策略
      if (isAIGenerating) {
        // 内容高度发生变化，或者接近底部时就滚动
        const isNearBottom = scrollHeight - scrollTop - clientHeight <= 100;
        const heightChanged = currentScrollHeight !== lastScrollHeightRef.current;
        
        if (heightChanged || isNearBottom) {
          scrollContainer.scrollTo({
            top: scrollHeight,
            behavior,
          });
          lastScrollHeightRef.current = currentScrollHeight;
        }
      } else {
        // 普通模式：只有在接近底部时才滚动
        const isNearBottom = scrollHeight - scrollTop - clientHeight <= 50;
        
        if (isNearBottom) {
          scrollContainer.scrollTo({
            top: scrollHeight,
            behavior,
          });
          lastScrollHeightRef.current = currentScrollHeight;
        }
      }
    }, delay);
  }, [behavior, delay, isAIGenerating, findScrollableParent]);

  /**
   * 触发自动滚动
   */
  const triggerAutoScroll = useCallback((targetElement?: HTMLElement) => {
    if (!enabled) return;
    
    if (!targetElement) {
      // 如果没有指定目标元素，尝试找到当前focus的元素
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement) {
        scrollToBottom(activeElement);
      }
      return;
    }
    
    scrollToBottom(targetElement);
  }, [enabled, scrollToBottom]);

  /**
   * 强制滚动到底部（不考虑用户滚动行为）
   */
  const forceScrollToBottom = useCallback((targetElement: HTMLElement) => {
    const scrollContainer = findScrollableParent(targetElement) || targetElement;
    
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior,
      });
      lastScrollHeightRef.current = scrollContainer.scrollHeight;
    }
  }, [behavior, findScrollableParent]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    triggerAutoScroll,
    forceScrollToBottom,
    findScrollableParent,
  };
}