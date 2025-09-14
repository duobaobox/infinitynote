/**
 * Tiptap 编辑器 - 统一规范版本（简化版）
 *
 * 设计原则：
 * 1. 清晰的接口设计和类型安全
 * 2. 统一的事件处理机制
 * 3. 完善的错误边界
 * 4. 可扩展的配置系统
 */

import React, { memo, useEffect, useMemo, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";

// 导入新的类型定义
import type { TiptapEditorProps } from "./types/core";

// 导入键盘事件管理器
import { getGlobalKeyboardManager } from "./core/KeyboardEventManager";

// 导入现有的工具和组件
import { useTheme } from "../../theme";
import {
  cleanHtmlContent,
  isContentEmpty,
  validateContentLength,
  generateEditorId,
} from "./utils";
import { useOptimizedDebounce } from "./performance";
import { ExtensionManager } from "./extensions";
import { Toolbar } from "./Toolbar";
import { TiptapEditorErrorBoundary } from "./ErrorBoundary";

// 默认配置
const DEFAULT_CONFIG = {
  PLACEHOLDER: "开始编辑...",
  MIN_HEIGHT: "120px",
  MAX_CHARACTERS: 10000,
  DEBOUNCE_DELAY: 300,
  THEME: "auto" as const,
};

const CSS_CLASSES = {
  EDITOR_CONTAINER: "tiptap-editor-container",
  EDITOR_CONTENT: "tiptap-editor-content",
  READONLY: "tiptap-readonly",
  FOCUSED: "tiptap-focused",
  DARK_THEME: "tiptap-dark",
  LIGHT_THEME: "tiptap-light",
  CHARACTER_COUNT: "tiptap-character-count",
  LOADING: "tiptap-loading",
  ERROR: "tiptap-error",
} as const;

/**
 * Tiptap编辑器组件 V2
 */
const TiptapEditor: React.FC<TiptapEditorProps> = memo((props) => {
  const {
    // 内容和基础配置
    content = "",
    onContentChange,
    readonly = false,
    autoFocus = false,
    placeholder = DEFAULT_CONFIG.PLACEHOLDER,
    minHeight = DEFAULT_CONFIG.MIN_HEIGHT,
    className = "",
    theme = DEFAULT_CONFIG.THEME,

    // 内容配置
    maxCharacters = DEFAULT_CONFIG.MAX_CHARACTERS,
    showCharacterCount = false,
    debounceDelay = DEFAULT_CONFIG.DEBOUNCE_DELAY,

    // 工具栏配置
    showToolbar = true,

    // 扩展配置
    extensions: customExtensions,
    enableDefaultExtensions = true,

    // 事件处理
    onEditorReady,
    onFocus,
    onBlur,
    onSelectionUpdate,
    onError,
    onEmpty,
    id,

    ...rest
  } = props;

  // 状态管理
  const [state, setState] = useState({
    isInitialized: false,
    isFocused: false,
    characterCount: 0,
    hasError: false,
  });

  // 主题
  const { isDark } = useTheme();

  // 生成编辑器ID
  const editorId = useMemo(() => id || generateEditorId(), [id]);

  // 扩展管理器
  const extensionManager = useMemo(() => new ExtensionManager(), []);

  // 错误处理
  const handleError = useCallback(
    (error: Error, context: string) => {
      console.error(`Tiptap Editor Error [${context}]:`, error);
      setState((prev) => ({ ...prev, hasError: true }));
      onError?.(error);
    },
    [onError]
  );

  // 内容验证
  const validateContent = useCallback(
    (newContent: string) => {
      const validation = validateContentLength(newContent, maxCharacters);

      if (!validation.isValid) {
        handleError(
          new Error(validation.message || "Content validation failed"),
          "validation"
        );
        return false;
      }

      return true;
    },
    [maxCharacters, handleError]
  );

  // 防抖的内容变化处理
  const debouncedContentChange = useOptimizedDebounce(
    useCallback(
      (newContent: string) => {
        try {
          const cleanedContent = cleanHtmlContent(newContent);

          if (!validateContent(cleanedContent)) {
            return;
          }

          setState((prev) => ({
            ...prev,
            characterCount: cleanedContent.replace(/<[^>]*>/g, "").length,
          }));

          onContentChange?.(cleanedContent);

          if (isContentEmpty(cleanedContent) && onEmpty) {
            onEmpty();
          }
        } catch (error) {
          handleError(error as Error, "content-change");
        }
      },
      [validateContent, onContentChange, onEmpty, handleError]
    ),
    debounceDelay
  );

  // 创建编辑器
  const editor = useEditor({
    extensions: extensionManager.getExtensions(),
    content: content,
    editable: !readonly,
    autofocus: autoFocus,
    onUpdate: ({ editor: updatedEditor }) => {
      try {
        const newContent = updatedEditor.getHTML();
        debouncedContentChange(newContent);
        onSelectionUpdate?.(updatedEditor);
      } catch (error) {
        handleError(error as Error, "runtime");
      }
    },

    onFocus: ({ editor: focusedEditor }) => {
      try {
        setState((prev) => ({ ...prev, isFocused: true }));
        onFocus?.();
        console.log("Editor focused:", focusedEditor.isFocused);
      } catch (error) {
        handleError(error as Error, "runtime");
      }
    },

    onBlur: ({ event }) => {
      try {
        setState((prev) => ({ ...prev, isFocused: false }));
        onBlur?.(event);
      } catch (error) {
        handleError(error as Error, "runtime");
      }
    },

    onCreate: ({ editor: createdEditor }) => {
      try {
        setState((prev) => ({ ...prev, isInitialized: true }));
        onEditorReady?.(createdEditor);
      } catch (error) {
        handleError(error as Error, "creation");
      }
    },
  });

  // 键盘事件管理器注册
  useEffect(() => {
    const keyboardManager = getGlobalKeyboardManager();

    if (editor && keyboardManager) {
      const handlerId = `tiptap-editor-${editorId}`;

      keyboardManager.registerHandler(handlerId, {
        key: handlerId,
        priority: 100,
        handler: (e: KeyboardEvent) => {
          // 基本的编辑器快捷键处理
          if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
              case "b":
                e.preventDefault();
                editor.chain().focus().toggleBold().run();
                return true;
              case "i":
                e.preventDefault();
                editor.chain().focus().toggleItalic().run();
                return true;
              default:
                return false;
            }
          }
          return false;
        },
        context: "editor",
      });

      return () => {
        keyboardManager.unregisterHandler(handlerId);
      };
    }
  }, [editor, editorId]);

  // 内容同步
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      try {
        const cleanedNewContent = cleanHtmlContent(content);
        editor.commands.setContent(cleanedNewContent);
      } catch (error) {
        handleError(error as Error, "content-sync");
      }
    }
  }, [content, editor, handleError]);

  // 样式计算
  const containerClassName = useMemo(() => {
    const classes = [CSS_CLASSES.EDITOR_CONTAINER];

    if (className) classes.push(className);
    if (readonly) classes.push(CSS_CLASSES.READONLY);
    if (state.isFocused) classes.push(CSS_CLASSES.FOCUSED);
    if (isDark) classes.push(CSS_CLASSES.DARK_THEME);
    else classes.push(CSS_CLASSES.LIGHT_THEME);
    if (state.hasError) classes.push(CSS_CLASSES.ERROR);

    return classes.join(" ");
  }, [className, readonly, state.isFocused, state.hasError, isDark]);

  const editorStyle = useMemo(
    () => ({
      minHeight,
      ...rest.style,
    }),
    [minHeight, rest.style]
  );

  if (!editor) {
    return <div className="tiptap-loading">加载编辑器...</div>;
  }

  return (
    <TiptapEditorErrorBoundary>
      <div
        className={containerClassName}
        style={editorStyle}
        data-editor-id={editorId}
        data-readonly={readonly}
        data-focused={state.isFocused}
      >
        {/* 编辑器内容区域 */}
        <EditorContent editor={editor} className="tiptap-editor-content" />

        {/* 工具栏 */}
        {showToolbar && (
          <Toolbar
            editor={editor}
            className="tiptap-toolbar"
            showAdvanced={true}
          />
        )}

        {/* 字符计数 */}
        {showCharacterCount && (
          <div className={CSS_CLASSES.CHARACTER_COUNT}>
            {state.characterCount} / {maxCharacters}
          </div>
        )}
      </div>
    </TiptapEditorErrorBoundary>
  );
});

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
