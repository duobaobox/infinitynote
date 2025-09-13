import React, { memo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Note } from "../../types";
import { useTheme, noteColorThemes } from "../../theme";
import styles from "./index.module.css";

interface NoteCardProps {
  note: Note;
  scale: number;
  onSelect: (noteId: string) => void;
  isSelected: boolean;
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
  ({ note, onSelect, isSelected }) => {
    const { isDark } = useTheme();

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
    });

    // 处理点击选择（不影响拖拽）
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(note.id);
      },
      [note.id, onSelect]
    );

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
        } ${isSelected ? styles.selected : ""}`}
        style={{
          left: note.position.x,
          top: note.position.y,
          width: note.size.width,
          height: note.size.height,
          zIndex: note.zIndex,
          ...getColorStyle(),
          ...dragStyle,
        }}
        onClick={handleClick}
        {...listeners}
        {...attributes}
      >
        {isSelected && <div className={styles.selectionBorder} />}

        <div className={styles.noteContent}>
          <h3 className={styles.noteTitle}>{note.title || "Untitled"}</h3>
          <div className={styles.noteText}>{note.content || "No content"}</div>
        </div>
      </div>
    );
  }
);

NoteCard.displayName = "NoteCard";
