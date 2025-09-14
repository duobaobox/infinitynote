/**
 * Tiptap 编辑器常量配置
 */

/** 默认配置 */
export const DEFAULT_CONFIG = {
  /** 默认占位符 */
  PLACEHOLDER: "开始输入便签内容...",
  /** 默认防抖延迟 */
  DEBOUNCE_DELAY: 300,
  /** 默认最小高度 */
  MIN_HEIGHT: "60px",
  /** 默认最大字符数 */
  MAX_CHARACTERS: 10000,
  /** 历史记录深度 */
  HISTORY_DEPTH: 100,
} as const;

/** 编辑器快捷键 */
export const SHORTCUTS = {
  /** 粗体 */
  BOLD: "Mod-b",
  /** 斜体 */
  ITALIC: "Mod-i",
  /** 删除线 */
  STRIKETHROUGH: "Mod-shift-x",
  /** 撤销 */
  UNDO: "Mod-z",
  /** 重做 */
  REDO: "Mod-y",
  /** 全选 */
  SELECT_ALL: "Mod-a",
  /** 换行 */
  HARD_BREAK: "Shift-Enter",
} as const;

/** CSS 类名常量 */
export const CSS_CLASSES = {
  /** 编辑器容器 */
  EDITOR_CONTAINER: "tiptap-editor-container",
  /** 编辑器内容区域 */
  EDITOR_CONTENT: "tiptap-editor-content",
  /** 编辑器工具栏 */
  EDITOR_TOOLBAR: "tiptap-editor-toolbar",
  /** 只读模式 */
  READONLY: "tiptap-editor-readonly",
  /** 获得焦点 */
  FOCUSED: "tiptap-editor-focused",
  /** 暗黑主题 */
  DARK_THEME: "tiptap-editor-dark",
  /** 字符计数 */
  CHARACTER_COUNT: "tiptap-editor-character-count",
  /** 工具栏按钮 */
  TOOLBAR_BUTTON: "tiptap-toolbar-button",
  /** 工具栏按钮激活状态 */
  TOOLBAR_BUTTON_ACTIVE: "tiptap-toolbar-button-active",
} as const;

/** 编辑器事件 */
export const EDITOR_EVENTS = {
  /** 内容更新 */
  UPDATE: "update",
  /** 获得焦点 */
  FOCUS: "focus",
  /** 失去焦点 */
  BLUR: "blur",
  /** 创建 */
  CREATE: "create",
  /** 销毁 */
  DESTROY: "destroy",
  /** 事务 */
  TRANSACTION: "transaction",
} as const;
