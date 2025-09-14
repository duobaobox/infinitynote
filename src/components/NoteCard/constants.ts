/**
 * NoteCard 组件常量配置
 *
 * 统一管理组件相关的常量值
 */

import type {
  NoteEditConfig,
  NoteDisplayConfig,
  NotePerformanceConfig,
} from "./types";

/**
 * 默认编辑配置
 */
export const DEFAULT_EDIT_CONFIG: Required<NoteEditConfig> = {
  enableDoubleClickEdit: true,
  enableInlineEdit: true,
  editorType: "text",
  autoSave: true,
  autoSaveDelay: 1000, // 1秒
};

/**
 * 默认显示配置
 */
export const DEFAULT_DISPLAY_CONFIG: Required<NoteDisplayConfig> = {
  showShadow: true,
  showBorder: false,
  borderRadius: 8,
  opacity: 1,
  enableAnimation: true,
};

/**
 * 默认性能配置
 */
export const DEFAULT_PERFORMANCE_CONFIG: Required<NotePerformanceConfig> = {
  enableVirtualization: false,
  enableDebounce: true,
  debounceDelay: 300,
  enableThrottle: true,
  throttleInterval: 16, // 60fps
};

/**
 * 缩放相关常量
 */
export const RESIZE_CONSTANTS = {
  /** 缩放控件大小 */
  HANDLE_SIZE: 8,
  /** 缩放控件悬浮检测区域 */
  HANDLE_HOVER_SIZE: 12,
  /** 最小缩放增量 */
  MIN_RESIZE_DELTA: 5,
  /** 缩放平滑度 */
  RESIZE_SMOOTHNESS: 1,
} as const;

/**
 * 拖拽相关常量
 */
export const DRAG_CONSTANTS = {
  /** 拖拽开始阈值（像素） */
  DRAG_THRESHOLD: 3,
  /** 拖拽惯性衰减系数 */
  DRAG_INERTIA_DECAY: 0.95,
  /** 拖拽边界检测间距 */
  DRAG_BOUNDARY_PADDING: 10,
} as const;

/**
 * 动画相关常量
 */
export const ANIMATION_CONSTANTS = {
  /** 选中状态动画持续时间 */
  SELECT_DURATION: 200,
  /** 悬浮状态动画持续时间 */
  HOVER_DURATION: 150,
  /** 缩放动画持续时间 */
  RESIZE_DURATION: 100,
  /** 拖拽结束动画持续时间 */
  DRAG_END_DURATION: 300,
  /** 缓动函数 */
  EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/**
 * 交互相关常量
 */
export const INTERACTION_CONSTANTS = {
  /** 双击检测时间窗口 */
  DOUBLE_CLICK_THRESHOLD: 300,
  /** 长按检测时间 */
  LONG_PRESS_THRESHOLD: 500,
  /** 键盘导航步长 */
  KEYBOARD_STEP: 10,
  /** 快速键盘导航步长 */
  KEYBOARD_FAST_STEP: 50,
} as const;

/**
 * 样式相关常量
 */
export const STYLE_CONSTANTS = {
  /** Z-Index 基础值 */
  BASE_Z_INDEX: 1000,
  /** 选中状态 Z-Index 增量 */
  SELECTED_Z_INDEX_BOOST: 100,
  /** 拖拽状态 Z-Index 增量 */
  DRAGGING_Z_INDEX_BOOST: 200,
  /** 编辑状态 Z-Index 增量 */
  EDITING_Z_INDEX_BOOST: 300,
  /** 阴影模糊半径 */
  SHADOW_BLUR: 8,
  /** 阴影偏移 */
  SHADOW_OFFSET: 2,
  /** 边框宽度 */
  BORDER_WIDTH: 1,
} as const;

/**
 * 键盘快捷键映射
 */
export const KEYBOARD_SHORTCUTS = {
  /** 删除便签 */
  DELETE: ["Delete", "Backspace"],
  /** 复制便签 */
  COPY: ["Control+c", "Meta+c"],
  /** 粘贴便签 */
  PASTE: ["Control+v", "Meta+v"],
  /** 撤销操作 */
  UNDO: ["Control+z", "Meta+z"],
  /** 重做操作 */
  REDO: ["Control+y", "Meta+y", "Control+Shift+z", "Meta+Shift+z"],
  /** 全选 */
  SELECT_ALL: ["Control+a", "Meta+a"],
  /** 保存 */
  SAVE: ["Control+s", "Meta+s"],
  /** 进入编辑模式 */
  EDIT: ["Enter", "F2"],
  /** 退出编辑模式 */
  EXIT_EDIT: ["Escape"],
  /** 移动便签（方向键） */
  MOVE: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"],
  /** 调整大小 */
  RESIZE: [
    "Control+ArrowUp",
    "Control+ArrowDown",
    "Control+ArrowLeft",
    "Control+ArrowRight",
  ],
} as const;

/**
 * 默认颜色主题
 */
export const DEFAULT_NOTE_COLORS = [
  "#FFF2CC", // 黄色
  "#FFE6E6", // 粉色
  "#E6F3FF", // 蓝色
  "#E6FFE6", // 绿色
  "#F0E6FF", // 紫色
  "#FFE6CC", // 橙色
  "#FFD6D6", // 红色
  "#F0F0F0", // 灰色
] as const;

/**
 * 便签类型图标映射
 */
export const NOTE_TYPE_ICONS = {
  text: "📝",
  markdown: "📄",
  rich: "📋",
  todo: "✅",
  reminder: "⏰",
  important: "⚠️",
  archived: "📦",
  deleted: "🗑️",
} as const;
