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

      // 颜色映射，将便签颜色字符串映射到实际颜色值
      const colorKey = note.color
        .toLowerCase()
        .replace(/[^a-z]/g, "") as keyof typeof themeColors;
      const backgroundColor = themeColors[colorKey] || themeColors.yellow;

      return {
        backgroundColor,
        // 在暗黑主题下调整边框和文字颜色
        border: isDark ? `1px solid ${backgroundColor}` : "none",
        color: isDark ? "var(--color-text)" : "#262626",
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
