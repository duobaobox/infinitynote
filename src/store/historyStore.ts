/**
 * 历史记录管理 Store
 * 实现全局的撤销/重做功能
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Command, HistoryStore } from "../types/history";

// 默认最大历史记录数
const DEFAULT_MAX_HISTORY = 50;

// 操作合并的时间窗口（毫秒）
const MERGE_TIME_WINDOW = 500;

/**
 * 历史记录管理 Store
 */
export const useHistoryStore = create<HistoryStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      undoStack: [],
      redoStack: [],
      maxHistorySize: DEFAULT_MAX_HISTORY,
      canUndo: false,
      canRedo: false,
      currentIndex: -1,

      // 执行命令并记录到历史
      executeCommand: async (command: Command) => {
        try {
          // 执行命令
          await command.execute();

          set((state) => {
            const { undoStack, maxHistorySize } = state;

            // 尝试与最后一个命令合并
            if (
              undoStack.length > 0 &&
              command.canMergeWith &&
              command.mergeWith
            ) {
              const lastCommand = undoStack[undoStack.length - 1];
              const timeDiff = command.timestamp - lastCommand.timestamp;

              // 在时间窗口内且可以合并
              if (
                timeDiff < MERGE_TIME_WINDOW &&
                command.canMergeWith(lastCommand)
              ) {
                const mergedCommand = command.mergeWith(lastCommand);
                const newUndoStack = [...undoStack.slice(0, -1), mergedCommand];

                console.log(
                  `🔀 命令已合并: ${command.type} (时间差: ${timeDiff}ms)`
                );

                return {
                  undoStack: newUndoStack,
                  redoStack: [], // 清空重做栈
                  canUndo: newUndoStack.length > 0,
                  canRedo: false,
                  currentIndex: newUndoStack.length - 1,
                };
              }
            }

            // 添加新命令到撤销栈
            let newUndoStack = [...undoStack, command];

            // 限制历史记录数量
            if (newUndoStack.length > maxHistorySize) {
              newUndoStack = newUndoStack.slice(-maxHistorySize);
            }

            console.log(`✅ 命令已执行: ${command.description}`);

            return {
              undoStack: newUndoStack,
              redoStack: [], // 清空重做栈（执行新操作后不能重做）
              canUndo: true,
              canRedo: false,
              currentIndex: newUndoStack.length - 1,
            };
          });
        } catch (error) {
          console.error(`❌ 命令执行失败: ${command.description}`, error);
          throw error;
        }
      },

      // 添加命令到历史但不执行（用于记录已完成的操作）
      recordCommand: (command: Command) => {
        set((state) => {
          const { undoStack, maxHistorySize } = state;

          // 尝试与最后一个命令合并
          if (
            undoStack.length > 0 &&
            command.canMergeWith &&
            command.mergeWith
          ) {
            const lastCommand = undoStack[undoStack.length - 1];
            const timeDiff = command.timestamp - lastCommand.timestamp;

            // 在时间窗口内且可以合并
            if (
              timeDiff < MERGE_TIME_WINDOW &&
              command.canMergeWith(lastCommand)
            ) {
              const mergedCommand = command.mergeWith(lastCommand);
              const newUndoStack = [...undoStack.slice(0, -1), mergedCommand];

              console.log(
                `🔀 命令已合并: ${command.type} (时间差: ${timeDiff}ms)`
              );

              return {
                undoStack: newUndoStack,
                redoStack: [], // 清空重做栈
                canUndo: newUndoStack.length > 0,
                canRedo: false,
                currentIndex: newUndoStack.length - 1,
              };
            }
          }

          // 添加新命令到撤销栈
          let newUndoStack = [...undoStack, command];

          // 限制历史记录数量
          if (newUndoStack.length > maxHistorySize) {
            newUndoStack = newUndoStack.slice(-maxHistorySize);
          }

          console.log(`📝 命令已记录: ${command.description}`);

          return {
            undoStack: newUndoStack,
            redoStack: [], // 清空重做栈（执行新操作后不能重做）
            canUndo: true,
            canRedo: false,
            currentIndex: newUndoStack.length - 1,
          };
        });
      },

      // 撤销上一个操作
      undo: async () => {
        const { undoStack, redoStack } = get();

        if (undoStack.length === 0) {
          console.warn("⚠️ 没有可撤销的操作");
          return;
        }

        try {
          // 获取最后一个命令
          const command = undoStack[undoStack.length - 1];

          // 执行撤销
          await command.undo();

          // 更新栈
          set({
            undoStack: undoStack.slice(0, -1),
            redoStack: [...redoStack, command],
            canUndo: undoStack.length > 1,
            canRedo: true,
            currentIndex: undoStack.length - 2,
          });

          console.log(`↶ 已撤销: ${command.description}`);
        } catch (error) {
          console.error("❌ 撤销操作失败:", error);
          throw error;
        }
      },

      // 重做下一个操作
      redo: async () => {
        const { undoStack, redoStack } = get();

        if (redoStack.length === 0) {
          console.warn("⚠️ 没有可重做的操作");
          return;
        }

        try {
          // 获取最后一个重做命令
          const command = redoStack[redoStack.length - 1];

          // 执行重做（即再次执行命令）
          await command.execute();

          // 更新栈
          set({
            undoStack: [...undoStack, command],
            redoStack: redoStack.slice(0, -1),
            canUndo: true,
            canRedo: redoStack.length > 1,
            currentIndex: undoStack.length,
          });

          console.log(`↷ 已重做: ${command.description}`);
        } catch (error) {
          console.error("❌ 重做操作失败:", error);
          throw error;
        }
      },

      // 清空历史记录
      clear: () => {
        set({
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
          currentIndex: -1,
        });
        console.log("🗑️ 历史记录已清空");
      },

      // 获取可撤销操作列表
      getUndoList: () => {
        return [...get().undoStack].reverse();
      },

      // 获取可重做操作列表
      getRedoList: () => {
        return [...get().redoStack].reverse();
      },

      // 设置最大历史记录数
      setMaxHistorySize: (size: number) => {
        set((state) => {
          let newUndoStack = state.undoStack;

          // 如果新的限制更小，截断历史栈
          if (size < state.undoStack.length) {
            newUndoStack = state.undoStack.slice(-size);
          }

          return {
            maxHistorySize: size,
            undoStack: newUndoStack,
            canUndo: newUndoStack.length > 0,
            currentIndex: newUndoStack.length - 1,
          };
        });

        console.log(`📊 最大历史记录数已设置为: ${size}`);
      },
    }),
    {
      name: "history-store",
    }
  )
);

// 开发环境下暴露到 window（便于调试）
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).useHistoryStore = useHistoryStore;
}
