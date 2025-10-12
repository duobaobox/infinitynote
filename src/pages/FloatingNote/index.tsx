import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, Button, App as AntApp } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import type { Note } from "../../types";
import { TiptapEditor } from "../../components/TiptapEditor";
import { ThemeProvider, useTheme } from "../../theme";
import { generateNoteColorThemes } from "../../config/noteColors";
import styles from "./index.module.css";

interface FloatingNoteData {
  noteId: string;
  title: string;
  content: string;
  color: string;
  width: number;
  height: number;
}

const FloatingNoteContent: React.FC = () => {
  const { isDark } = useTheme();
  const [noteData, setNoteData] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 获取 URL 参数
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("noteId");

  // 防抖保存函数
  const debouncedSave = useCallback(
    (updates: Partial<Note>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (noteId && window.electronAPI?.floating?.updateFloatingNote) {
          window.electronAPI.floating.updateFloatingNote(noteId, updates);
        }
      }, 300);
    },
    [noteId]
  );

  // 标题变化处理
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setLocalTitle(newTitle);
      debouncedSave({ title: newTitle });
    },
    [debouncedSave]
  );

  // 内容变化处理
  const handleContentChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent);
      debouncedSave({ content: newContent });
    },
    [debouncedSave]
  );

  // 标题编辑
  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setIsEditingTitle(false);
      } else if (e.key === "Escape") {
        setLocalTitle(noteData?.title || "");
        setIsEditingTitle(false);
      }
    },
    [noteData]
  );

  // 关闭悬浮便签
  const handleClose = useCallback(() => {
    if (noteId && window.electronAPI?.floating?.closeFloatingNote) {
      // 在关闭前保存最后的更改
      if (
        localTitle !== noteData?.title ||
        localContent !== noteData?.content
      ) {
        window.electronAPI.floating.updateFloatingNote(noteId, {
          title: localTitle,
          content: localContent,
        });
      }
      window.electronAPI.floating.closeFloatingNote(noteId);
    }
  }, [noteId, noteData, localTitle, localContent]);

  // 接收便签数据
  useEffect(() => {
    const handleNoteData = (_event: any, data: FloatingNoteData) => {
      console.log("🎯 悬浮窗口接收到便签数据:", data);

      const note: Note = {
        id: data.noteId,
        title: data.title,
        content: data.content,
        color: data.color,
        position: { x: 0, y: 0 },
        size: { width: data.width, height: data.height },
        zIndex: 1,
        canvasId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setNoteData(note);
      setLocalTitle(note.title);
      setLocalContent(note.content);
      setIsLoading(false);
    };

    const handleNoteDataUpdated = (_event: any, data: any) => {
      console.log("🔄 悬浮窗口接收到数据更新:", data);
      if (data.noteId === noteId) {
        setNoteData((prev) => {
          if (prev) {
            const updated = { ...prev, ...data };
            if (data.title !== undefined) setLocalTitle(data.title);
            if (data.content !== undefined) setLocalContent(data.content);
            return updated;
          }
          return null;
        });
      }
    };

    if (window.electronAPI?.onMenuAction) {
      const removeListener = window.electronAPI.onMenuAction(
        (eventName: string, data: any) => {
          if (eventName === "note-data") {
            handleNoteData(eventName, data);
          } else if (eventName === "note-data-updated") {
            handleNoteDataUpdated(eventName, data);
          }
        }
      );

      // 超时处理
      const timeout = setTimeout(() => {
        if (isLoading && noteId) {
          console.warn("⚠️ 超时未收到便签数据，使用默认数据");
          const mockNote: Note = {
            id: noteId,
            title: "悬浮便签",
            content: "加载中...",
            color: "yellow",
            position: { x: 0, y: 0 },
            size: { width: 400, height: 300 },
            zIndex: 1,
            canvasId: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setNoteData(mockNote);
          setLocalTitle(mockNote.title);
          setLocalContent(mockNote.content);
          setIsLoading(false);
        }
      }, 2000);

      return () => {
        clearTimeout(timeout);
        removeListener?.();
      };
    }
  }, [noteId, isLoading]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading || !noteData) {
    return (
      <div className={styles.floatingLoading}>
        <div className={styles.loadingContent}>加载便签中...</div>
      </div>
    );
  }

  const noteColorThemes = generateNoteColorThemes();
  const defaultColor = Object.values(noteColorThemes)[0] || {
    light: {},
    dark: {},
  };
  const colorTheme =
    noteColorThemes[noteData.color as keyof typeof noteColorThemes] ||
    defaultColor;

  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <div
          className={styles.floatingWindow}
          style={{
            background: isDark ? colorTheme.dark : colorTheme.light,
          }}
        >
          {/* 标题栏 - 可拖拽 */}
          <div className={styles.floatingHeader}>
            <div className={styles.dragHandle}>
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={localTitle}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className={styles.titleInput}
                  placeholder="便签标题..."
                />
              ) : (
                <h3
                  className={styles.title}
                  onClick={handleTitleClick}
                  title="双击编辑标题"
                >
                  {localTitle || "无标题便签"}
                </h3>
              )}
            </div>

            {/* 关闭按钮 */}
            <Button
              icon={<CloseOutlined />}
              onClick={handleClose}
              title="关闭悬浮便签"
              type="text"
              size="small"
              className={styles.closeButton}
              danger
            />
          </div>

          {/* 内容区域 */}
          <div className={styles.floatingContent}>
            <TiptapEditor
              content={localContent}
              onContentChange={handleContentChange}
              placeholder="在这里编写便签内容..."
              readonly={false}
              autoFocus={false}
              config={{
                toolbar: {
                  show: true,
                  position: "top",
                },
              }}
            />
          </div>
        </div>
      </AntApp>
    </ConfigProvider>
  );
};

// 包装组件 - 提供 ThemeProvider
const FloatingNote: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <FloatingNoteContent />
    </ThemeProvider>
  );
};

// 挂载 React 应用
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<FloatingNote />);

export default FloatingNote;
