/**
 * 专注模式便签列表组件
 */

import { memo, useMemo } from "react";
import { FileTextOutlined } from "@ant-design/icons";
import type { Note } from "../../types";
import styles from "./NoteList.module.css";

export interface NoteListProps {
  /** 便签列表 */
  notes: Note[];
  /** 当前激活的便签ID */
  activeNoteId?: string;
  /** 搜索关键字 */
  searchKeyword: string;
  /** 点击便签回调 */
  onNoteClick: (noteId: string) => void;
  /** 搜索关键字变化回调 */
  onSearchChange: (keyword: string) => void;
}

export interface NoteListItemProps {
  /** 便签数据 */
  note: Note;
  /** 是否激活状态 */
  isActive: boolean;
  /** 点击回调 */
  onClick: () => void;
}

// 便签列表项组件
const NoteListItem = memo<NoteListItemProps>(({ note, isActive, onClick }) => {
  // 生成内容预览
  const contentPreview = useMemo(() => {
    const plainText = note.content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const maxLength = 100;
    return plainText.length > maxLength
      ? plainText.slice(0, maxLength) + "..."
      : plainText;
  }, [note.content]);

  // 格式化日期
  const formattedDate = useMemo(() => {
    const now = new Date();
    const noteDate = new Date(note.updatedAt);
    const diff = now.getTime() - noteDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "今天";
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return noteDate.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
    }
  }, [note.updatedAt]);

  return (
    <div
      className={`${styles.noteListItem} ${isActive ? styles.active : ""}`}
      onClick={onClick}
      style={{ borderLeftColor: note.color }}
    >
      <div className={styles.noteTitle}>{note.title || "无标题"}</div>
      <div className={styles.notePreview}>{contentPreview || "暂无内容"}</div>
      <div className={styles.noteDate}>{formattedDate}</div>
    </div>
  );
});

NoteListItem.displayName = "NoteListItem";

// 主便签列表组件
export const NoteList = memo<NoteListProps>(
  ({ notes, activeNoteId, searchKeyword, onNoteClick, onSearchChange }) => {
    // 根据搜索关键字过滤便签
    const filteredNotes = useMemo(() => {
      if (!searchKeyword.trim()) return notes;

      const keyword = searchKeyword.toLowerCase();
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
      );
    }, [notes, searchKeyword]);

    // 按更新时间排序（最新的在前）
    const sortedNotes = useMemo(() => {
      return [...filteredNotes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }, [filteredNotes]);

    return (
      <div className={styles.noteList}>
        {/* 搜索框 */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={`${styles.searchBox} focus-mode-search-input`}
            placeholder="搜索便签... (Ctrl+F)"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* 便签列表 */}
        <div className={styles.listContainer}>
          {sortedNotes.length === 0 ? (
            <div className={styles.emptyState}>
              <FileTextOutlined className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>
                {searchKeyword ? "未找到匹配的便签" : "还没有便签"}
              </div>
              <div className={styles.emptyDescription}>
                {searchKeyword
                  ? "尝试调整搜索关键字"
                  : "创建第一个便签开始记录"}
              </div>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onClick={() => onNoteClick(note.id)}
              />
            ))
          )}
        </div>
      </div>
    );
  }
);

NoteList.displayName = "NoteList";
