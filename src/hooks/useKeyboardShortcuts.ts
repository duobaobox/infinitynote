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

/**
 * 键盘快捷键 Hook
 *
 * 功能增强：
 * - 忽略输入框中的快捷键
 * - 支持 Mac/Windows 差异处理
 * - 更好的错误处理
 * - 性能优化
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  // 检查是否为 Mac 系统
  const isMac = useCallback(() => {
    return (
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0
    );
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 忽略在输入框、文本域或可编辑元素中的按键
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.isContentEditable
      ) {
        return;
      }

      const mac = isMac();

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

        // Mac 系统上 Cmd 键对应 metaKey，Windows/Linux 上 Ctrl 键对应 ctrlKey
        const modifierCtrlMatch = mac
          ? ctrlKey
            ? event.metaKey
            : !event.metaKey
          : ctrlKey
          ? event.ctrlKey
          : !event.ctrlKey;

        const shiftMatch = event.shiftKey === shiftKey;
        const altMatch = event.altKey === altKey;
        const metaMatch = event.metaKey === metaKey;

        if (
          keyMatch &&
          modifierCtrlMatch &&
          shiftMatch &&
          altMatch &&
          metaMatch
        ) {
          if (preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }

          try {
            callback(event);
          } catch (error) {
            console.error("快捷键执行失败:", error);
          }
        }
      });
    },
    [shortcuts, isMac]
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
