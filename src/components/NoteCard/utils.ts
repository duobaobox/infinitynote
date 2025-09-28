/**
 * NoteCard 组件工具函数
 *
 * 提取和封装组件中的工具函数，提高代码复用性和可测试性
 */

import type { Note, Size, Position } from "../../types";
import type { ResizeDirection, ResizeData, DragData } from "./types";
import { NOTE_MIN_SIZE } from "../../types/constants";
import { RESIZE_CONSTANTS, DRAG_CONSTANTS } from "./constants";

/**
 * 计算便签变换样式
 */
export const calculateTransformStyle = (
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
  isDragging: boolean,
  scale: number = 1
): React.CSSProperties => {
  const style: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  if (transform) {
    style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${scale})`;
  }

  if (isDragging) {
    style.zIndex = 9999;
    style.opacity = 0.8;
  }

  return style;
};

/**
 * 计算便签颜色样式
 */
export const calculateColorStyle = (
  color: string,
  isDark: boolean,
  isSelected: boolean,
  isHovered: boolean
): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: color,
  };

  // 选中状态边框
  if (isSelected) {
    baseStyle.boxShadow = isDark
      ? "0 0 0 2px #1890ff, 0 4px 12px rgba(0, 0, 0, 0.3)"
      : "0 0 0 2px #1890ff, 0 4px 12px rgba(0, 0, 0, 0.15)";
  } else if (isHovered) {
    // 悬浮状态阴影
    baseStyle.boxShadow = isDark
      ? "0 2px 8px rgba(0, 0, 0, 0.4)"
      : "0 2px 8px rgba(0, 0, 0, 0.2)";
  } else {
    // 默认阴影
    baseStyle.boxShadow = isDark
      ? "0 1px 4px rgba(0, 0, 0, 0.3)"
      : "0 1px 4px rgba(0, 0, 0, 0.1)";
  }

  return baseStyle;
};

/**
 * 计算缩放控件位置
 */
export const calculateResizeHandlePosition = (
  direction: ResizeDirection
): React.CSSProperties => {
  const { HANDLE_HOVER_SIZE } = RESIZE_CONSTANTS;
  // 将控件放在便签内部，距离边缘有一定间距
  const insetOffset = 4;

  const positions: Record<ResizeDirection, React.CSSProperties> = {
    n: {
      top: insetOffset,
      left: "50%",
      transform: "translateX(-50%)",
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "n-resize",
    },
    s: {
      bottom: insetOffset,
      left: "50%",
      transform: "translateX(-50%)",
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "s-resize",
    },
    w: {
      left: insetOffset,
      top: "50%",
      transform: "translateY(-50%)",
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "w-resize",
    },
    e: {
      right: insetOffset,
      top: "50%",
      transform: "translateY(-50%)",
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "e-resize",
    },
    nw: {
      top: insetOffset,
      left: insetOffset,
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "nw-resize",
    },
    ne: {
      top: insetOffset,
      right: insetOffset,
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "ne-resize",
    },
    sw: {
      bottom: insetOffset,
      left: insetOffset,
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "sw-resize",
    },
    se: {
      bottom: insetOffset,
      right: insetOffset,
      width: HANDLE_HOVER_SIZE,
      height: HANDLE_HOVER_SIZE,
      cursor: "se-resize",
    },
  };

  return positions[direction];
};

/**
 * 计算缩放后的尺寸
 */
export const calculateResizedSize = (
  resizeData: ResizeData,
  deltaX: number,
  deltaY: number
): Size => {
  const { direction, startWidth, startHeight } = resizeData;
  let newWidth = startWidth;
  let newHeight = startHeight;

  // 根据缩放方向计算新尺寸
  switch (direction) {
    case "n":
      newHeight = startHeight - deltaY;
      break;
    case "s":
      newHeight = startHeight + deltaY;
      break;
    case "w":
      newWidth = startWidth - deltaX;
      break;
    case "e":
      newWidth = startWidth + deltaX;
      break;
    case "nw":
      newWidth = startWidth - deltaX;
      newHeight = startHeight - deltaY;
      break;
    case "ne":
      newWidth = startWidth + deltaX;
      newHeight = startHeight - deltaY;
      break;
    case "sw":
      newWidth = startWidth - deltaX;
      newHeight = startHeight + deltaY;
      break;
    case "se":
      newWidth = startWidth + deltaX;
      newHeight = startHeight + deltaY;
      break;
  }

  // 应用尺寸限制（只限制最小值，不限制最大值）
  newWidth = Math.max(NOTE_MIN_SIZE.width, newWidth);
  newHeight = Math.max(NOTE_MIN_SIZE.height, newHeight);

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
};

/**
 * 计算拖拽后的位置
 */
export const calculateDraggedPosition = (
  dragData: DragData,
  deltaX: number,
  deltaY: number,
  canvasBounds?: { width: number; height: number; padding?: number }
): Position => {
  const { startNoteX, startNoteY } = dragData;
  let newX = startNoteX + deltaX;
  let newY = startNoteY + deltaY;

  // 如果有画布边界限制
  if (canvasBounds) {
    const padding =
      canvasBounds.padding || DRAG_CONSTANTS.DRAG_BOUNDARY_PADDING;
    newX = Math.max(padding, Math.min(canvasBounds.width - padding, newX));
    newY = Math.max(padding, Math.min(canvasBounds.height - padding, newY));
  }

  return {
    x: Math.round(newX),
    y: Math.round(newY),
  };
};

/**
 * 检测是否应该开始拖拽
 */
export const shouldStartDrag = (
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): boolean => {
  const deltaX = Math.abs(currentX - startX);
  const deltaY = Math.abs(currentY - startY);
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  return distance > DRAG_CONSTANTS.DRAG_THRESHOLD;
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => func(...args), delay) as unknown as number;
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  interval: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      func(...args);
    }
  };
};

/**
 * 获取便签显示文本（截断长文本）
 */
export const getDisplayText = (
  content: string,
  maxLength: number = 100,
  suffix: string = "..."
): string => {
  if (content.length <= maxLength) {
    return content;
  }

  return content.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * 计算便签对比度颜色（用于文本颜色）
 */
export const getContrastColor = (backgroundColor: string): string => {
  // 将十六进制颜色转换为RGB
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 根据亮度返回对比色
  return brightness > 128 ? "#000000" : "#FFFFFF";
};

/**
 * 格式化便签时间显示
 */
export const formatNoteTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString("zh-CN");
};

/**
 * 检查便签是否在视口内
 */
export const isNoteInViewport = (
  note: Note,
  viewportBounds: { x: number; y: number; width: number; height: number }
): boolean => {
  const noteRight = note.position.x + note.size.width;
  const noteBottom = note.position.y + note.size.height;
  const viewportRight = viewportBounds.x + viewportBounds.width;
  const viewportBottom = viewportBounds.y + viewportBounds.height;

  return !(
    noteRight < viewportBounds.x ||
    note.position.x > viewportRight ||
    noteBottom < viewportBounds.y ||
    note.position.y > viewportBottom
  );
};
