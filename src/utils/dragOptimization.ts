/**
 * 拖拽性能优化工具
 * 
 * 解决便签和画布拖动不跟手的问题
 */

import { useRef, useState, useCallback } from 'react';
import type { Position } from '../types';

/**
 * 便签拖拽优化 Hook
 * 使用本地状态提供实时视觉反馈，减少全局状态更新频率
 */
export function useOptimizedNoteDrag(
  noteId: string,
  originalPosition: Position,
  onDragEnd: (noteId: string, position: Position) => void
) {
  const [localOffset, setLocalOffset] = useState<Position | null>(null);
  const isDraggingRef = useRef(false);

  const startDrag = useCallback(() => {
    isDraggingRef.current = true;
    setLocalOffset(null);
  }, []);

  const updateDrag = useCallback((offset: Position) => {
    if (isDraggingRef.current) {
      setLocalOffset(offset);
    }
  }, []);

  const endDrag = useCallback(() => {
    if (isDraggingRef.current && localOffset) {
      const finalPosition = {
        x: originalPosition.x + localOffset.x,
        y: originalPosition.y + localOffset.y,
      };
      
      // 异步更新数据库，避免阻塞UI
      Promise.resolve().then(() => {
        onDragEnd(noteId, finalPosition);
      });
    }
    
    isDraggingRef.current = false;
    setLocalOffset(null);
  }, [noteId, originalPosition, localOffset, onDragEnd]);

  // 计算当前显示位置（原始位置 + 本地偏移）
  const displayPosition = localOffset
    ? {
        x: originalPosition.x + localOffset.x,
        y: originalPosition.y + localOffset.y,
      }
    : originalPosition;

  return {
    displayPosition,
    isDragging: isDraggingRef.current,
    startDrag,
    updateDrag,
    endDrag,
  };
}

/**
 * 画布平移优化 Hook
 * 使用本地状态和RAF优化画布拖拽性能
 */
export function useOptimizedCanvasPan(
  onPanEnd: (delta: Position) => void
) {
  const [localOffset, setLocalOffset] = useState<Position | null>(null);
  const accumulatedDelta = useRef<Position>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const rafId = useRef<number | null>(null);

  const startPan = useCallback(() => {
    isPanningRef.current = true;
    accumulatedDelta.current = { x: 0, y: 0 };
    setLocalOffset(null);
  }, []);

  const updatePan = useCallback((delta: Position) => {
    if (!isPanningRef.current) return;

    // 取消之前的RAF
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    // 使用RAF进行节流
    rafId.current = requestAnimationFrame(() => {
      // 更新本地状态，提供即时视觉反馈
      setLocalOffset(prev => ({
        x: (prev?.x || 0) + delta.x,
        y: (prev?.y || 0) + delta.y,
      }));

      // 累积变化量
      accumulatedDelta.current.x += delta.x;
      accumulatedDelta.current.y += delta.y;
    });
  }, []);

  const endPan = useCallback(() => {
    if (!isPanningRef.current) return;

    // 清理RAF
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    // 一次性同步累积的变化到全局状态
    if (accumulatedDelta.current.x !== 0 || accumulatedDelta.current.y !== 0) {
      onPanEnd(accumulatedDelta.current);
    }

    // 重置状态
    isPanningRef.current = false;
    accumulatedDelta.current = { x: 0, y: 0 };
    setLocalOffset(null);
  }, [onPanEnd]);

  return {
    localOffset,
    isPanning: isPanningRef.current,
    startPan,
    updatePan,
    endPan,
  };
}

/**
 * 防抖函数，用于减少函数调用频率
 */
export function createDragDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: number | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      fn(...args);
    }, delay);
  }) as T;
}

/**
 * 节流函数，限制函数执行频率
 */
export function createDragThrottle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}
