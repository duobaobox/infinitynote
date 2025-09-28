/**
 * Tiptap 编辑器核心类型定义 - 统一规范版本
 *
 * 设计原则：
 * 1. 清晰的接口分离 - 配置、事件、状态分离
 * 2. 可扩展性 - 支持插件和自定义扩展
 * 3. 类型安全 - 完整的TypeScript类型支持
 * 4. 向后兼容 - 保持API稳定性
 */

import type {
  Editor,
  Extension,
  Mark,
  Node,
} from "@tiptap/core";
import type React from "react";

// ======================== 基础类型定义 ========================

/**
 * 编辑器主题类型
 */
export type EditorTheme = "light" | "dark" | "auto";

/**
 * 工具栏位置类型
 */
export type ToolbarPosition = "top" | "bottom" | "floating" | "bubble";

/**
 * 编辑器尺寸类型
 */
export type EditorSize = string | number;

// ======================== 配置接口 ========================

/**
 * 编辑器基础配置接口
 */
export interface TiptapEditorConfig {
  /** 编辑器唯一标识 */
  id?: string;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 是否自动获取焦点 */
  autoFocus?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 编辑器高度 */
  height?: EditorSize;
  /** 最小高度 */
  minHeight?: EditorSize;
  /** 最大高度 */
  maxHeight?: EditorSize;
  /** 额外的CSS类名 */
  className?: string;
  /** 编辑器主题 */
  theme?: EditorTheme;
  /** 是否启用键盘快捷键 */
  enableShortcuts?: boolean;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
}

/**
 * 内容管理配置
 */
export interface TiptapContentConfig {
  /** 最大字符数 */
  maxCharacters?: number;
  /** 是否显示字符计数 */
  showCharacterCount?: boolean;
  /** 内容验证规则 */
  validationRules?: ContentValidationRule[];
  /** 自动保存间隔（毫秒） */
  autoSaveInterval?: number;
}

/**
 * 扩展配置接口
 */
export interface TiptapExtensionConfig {
  /** 启用的扩展列表 */
  extensions?: (Extension | Mark | Node)[];
  /** 扩展配置映射 */
  extensionOptions?: Record<string, any>;
  /** 是否启用默认扩展 */
  enableDefaultExtensions?: boolean;
  /** 扩展加载策略 */
  loadingStrategy?: "eager" | "lazy";
}

/**
 * 工具栏配置接口
 */
export interface TiptapToolbarConfig {
  /** 是否显示工具栏 */
  show?: boolean;
  /** 工具栏位置 */
  position?: ToolbarPosition;
  /** 启用的按钮ID列表 */
  buttons?: string[];
  /** 自定义按钮 */
  customButtons?: ToolbarButton[];
  /** 是否显示分组分割线 */
  showGroupDividers?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
}

// ======================== 事件处理接口 ========================

/**
 * 编辑器核心事件
 */
export interface TiptapEditorEvents {
  /** 内容变化回调 */
  onContentChange: (content: string) => void;
  /** 编辑器准备就绪回调 */
  onEditorReady?: (editor: Editor) => void;
  /** 失去焦点回调 */
  onBlur?: (event?: FocusEvent) => void;
  /** 获得焦点回调 */
  onFocus?: () => void;
  /** 选择变化回调 */
  onSelectionUpdate?: (editor: Editor) => void;
  /** 错误处理回调 */
  onError?: (error: EditorError) => void;
}

/**
 * 键盘事件处理
 */
export interface TiptapKeyboardEvents {
  /** Enter 键回调 */
  onEnter?: () => void;
  /** Escape 键回调 */
  onEscape?: () => void;
  /** 自定义按键处理 */
  onKeyDown?: (event: KeyboardEvent) => boolean;
  /** 自定义按键释放处理 */
  onKeyUp?: (event: KeyboardEvent) => boolean;
}

/**
 * 内容事件处理
 */
export interface TiptapContentEvents {
  /** 内容为空回调 */
  onEmpty?: () => void;
  /** 内容过长回调 */
  onExceedLimit?: (currentLength: number, maxLength: number) => void;
  /** 粘贴事件回调 */
  onPaste?: (event: ClipboardEvent) => void;
  /** 拖拽事件回调 */
  onDrop?: (event: DragEvent) => void;
}

// ======================== 状态管理接口 ========================

/**
 * 编辑器状态
 */
export interface TiptapEditorState {
  /** 编辑器实例 */
  editor: Editor | null;
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 当前内容 */
  content: string;
  /** 是否有焦点 */
  isFocused: boolean;
  /** 是否只读 */
  isReadonly: boolean;
  /** 字符统计 */
  characterCount: number;
  /** 最后错误 */
  lastError: EditorError | null;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
}

/**
 * 编辑器上下文
 */
export interface TiptapEditorContext {
  /** 编辑器状态 */
  state: TiptapEditorState;
  /** 配置信息 */
  config: TiptapEditorProps;
  /** 更新配置 */
  updateConfig: (config: Partial<TiptapEditorProps>) => void;
  /** 强制重新渲染 */
  forceUpdate: () => void;
  /** 执行命令 */
  executeCommand: (command: string, ...args: any[]) => boolean;
}

// ======================== 工具栏相关接口 ========================

/**
 * 工具栏按钮定义
 */
export interface ToolbarButton {
  /** 按钮唯一标识 */
  id: string;
  /** 按钮图标 */
  icon: React.ReactNode | string;
  /** 按钮标题 */
  title: string;
  /** 按钮分组 */
  group?: string;
  /** 按钮优先级（影响排序） */
  priority?: number;
  /** 检查是否激活 */
  isActive?: (editor: Editor) => boolean;
  /** 检查是否禁用 */
  disabled?: (editor: Editor) => boolean;
  /** 检查是否隐藏 */
  hidden?: (editor: Editor) => boolean;
  /** 点击处理函数 */
  onClick: (editor: Editor) => void;
  /** 键盘快捷键 */
  shortcut?: string;
  /** 按钮描述 */
  description?: string;
  /** 工具提示 */
  tooltip?: string;
  /** 自定义样式 */
  className?: string;
}

/**
 * 工具栏分组定义
 */
export interface ToolbarGroup {
  /** 分组ID */
  id: string;
  /** 分组标签 */
  label: string;
  /** 分组优先级 */
  order: number;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
  /** 分组图标 */
  icon?: React.ReactNode;
}

// ======================== 主要组件接口 ========================

/**
 * 编辑器完整属性接口
 */
export interface TiptapEditorProps
  extends TiptapEditorConfig,
    TiptapContentConfig,
    TiptapExtensionConfig,
    TiptapToolbarConfig,
    TiptapEditorEvents,
    TiptapKeyboardEvents,
    TiptapContentEvents {
  /** 编辑器内容 */
  content: string;
}

// ======================== 验证和错误处理 ========================

/**
 * 内容验证规则
 */
export interface ContentValidationRule {
  /** 规则名称 */
  name: string;
  /** 验证函数 */
  validate: (content: string) => boolean;
  /** 错误消息 */
  message: string;
  /** 规则优先级 */
  priority?: number;
}

/**
 * 内容验证结果
 */
export interface ContentValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误消息 */
  message?: string;
  /** 具体错误列表 */
  errors?: ContentValidationError[];
}

/**
 * 内容验证错误
 */
export interface ContentValidationError {
  /** 错误类型 */
  type: string;
  /** 错误消息 */
  message: string;
  /** 错误位置 */
  position?: { start: number; end: number };
}

/**
 * 编辑器错误类型
 */
export interface EditorError {
  /** 错误类型 */
  type: "extension" | "content" | "validation" | "runtime" | "network";
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
  /** 错误堆栈 */
  stack?: string;
  /** 时间戳 */
  timestamp: number;
  /** 是否可恢复 */
  recoverable?: boolean;
}

// ======================== 性能监控 ========================

/**
 * 性能监控配置
 */
export interface TiptapPerformanceConfig {
  /** 是否启用性能监控 */
  enabled?: boolean;
  /** 采样率（0-1） */
  sampleRate?: number;
  /** 性能数据回调 */
  onPerformanceData?: (data: PerformanceData) => void;
  /** 监控指标列表 */
  metrics?: PerformanceMetric[];
}

/**
 * 性能数据
 */
export interface PerformanceData {
  /** 操作类型 */
  operation: string;
  /** 持续时间（毫秒） */
  duration: number;
  /** 时间戳 */
  timestamp: number;
  /** 内存使用情况 */
  memoryUsage?: number;
  /** 额外数据 */
  metadata?: Record<string, any>;
}

/**
 * 性能指标
 */
export interface PerformanceMetric {
  /** 指标名称 */
  name: string;
  /** 指标类型 */
  type: "counter" | "gauge" | "histogram";
  /** 指标描述 */
  description?: string;
  /** 单位 */
  unit?: string;
}

// ======================== 扩展开发接口 ========================

/**
 * 扩展开发者接口
 */
export interface TiptapExtensionDeveloper {
  /** 扩展名称 */
  name: string;
  /** 扩展版本 */
  version: string;
  /** 扩展描述 */
  description?: string;
  /** 扩展作者 */
  author?: string;
  /** 创建扩展实例 */
  createExtension: (options?: any) => Extension | Mark | Node;
  /** 扩展配置选项 */
  options?: Record<string, any>;
  /** 扩展依赖 */
  dependencies?: string[];
  /** 扩展标签 */
  tags?: string[];
}

/**
 * 插件接口
 */
export interface TiptapPlugin {
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description?: string;
  /** 插件扩展 */
  extensions?: TiptapExtensionDeveloper[];
  /** 工具栏按钮 */
  toolbarButtons?: ToolbarButton[];
  /** 初始化函数 */
  initialize?: (context: TiptapEditorContext) => void;
  /** 销毁函数 */
  destroy?: () => void;
  /** 插件配置 */
  config?: Record<string, any>;
}

// ======================== 导出所有类型 ========================

export type {
  Editor,
  EditorOptions,
  Extension,
  Mark,
  Node,
} from "@tiptap/core";
