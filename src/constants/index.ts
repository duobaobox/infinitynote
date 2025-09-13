// 应用配置常量
export const APP_CONFIG = {
  NAME: "InfinityNote",
  VERSION: "2.0.0",
  DESCRIPTION: "无限画布便签应用",
  AUTHOR: "InfinityNote Team",
} as const;

// 画布相关常量
export const CANVAS_CONFIG = {
  DEFAULT_SCALE: 1,
  MIN_SCALE: 0.1,
  MAX_SCALE: 5,
  SCALE_STEP: 0.1,
  ZOOM_SENSITIVITY: 0.001,
  PAN_SPEED: 1,
  GRID_SIZE: 20,
  SNAP_THRESHOLD: 10,
} as const;

// 便签相关常量
export const NOTE_CONFIG = {
  DEFAULT_WIDTH: 200,
  DEFAULT_HEIGHT: 150,
  MIN_WIDTH: 100,
  MIN_HEIGHT: 80,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  RESIZE_HANDLE_SIZE: 10,
  BORDER_RADIUS: 8,
  SHADOW: "0 2px 8px rgba(0,0,0,0.1)",
} as const;

// 拖拽相关常量
export const DRAG_CONFIG = {
  DRAG_THRESHOLD: 3,
  DRAG_DELAY: 0,
  AUTO_SCROLL_THRESHOLD: 50,
  AUTO_SCROLL_SPEED: 5,
} as const;

// 键盘快捷键常量
export const HOTKEYS = {
  NEW_NOTE: "ctrl+n",
  DELETE_NOTE: "delete",
  COPY: "ctrl+c",
  PASTE: "ctrl+v",
  ZOOM_IN: "ctrl+=",
  ZOOM_OUT: "ctrl+-",
  ZOOM_RESET: "ctrl+0",
  SELECT_ALL: "ctrl+a",
  DESELECT: "escape",
  SAVE: "ctrl+s",
  EXPORT: "ctrl+shift+e",
  IMPORT: "ctrl+shift+i",
} as const;

// 颜色主题常量
export const COLOR_THEMES = {
  LIGHT: {
    BACKGROUND: "#ffffff",
    SURFACE: "#f5f5f5",
    PRIMARY: "#1890ff",
    SECONDARY: "#52c41a",
    TEXT_PRIMARY: "#262626",
    TEXT_SECONDARY: "#8c8c8c",
    BORDER: "#d9d9d9",
    SHADOW: "rgba(0, 0, 0, 0.1)",
  },
  DARK: {
    BACKGROUND: "#141414",
    SURFACE: "#1f1f1f",
    PRIMARY: "#177ddc",
    SECONDARY: "#49aa19",
    TEXT_PRIMARY: "#ffffff",
    TEXT_SECONDARY: "#a6a6a6",
    BORDER: "#434343",
    SHADOW: "rgba(0, 0, 0, 0.3)",
  },
} as const;

// 便签颜色预设
export const NOTE_COLORS = [
  "#FFF2CC", // 黄色
  "#FFE6E6", // 粉色
  "#E6F3FF", // 蓝色
  "#E6FFE6", // 绿色
  "#F0E6FF", // 紫色
  "#FFE6CC", // 橙色
  "#FFD6D6", // 红色
  "#F0F0F0", // 灰色
  "#E6F7FF", // 浅蓝
  "#F6FFED", // 浅绿
  "#FFF0F6", // 浅粉
  "#FFFBE6", // 浅黄
] as const;

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_OUT: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    EASE_IN_OUT: "cubic-bezier(0.645, 0.045, 0.355, 1)",
    BOUNCE: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  NOTES: "infinitynote-notes",
  CANVAS_STATE: "infinitynote-canvas-state",
  USER_PREFERENCES: "infinitynote-preferences",
  TAGS: "infinitynote-tags",
  RECENT_COLORS: "infinitynote-recent-colors",
  WINDOW_STATE: "infinitynote-window-state",
} as const;

// API 端点（如果需要）
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  NOTES: "/api/notes",
  SYNC: "/api/sync",
  BACKUP: "/api/backup",
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "网络连接错误，请稍后重试",
  SAVE_ERROR: "保存失败，请重试",
  LOAD_ERROR: "加载失败，请刷新页面",
  INVALID_FILE: "文件格式无效",
  PERMISSION_DENIED: "权限不足",
  QUOTA_EXCEEDED: "存储空间不足",
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: "保存成功",
  EXPORT_SUCCESS: "导出成功",
  IMPORT_SUCCESS: "导入成功",
  DELETE_SUCCESS: "删除成功",
  COPY_SUCCESS: "复制成功",
} as const;
