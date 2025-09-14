import React, { memo, useCallback, useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Note, Size } from "../../types";
import { NOTE_MIN_SIZE } from "../../types/constants";
import { useNoteStore } from "../../store/noteStore";
import { useTheme, noteColorThemes } from "../../theme";
import { TiptapEditor } from "../TiptapEditor";
import styles from "./index.module.css";

interface NoteCardProps {
  note: Note;
  scale: number;
  onSelect: (noteId: string) => void;
  isSelected: boolean;
  onResize?: (noteId: string, size: Size) => void;
}

/**
 * 便签卡片组件
 *
 * 功能特性：
 * - 支持拖拽操作
 * - 响应式缩放显示
 * - 主题颜色适配
 * - 选中状态显示
 *
 * 性能优化：
 * - 使用 memo 避免不必要的重渲染
 * - 硬件加速的拖拽动画
 */
export const NoteCard = memo<NoteCardProps>(
  ({ note, onSelect, isSelected, onResize }) => {
    const { isDark } = useTheme();
    const { resizeNote, updateNote } = useNoteStore();

    // 悬浮状态
    const [isHovered, setIsHovered] = useState(false);

    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);

    // 缩放状态
    const [isResizing, setIsResizing] = useState(false);
    const [resizeSize, setResizeSize] = useState<Size | null>(null);
    const resizeDataRef = useRef<{
      isActive: boolean;
      direction: string;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      currentWidth: number;
      currentHeight: number;
    } | null>(null);

    // 使用 dnd-kit 的拖拽功能
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging: dndIsDragging,
    } = useDraggable({
      id: note.id,
      data: {
        note,
      },
      // 缩放或编辑时禁用拖拽
      disabled: isResizing || isEditing,
    });

    // 处理点击选择（避免与拖拽冲突）
    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        // 在鼠标释放时处理点击选择（避免与dnd-kit拖拽冲突）
        if (e.button === 0) {
          // 左键点击
          e.stopPropagation();
          onSelect(note.id);
        }
      },
      [note.id, onSelect]
    );

    // 处理内容变化
    const handleContentChange = useCallback(
      (newContent: string) => {
        updateNote(note.id, { content: newContent });
      },
      [note.id, updateNote]
    );

    // 处理双击进入编辑
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // 阻止冒泡到画布
        if (!isEditing) {
          setIsEditing(true);
          // 确保便签被选中
          if (!isSelected) {
            onSelect(note.id);
          }
        }
      },
      [isEditing, isSelected, onSelect, note.id]
    );

    // 处理编辑器获得焦点
    const handleEditorFocus = useCallback(() => {
      if (!isEditing) {
        setIsEditing(true);
      }
    }, [isEditing]);

    // 处理编辑器失去焦点 - 遵循Tiptap官方最佳实践
    const handleEditorBlur = useCallback((event?: FocusEvent) => {
      // 检查焦点是否转移到了相关的编辑器元素（如工具栏）
      if (event?.relatedTarget) {
        const relatedElement = event.relatedTarget as HTMLElement;

        // 如果焦点转移到了工具栏按钮或其他编辑器相关元素，不要退出编辑模式
        if (
          relatedElement.closest(".tiptap-toolbar") ||
          relatedElement.closest(".tiptap-editor-container") ||
          relatedElement.classList.contains("tiptap-toolbar-button")
        ) {
          return;
        }
      }

      // 使用requestAnimationFrame + setTimeout确保在工具栏点击处理完成后再检查
      requestAnimationFrame(() => {
        setTimeout(() => {
          // 双重检查：如果当前焦点在编辑器相关元素上，不要退出编辑模式
          const activeElement = document.activeElement as HTMLElement;
          if (
            activeElement &&
            (activeElement.closest(".tiptap-toolbar") ||
              activeElement.closest(".tiptap-editor-container") ||
              activeElement.classList.contains("tiptap-toolbar-button"))
          ) {
            return;
          }
          setIsEditing(false);
        }, 100);
      });
    }, []);

    // 处理ESC键退出编辑
    const handleEditorEscape = useCallback(() => {
      setIsEditing(false);
    }, []);

    // 缩放开始处理 - 使用useRef避免闭包问题
    const handleResizeStart = useCallback(
      (e: React.MouseEvent, direction: string) => {
        // 非常重要：阻止所有事件传播，防止触发拖拽
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }

        // console.log(
        //   `🔧 开始缩放便签 ${noteIdRef.current.slice(-8)}, 方向: ${direction}`
        // );

        // 确保便签被选中
        if (!isSelected) {
          onSelect(noteIdRef.current);
        }

        // 初始化缩放数据 - 使用当前的尺寸
        const currentSize = note.size;
        resizeDataRef.current = {
          isActive: true,
          direction,
          startX: e.clientX,
          startY: e.clientY,
          startWidth: currentSize.width,
          startHeight: currentSize.height,
          currentWidth: currentSize.width,
          currentHeight: currentSize.height,
        };

        setIsResizing(true);

        // 防止页面滚动和文本选择
        document.body.style.userSelect = "none";
        document.body.style.cursor = "se-resize";
      },
      [isSelected, onSelect, note.size]
    );

    // 使用useRef保存最新的函数引用，避免闭包问题
    const resizeNoteRef = useRef(resizeNote);
    const onResizeRef = useRef(onResize);
    const noteIdRef = useRef(note.id);

    // 更新refs
    useEffect(() => {
      resizeNoteRef.current = resizeNote;
      onResizeRef.current = onResize;
      noteIdRef.current = note.id;
    });

    // 缩放过程处理 - 使用useRef避免闭包问题
    const handleResizeMove = useCallback((e: MouseEvent) => {
      const resizeData = resizeDataRef.current;
      if (!resizeData || !resizeData.isActive) return;

      e.preventDefault();

      const deltaX = e.clientX - resizeData.startX;
      const deltaY = e.clientY - resizeData.startY;

      let newWidth = resizeData.startWidth;
      let newHeight = resizeData.startHeight;

      // 只支持右下角缩放（最常用的缩放方式）
      if (resizeData.direction === "se") {
        newWidth = resizeData.startWidth + deltaX;
        newHeight = resizeData.startHeight + deltaY;
      }

      // 应用尺寸限制，只限制最小值，不限制最大值
      newWidth = Math.max(NOTE_MIN_SIZE.width, newWidth);
      newHeight = Math.max(NOTE_MIN_SIZE.height, newHeight);

      const finalWidth = Math.round(newWidth);
      const finalHeight = Math.round(newHeight);

      // 更新ref中的当前尺寸，避免不必要的调用
      if (
        finalWidth !== resizeData.currentWidth ||
        finalHeight !== resizeData.currentHeight
      ) {
        resizeData.currentWidth = finalWidth;
        resizeData.currentHeight = finalHeight;

        // 只更新本地视觉状态，避免频繁触发全局状态更新
        setResizeSize({ width: finalWidth, height: finalHeight });

        // console.log(`📏 缩放中: ${finalWidth}x${finalHeight}`);
      }
    }, []);

    // 缩放结束处理 - 使用useRef避免闭包问题
    const handleResizeEnd = useCallback(() => {
      const resizeData = resizeDataRef.current;
      if (!resizeData || !resizeData.isActive) return;

      // console.log("🔚 缩放结束");

      // 设置为非活动状态
      resizeData.isActive = false;
      setIsResizing(false);
      setResizeSize(null); // 清除本地调整状态

      // 移除全局事件监听器
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.removeEventListener("mouseleave", handleResizeEnd);

      // 重置光标和用户选择
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // 最终保存到数据库 - 使用最新的函数引用和数据
      if (
        resizeData.currentWidth &&
        resizeData.currentHeight &&
        (resizeData.currentWidth !== resizeData.startWidth ||
          resizeData.currentHeight !== resizeData.startHeight)
      ) {
        const finalSize: Size = {
          width: resizeData.currentWidth,
          height: resizeData.currentHeight,
        };
        resizeNoteRef.current(noteIdRef.current, finalSize);
        onResizeRef.current?.(noteIdRef.current, finalSize);
        // console.log(`💾 保存最终尺寸: ${finalSize.width}x${finalSize.height}`);
      }
    }, [handleResizeMove]);

    // 缩放时的键盘支持
    const handleResizeKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isResizing) return;

        // ESC键取消缩放
        if (e.key === "Escape") {
          e.preventDefault();
          handleResizeEnd();
        }
      },
      [isResizing, handleResizeEnd]
    );

    // 管理缩放事件监听器
    useEffect(() => {
      if (isResizing) {
        // 添加全局事件监听
        document.addEventListener("mousemove", handleResizeMove, true);
        document.addEventListener("mouseup", handleResizeEnd, true);
        document.addEventListener("keydown", handleResizeKeyDown, true);

        return () => {
          // 清理事件监听
          document.removeEventListener("mousemove", handleResizeMove, true);
          document.removeEventListener("mouseup", handleResizeEnd, true);
          document.removeEventListener("keydown", handleResizeKeyDown, true);
        };
      }
    }, [isResizing, handleResizeMove, handleResizeEnd, handleResizeKeyDown]);

    // 组件卸载时清理
    useEffect(() => {
      return () => {
        // 确保清理所有可能残留的事件监听器
        document.removeEventListener("mousemove", handleResizeMove, true);
        document.removeEventListener("mouseup", handleResizeEnd, true);
        document.removeEventListener("keydown", handleResizeKeyDown, true);

        // 恢复页面状态
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }, []);

    const getColorStyle = () => {
      // 根据主题选择颜色映射
      const themeColors = isDark ? noteColorThemes.dark : noteColorThemes.light;

      // 十六进制颜色到颜色名称的映射
      const colorHexToName: Record<string, keyof typeof themeColors> = {
        "#FFF2CC": "yellow",
        "#FFE6E6": "pink",
        "#E6F3FF": "blue",
        "#E6FFE6": "green",
        "#F0E6FF": "purple",
        "#FFE6CC": "orange",
        "#FFD6D6": "red",
        "#F0F0F0": "gray",
      };

      // 获取颜色名称，默认为 yellow
      const colorName = colorHexToName[note.color] || "yellow";
      const backgroundColor = themeColors[colorName];

      return {
        backgroundColor,
        // 在暗黑主题下调整边框和文字颜色
        border: isDark ? `1px solid ${backgroundColor}` : "none",
        color: isDark ? "var(--color-text)" : "var(--color-text)",
      };
    };

    // 计算拖拽时的样式
    const dragStyle = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : {};

    return (
      <div
        ref={setNodeRef}
        data-note-card
        className={`${styles.noteCard} ${
          dndIsDragging ? styles.dragging : ""
        } ${isSelected ? styles.selected : ""} ${
          isResizing ? styles.resizing : ""
        } ${isEditing ? styles.editing : ""}`}
        style={{
          left: note.position.x,
          top: note.position.y,
          width: resizeSize?.width ?? note.size.width,
          height: resizeSize?.height ?? note.size.height,
          zIndex: note.zIndex,
          ...getColorStyle(),
          ...dragStyle,
        }}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
        {...(isResizing || isEditing ? {} : listeners)}
        {...(isResizing || isEditing ? {} : attributes)}
      >
        {isSelected && <div className={styles.selectionBorder} />}

        <div className={styles.noteContent}>
          <h3 className={styles.noteTitle}>{note.title || "Untitled"}</h3>
          <TiptapEditor
            content={note.content || ""}
            onContentChange={handleContentChange}
            placeholder="双击编辑便签内容..."
            height="100%"
            className={styles.noteText}
            autoFocus={isEditing}
            readonly={!isEditing}
            onFocus={handleEditorFocus}
            onBlur={handleEditorBlur}
            onEscape={handleEditorEscape}
            debounceDelay={300}
          />
        </div>

        {/* 缩放控件 - 只显示右下角，悬浮或选中时显示 */}
        {(isSelected || isHovered || isResizing) && (
          <div
            className={`${styles.resizeHandle} ${styles["resize-se"]}`}
            onMouseDown={(e) => handleResizeStart(e, "se")}
            onPointerDown={(e) => {
              // 阻止事件冒泡到拖拽监听器
              e.stopPropagation();
            }}
            title="拖拽调整便签大小"
          />
        )}
      </div>
    );
  }
);

NoteCard.displayName = "NoteCard";
