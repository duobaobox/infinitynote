/**
 * Tiptap 编辑器组件类型定义
 */

import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";

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
  /** 失去焦点时的回调 */
  onBlur?: (editor?: Editor, event?: FocusEvent) => void;
  /** 获得焦点时的回调 */
  onFocus?: (editor?: Editor) => void;
  /** 按下 Enter 键的回调 */
  onEnter?: () => void;
  /** 按下 Escape 键的回调 */
  onEscape?: () => void;
  /** 内容为空时的回调 */
  onEmpty?: () => void;
  /** 编辑器创建完成的回调 */
  onEditorReady?: (editor: Editor) => void;
  /** 是否启用协作模式 */
  collaborative?: boolean;
  /** 是否显示字符计数 */
  showCharacterCount?: boolean;
  /** 最大字符数限制 */
  maxCharacters?: number;
  /** 防抖延迟时间（毫秒） */
  debounceDelay?: number;
  /** 是否启用历史记录（撤销/重做） */
  enableHistory?: boolean;
  /** 是否启用快捷键 */
  enableShortcuts?: boolean;
}

/**
 * 编辑器工具栏按钮配置
 */
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
}

/**
 * 编辑器配置选项
 */
export interface EditorConfig {
  /** 启用的扩展名称列表 */
  extensions?: string[];
  /** 工具栏配置 */
  toolbar?: {
    /** 是否显示工具栏 */
    show: boolean;
    /** 工具栏位置 */
    position: "top" | "bottom" | "floating" | "bubble";
    /** 自定义按钮 */
    buttons?: ToolbarButton[];
  };
  /** 主题配置 */
  theme?: {
    /** 是否使用暗黑主题 */
    dark: boolean;
    /** 自定义CSS变量 */
    cssVariables?: Record<string, string>;
  };
}

/**
 * 编辑器状态
 */
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
}
