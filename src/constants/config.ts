/**
 * 应用配置常量
 * 集中管理所有魔法数字和配置值
 */

// ============================================
// 时间相关常量（毫秒）
// ============================================

/** 防抖延迟 - 保存便签 */
export const DEBOUNCE_SAVE_DELAY = 500;

/** 防抖延迟 - 搜索 */
export const DEBOUNCE_SEARCH_DELAY = 300;

/** 日志去重超时 */
export const LOG_DEDUP_TIMEOUT = 5000;

/** 流式更新节流间隔 */
export const STREAM_THROTTLE_INTERVAL = 50;

/** 自动保存间隔 */
export const AUTO_SAVE_INTERVAL = 30000;

/** 动画持续时间 */
export const ANIMATION_DURATION = 200;

/** 工具提示延迟 */
export const TOOLTIP_DELAY = 500;

// ============================================
// 尺寸相关常量
// ============================================

/** 便签默认宽度 */
export const NOTE_DEFAULT_WIDTH = 280;

/** 便签默认高度 */
export const NOTE_DEFAULT_HEIGHT = 200;

/** 便签最小宽度 */
export const NOTE_MIN_WIDTH = 200;

/** 便签最小高度 */
export const NOTE_MIN_HEIGHT = 150;

/** 便签最大宽度 */
export const NOTE_MAX_WIDTH = 800;

/** 便签最大高度 */
export const NOTE_MAX_HEIGHT = 1000;

/** 悬浮窗口最小宽度 */
export const FLOATING_MIN_WIDTH = 250;

/** 悬浮窗口最小高度 */
export const FLOATING_MIN_HEIGHT = 150;

/** 悬浮窗口默认宽度 */
export const FLOATING_DEFAULT_WIDTH = 320;

/** 悬浮窗口默认高度 */
export const FLOATING_DEFAULT_HEIGHT = 280;

// ============================================
// 画布相关常量
// ============================================

/** 画布最小缩放 */
export const CANVAS_MIN_ZOOM = 0.1;

/** 画布最大缩放 */
export const CANVAS_MAX_ZOOM = 3;

/** 画布默认缩放 */
export const CANVAS_DEFAULT_ZOOM = 1;

/** 缩放步进 */
export const CANVAS_ZOOM_STEP = 0.1;

/** 画布网格大小 */
export const CANVAS_GRID_SIZE = 20;

/** 画布边距 */
export const CANVAS_PADDING = 50;

// ============================================
// 性能相关常量
// ============================================

/** 性能警告阈值（毫秒，60fps = 16ms） */
export const PERFORMANCE_THRESHOLD = 16;

/** 性能采样率 */
export const PERFORMANCE_SAMPLE_RATE = 0.1;

/** 最大内容长度（字符数） */
export const MAX_CONTENT_LENGTH = 1000000;

/** 最大历史记录数 */
export const MAX_HISTORY_SIZE = 100;

/** 虚拟列表缓冲区大小 */
export const VIRTUAL_LIST_BUFFER = 5;

/** 批量操作大小 */
export const BATCH_SIZE = 50;

// ============================================
// AI相关常量
// ============================================

/** AI请求超时（毫秒） */
export const AI_REQUEST_TIMEOUT = 60000;

/** AI最大重试次数 */
export const AI_MAX_RETRIES = 3;

/** AI流式响应缓冲区大小 */
export const AI_STREAM_BUFFER_SIZE = 1024;

/** 默认AI温度 */
export const AI_DEFAULT_TEMPERATURE = 0.7;

/** 默认最大Token数 */
export const AI_DEFAULT_MAX_TOKENS = 4096;

// ============================================
// 存储相关常量
// ============================================

/** 数据库名称 */
export const DB_NAME = 'InfinityNoteDB';

/** 数据库版本 */
export const DB_VERSION = 1;

/** 本地存储键前缀 */
export const STORAGE_KEY_PREFIX = 'infinitynote_';

/** 设置存储键 */
export const SETTINGS_STORAGE_KEY = `${STORAGE_KEY_PREFIX}settings`;

/** 主题存储键 */
export const THEME_STORAGE_KEY = `${STORAGE_KEY_PREFIX}theme`;

// ============================================
// Z-Index层级常量
// ============================================

/** 便签基础层级 */
export const Z_INDEX_NOTE_BASE = 1;

/** 选中便签层级提升 */
export const Z_INDEX_SELECTED_BOOST = 1000;

/** 拖拽便签层级 */
export const Z_INDEX_DRAGGING = 9999;

/** 工具栏层级 */
export const Z_INDEX_TOOLBAR = 100;

/** 模态框层级 */
export const Z_INDEX_MODAL = 10000;

/** 通知层级 */
export const Z_INDEX_NOTIFICATION = 10001;

/** 悬浮窗层级 */
export const Z_INDEX_FLOATING = 99999;

// ============================================
// 颜色相关常量
// ============================================

/** 默认便签颜色 */
export const DEFAULT_NOTE_COLOR = '#FFF9C4';

/** 便签颜色列表 */
export const NOTE_COLORS = [
  '#FFF9C4', // 浅黄
  '#FFECB3', // 金黄
  '#FFE0B2', // 橙色
  '#FFCCBC', // 珊瑚
  '#F8BBD0', // 粉色
  '#E1BEE7', // 紫色
  '#D1C4E9', // 薰衣草
  '#C5CAE9', // 靛蓝
  '#BBDEFB', // 天蓝
  '#B2EBF2', // 青色
  '#C8E6C9', // 薄荷绿
] as const;

// ============================================
// 导出类型
// ============================================

export type NoteColorType = (typeof NOTE_COLORS)[number];

// ============================================
// 配置对象（用于运行时配置）
// ============================================

export const AppConfig = {
  /** 是否为开发模式 */
  isDev: import.meta.env.DEV,
  
  /** 是否为生产模式 */
  isProd: import.meta.env.PROD,
  
  /** 应用版本 */
  version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  
  /** 应用名称 */
  appName: import.meta.env.VITE_APP_NAME || '无限便签',
  
  /** 是否启用调试 */
  debug: import.meta.env.VITE_DEBUG === 'true',
} as const;
