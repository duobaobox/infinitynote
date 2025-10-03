/**
 * 撤销/重做快捷键 Hook
 */

import { useEffect, useCallback } from "react";
import { HistoryHelper } from "../utils/historyHelper";
import { useHistoryStore } from "../store/historyStore";

/**
 * 使用撤销/重做快捷键
 *
 * 功能：
 * - Ctrl+Z / Cmd+Z: 撤销
 * - Ctrl+Y / Cmd+Shift+Z: 重做
 * - 自动排除编辑器内的快捷键（编辑器有自己的撤销重做）
 */
export const useHistoryShortcuts = () => {
  const { canUndo, canRedo } = useHistoryStore();

  // 检查是否为 Mac 系统
  const isMac = useCallback(() => {
    return (
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0
    );
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 忽略在输入框、文本域或可编辑元素中的按键（让编辑器自己处理）
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.isContentEditable ||
        // 特别排除 TipTap 编辑器
        target.closest(".ProseMirror") ||
        target.closest('[class*="tiptap"]')
      ) {
        return;
      }

      const mac = isMac();
      const modifierKey = mac ? event.metaKey : event.ctrlKey;

      // Ctrl+Z / Cmd+Z: 撤销
      if (modifierKey && event.key.toLowerCase() === "z" && !event.shiftKey) {
        if (canUndo) {
          event.preventDefault();
          event.stopPropagation();
          HistoryHelper.undo().catch((error) => {
            console.error("撤销失败:", error);
          });
        }
        return;
      }

      // Ctrl+Y / Cmd+Shift+Z: 重做
      if (
        (modifierKey && event.key.toLowerCase() === "y") ||
        (mac &&
          modifierKey &&
          event.shiftKey &&
          event.key.toLowerCase() === "z")
      ) {
        if (canRedo) {
          event.preventDefault();
          event.stopPropagation();
          HistoryHelper.redo().catch((error) => {
            console.error("重做失败:", error);
          });
        }
        return;
      }
    },
    [canUndo, canRedo, isMac]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
};
