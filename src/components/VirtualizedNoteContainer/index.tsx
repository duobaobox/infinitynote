// VirtualizedNoteContainer.tsx
// 虚拟化便签容器，用于优化大量便签的渲染性能

import React, { useMemo, useCallback } from "react";
import { NoteCard } from "../NoteCard";
import type { Note } from "../../types";

/**
 * 虚拟化便签容器属性
 */
interface VirtualizedNoteContainerProps {
  /** 便签列表 */
  notes: Note[];
  /** 选中的便签ID列表 */
  selectedNoteIds: string[];
  /** 画布缩放比例 */
  scale: number;
  /** 视口区域 */
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 便签点击事件 */
  onNoteClick?: (e: React.MouseEvent, note: Note) => void;
}

/**
 * 计算便签是否在视口内
 */
const isNoteInViewport = (
  note: Note,
  viewport: VirtualizedNoteContainerProps["viewport"],
  scale: number,
  margin = 100 // 额外边距，提前加载即将进入视口的便签
): boolean => {
  const noteLeft = note.position.x * scale;
  const noteTop = note.position.y * scale;
  const noteRight = noteLeft + note.size.width * scale;
  const noteBottom = noteTop + note.size.height * scale;

  const viewportLeft = viewport.x - margin;
  const viewportTop = viewport.y - margin;
  const viewportRight = viewport.x + viewport.width + margin;
  const viewportBottom = viewport.y + viewport.height + margin;

  return !(
    noteRight < viewportLeft ||
    noteLeft > viewportRight ||
    noteBottom < viewportTop ||
    noteTop > viewportBottom
  );
};

/**
 * 虚拟化便签容器组件
 * 只渲染视口内和即将进入视口的便签，提升大量便签时的性能
 */
export const VirtualizedNoteContainer: React.FC<
  VirtualizedNoteContainerProps
> = ({ notes, selectedNoteIds, scale, viewport, onNoteClick }) => {
  // 计算需要渲染的便签
  const visibleNotes = useMemo(() => {
    // 如果便签数量不多，直接渲染所有便签
    if (notes.length <= 100) {
      return notes;
    }

    // 大量便签时，使用虚拟化
    return notes.filter((note) => {
      // 始终渲染选中的便签
      if (selectedNoteIds.includes(note.id)) {
        return true;
      }

      // 检查是否在视口内
      return isNoteInViewport(note, viewport, scale);
    });
  }, [notes, selectedNoteIds, viewport, scale]);

  // 处理便签选择
  const handleNoteSelect = useCallback(
    (noteId: string) => {
      if (onNoteClick) {
        // 如果有父组件传递的点击处理函数，则调用
        const fakeEvent = { stopPropagation: () => {} } as React.MouseEvent;
        const targetNote = notes.find((note) => note.id === noteId);
        if (targetNote) {
          onNoteClick(fakeEvent, targetNote);
        }
      }
    },
    [onNoteClick, notes]
  );

  return (
    <>
      {visibleNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          scale={scale}
          isSelected={selectedNoteIds.includes(note.id)}
          onSelect={handleNoteSelect}
        />
      ))}
    </>
  );
};

export default VirtualizedNoteContainer;
