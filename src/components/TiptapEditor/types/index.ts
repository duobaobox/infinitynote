/**
 * Tiptap 编辑器完整类型定义
 */

import type { Editor, Extension } from "@tiptap/core";
import type { ReactNode } from "react";

// 编辑器状态接口
export interface EditorState {
  /** 是否有内容 */
  hasContent: boolean;
  /** 字符数 */
  characterCount: number;
  /** 词数 */
  wordCount: number;
  /** 是否可以撤销 */
  canUndo: boolean;
  /** 是否可以重做 */
  canRedo: boolean;
  /** 是否获得焦点 */
  isFocused: boolean;
  /** 是否为空 */
  isEmpty: boolean;
  /** 当前选择的文本 */
  selectedText: string;
}

// 编辑器事件接口
export interface EditorEvents {
  /** 编辑器创建完成 */
  onCreate?: (editor: Editor) => void;
  /** 编辑器销毁 */
  onDestroy?: () => void;
  /** 内容更新 */
  onUpdate?: (editor: Editor) => void;
  /** 获得焦点 */
  onFocus?: (editor: Editor) => void;
  /** 失去焦点 */
  onBlur?: (editor: Editor) => void;
  /** 选择变化 */
  onSelectionUpdate?: (editor: Editor) => void;
  /** 事务处理 */
  onTransaction?: (editor: Editor) => void;
}

// 扩展配置类型
export interface ExtensionConfiguration {
  name: string;
  enabled: boolean;
  options?: Record<string, any>;
  dependencies?: string[];
  priority?: number;
}

// 工具栏按钮接口
export interface ToolbarButton {
  /** 按钮唯一标识 */
  id: string;
  /** 按钮图标 */
  icon: ReactNode;
  /** 按钮标题 */
  title: string;
  /** 是否激活状态 */
  isActive?: (editor: Editor) => boolean;
  /** 点击处理函数 */
  onClick: (editor: Editor) => void;
  /** 是否禁用 */
  disabled?: (editor: Editor) => boolean;
  /** 分组标识 */
  group?: string;
  /** 快捷键 */
  shortcut?: string;
}

// 编辑器配置接口
export interface EditorConfiguration {
  /** 启用的扩展配置 */
  extensions?: ExtensionConfiguration[];
  /** 工具栏配置 */
  toolbar?: {
    show: boolean;
    position: "top" | "bottom" | "floating" | "bubble";
    buttons?: string[];
    customButtons?: ToolbarButton[];
  };
  /** 主题配置 */
  theme?: {
    dark: boolean;
    cssVariables?: Record<string, string>;
  };
  /** 性能配置 */
  performance?: {
    debounceDelay: number;
    throttleDelay: number;
    maxHistoryDepth: number;
  };
}

// 内容验证结果
export interface ContentValidationResult {
  isValid: boolean;
  message?: string;
  errors?: string[];
}

// 编辑器属性接口 (更新版本)
export interface TiptapEditorProps {
  /** 编辑器内容 */
  content: string;
  /** 内容变化回调 */
  onContentChange: (content: string) => void;
  /** 是否为只读模式 */
  readonly?: boolean;
  /** 是否自动获取焦点 */
  autoFocus?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 编辑器高度 */
  height?: number | string;
  /** 最小高度 */
  minHeight?: number | string;
  /** 最大高度 */
  maxHeight?: number | string;
  /** 自定义类名 */
  className?: string;
  /** 编辑器配置 */
  config?: Partial<EditorConfiguration>;
  /** 编辑器事件处理 */
  events?: EditorEvents;
  /** 是否显示字符计数 */
  showCharacterCount?: boolean;
  /** 最大字符数限制 */
  maxCharacters?: number;
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 是否启用快捷键 */
  enableShortcuts?: boolean;
  /** 失去焦点时的回调 */
  onBlur?: (event?: FocusEvent) => void;
  /** 获得焦点时的回调 */
  onFocus?: () => void;
  /** 按下 Enter 键的回调 */
  onEnter?: () => void;
  /** 按下 Escape 键的回调 */
  onEscape?: () => void;
  /** 内容为空时的回调 */
  onEmpty?: () => void;
  /** 编辑器创建完成的回调 */
  onEditorReady?: (editor: Editor) => void;
  /** 是否启用自动滚动到底部 */
  enableAutoScroll?: boolean;
  /** 自动滚动的行为 */
  autoScrollBehavior?: ScrollBehavior;
}

// 错误类型
export interface EditorError {
  type: "extension" | "content" | "validation" | "runtime";
  message: string;
  details?: any;
  stack?: string;
}

// 性能监控数据
export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  charactersPerSecond: number;
  memoryUsage?: number;
}

// 编辑器命令接口
export interface EditorCommand {
  name: string;
  execute: (editor: Editor, ...args: any[]) => boolean;
  canExecute?: (editor: Editor, ...args: any[]) => boolean;
  description?: string;
  shortcut?: string;
}

// 编辑器插件接口
export interface EditorPlugin {
  name: string;
  version: string;
  extensions?: Extension[];
  commands?: EditorCommand[];
  toolbarButtons?: ToolbarButton[];
  initialize?: (editor: Editor) => void;
  destroy?: () => void;
}

// 导出所有类型
export type { Editor, Extension, ReactNode };
