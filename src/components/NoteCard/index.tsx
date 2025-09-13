import React, { memo, useCallback, useState } from "react";
import type { Note } from "../../types";
import { useNoteStore } from "../../store/noteStore";
import { useTheme, noteColorThemes } from "../../theme";
import styles from "./index.module.css";

interface NoteCardProps {
  note: Note;
  scale: number;
  onSelect: (noteId: string) => void;
  isSelected: boolean;
}

export const NoteCard = memo<NoteCardProps>(
  ({ note, scale, onSelect, isSelected }) => {
    const { moveNote, startDrag, endDrag } = useNoteStore();
    const { isDark } = useTheme();
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(note.id);
        setIsDragging(true);
        startDrag(note.id, note.position);

        const startX = e.clientX;
        const startY = e.clientY;

        const handleMouseMove = (e: MouseEvent) => {
          const deltaX = (e.clientX - startX) / scale;
          const deltaY = (e.clientY - startY) / scale;
          moveNote(note.id, {
            x: note.position.x + deltaX,
            y: note.position.y + deltaY,
          });
        };

        const handleMouseUp = () => {
          setIsDragging(false);
          endDrag();
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
      [note.id, note.position, scale, onSelect, startDrag, endDrag, moveNote]
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

    return (
      <div
        data-note-card
        className={`${styles.noteCard} ${isDragging ? styles.dragging : ""} ${
          isSelected ? styles.selected : ""
        }`}
        style={{
          left: note.position.x,
          top: note.position.y,
          width: note.size.width,
          height: note.size.height,
          zIndex: note.zIndex,
          ...getColorStyle(),
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(note.id);
        }}
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
