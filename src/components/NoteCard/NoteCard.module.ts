/**
 * NoteCard 组件模块统一导出
 *
 * 规范化组件接口，方便外部使用
 */

// 组件本体
export { NoteCard } from "./index";

// 类型定义
export type {
  NoteCardProps,
  ExtendedNoteCardProps,
  NoteToolbarButton,
  NoteInteractionState,
  ResizeData,
  DragData,
  ResizeDirection,
  NoteEditConfig,
  NoteDisplayConfig,
  NoteEventHandlers,
  NotePerformanceConfig,
} from "./types";

// 自定义 Hooks
export {
  useNoteInteraction,
  useNoteResize,
  useNoteDrag,
  useNoteEdit,
  useNoteKeyboard,
} from "./hooks";

// 工具函数
export {
  calculateTransformStyle,
  calculateColorStyle,
  calculateResizeHandlePosition,
  calculateResizedSize,
  calculateDraggedPosition,
  shouldStartDrag,
  debounce,
  throttle,
  getDisplayText,
  getContrastColor,
  formatNoteTime,
  isNoteInViewport,
} from "./utils";

// 常量配置
export {
  DEFAULT_EDIT_CONFIG,
  DEFAULT_DISPLAY_CONFIG,
  DEFAULT_PERFORMANCE_CONFIG,
  RESIZE_CONSTANTS,
  DRAG_CONSTANTS,
  ANIMATION_CONSTANTS,
  INTERACTION_CONSTANTS,
  STYLE_CONSTANTS,
  KEYBOARD_SHORTCUTS,
  DEFAULT_NOTE_COLORS,
  NOTE_TYPE_ICONS,
} from "./constants";

// 便签卡片组件的默认配置
import {
  DEFAULT_EDIT_CONFIG,
  DEFAULT_DISPLAY_CONFIG,
  DEFAULT_PERFORMANCE_CONFIG,
} from "./constants";

export const DEFAULT_NOTE_CARD_CONFIG = {
  edit: DEFAULT_EDIT_CONFIG,
  display: DEFAULT_DISPLAY_CONFIG,
  performance: DEFAULT_PERFORMANCE_CONFIG,
} as const;
