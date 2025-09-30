/**
 * 专注模式主组件
 * 提供类似思源笔记的树形结构，显示画布和便签的层级关系
 */

import { memo, useState, useEffect, useCallback } from "react";
import {
  CloseOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  MenuOutlined,
  SearchOutlined,
  PlusOutlined,
  FolderAddOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useNoteStore } from "../../store/noteStore";
import { useCanvasStore } from "../../store/canvasStore";
import { useFocusModeStore } from "../../store/focusModeStore";
import { TiptapEditor } from "../TiptapEditor";
import { NoteTree } from "./NoteTree";
import KeyboardShortcuts from "./KeyboardShortcuts";
import type { FocusModeProps } from "./types";
import styles from "./FocusMode.module.css";

const FocusMode = memo<FocusModeProps>(
  ({ visible, activeNoteId, onClose, onNoteChange }) => {
    const [closing, setClosing] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // 从专注模式store获取状态和操作
    const { searchKeyword, setSearchKeyword, closeFocusMode, setActiveNote } =
      useFocusModeStore();

    // 从便签store获取便签相关数据和方法
    const { notes, updateNote, createNote } = useNoteStore();

    // 从画布store获取画布相关数据
    const { canvases, activeCanvasId, setActiveCanvas, createCanvas } =
      useCanvasStore();

    // 获取当前编辑的便签
    const currentNote = activeNoteId
      ? notes.find((note) => note.id === activeNoteId)
      : undefined;

    // 处理便签点击
    const handleNoteClick = useCallback(
      (noteId: string) => {
        setActiveNote(noteId);
        onNoteChange(noteId);
      },
      [onNoteChange, setActiveNote]
    );

    // 处理画布点击
    const handleCanvasClick = useCallback(
      (canvasId: string) => {
        setActiveCanvas(canvasId);
      },
      [setActiveCanvas]
    );

    // 处理标题变化
    const handleTitleChange = useCallback(
      (value: string) => {
        if (activeNoteId && currentNote) {
          updateNote(activeNoteId, { title: value });
        }
      },
      [activeNoteId, currentNote, updateNote]
    );

    // 处理内容变化
    const handleContentChange = useCallback(
      (content: string) => {
        if (activeNoteId && currentNote) {
          updateNote(activeNoteId, { content });
        }
      },
      [activeNoteId, currentNote, updateNote]
    );

    // 处理创建新便签
    const handleCreateNote = useCallback(async () => {
      if (activeCanvasId) {
        // 生成一个默认位置，比如在画布的某个位置
        const newPosition = {
          x: Math.random() * 200 + 100,
          y: Math.random() * 200 + 100,
        };
        const newNoteId = await createNote(activeCanvasId, newPosition);
        setActiveNote(newNoteId);
        onNoteChange(newNoteId);
      }
    }, [activeCanvasId, createNote, setActiveNote, onNoteChange]);

    // 处理创建新画布
    const handleCreateCanvas = useCallback(async () => {
      const newCanvasId = await createCanvas("新画布");
      setActiveCanvas(newCanvasId);
    }, [createCanvas, setActiveCanvas]);

    // 处理关闭
    const handleClose = useCallback(() => {
      setClosing(true);
      setTimeout(() => {
        setClosing(false);
        closeFocusMode();
        onClose();
      }, 200);
    }, [onClose, closeFocusMode]);

    // ESC键关闭，Ctrl+F搜索，?键显示帮助
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!visible) return;

        if (event.key === "Escape") {
          if (showShortcuts) {
            setShowShortcuts(false);
          } else {
            handleClose();
          }
        }

        // ? 键显示键盘快捷键帮助
        if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          setShowShortcuts(true);
        }

        // Ctrl+F 或 Cmd+F 聚焦搜索框
        if ((event.ctrlKey || event.metaKey) && event.key === "f") {
          event.preventDefault();
          const searchInput = document.querySelector(
            ".focus-mode-search-input"
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
      };

      if (visible) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [visible, showShortcuts, handleClose]);

    if (!visible) return null;

    return (
      <div className={`${styles.focusMode} ${closing ? styles.closing : ""}`}>
        {/* 顶部工具栏 */}
        <div className={styles.topToolbar}>
          <div className={styles.toolbarLeft}>
            <button
              className={styles.toolbarButton}
              onClick={() => {}}
              aria-label="菜单"
            >
              <MenuOutlined />
            </button>
            <span className={styles.appTitle}>InfinityNote</span>
          </div>

          <div className={styles.toolbarRight}>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={async () => await handleCreateNote()}
              className={styles.toolbarButton}
              aria-label="创建新便签"
            />
            <Button
              type="text"
              size="small"
              icon={<FolderAddOutlined />}
              onClick={async () => await handleCreateCanvas()}
              className={styles.toolbarButton}
              aria-label="创建新画布"
            />
            <Button
              type="text"
              size="small"
              icon={<QuestionCircleOutlined />}
              onClick={() => setShowShortcuts(true)}
              className={styles.toolbarButton}
              aria-label="键盘快捷键"
            />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleClose}
              className={styles.toolbarButton}
              aria-label="关闭专注模式"
            />
          </div>
        </div>

        <div className={styles.mainContent}>
          {/* 侧边栏 - 便签树 */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>笔记本</h3>
              <div className={styles.sidebarActions}>
                <Tooltip title="搜索" placement="bottom">
                  <Button
                    type="text"
                    size="small"
                    icon={<SearchOutlined />}
                    className={styles.sidebarButton}
                    aria-label="搜索"
                  />
                </Tooltip>
              </div>
            </div>
            <NoteTree
              notes={notes}
              canvases={canvases}
              activeNoteId={activeNoteId}
              activeCanvasId={activeCanvasId || undefined}
              searchKeyword={searchKeyword}
              onNoteClick={handleNoteClick}
              onCanvasClick={handleCanvasClick}
              onSearchChange={setSearchKeyword}
            />
          </div>

          {/* 主编辑器区域 */}
          <div className={styles.mainEditor}>
            {currentNote ? (
              <>
                <div className={styles.editorHeader}>
                  <textarea
                    className={styles.titleInput}
                    placeholder="无标题"
                    value={currentNote.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    rows={1}
                    style={{ height: "auto" }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />
                </div>

                <div className={styles.editorContent}>
                  <TiptapEditor
                    key={currentNote.id}
                    content={currentNote.content}
                    onContentChange={handleContentChange}
                    placeholder="输入 / 以使用命令"
                    autoFocus
                  />
                </div>

                {/* 底部状态栏 */}
                <div className={styles.statusBar}>
                  <span className={styles.statusText}>
                    {currentNote && (
                      <>
                        <span className={styles.noteInfo}>
                          {new Date(currentNote.updatedAt).toLocaleDateString(
                            "zh-CN"
                          )}{" "}
                          •
                          {currentNote.content
                            ? currentNote.content.replace(/<[^>]*>/g, "").length
                            : 0}{" "}
                          字
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <EditOutlined className={styles.emptyIcon} />
                <div className={styles.emptyTitle}>选择一个便签开始编辑</div>
                <div className={styles.emptyDescription}>
                  从左侧树状结构中选择画布或便签
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 键盘快捷键帮助 */}
        <KeyboardShortcuts
          visible={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      </div>
    );
  }
);

FocusMode.displayName = "FocusMode";

export default FocusMode;
