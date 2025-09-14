/**
 * NoteCard 组件相关类型定义
 *
 * 将组件相关的类型定义独立出来，便于维护和扩展
 */

import type { Note, Size, Position } from "../../types";

/**
 * 便签卡片基础属性
 */
export interface NoteCardProps {
  /** 便签数据 */
  note: Note;
  /** 画布缩放比例 */
  scale: number;
  /** 选中状态回调 */
  onSelect: (noteId: string) => void;
  /** 是否被选中 */
  isSelected: boolean;
  /** 尺寸变化回调 */
  onResize?: (noteId: string, size: Size) => void;
  /** 位置变化回调 */
  onMove?: (noteId: string, position: Position) => void;
  /** 内容变化回调 */
  onContentChange?: (noteId: string, content: string) => void;
  /** 颜色变化回调 */
  onColorChange?: (noteId: string, color: string) => void;
  /** 删除回调 */
  onDelete?: (noteId: string) => void;
  /** 复制回调 */
  onCopy?: (noteId: string) => void;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 自定义工具栏按钮 */
  customToolbarButtons?: NoteToolbarButton[];
}

/**
 * 便签工具栏按钮配置
 */
export interface NoteToolbarButton {
  /** 按钮ID */
  id: string;
  /** 按钮图标 */
  icon: React.ReactNode;
  /** 按钮标题（悬浮提示） */
  title: string;
  /** 点击回调 */
  onClick: (noteId: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否激活状态 */
  active?: boolean;
}

/**
 * 便签交互状态
 */
export interface NoteInteractionState {
  /** 是否悬浮 */
  isHovered: boolean;
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 是否正在缩放 */
  isResizing: boolean;
  /** 是否正在编辑 */
  isEditing: boolean;
  /** 是否获得焦点 */
  isFocused: boolean;
}

/**
 * 便签缩放数据
 */
export interface ResizeData {
  /** 是否激活缩放 */
  isActive: boolean;
  /** 缩放方向 */
  direction: ResizeDirection;
  /** 开始位置 */
  startX: number;
  startY: number;
  /** 初始尺寸 */
  startWidth: number;
  startHeight: number;
  /** 当前尺寸 */
  currentWidth: number;
  currentHeight: number;
}

/**
 * 缩放方向枚举
 */
export type ResizeDirection = "n" | "s" | "w" | "e" | "nw" | "ne" | "sw" | "se";

/**
 * 便签拖拽数据
 */
export interface DragData {
  /** 是否激活拖拽 */
  isActive: boolean;
  /** 开始位置 */
  startX: number;
  startY: number;
  /** 初始便签位置 */
  startNoteX: number;
  startNoteY: number;
  /** 当前位置 */
  currentX: number;
  currentY: number;
}

/**
 * 便签编辑配置
 */
export interface NoteEditConfig {
  /** 是否启用双击编辑 */
  enableDoubleClickEdit?: boolean;
  /** 是否启用内联编辑 */
  enableInlineEdit?: boolean;
  /** 编辑器类型 */
  editorType?: "text" | "markdown" | "rich";
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 自动保存延迟（毫秒） */
  autoSaveDelay?: number;
}

/**
 * 便签显示配置
 */
export interface NoteDisplayConfig {
  /** 是否显示阴影 */
  showShadow?: boolean;
  /** 是否显示边框 */
  showBorder?: boolean;
  /** 圆角大小 */
  borderRadius?: number;
  /** 透明度 */
  opacity?: number;
  /** 是否启用动画 */
  enableAnimation?: boolean;
}

/**
 * 便签事件回调集合
 */
export interface NoteEventHandlers {
  /** 鼠标进入 */
  onMouseEnter?: (noteId: string, event: React.MouseEvent) => void;
  /** 鼠标离开 */
  onMouseLeave?: (noteId: string, event: React.MouseEvent) => void;
  /** 鼠标按下 */
  onMouseDown?: (noteId: string, event: React.MouseEvent) => void;
  /** 鼠标抬起 */
  onMouseUp?: (noteId: string, event: React.MouseEvent) => void;
  /** 鼠标移动 */
  onMouseMove?: (noteId: string, event: React.MouseEvent) => void;
  /** 键盘按下 */
  onKeyDown?: (noteId: string, event: React.KeyboardEvent) => void;
  /** 键盘抬起 */
  onKeyUp?: (noteId: string, event: React.KeyboardEvent) => void;
  /** 获得焦点 */
  onFocus?: (noteId: string, event: React.FocusEvent) => void;
  /** 失去焦点 */
  onBlur?: (noteId: string, event: React.FocusEvent) => void;
  /** 右键菜单 */
  onContextMenu?: (noteId: string, event: React.MouseEvent) => void;
}

/**
 * 便签性能配置
 */
export interface NotePerformanceConfig {
  /** 是否启用虚拟化 */
  enableVirtualization?: boolean;
  /** 是否启用防抖 */
  enableDebounce?: boolean;
  /** 防抖延迟 */
  debounceDelay?: number;
  /** 是否启用节流 */
  enableThrottle?: boolean;
  /** 节流间隔 */
  throttleInterval?: number;
}

/**
 * 扩展的便签卡片属性（包含所有配置）
 */
export interface ExtendedNoteCardProps extends NoteCardProps {
  /** 编辑配置 */
  editConfig?: NoteEditConfig;
  /** 显示配置 */
  displayConfig?: NoteDisplayConfig;
  /** 事件处理器 */
  eventHandlers?: NoteEventHandlers;
  /** 性能配置 */
  performanceConfig?: NotePerformanceConfig;
}
