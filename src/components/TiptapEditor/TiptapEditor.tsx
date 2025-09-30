/**
 * Tiptap 编辑器主组件
 */

import React, { memo, useEffect, useRef, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { ListItem } from "@tiptap/extension-list-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import MarkdownIt from "markdown-it";
import type { TiptapEditorProps } from "./types/index";
import { DEFAULT_CONFIG, CSS_CLASSES } from "./constants";
import {
  cleanHtmlContent,
  isContentEmpty,
  validateContentLength,
  generateEditorId,
} from "./utils";
import { useTheme } from "../../theme";
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
    enableShortcuts = true,
    enableAutoScroll = false,
  }) => {
    const { isDark } = useTheme();
    const editorId = useRef(generateEditorId());
    const lastValidContent = useRef(content);
    const isStreamingRef = useRef(false);

    // 强制重新渲染的状态，用于更新工具栏按钮的激活状态
    const [toolbarUpdateKey, setToolbarUpdateKey] = useState(0);

    // Tiptap 官方推荐的扩展配置方式 - 标准化配置
    const extensions = useMemo(
      () => [
        StarterKit.configure({
          // 使用官方推荐的CSS类命名，更符合ProseMirror规范
          blockquote: {
            HTMLAttributes: {
              class: "ProseMirror-blockquote",
            },
          },
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
            HTMLAttributes: {
              class: "ProseMirror-bulletList",
            },
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
            HTMLAttributes: {
              class: "ProseMirror-orderedList",
            },
          },
          listItem: {
            HTMLAttributes: {
              class: "ProseMirror-listItem",
            },
          },
          codeBlock: {
            HTMLAttributes: {
              class: "ProseMirror-codeBlock",
            },
          },
          code: {
            HTMLAttributes: {
              class: "ProseMirror-code",
            },
          },
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
            HTMLAttributes: {
              class: "ProseMirror-heading",
            },
          },
          paragraph: {
            HTMLAttributes: {
              class: "ProseMirror-paragraph",
            },
          },
          horizontalRule: {
            HTMLAttributes: {
              class: "ProseMirror-hr",
            },
          },
          dropcursor: {
            color: "var(--color-primary, #1677ff)",
            width: 2,
          },
        }),
        TextStyle.configure({
          HTMLAttributes: {
            class: "ProseMirror-textStyle",
          },
        }),
        Color.configure({
          types: [TextStyle.name, ListItem.name],
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
          alignments: ["left", "center", "right", "justify"],
          defaultAlignment: "left",
        }),
        // 添加任务列表支持 - 按照官方demo配置
        TaskList.configure({
          HTMLAttributes: {},
        }),
        TaskItem.configure({
          nested: true, // 支持嵌套任务
          HTMLAttributes: {},
        }),
        // 添加表格支持
        Table.configure({
          resizable: false, // 禁用手动调整列宽以保持等宽
          HTMLAttributes: { class: "ProseMirror-table" },
        }),
        TableRow,
        TableCell,
        TableHeader,
        // 图片扩展
        Image.configure({
          HTMLAttributes: { class: "ProseMirror-image" },
          allowBase64: true,
        }),
      ],
      []
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

    // TipTap 官方最佳实践：编辑器初始化配置
    const editor = useEditor({
      extensions,
      content: content || "",
      editable: !readonly,
      autofocus: autoFocus,

      // 官方推荐的性能优化配置
      shouldRerenderOnTransaction: false, // v3.4+ 推荐，避免不必要的重渲染

      // 官方推荐的解析选项
      parseOptions: {
        preserveWhitespace: "full", // 保留空白字符，提升编辑体验
      },

      // 生命周期钩子
      onCreate: ({ editor }) => {
        onEditorReady?.(editor);
      },

      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        debouncedContentChange(html);
        // 内容更新时也要更新工具栏状态
        setToolbarUpdateKey((prev) => prev + 1);

        // 如果启用了自动滚动且当前在流式模式下，自动滚动到内容末尾
        if (enableAutoScroll && readonly && isStreamingRef.current) {
          // 使用 requestAnimationFrame 确保DOM已更新
          requestAnimationFrame(() => {
            if (editor && !editor.isDestroyed) {
              editor.commands.focus("end");
            }
          });
        }
      },

      onSelectionUpdate: () => {
        // 工具栏按钮状态更新的关键
        setToolbarUpdateKey((prev) => prev + 1);
      },

      onTransaction: ({ transaction }) => {
        // 事务更新时也要更新工具栏状态（包括格式变更）
        // 只有当事务真正改变了文档或选择时才更新，避免过度渲染
        if (transaction.docChanged || transaction.selectionSet) {
          setToolbarUpdateKey((prev) => prev + 1);
        }
      },

      onFocus: () => {
        onFocus?.();
      },

      onBlur: () => {
        onBlur?.();
      },

      // 官方推荐的编辑器属性配置
      editorProps: {
        attributes: {
          class: `${CSS_CLASSES.EDITOR_CONTENT} tiptap-editor-prose`,
          role: "textbox", // 可访问性支持
          "aria-multiline": "true", // 可访问性支持
          "aria-label": "富文本编辑器", // 可访问性支持
          "data-placeholder": placeholder,
          "data-editor-id": editorId.current,
        },

        // 简化的键盘事件处理 - 官方推荐方式
        handleKeyDown: (_view, event) => {
          if (!enableShortcuts) return false;

          // 只处理真正需要自定义的按键，让 TipTap 处理其他所有按键
          switch (event.key) {
            case "Escape":
              onEscape?.();
              break;
            case "Enter":
              if (!event.shiftKey) {
                onEnter?.(); // 不阻止默认行为，让 TipTap 处理
              }
              break;
          }

          return false; // 让 TipTap 处理所有按键的默认行为
        },
      },
    });

    // 当外部 content 改变时更新编辑器
    useEffect(() => {
      if (editor && content !== lastValidContent.current) {
        // 检查是否为流式 Markdown 内容（只读模式下）
        const isStreamingMarkdown =
          readonly &&
          typeof content === "string" &&
          /[#$*\-_`\\]/.test(content) &&
          !content.includes("<");

        let processedContent = content;
        if (isStreamingMarkdown) {
          // 对于流式 Markdown 内容，转换为 HTML
          const md = new MarkdownIt({
            html: false,
            breaks: true,
            linkify: true,
            typographer: true,
            quotes: "\"\"''",
          });
          processedContent = md.render(content);
        }

        // 对于非流式内容，执行标准清理
        const finalContent =
          typeof processedContent === "string"
            ? isStreamingMarkdown
              ? processedContent
              : cleanHtmlContent(processedContent)
            : processedContent;

        // 比较逻辑
        let shouldUpdate = false;
        if (isStreamingMarkdown) {
          // 对于流式 Markdown 内容，比较转换后的文本
          const currentText = editor.getText();
          const newText = content; // 使用原始 Markdown 文本进行比较
          shouldUpdate = currentText !== newText.replace(/[#*\-_`\\]/g, ""); // 简化文本比较
        } else {
          // 对于非流式内容，使用标准比较
          const currentContent = editor.getHTML();
          shouldUpdate = currentContent !== finalContent;
        }

        if (shouldUpdate) {
          // 使用requestAnimationFrame优化流式更新的渲染性能
          requestAnimationFrame(() => {
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(finalContent, {
                emitUpdate: false,
                parseOptions: isStreamingMarkdown
                  ? {
                      // 流式内容解析优化：保持空白字符格式
                      preserveWhitespace: "full",
                    }
                  : undefined,
              });
              lastValidContent.current = finalContent;

              // 自动滚动到内容末尾，特别是在AI流式生成时
              if (enableAutoScroll && readonly && isStreamingMarkdown) {
                // 使用 requestAnimationFrame 确保DOM已更新
                requestAnimationFrame(() => {
                  if (editor && !editor.isDestroyed) {
                    editor.commands.focus("end");
                  }
                });
              }
            }
          });
        }

        // 跟踪是否正在流式更新
        isStreamingRef.current = isStreamingMarkdown;
      }
    }, [editor, content, readonly]);

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

          {/* 底部工具栏 - 仅在非readonly模式下显示 */}
          {editor && !readonly && (
            <Toolbar
              key={toolbarUpdateKey}
              editor={editor}
              config={toolbarConfig}
              updateKey={toolbarUpdateKey}
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
