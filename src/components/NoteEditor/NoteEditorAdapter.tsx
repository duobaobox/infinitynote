/**
 * 便签编辑器适配器
 *
 * 连接 Tiptap 编辑器与便签系统，处理内容同步和状态管理
 */

import React, { memo, useCallback, useRef, useEffect, useState } from "react";
import { TiptapEditor } from "../TiptapEditor";
import type { TiptapEditorProps } from "../TiptapEditor";
import { useTheme } from "../../theme";
import { htmlToText, isContentEmpty } from "../TiptapEditor/utils";
import type { Note } from "../../types";
import "./NoteEditorAdapter.css";

export interface NoteEditorAdapterProps {
  /** 便签对象 */
  note: Note;
  /** 是否处于编辑模式 */
  isEditing: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 内容变化回调 */
  onContentChange: (content: string) => void;
  /** 编辑模式切换回调 */
  onEditingChange: (isEditing: boolean) => void;
  /** 进入编辑模式回调 */
  onStartEdit?: () => void;
  /** 退出编辑模式回调 */
  onFinishEdit?: () => void;
  /** 双击事件回调 */
  onDoubleClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 最大高度 */
  maxHeight?: string | number;
  /** 最小高度 */
  minHeight?: string | number;
  /** 是否显示字符计数 */
  showCharacterCount?: boolean;
  /** 最大字符数 */
  maxCharacters?: number;
}

/**
 * 便签编辑器适配器组件
 */
export const NoteEditorAdapter = memo<NoteEditorAdapterProps>(
  ({
    note,
    isEditing,
    readonly = false,
    onContentChange,
    onEditingChange,
    onStartEdit,
    onFinishEdit,
    onDoubleClick,
    className = "",
    maxHeight = "100%",
    minHeight = "60px",
    showCharacterCount = false,
    maxCharacters = 10000,
  }) => {
    const { isDark } = useTheme();
    const [localContent, setLocalContent] = useState(note.content || "");
    const lastSavedContent = useRef(note.content || "");
    const editorRef = useRef<any>(null);

    // 同步外部 note.content 变化
    useEffect(() => {
      if (note.content !== lastSavedContent.current) {
        setLocalContent(note.content || "");
        lastSavedContent.current = note.content || "";
      }
    }, [note.content]);

    // 处理内容变化
    const handleContentChange = useCallback(
      (newContent: string) => {
        setLocalContent(newContent);

        // 防抖保存到外部
        if (newContent !== lastSavedContent.current) {
          lastSavedContent.current = newContent;
          onContentChange(newContent);
        }
      },
      [onContentChange]
    );

    // 处理编辑器获得焦点
    const handleFocus = useCallback(() => {
      if (!isEditing && !readonly) {
        onEditingChange(true);
        onStartEdit?.();
      }
    }, [isEditing, readonly, onEditingChange, onStartEdit]);

    // 处理编辑器失去焦点
    const handleBlur = useCallback(() => {
      // 延迟处理，允许用户在编辑器内部点击
      setTimeout(() => {
        if (isEditing && !readonly) {
          onEditingChange(false);
          onFinishEdit?.();
        }
      }, 150);
    }, [isEditing, readonly, onEditingChange, onFinishEdit]);

    // 处理 Escape 键
    const handleEscape = useCallback(() => {
      if (isEditing) {
        onEditingChange(false);
        onFinishEdit?.();
        // 可选：恢复到上次保存的内容
        // setLocalContent(lastSavedContent.current);
      }
    }, [isEditing, onEditingChange, onFinishEdit]);

    // 处理 Enter 键
    const handleEnter = useCallback(() => {
      // 在便签中，单独的 Enter 通常用于换行，不退出编辑模式
      // 这里可以根据需要自定义行为
    }, []);

    // 处理双击事件
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!readonly && !isEditing) {
          e.preventDefault();
          e.stopPropagation();
          onEditingChange(true);
          onStartEdit?.();
          onDoubleClick?.();
        }
      },
      [readonly, isEditing, onEditingChange, onStartEdit, onDoubleClick]
    );

    // 处理编辑器创建完成
    const handleEditorReady = useCallback((editor: any) => {
      editorRef.current = editor;
    }, []);

    // 生成显示内容（只读模式）
    const getDisplayContent = () => {
      if (!note.content) {
        return (
          <span className="note-editor-empty-placeholder">点击添加内容...</span>
        );
      }

      const textContent = htmlToText(note.content);
      if (isContentEmpty(note.content)) {
        return (
          <span className="note-editor-empty-placeholder">点击添加内容...</span>
        );
      }

      // 在查看模式下，可以简单显示处理过的文本
      return <div className="note-editor-display-content">{textContent}</div>;
    };

    // 构建编辑器属性
    const editorProps: TiptapEditorProps = {
      content: localContent,
      onContentChange: handleContentChange,
      readonly: readonly,
      autoFocus: isEditing,
      placeholder: "开始输入便签内容...",
      height: "100%",
      minHeight,
      maxHeight,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onEscape: handleEscape,
      onEnter: handleEnter,
      onEditorReady: handleEditorReady,
      showCharacterCount,
      maxCharacters,
      debounceDelay: 300,
      enableShortcuts: true,
    };

    // 构建容器类名
    const containerClassName = [
      "note-editor-adapter",
      className,
      isEditing ? "note-editor-editing" : "note-editor-viewing",
      readonly ? "note-editor-readonly" : "",
      isDark ? "note-editor-dark" : "note-editor-light",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={containerClassName} onDoubleClick={handleDoubleClick}>
        {isEditing || readonly ? (
          <TiptapEditor {...editorProps} />
        ) : (
          <div className="note-editor-display">{getDisplayContent()}</div>
        )}
      </div>
    );
  }
);

NoteEditorAdapter.displayName = "NoteEditorAdapter";
