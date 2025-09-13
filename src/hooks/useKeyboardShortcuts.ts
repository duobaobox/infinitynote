import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const {
          key,
          ctrlKey = false,
          shiftKey = false,
          altKey = false,
          metaKey = false,
          callback,
          preventDefault = true,
        } = shortcut;

        // 检查键是否匹配
        const keyMatch = event.key.toLowerCase() === key.toLowerCase();
        const ctrlMatch = event.ctrlKey === ctrlKey;
        const shiftMatch = event.shiftKey === shiftKey;
        const altMatch = event.altKey === altKey;
        const metaMatch = event.metaKey === metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }
          callback(event);
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
};

// 预定义的快捷键组合
export const KEYBOARD_SHORTCUTS = {
  // 便签操作
  NEW_NOTE: { key: "n", ctrlKey: true },
  DELETE_NOTE: { key: "Delete" },
  COPY_NOTE: { key: "c", ctrlKey: true },
  PASTE_NOTE: { key: "v", ctrlKey: true },

  // 画布操作
  ZOOM_IN: { key: "=", ctrlKey: true },
  ZOOM_OUT: { key: "-", ctrlKey: true },
  ZOOM_RESET: { key: "0", ctrlKey: true },
  FIT_TO_SCREEN: { key: "f", ctrlKey: true },

  // 选择操作
  SELECT_ALL: { key: "a", ctrlKey: true },
  DESELECT_ALL: { key: "Escape" },

  // 导入导出
  EXPORT: { key: "e", ctrlKey: true, shiftKey: true },
  IMPORT: { key: "i", ctrlKey: true, shiftKey: true },

  // 其他
  SAVE: { key: "s", ctrlKey: true },
  UNDO: { key: "z", ctrlKey: true },
  REDO: { key: "y", ctrlKey: true },
};
