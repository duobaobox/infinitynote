import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, Button, App as AntApp } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import type { Note } from "../../types";
import { TiptapEditor } from "../../components/TiptapEditor";
import { ThemeProvider, useTheme } from "../../theme";
import {
  generateNoteColorThemes,
  getNoteColorPreset,
} from "../../config/noteColors";
import { useVerticalScrollbarDetection } from "../../hooks/useScrollbarDetection";
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
  const [isEditing, setIsEditing] = useState(false); // 编辑模式状态
  const titleInputRef = useRef<HTMLInputElement>(null);
  const floatingWindowRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 用于检测滚动条的 ProseMirror 元素
  const [proseMirrorElement, setProseMirrorElement] =
    useState<HTMLElement | null>(null);

  // 检测 TiptapEditor 内容区域是否有垂直滚动条
  const hasVerticalScrollbar = useVerticalScrollbarDetection(
    proseMirrorElement,
    {
      debounceDelay: 16, // 约一个动画帧的时间
      immediate: false, // 保持防抖，但使用很短的延迟
    }
  );

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

  // 进入编辑模式
  const handleEnterEditMode = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true);
    }
  }, [isEditing]);

  // 编辑器焦点处理 - 自动进入编辑模式
  const handleEditorFocus = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true);
    }
  }, [isEditing]);

  // ESC 键退出编辑模式
  const handleEditorEscape = useCallback(() => {
    setIsEditing(false);
  }, []);

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
      console.log("🎨 接收到的颜色值:", data.color);

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

  // 监听窗口失焦事件 - 退出编辑模式
  useEffect(() => {
    const handleWindowBlur = () => {
      if (isEditing) {
        setIsEditing(false);
      }
    };

    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isEditing]);

  // 获取 ProseMirror 元素用于滚动条检测
  useEffect(() => {
    if (floatingWindowRef.current && !isLoading) {
      // 使用 requestAnimationFrame 确保 DOM 已渲染
      const frameId = requestAnimationFrame(() => {
        const proseMirror = floatingWindowRef.current?.querySelector(
          ".ProseMirror"
        ) as HTMLElement;
        setProseMirrorElement(proseMirror);
      });

      return () => cancelAnimationFrame(frameId);
    } else {
      // 清除引用
      setProseMirrorElement(null);
    }
  }, [isLoading, localContent]); // 当内容变化时重新检测

  if (isLoading || !noteData) {
    return (
      <div className={styles.floatingLoading}>
        <div className={styles.loadingContent}>加载便签中...</div>
      </div>
    );
  }

  // 获取便签颜色主题
  const { light, dark } = generateNoteColorThemes();

  // 🔍 将颜色值转换为颜色名称
  // noteData.color 可能是 "#FFF2CC" 这样的值，需要转换为 "yellow"
  const colorPreset = getNoteColorPreset(noteData.color);
  const colorName = colorPreset?.name || "yellow"; // 默认黄色

  // 🔍 调试日志
  console.log("🎨 悬浮便签颜色调试:", {
    originalColor: noteData.color,
    colorPreset,
    colorName,
    isDark,
    selectedLight: light[colorName],
    selectedDark: dark[colorName],
  });

  const backgroundColor = isDark
    ? dark[colorName] || dark.yellow
    : light[colorName] || light.yellow;

  console.log("🎨 最终背景色:", backgroundColor);

  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <div
          ref={floatingWindowRef}
          className={styles.floatingWindow}
          style={{
            background: backgroundColor,
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
          <div
            className={`${styles.floatingContent} ${
              hasVerticalScrollbar ? styles.hasScrollbar : styles.noScrollbar
            }`}
            onClick={handleEnterEditMode}
          >
            <TiptapEditor
              content={localContent}
              onContentChange={handleContentChange}
              onFocus={handleEditorFocus}
              onEscape={handleEditorEscape}
              placeholder={
                isEditing ? "在这里编写便签内容..." : "点击开始编辑..."
              }
              readonly={!isEditing}
              autoFocus={isEditing}
              config={{
                toolbar: {
                  show: isEditing, // 编辑模式时显示工具栏
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
