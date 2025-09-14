/**
 * Tiptap 编辑器主组件
 */

import React, { memo, useEffect, useRef, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { TiptapEditorProps } from "./types/index";
import { DEFAULT_CONFIG, CSS_CLASSES } from "./constants";
import {
  cleanHtmlContent,
  isContentEmpty,
  validateContentLength,
  generateEditorId,
} from "./utils";
import { useTheme } from "../../theme";
import { ExtensionManager } from "./extensions/index";
import { Toolbar, DEFAULT_TOOLBAR_CONFIG } from "./toolbar/Toolbar";
import type { ToolbarConfig } from "./toolbar/Toolbar";
import { useOptimizedDebounce } from "./performance";
import { TiptapEditorErrorBoundary } from "./ErrorBoundary";
import "./TiptapEditor.css";

/**
 * Tiptap 编辑器组件
 */
export const TiptapEditor = memo<TiptapEditorProps>(
  ({
    content,
    onContentChange,
    readonly = false,
    autoFocus = false,
    placeholder = DEFAULT_CONFIG.PLACEHOLDER,
    height,
    minHeight = DEFAULT_CONFIG.MIN_HEIGHT,
    maxHeight,
    className = "",
    onBlur,
    onFocus,
    onEnter,
    onEscape,
    onEmpty,
    onEditorReady,
    showCharacterCount = false,
    maxCharacters = DEFAULT_CONFIG.MAX_CHARACTERS,
    debounceDelay = DEFAULT_CONFIG.DEBOUNCE_DELAY,
    // enableHistory = true, // 历史记录功能暂时保留
    enableShortcuts = true,
  }) => {
    const { isDark } = useTheme();
    const editorId = useRef(generateEditorId());
    const lastValidContent = useRef(content);

    // 强制重新渲染的状态，用于更新工具栏按钮的激活状态
    const [toolbarUpdateKey, setToolbarUpdateKey] = useState(0);

    // 创建扩展管理器实例
    const extensionManager = useMemo(() => new ExtensionManager(), []);

    // 获取扩展列表
    const extensions = useMemo(
      () => extensionManager.getExtensions(),
      [extensionManager]
    );

    // 工具栏配置
    const toolbarConfig: ToolbarConfig = useMemo(
      () => ({
        ...DEFAULT_TOOLBAR_CONFIG,
        show: !readonly,
      }),
      [readonly]
    );

    // 创建优化的防抖内容更新函数
    const debouncedContentChange = useOptimizedDebounce(
      (newContent: string) => {
        const cleanedContent = cleanHtmlContent(newContent);

        // 验证内容长度
        const validation = validateContentLength(cleanedContent, maxCharacters);
        if (!validation.isValid) {
          console.warn(validation.message);
          return;
        }

        // 检查内容是否为空
        if (isContentEmpty(cleanedContent) && onEmpty) {
          onEmpty();
        }

        lastValidContent.current = cleanedContent;
        onContentChange(cleanedContent);
      },
      debounceDelay,
      [onContentChange, maxCharacters, onEmpty]
    );

    // 性能监控 (预留接口)
    // const performanceMonitor = usePerformanceMonitor();

    // 初始化编辑器
    const editor = useEditor({
      extensions,
      content: content || "",
      editable: !readonly,
      autofocus: autoFocus,
      // TipTap v3.4+ 最佳实践：控制事务重渲染
      shouldRerenderOnTransaction: false,
      onCreate: ({ editor }) => {
        onEditorReady?.(editor);
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        debouncedContentChange(html);
      },
      onSelectionUpdate: () => {
        // 触发工具栏按钮状态更新 - 这是激活状态正确显示的关键！
        // 强制重新渲染以更新按钮激活状态
        setToolbarUpdateKey((prev) => prev + 1);
      },
      onFocus: ({ editor }) => {
        onFocus?.(editor);
      },
      onBlur: ({ editor, event }) => {
        // TipTap 最佳实践：传递 editor 实例和原生事件
        onBlur?.(editor, event);
      },
      editorProps: {
        attributes: {
          class: `${CSS_CLASSES.EDITOR_CONTENT} tiptap-editor-prose`,
          "data-placeholder": placeholder,
          "data-editor-id": editorId.current,
        },
        handleKeyDown: (_view, event) => {
          // 只处理必要的快捷键，让其他所有按键（包括空格）正常工作
          if (!enableShortcuts) return false;

          // 只处理 Escape 键，其他所有按键都让 Tiptap 处理
          if (event.key === "Escape") {
            event.preventDefault();
            onEscape?.();
            return true;
          }

          // 处理 Enter 键，但不阻止默认行为
          if (event.key === "Enter" && !event.shiftKey) {
            onEnter?.();
            // 不阻止默认行为，让 Tiptap 正常处理 Enter
          }

          // 对所有其他按键（包括空格、字母、数字等）返回 false，让 Tiptap 处理
          return false;
        },
      },
    });

    // 当外部 content 改变时更新编辑器
    useEffect(() => {
      if (editor && content !== lastValidContent.current) {
        const currentContent = editor.getHTML();
        const cleanedNewContent = cleanHtmlContent(content);

        if (currentContent !== cleanedNewContent) {
          editor.commands.setContent(cleanedNewContent, { emitUpdate: false });
          lastValidContent.current = cleanedNewContent;
        }
      }
    }, [editor, content]);

    // 当只读状态改变时更新编辑器
    useEffect(() => {
      if (editor) {
        editor.setEditable(!readonly);
      }
    }, [editor, readonly]);

    // 清理函数
    useEffect(() => {
      return () => {
        editor?.destroy();
      };
    }, [editor]);

    // 计算编辑器样式
    const editorStyle: React.CSSProperties = {
      height,
      minHeight,
      maxHeight,
    };

    // 计算容器类名
    const containerClassName = [
      CSS_CLASSES.EDITOR_CONTAINER,
      className,
      readonly ? CSS_CLASSES.READONLY : "",
      editor?.isFocused ? CSS_CLASSES.FOCUSED : "",
      isDark ? CSS_CLASSES.DARK_THEME : "",
    ]
      .filter(Boolean)
      .join(" ");

    // 获取字符统计信息
    const getCharacterCount = () => {
      if (!editor) return 0;
      // 简单的字符计数，使用编辑器的 getText 方法
      return editor.getText().length;
    };

    if (!editor) {
      return (
        <div className={containerClassName} style={editorStyle}>
          <div className="tiptap-editor-loading">编辑器加载中...</div>
        </div>
      );
    }

    return (
      <TiptapEditorErrorBoundary>
        <div className={containerClassName} style={editorStyle}>
          {/* 编辑器内容区域 - 充满主要空间 */}
          <EditorContent editor={editor} className="tiptap-editor-content" />

          {/* 底部工具栏 */}
          {editor && (
            <Toolbar
              key={toolbarUpdateKey}
              editor={editor}
              config={toolbarConfig}
            />
          )}

          {/* 字符计数显示 */}
          {showCharacterCount && (
            <div className={CSS_CLASSES.CHARACTER_COUNT}>
              {getCharacterCount()}/{maxCharacters}
            </div>
          )}
        </div>
      </TiptapEditorErrorBoundary>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";
