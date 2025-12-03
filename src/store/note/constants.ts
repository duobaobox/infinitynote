/**
 * Note Store 常量定义
 */

// ============================================
// 层级管理常量
// ============================================

/** 层级步进值 */
export const LAYER_STEP = 10;

/** 最大层级 */
export const MAX_Z_INDEX = 999999;

/** 最小层级 */
export const MIN_Z_INDEX = 1;

// ============================================
// 性能相关常量
// ============================================

/** 防抖保存延迟（毫秒） */
export const DEBOUNCE_SAVE_DELAY = 500;

/** 流式更新节流间隔（毫秒） */
export const STREAM_THROTTLE_INTERVAL = 50;

/** 日志去重超时（毫秒） */
export const LOG_DEDUP_TIMEOUT = 5000;

// ============================================
// 便签数量限制
// ============================================

/** 最大支持便签数量 */
export const MAX_NOTES_COUNT = 1000;

/** 警告阈值（达到此比例时警告） */
export const NOTE_COUNT_WARNING_THRESHOLD = 0.8;
