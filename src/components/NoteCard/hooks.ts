/**
 * NoteCard 组件自定义 Hooks
 *
 * 将组件逻辑封装为可复用的 hooks
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { Note, Size, Position } from "../../types";
import type {
  NoteInteractionState,
  ResizeData,
  DragData,
  ResizeDirection,
  NoteEditConfig,
} from "./types";
import {
  calculateResizedSize,
  calculateDraggedPosition,
  shouldStartDrag,
  debounce,
} from "./utils";
import { DEFAULT_EDIT_CONFIG } from "./constants";

/**
 * 便签交互状态管理 Hook
 */
export const useNoteInteraction = () => {
  const [interactionState, setInteractionState] =
    useState<NoteInteractionState>({
      isHovered: false,
      isDragging: false,
      isResizing: false,
      isEditing: false,
      isFocused: false,
    });

  const updateInteractionState = useCallback(
    (updates: Partial<NoteInteractionState>) => {
      setInteractionState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  return {
    interactionState,
    updateInteractionState,
  };
};

/**
 * 便签缩放功能 Hook
 */
export const useNoteResize = (
  note: Note,
  onResize?: (noteId: string, size: Size) => void
) => {
  const [isResizing, setIsResizing] = useState(false);
  const resizeDataRef = useRef<ResizeData | null>(null);

  const startResize = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      e.preventDefault();
      e.stopPropagation();

      const resizeData: ResizeData = {
        isActive: true,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: note.size.width,
        startHeight: note.size.height,
        currentWidth: note.size.width,
        currentHeight: note.size.height,
      };

      resizeDataRef.current = resizeData;
      setIsResizing(true);

      // 添加全局事件监听器
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = `${direction}-resize`;
      document.body.style.userSelect = "none";
    },
    [note.size]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      const resizeData = resizeDataRef.current;
      if (!resizeData || !resizeData.isActive) return;

      e.preventDefault();

      const deltaX = e.clientX - resizeData.startX;
      const deltaY = e.clientY - resizeData.startY;

      const newSize = calculateResizedSize(resizeData, deltaX, deltaY);

      if (
        newSize.width !== resizeData.currentWidth ||
        newSize.height !== resizeData.currentHeight
      ) {
        resizeData.currentWidth = newSize.width;
        resizeData.currentHeight = newSize.height;
        onResize?.(note.id, newSize);
      }
    },
    [onResize, note.id]
  );

  const handleResizeEnd = useCallback(() => {
    const resizeData = resizeDataRef.current;
    if (!resizeData || !resizeData.isActive) return;

    setIsResizing(false);
    resizeData.isActive = false;

    // 移除全局事件监听器
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleResizeMove]);

  // 清理副作用
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleResizeMove, handleResizeEnd]);

  return {
    isResizing,
    startResize,
    resizeData: resizeDataRef.current,
  };
};

/**
 * 便签拖拽功能 Hook
 */
export const useNoteDrag = (
  note: Note,
  onMove?: (noteId: string, position: Position) => void,
  canvasBounds?: { width: number; height: number; padding?: number }
) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragDataRef = useRef<DragData | null>(null);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      const dragData: DragData = {
        isActive: false, // 暂时不激活，等待移动阈值判断
        startX: e.clientX,
        startY: e.clientY,
        startNoteX: note.position.x,
        startNoteY: note.position.y,
        currentX: e.clientX,
        currentY: e.clientY,
      };

      dragDataRef.current = dragData;

      // 添加全局事件监听器
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    },
    [note.position]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      const dragData = dragDataRef.current;
      if (!dragData) return;

      e.preventDefault();
      dragData.currentX = e.clientX;
      dragData.currentY = e.clientY;

      // 检查是否应该开始拖拽
      if (!dragData.isActive) {
        if (
          shouldStartDrag(
            dragData.startX,
            dragData.startY,
            dragData.currentX,
            dragData.currentY
          )
        ) {
          dragData.isActive = true;
          setIsDragging(true);
          document.body.style.cursor = "grabbing";
        }
        return;
      }

      const deltaX = dragData.currentX - dragData.startX;
      const deltaY = dragData.currentY - dragData.startY;

      const newPosition = calculateDraggedPosition(
        dragData,
        deltaX,
        deltaY,
        canvasBounds
      );
      onMove?.(note.id, newPosition);
    },
    [onMove, note.id, canvasBounds]
  );

  const handleDragEnd = useCallback(() => {
    const dragData = dragDataRef.current;
    if (!dragData) return;

    setIsDragging(false);
    dragData.isActive = false;

    // 移除全局事件监听器
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.body.style.cursor = "";
  }, [handleDragMove]);

  // 清理副作用
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.body.style.cursor = "";
    };
  }, [handleDragMove, handleDragEnd]);

  return {
    isDragging,
    startDrag,
    dragData: dragDataRef.current,
  };
};

/**
 * 便签编辑功能 Hook
 */
export const useNoteEdit = (
  note: Note,
  onContentChange?: (noteId: string, content: string) => void,
  config: NoteEditConfig = DEFAULT_EDIT_CONFIG
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const editTimeoutRef = useRef<number>(0);

  // 自动保存功能
  const debouncedSave = useCallback(
    debounce((content: string) => {
      if (config.autoSave && content !== note.content) {
        onContentChange?.(note.id, content);
      }
    }, config.autoSaveDelay || 1000),
    [
      config.autoSave,
      config.autoSaveDelay,
      note.content,
      note.id,
      onContentChange,
    ]
  );

  const startEdit = useCallback(() => {
    if (!config.enableInlineEdit) return;

    setIsEditing(true);
    setEditContent(note.content);
  }, [config.enableInlineEdit, note.content]);

  const updateContent = useCallback(
    (content: string) => {
      setEditContent(content);

      if (config.autoSave) {
        debouncedSave(content);
      }
    },
    [config.autoSave, debouncedSave]
  );

  const finishEdit = useCallback(() => {
    setIsEditing(false);

    // 清除自动保存定时器
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }

    // 如果没有启用自动保存，手动保存
    if (!config.autoSave && editContent !== note.content) {
      onContentChange?.(note.id, editContent);
    }
  }, [config.autoSave, editContent, note.content, note.id, onContentChange]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(note.content);

    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
  }, [note.content]);

  // 处理双击编辑
  const handleDoubleClick = useCallback(() => {
    if (config.enableDoubleClickEdit) {
      startEdit();
    }
  }, [config.enableDoubleClickEdit, startEdit]);

  // 清理副作用
  useEffect(() => {
    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    };
  }, []);

  return {
    isEditing,
    editContent,
    startEdit,
    updateContent,
    finishEdit,
    cancelEdit,
    handleDoubleClick,
  };
};

/**
 * 便签键盘快捷键 Hook
 */
export const useNoteKeyboard = (callbacks: {
  onDelete?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  onMove?: (
    direction: "up" | "down" | "left" | "right",
    fast?: boolean
  ) => void;
  onResize?: (direction: "up" | "down" | "left" | "right") => void;
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = e;
      const isModifier = ctrlKey || metaKey;

      switch (key) {
        case "Delete":
        case "Backspace":
          if (!isModifier) {
            e.preventDefault();
            callbacks.onDelete?.();
          }
          break;

        case "c":
          if (isModifier) {
            e.preventDefault();
            callbacks.onCopy?.();
          }
          break;

        case "Enter":
        case "F2":
          if (!isModifier) {
            e.preventDefault();
            callbacks.onEdit?.();
          }
          break;

        case "ArrowUp":
          if (isModifier) {
            e.preventDefault();
            callbacks.onResize?.("up");
          } else {
            e.preventDefault();
            callbacks.onMove?.("up", shiftKey);
          }
          break;

        case "ArrowDown":
          if (isModifier) {
            e.preventDefault();
            callbacks.onResize?.("down");
          } else {
            e.preventDefault();
            callbacks.onMove?.("down", shiftKey);
          }
          break;

        case "ArrowLeft":
          if (isModifier) {
            e.preventDefault();
            callbacks.onResize?.("left");
          } else {
            e.preventDefault();
            callbacks.onMove?.("left", shiftKey);
          }
          break;

        case "ArrowRight":
          if (isModifier) {
            e.preventDefault();
            callbacks.onResize?.("right");
          } else {
            e.preventDefault();
            callbacks.onMove?.("right", shiftKey);
          }
          break;
      }
    },
    [callbacks]
  );

  return {
    handleKeyDown,
  };
};
