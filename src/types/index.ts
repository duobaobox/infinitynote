// 这里用于定义全局 TypeScript 类型

/**
 * 位置坐标接口
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 尺寸接口
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 便签接口
 */
export interface Note {
  /** 唯一标识 */
  id: string;
  /** 便签标题 */
  title: string;
  /** 便签内容 */
  content: string;
  /** 便签颜色 */
  color: string;
  /** 位置信息 */
  position: Position;
  /** 尺寸信息 */
  size: Size;
  /** 层级索引 */
  zIndex: number;
  /** 所属画布ID */
  canvasId: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否被选中 */
  isSelected?: boolean;
}

/**
 * 画布接口
 */
export interface Canvas {
  /** 唯一标识 */
  id: string;
  /** 画布名称 */
  name: string;
  /** 画布缩放比例 */
  scale: number;
  /** 画布偏移位置 */
  offset: Position;
  /** 背景颜色 */
  backgroundColor: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否为默认画布 */
  isDefault?: boolean;
}

/**
 * 拖拽状态接口
 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 拖拽的便签ID */
  draggedNoteId: string | null;
  /** 拖拽开始位置 */
  dragStartPosition: Position | null;
  /** 当前拖拽位置 */
  currentDragPosition: Position | null;
}

/**
 * 画布视口状态接口
 */
export interface CanvasViewport {
  /** 缩放比例 */
  scale: number;
  /** 偏移位置 */
  offset: Position;
  /** 最小缩放比例 */
  minScale: number;
  /** 最大缩放比例 */
  maxScale: number;
}

/**
 * 便签颜色枚举
 */
export enum NoteColor {
  YELLOW = "#FFF2CC",
  PINK = "#FFE6E6",
  BLUE = "#E6F3FF",
  GREEN = "#E6FFE6",
  PURPLE = "#F0E6FF",
  ORANGE = "#FFE6CC",
  RED = "#FFD6D6",
  GRAY = "#F0F0F0",
}

// 重新导出常量
export { NOTE_DEFAULT_SIZE, NOTE_MIN_SIZE, NOTE_MAX_SIZE } from "./constants";
