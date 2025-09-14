/**
 * 重构后的 NoteCard 组件
 *
 * 采用模块化架构，职责分离，便于扩展和维护
 */

import React, { memo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { NoteCardProps, ResizeDirection } from "./types";
import { useNoteStore } from "../../store/noteStore";
import { useTheme } from "../../theme";
import {
  useNoteInteraction,
  useNoteResize,
  useNoteEdit,
  useNoteKeyboard,
} from "./hooks";
import {
  calculateTransformStyle,
  calculateColorStyle,
  calculateResizeHandlePosition,
  getDisplayText,
} from "./utils";
import { INTERACTION_CONSTANTS } from "./constants";
import styles from "./index.module.css";

/**
 * 便签卡片组件
 */
export const NoteCard = memo<NoteCardProps>(
  ({
    note,
    scale = 1,
    onSelect,
    isSelected,
    onResize,
    onMove,
    onContentChange,
    onDelete,
    onCopy,
    readonly = false,
    showToolbar = true,
    customToolbarButtons = [],
  }) => {
    const { isDark } = useTheme();
    const { resizeNote, updateNote, deleteNote } = useNoteStore();

    // 交互状态管理
    const { interactionState, updateInteractionState } = useNoteInteraction();

    // 缩放功能
    const { isResizing, startResize } = useNoteResize(note, (noteId, size) => {
      resizeNote(noteId, size);
      onResize?.(noteId, size);
    });

    // 编辑功能
    const {
      isEditing,
      editContent,
      handleDoubleClick,
      updateContent,
      finishEdit,
    } = useNoteEdit(note, (noteId, content) => {
      updateNote(noteId, { content });
      onContentChange?.(noteId, content);
    });

    // 键盘快捷键
    const { handleKeyDown } = useNoteKeyboard({
      onDelete: () => {
        deleteNote(note.id);
        onDelete?.(note.id);
      },
      onCopy: () => {
        onCopy?.(note.id);
      },
      onEdit: () => {
        if (!readonly) {
          updateInteractionState({ isEditing: true });
        }
      },
      onMove: (direction, fast) => {
        const step = fast
          ? INTERACTION_CONSTANTS.KEYBOARD_FAST_STEP
          : INTERACTION_CONSTANTS.KEYBOARD_STEP;
        let newPosition = { ...note.position };

        switch (direction) {
          case "up":
            newPosition.y -= step;
            break;
          case "down":
            newPosition.y += step;
            break;
          case "left":
            newPosition.x -= step;
            break;
          case "right":
            newPosition.x += step;
            break;
        }

        updateNote(note.id, { position: newPosition });
        onMove?.(note.id, newPosition);
      },
    });

    // 拖拽功能（使用 dnd-kit）
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging: dndIsDragging,
    } = useDraggable({
      id: note.id,
      data: { note },
      disabled: isResizing || isEditing || readonly,
    });

    // 鼠标事件处理
    const handleMouseEnter = useCallback(() => {
      if (!readonly) {
        updateInteractionState({ isHovered: true });
      }
    }, [readonly, updateInteractionState]);

    const handleMouseLeave = useCallback(() => {
      updateInteractionState({ isHovered: false });
    }, [updateInteractionState]);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 0 && !isResizing) {
          onSelect(note.id);
        }
      },
      [isResizing, onSelect, note.id]
    );

    const handleResizeStart = useCallback(
      (e: React.MouseEvent, direction: ResizeDirection) => {
        if (readonly) return;
        e.preventDefault();
        e.stopPropagation();
        startResize(e, direction);
        updateInteractionState({ isResizing: true });
      },
      [readonly, startResize, updateInteractionState]
    );

    // 渲染缩放控件
    const renderResizeHandle = (direction: ResizeDirection) => {
      const handleStyle = calculateResizeHandlePosition(direction);

      return (
        <div
          key={direction}
          className={styles.resizeHandle}
          style={handleStyle}
          onMouseDown={(e) => handleResizeStart(e, direction)}
          data-direction={direction}
        />
      );
    };

    // 计算样式
    const transformStyle = calculateTransformStyle(
      transform,
      dndIsDragging,
      scale
    );
    const colorStyle = calculateColorStyle(
      note.color,
      isDark,
      isSelected,
      interactionState.isHovered
    );

    const noteStyle = {
      ...transformStyle,
      ...colorStyle,
      position: "absolute" as const,
      left: note.position.x,
      top: note.position.y,
      width: note.size.width,
      height: note.size.height,
      zIndex: isSelected ? 1000 : note.zIndex,
    };

    return (
      <div
        ref={setNodeRef}
        className={`${styles.noteCard} ${isSelected ? styles.selected : ""}`}
        style={noteStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        {...attributes}
        {...(readonly ? {} : listeners)}
        tabIndex={isSelected ? 0 : -1}
      >
        {/* 便签内容 */}
        {isEditing ? (
          <textarea
            className={styles.noteEditor}
            value={editContent}
            onChange={(e) => updateContent(e.target.value)}
            onBlur={finishEdit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                finishEdit();
              }
            }}
            autoFocus
          />
        ) : (
          <div className={styles.noteContent}>
            <div className={styles.noteTitle}>{note.title || "无标题"}</div>
            <div className={styles.noteText}>
              {getDisplayText(note.content, 200)}
            </div>
          </div>
        )}

        {/* 工具栏 */}
        {showToolbar && interactionState.isHovered && !readonly && (
          <div className={styles.noteToolbar}>
            {customToolbarButtons.map((button) => (
              <button
                key={button.id}
                className={`${styles.toolbarButton} ${
                  button.active ? styles.active : ""
                }`}
                onClick={() => button.onClick(note.id)}
                disabled={button.disabled}
                title={button.title}
              >
                {button.icon}
              </button>
            ))}
          </div>
        )}

        {/* 缩放控件 */}
        {!readonly && interactionState.isHovered && !isEditing && (
          <div className={styles.resizeHandles}>
            {/* 只显示右下角缩放控件，保持简洁 */}
            {renderResizeHandle("se")}
          </div>
        )}

        {/* 状态指示器 */}
        {(isResizing || dndIsDragging) && (
          <div className={styles.stateIndicator}>
            {isResizing && <span className={styles.resizingIndicator}>⚡</span>}
            {dndIsDragging && (
              <span className={styles.draggingIndicator}>🚀</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

NoteCard.displayName = "NoteCard";
