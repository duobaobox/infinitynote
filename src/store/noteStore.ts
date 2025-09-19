// noteStore.ts
// 用于管理便签数据的 Zustand store

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Note, Position, Size, DragState } from "../types";
import type { AICustomProperties } from "../types/ai";
import { NOTE_DEFAULT_SIZE, NoteColor } from "../types";
import { dbOperations } from "../utils/db";
import { noteStoreEvents, storeEventBus } from "./storeEvents";
import { aiService } from "../services/aiService";

// 日志去重机制
const loggedMessages = new Set<string>();
const logWithDedup = (message: string, ...args: any[]) => {
  const key = `${message}_${JSON.stringify(args)}`;
  if (!loggedMessages.has(key)) {
    loggedMessages.add(key);
    console.log(message, ...args);
    // 5秒后清除记录，允许重新打印
    setTimeout(() => loggedMessages.delete(key), 5000);
  }
};

// 防抖保存便签状态的超时引用映射
const saveNoteTimeouts = new Map<string, number>();

/**
 * 防抖保存便签状态到数据库
 * @param noteId 便签ID
 * @param updates 要更新的便签数据
 * @param delay 防抖延迟时间（毫秒）
 */
const debouncedSaveNote = (
  noteId: string,
  updates: Partial<Omit<Note, "id" | "createdAt">>,
  delay = 500
) => {
  // 清除之前的定时器
  const existingTimeout = saveNoteTimeouts.get(noteId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // 设置新的定时器
  const timeoutId = window.setTimeout(async () => {
    try {
      const updatesWithTime = { ...updates, updatedAt: new Date() };
      await dbOperations.updateNote(noteId, updatesWithTime);
      // 只在成功保存后输出日志，避免频繁打印
      logWithDedup(`✅ 便签状态已保存，ID: ${noteId}`);
    } catch (error) {
      console.error("❌ 防抖保存便签状态失败:", error);
    }
    saveNoteTimeouts.delete(noteId);
  }, delay);

  saveNoteTimeouts.set(noteId, timeoutId);
};

/**
 * 便签状态接口
 */
interface NoteState {
  /** 便签列表 */
  notes: Note[];
  /** 当前选中的便签ID列表 */
  selectedNoteIds: string[];
  /** 拖拽状态 */
  dragState: DragState;
  /** 最大层级索引 */
  maxZIndex: number;

  // === AI 相关状态 ===
  /** 正在生成AI内容的便签ID映射 */
  aiGenerating: Record<string, boolean>;
  /** 流式生成的实时数据 */
  aiStreamingData: Record<string, string | undefined>;
  /** AI生成错误信息 */
  aiErrors: Record<string, string | undefined>;
}

/**
 * 便签操作接口
 */
interface NoteActions {
  /** 创建便签 */
  createNote: (
    canvasId: string,
    position: Position,
    color?: string
  ) => Promise<string>;
  /** 更新便签 */
  updateNote: (
    id: string,
    updates: Partial<Omit<Note, "id" | "createdAt">>
  ) => Promise<void>;
  /** 删除便签 */
  deleteNote: (id: string) => Promise<void>;
  /** 删除多个便签 */
  deleteNotes: (ids: string[]) => Promise<void>;
  /** 移动便签位置 */
  moveNote: (id: string, position: Position) => Promise<void>;
  /** 调整便签大小 */
  resizeNote: (id: string, size: Size) => Promise<void>;
  /** 设置便签层级 */
  setNoteZIndex: (id: string, zIndex: number) => Promise<void>;
  /** 重平衡所有便签的 zIndex */
  rebalanceZIndexes: () => Promise<void>;
  /** 将便签置顶 */
  bringToFront: (id: string) => Promise<void>;
  /** 带防抖的置顶方法 */
  debouncedBringToFront: (id: string, delay?: number) => void;
  /** 选中便签 */
  selectNote: (id: string, multi?: boolean) => void;
  /** 取消选中便签 */
  deselectNote: (id: string) => void;
  /** 清空选中 */
  clearSelection: () => void;
  /** 选中多个便签 */
  selectMultiple: (ids: string[]) => void;
  /** 根据画布ID获取便签 */
  getNotesByCanvas: (canvasId: string) => Note[];
  /** 开始拖拽 */
  startDrag: (noteId: string, startPosition: Position) => void;
  /** 更新拖拽位置 */
  updateDragPosition: (position: Position) => void;
  /** 结束拖拽 */
  endDrag: () => void;
  /** 批量移动便签 */
  moveNotes: (noteIds: string[], deltaPosition: Position) => Promise<void>;
  /** 从数据库加载所有便签 */
  loadNotesFromDB: () => Promise<void>;
  /** 获取最大支持的便签数量 */
  getMaxSupportedNotes: () => number;
  /** 检查便签数量限制 */
  checkNoteCountLimit: () => void;
  /** 初始化数据 */
  initialize: () => Promise<void>;

  // === AI 相关方法 ===
  /** 开始AI生成 */
  startAIGeneration: (noteId: string, prompt: string) => Promise<void>;
  /** 更新流式生成内容 */
  updateAIStreamingContent: (
    noteId: string,
    content: string,
    aiData?: AICustomProperties["ai"]
  ) => void;
  /** 完成AI生成 */
  completeAIGeneration: (
    noteId: string,
    finalContent: string,
    aiData: AICustomProperties["ai"]
  ) => Promise<void>;
  /** 取消AI生成 */
  cancelAIGeneration: (noteId: string) => void;
  /** 切换思维链显示 */
  toggleThinkingChain: (noteId: string) => Promise<void>;
  /** 保存AI生成的便签 */
  saveAINote: (
    noteData: Partial<Note>,
    aiData: AICustomProperties["ai"]
  ) => Promise<string>;
  /** 从提示词生成便签 */
  createAINoteFromPrompt: (
    canvasId: string,
    prompt: string,
    position?: Position
  ) => Promise<string>;

  // 层级管理常量
  readonly LAYER_STEP: number;
  readonly MAX_Z_INDEX: number;
  readonly MIN_Z_INDEX: number;

  // 内部状态（不对外暴露）
  readonly _debouncedBringToFrontMap: Map<string, number>;
}

type NoteStore = NoteState & NoteActions;

/**
 * 生成UUID
 */
const generateId = (): string => {
  return (
    "note_" + Date.now().toString(36) + Math.random().toString(36).substring(2)
  );
};

/**
 * 便签状态管理
 */
export const useNoteStore = create<NoteStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      notes: [],
      selectedNoteIds: [],
      dragState: {
        isDragging: false,
        draggedNoteId: null,
        dragStartPosition: null,
        currentDragPosition: null,
      },
      maxZIndex: 1,

      // === AI 相关状态初始化 ===
      aiGenerating: {},
      aiStreamingData: {},
      aiErrors: {},

      // 创建便签
      createNote: async (
        canvasId: string,
        position: Position,
        color = NoteColor.YELLOW
      ) => {
        const tempId = generateId();
        const now = new Date();
        const { maxZIndex } = get();

        const newNote: Note = {
          id: tempId,
          title: "新便签",
          content: "",
          color,
          position,
          size: { ...NOTE_DEFAULT_SIZE },
          zIndex: maxZIndex + 1,
          canvasId,
          createdAt: now,
          updatedAt: now,
        };

        try {
          // 先更新内存状态，提供即时反馈
          set((state) => ({
            notes: [...state.notes, newNote],
            maxZIndex: maxZIndex + 1,
          }));

          // 同步到数据库
          const dbId = await dbOperations.addNote(newNote);

          console.log(`✅ 便签创建成功，ID: ${tempId}`);

          // 检查便签数量是否接近上限
          get().checkNoteCountLimit();

          // 发送便签创建事件
          noteStoreEvents.notifyNoteCreated(tempId, canvasId);

          return dbId;
        } catch (error) {
          // 如果数据库操作失败，回滚内存状态
          set((state) => ({
            notes: state.notes.filter((note) => note.id !== tempId),
            maxZIndex: state.maxZIndex - 1,
          }));

          console.error("❌ 创建便签失败:", error);
          throw new Error(
            `创建便签失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 更新便签
      updateNote: async (
        id: string,
        updates: Partial<Omit<Note, "id" | "createdAt">>
      ) => {
        const updatedAt = new Date();
        const updatesWithTime = { ...updates, updatedAt };

        try {
          // 先更新内存状态
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id ? { ...note, ...updatesWithTime } : note
            ),
          }));

          // 同步到数据库
          await dbOperations.updateNote(id, updatesWithTime);

          // 去掉频繁的日志输出，避免控制台污染
          // console.log(`✅ 便签更新成功，ID: ${id}`);

          // 发送便签更新事件
          const note = get().notes.find((n) => n.id === id);
          if (note) {
            noteStoreEvents.notifyNoteUpdated(id, note.canvasId);
          }
        } catch (error) {
          console.error("❌ 更新便签失败:", error);
          // 可以选择重新加载数据或显示错误提示
          throw new Error(
            `更新便签失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 删除便签
      deleteNote: async (id: string) => {
        try {
          // 获取便签信息用于事件通知
          const noteToDelete = get().notes.find((note) => note.id === id);
          const canvasId = noteToDelete?.canvasId;

          // 先更新内存状态
          set((state) => ({
            notes: state.notes.filter((note) => note.id !== id),
            selectedNoteIds: state.selectedNoteIds.filter(
              (selectedId) => selectedId !== id
            ),
          }));

          // 同步到数据库
          await dbOperations.deleteNote(id);

          console.log(`✅ 便签删除成功，ID: ${id}`);

          // 发送便签删除事件
          if (canvasId) {
            noteStoreEvents.notifyNoteDeleted(id, canvasId);
          }
        } catch (error) {
          console.error("❌ 删除便签失败:", error);
          // 重新加载数据以恢复状态
          await get().loadNotesFromDB();
          throw new Error(
            `删除便签失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 删除多个便签
      deleteNotes: async (ids: string[]) => {
        try {
          // 先更新内存状态
          set((state) => ({
            notes: state.notes.filter((note) => !ids.includes(note.id)),
            selectedNoteIds: state.selectedNoteIds.filter(
              (selectedId) => !ids.includes(selectedId)
            ),
          }));

          // 批量删除数据库记录
          const deletePromises = ids.map((id) => dbOperations.deleteNote(id));
          await Promise.all(deletePromises);

          console.log(`✅ 批量删除便签成功，数量: ${ids.length}`);
        } catch (error) {
          console.error("❌ 批量删除便签失败:", error);
          // 重新加载数据以恢复状态
          await get().loadNotesFromDB();
          throw new Error(
            `批量删除便签失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 移动便签位置
      moveNote: async (id: string, position: Position) => {
        // 优化性能：使用函数式更新，只更新目标便签
        set((state) => {
          const noteIndex = state.notes.findIndex((note) => note.id === id);
          if (noteIndex === -1) return state;

          // 创建新的数组副本，只更新目标便签
          const newNotes = [...state.notes];
          newNotes[noteIndex] = {
            ...newNotes[noteIndex],
            position,
            updatedAt: new Date(),
          };

          return { notes: newNotes };
        });

        // 使用防抖保存，避免拖动时频繁更新数据库
        debouncedSaveNote(id, { position });
      },

      // 调整便签大小
      resizeNote: async (id: string, size: Size) => {
        // 优化性能：使用函数式更新，只更新目标便签
        set((state) => {
          const noteIndex = state.notes.findIndex((note) => note.id === id);
          if (noteIndex === -1) return state;

          // 创建新的数组副本，只更新目标便签
          const newNotes = [...state.notes];
          newNotes[noteIndex] = {
            ...newNotes[noteIndex],
            size,
            updatedAt: new Date(),
          };

          return { notes: newNotes };
        });

        // 使用防抖保存，避免调整大小时频繁更新数据库
        debouncedSaveNote(id, { size });
      },

      // 设置便签层级
      setNoteZIndex: async (id: string, zIndex: number) => {
        const { maxZIndex } = get();
        const newZIndex = Math.min(zIndex, maxZIndex);
        await get().updateNote(id, { zIndex: newZIndex });
      },

      // 层级管理常量（优化后的安全范围）
      LAYER_STEP: 10,
      MAX_Z_INDEX: 10000, // 降低到安全范围，支持1000个便签
      MIN_Z_INDEX: 1,

      // 获取当前可支持的最大便签数量
      getMaxSupportedNotes: () => {
        const { MAX_Z_INDEX, MIN_Z_INDEX, LAYER_STEP } = get();
        return Math.floor((MAX_Z_INDEX - MIN_Z_INDEX) / LAYER_STEP) + 1;
      },

      // 检查是否接近便签数量上限
      checkNoteCountLimit: () => {
        const { notes } = get();
        const maxSupported = get().getMaxSupportedNotes();
        const currentCount = notes.length;
        const usagePercent = (currentCount / maxSupported) * 100;

        if (usagePercent >= 90) {
          console.warn(
            `⚠️ 便签数量接近上限: ${currentCount}/${maxSupported} (${usagePercent.toFixed(
              1
            )}%)`
          );
        } else if (usagePercent >= 75) {
          console.log(
            `📊 便签数量统计: ${currentCount}/${maxSupported} (${usagePercent.toFixed(
              1
            )}%)`
          );
        }

        return { currentCount, maxSupported, usagePercent };
      },

      // 重平衡所有便签的 zIndex，避免数值过大
      rebalanceZIndexes: async () => {
        const { notes, LAYER_STEP, MIN_Z_INDEX } = get();
        if (notes.length === 0) return;

        console.log(`🔄 开始重平衡 ${notes.length} 个便签的层级...`);

        try {
          // 按当前 zIndex 排序
          const sortedNotes = [...notes].sort((a, b) => a.zIndex - b.zIndex);
          const updates: Array<{ id: string; zIndex: number }> = [];

          // 重新分配 zIndex，从 MIN_Z_INDEX 开始，每个便签间隔 LAYER_STEP
          sortedNotes.forEach((note, index) => {
            const newZIndex = MIN_Z_INDEX + index * LAYER_STEP;
            if (note.zIndex !== newZIndex) {
              updates.push({ id: note.id, zIndex: newZIndex });
            }
          });

          if (updates.length === 0) {
            console.log("✅ 层级已经是最优状态，无需重平衡");
            return;
          }

          // 计算新的maxZIndex
          const newMaxZIndex =
            MIN_Z_INDEX + (sortedNotes.length - 1) * LAYER_STEP;

          // 批量更新内存状态
          set((state) => ({
            notes: state.notes.map((note) => {
              const update = updates.find((u) => u.id === note.id);
              return update
                ? { ...note, zIndex: update.zIndex, updatedAt: new Date() }
                : note;
            }),
            maxZIndex: newMaxZIndex,
          }));

          // 批量更新数据库
          const dbUpdates = updates.map(({ id, zIndex }) =>
            dbOperations.updateNote(id, { zIndex, updatedAt: new Date() })
          );
          await Promise.all(dbUpdates);

          console.log(`✅ 层级重平衡完成，更新了 ${updates.length} 个便签`);
          console.log(`📊 新的层级范围: ${MIN_Z_INDEX} - ${newMaxZIndex}`);
        } catch (error) {
          console.error("❌ 层级重平衡失败:", error);
          // 重新加载数据以恢复状态
          await get().loadNotesFromDB();
          throw new Error(
            `层级重平衡失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 将便签置顶（优化版本）
      bringToFront: async (id: string) => {
        const { maxZIndex, notes, LAYER_STEP, MAX_Z_INDEX } = get();
        const targetNote = notes.find((note) => note.id === id);

        if (!targetNote) {
          console.warn(`⚠️ 便签不存在: ${id.slice(-8)}`);
          return;
        }

        // 检查是否需要重平衡
        if (maxZIndex >= MAX_Z_INDEX - LAYER_STEP) {
          console.log("🔄 zIndex 接近上限，执行重平衡...");
          await get().rebalanceZIndexes();
        }

        const newZIndex = Math.max(maxZIndex, get().maxZIndex) + LAYER_STEP;
        const updatedAt = new Date();

        console.log(
          `🔝 开始置顶便签: ${id.slice(-8)}, 当前zIndex: ${
            targetNote.zIndex
          }, 新zIndex: ${newZIndex}, 当前maxZIndex: ${maxZIndex}`
        );

        // 如果已经是最顶层，无需操作
        if (targetNote.zIndex === maxZIndex) {
          console.log(`✅ 便签已在最顶层: ${id.slice(-8)}`);
          return;
        }

        // 保存原始状态用于错误恢复
        const originalNote = { ...targetNote };

        try {
          // 先更新内存状态
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id ? { ...note, zIndex: newZIndex, updatedAt } : note
            ),
            maxZIndex: newZIndex,
          }));

          // 同步到数据库
          await dbOperations.updateNote(id, {
            zIndex: newZIndex,
            updatedAt,
          });

          console.log(
            `✅ 便签置顶成功，ID: ${id.slice(-8)}, 新zIndex: ${newZIndex}`
          );
        } catch (error) {
          console.error("❌ 便签置顶失败:", error);

          // 精确恢复失败的便签状态，而不是重新加载所有数据
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id ? originalNote : note
            ),
            maxZIndex: Math.max(
              ...state.notes.map((n) =>
                n.id === id ? originalNote.zIndex : n.zIndex
              )
            ),
          }));

          throw new Error(
            `便签置顶失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 防抖置顶操作的映射表
      _debouncedBringToFrontMap: new Map<string, number>(),

      // 带防抖的数据库同步方法（只处理数据库操作）
      debouncedBringToFront: (id: string, delay = 100) => {
        const { _debouncedBringToFrontMap } = get();

        // 清除之前的定时器
        const existingTimer = _debouncedBringToFrontMap.get(id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // 设置新的定时器，只同步数据库
        const timer = setTimeout(async () => {
          try {
            const { notes } = get();
            const targetNote = notes.find((note) => note.id === id);

            if (targetNote) {
              // 去掉频繁的日志输出，避免控制台污染
              // console.log(
              //   `💾 防抖数据库同步: ${id.slice(-8)}, zIndex: ${
              //     targetNote.zIndex
              //   }`
              // );

              // 只同步到数据库，不更新内存状态（内存状态已经在selectNote中更新）
              await dbOperations.updateNote(id, {
                zIndex: targetNote.zIndex,
                updatedAt: targetNote.updatedAt,
              });

              // console.log(`✅ 数据库同步成功: ${id.slice(-8)}`);
            }
          } catch (error) {
            console.error("❌ 防抖数据库同步失败:", error);
            // 如果数据库同步失败，重新调用完整的置顶方法
            get().bringToFront(id).catch(console.error);
          }
          _debouncedBringToFrontMap.delete(id);
        }, delay);

        _debouncedBringToFrontMap.set(id, timer);
      },

      // 选中便签（支持自动置顶，带重平衡检查）
      selectNote: async (id: string, multi = false) => {
        const { notes, maxZIndex, LAYER_STEP, MAX_Z_INDEX } = get();
        const targetNote = notes.find((note) => note.id === id);

        if (multi) {
          // 多选模式：切换选中状态，不置顶
          set((state) => {
            const isSelected = state.selectedNoteIds.includes(id);
            return {
              selectedNoteIds: isSelected
                ? state.selectedNoteIds.filter(
                    (selectedId) => selectedId !== id
                  )
                : [...state.selectedNoteIds, id],
            };
          });
        } else {
          if (!targetNote) {
            console.warn(`⚠️ 选中的便签不存在: ${id.slice(-8)}`);
            return;
          }

          // 立即更新选中状态
          set({ selectedNoteIds: [id] });

          // 检查是否需要重平衡
          if (maxZIndex >= MAX_Z_INDEX - LAYER_STEP) {
            console.log("🔄 zIndex 接近上限，执行重平衡...");
            await get().rebalanceZIndexes();
          }

          // 自动置顶：将便签置顶到最上层
          const currentMaxZIndex = get().maxZIndex; // 重平衡后可能已更新
          const newZIndex = currentMaxZIndex + LAYER_STEP;

          // 立即更新内存状态，提供即时视觉反馈
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id
                ? { ...note, zIndex: newZIndex, updatedAt: new Date() }
                : note
            ),
            maxZIndex: newZIndex,
          }));

          // 防抖数据库操作，避免频繁写入
          get().debouncedBringToFront(id);
        }
      },

      // 取消选中便签
      deselectNote: (id: string) => {
        set((state) => ({
          selectedNoteIds: state.selectedNoteIds.filter(
            (selectedId) => selectedId !== id
          ),
        }));
      },

      // 清空选中
      clearSelection: () => {
        set({ selectedNoteIds: [] });
      },

      // 选中多个便签
      selectMultiple: (ids: string[]) => {
        set({ selectedNoteIds: ids });
      },

      // 根据画布ID获取便签
      getNotesByCanvas: (canvasId: string) => {
        return get().notes.filter((note) => note.canvasId === canvasId);
      },

      // 开始拖拽
      startDrag: (noteId: string, startPosition: Position) => {
        set({
          dragState: {
            isDragging: true,
            draggedNoteId: noteId,
            dragStartPosition: startPosition,
            currentDragPosition: startPosition,
          },
        });
      },

      // 更新拖拽位置
      updateDragPosition: (position: Position) => {
        set((state) => ({
          dragState: {
            ...state.dragState,
            currentDragPosition: position,
          },
        }));
      },

      // 结束拖拽
      endDrag: () => {
        set({
          dragState: {
            isDragging: false,
            draggedNoteId: null,
            dragStartPosition: null,
            currentDragPosition: null,
          },
        });
      },

      // 批量移动便签
      moveNotes: async (noteIds: string[], deltaPosition: Position) => {
        const updatedAt = new Date();

        try {
          // 先更新内存状态
          set((state) => ({
            notes: state.notes.map((note) =>
              noteIds.includes(note.id)
                ? {
                    ...note,
                    position: {
                      x: note.position.x + deltaPosition.x,
                      y: note.position.y + deltaPosition.y,
                    },
                    updatedAt,
                  }
                : note
            ),
          }));

          // 批量更新数据库
          const updatePromises = noteIds.map(async (id) => {
            const note = get().notes.find((n) => n.id === id);
            if (note) {
              await dbOperations.updateNote(id, {
                position: note.position,
                updatedAt,
              });
            }
          });

          await Promise.all(updatePromises);
          console.log(`✅ 批量移动便签成功，数量: ${noteIds.length}`);
        } catch (error) {
          console.error("❌ 批量移动便签失败:", error);
          // 重新加载数据以恢复状态
          await get().loadNotesFromDB();
          throw new Error(
            `批量移动便签失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 从数据库加载所有便签
      loadNotesFromDB: async () => {
        try {
          const dbNotes = await dbOperations.getAllNotes();

          const formattedNotes: Note[] = dbNotes.map((note) => ({
            id: note.id || "",
            title: note.title,
            content: note.content,
            color: note.color,
            position: note.position,
            size: note.size,
            zIndex: note.zIndex,
            canvasId: note.canvasId,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            // 添加新字段的默认值
            tags: note.tags || [],
            priority: note.priority || 2,
            isPinned: note.isPinned || false,
            isArchived: note.isArchived || false,
            isFavorite: note.isFavorite || false,
            contentType: note.contentType || "text",
            permission: note.permission || "private",
            version: note.version || 1,
            isDeleted: note.isDeleted || false,
            lastAccessedAt: note.lastAccessedAt || note.updatedAt,
            // ⭐ 关键修复：确保包含 customProperties 字段，这里存储所有 AI 数据
            customProperties: note.customProperties || {},
          }));

          // 计算最大 zIndex
          const maxZIndex =
            formattedNotes.length > 0
              ? Math.max(...formattedNotes.map((note) => note.zIndex))
              : 1;

          set({
            notes: formattedNotes,
            maxZIndex,
            selectedNoteIds: [], // 清空选中状态
          });

          // 输出详细信息但去重，包含AI数据统计
          if (formattedNotes.length > 0) {
            const aiNotesCount = formattedNotes.filter(
              (note) => note.customProperties?.ai
            ).length;
            const thinkingChainCount = formattedNotes.filter(
              (note) => note.customProperties?.ai?.thinkingChain
            ).length;

            logWithDedup(
              `📋 Store加载 ${formattedNotes.length} 个便签 (AI便签: ${aiNotesCount}, 思维链: ${thinkingChainCount}):`,
              formattedNotes.map((note) => ({
                id: note.id.slice(-8),
                title: note.title,
                canvasId: note.canvasId.slice(-8),
                hasAI: !!note.customProperties?.ai,
                hasThinking: !!note.customProperties?.ai?.thinkingChain,
                thinkingSteps:
                  note.customProperties?.ai?.thinkingChain?.totalSteps || 0,
              }))
            );
          }
        } catch (error) {
          console.error("❌ 从数据库加载便签失败:", error);
          throw new Error(
            `加载便签失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 初始化数据
      initialize: async () => {
        try {
          // 检查数据库健康状态
          const isHealthy = await dbOperations.healthCheck();
          if (!isHealthy) {
            throw new Error("数据库连接失败");
          }

          // 加载所有便签
          await get().loadNotesFromDB();
        } catch (error) {
          console.error("❌ 便签初始化失败:", error);
          // 初始化失败时设置空状态，但不抛出错误，让应用继续运行
          set({
            notes: [],
            maxZIndex: 1,
            selectedNoteIds: [],
          });
        }
      },

      // === AI 相关方法实现 ===

      // 开始AI生成
      startAIGeneration: async (noteId: string, prompt: string) => {
        try {
          set((state) => ({
            aiGenerating: { ...state.aiGenerating, [noteId]: true },
            aiErrors: { ...state.aiErrors, [noteId]: undefined },
            aiStreamingData: { ...state.aiStreamingData, [noteId]: "" },
          }));

          console.log(
            `🤖 开始为便签 ${noteId.slice(-8)} 生成AI内容，提示: ${prompt.slice(
              0,
              50
            )}...`
          );

          // 调用AI服务进行生成
          await aiService.generateNote({
            noteId,
            prompt,
            onStream: (content, aiData) => {
              get().updateAIStreamingContent(noteId, content, aiData);
            },
            onComplete: (finalContent, aiData) => {
              get().completeAIGeneration(noteId, finalContent, aiData);
            },
            onError: (error) => {
              set((state) => ({
                aiErrors: { ...state.aiErrors, [noteId]: error.message },
                aiGenerating: { ...state.aiGenerating, [noteId]: false },
              }));
            },
          });
        } catch (error) {
          console.error("AI生成启动失败:", error);
          set((state) => ({
            aiErrors: { ...state.aiErrors, [noteId]: (error as Error).message },
            aiGenerating: { ...state.aiGenerating, [noteId]: false },
          }));
        }
      },

      // 更新流式内容
      updateAIStreamingContent: (
        noteId: string,
        content: string,
        aiData?: AICustomProperties["ai"]
      ) => {
        set((state) => ({
          aiStreamingData: { ...state.aiStreamingData, [noteId]: content },
        }));

        // 如果有AI数据（包含思维链），立即更新便签
        if (aiData) {
          const note = get().notes.find((n) => n.id === noteId);
          if (note) {
            // 直接更新内存中的便签数据，不触发数据库保存
            set((state) => ({
              notes: state.notes.map((n) =>
                n.id === noteId
                  ? {
                      ...n,
                      content: content,
                      customProperties: {
                        ...n.customProperties,
                        ai: aiData,
                      },
                      updatedAt: new Date(),
                    }
                  : n
              ),
            }));
          }
        }
      },

      // 完成AI生成
      completeAIGeneration: async (
        noteId: string,
        finalContent: string,
        aiData: AICustomProperties["ai"]
      ) => {
        try {
          // 更新便签内容和AI数据
          await get().updateNote(noteId, {
            content: finalContent,
            customProperties: {
              ...get().notes.find((n) => n.id === noteId)?.customProperties,
              ai: aiData,
            },
          });

          // 清理临时状态
          set((state) => ({
            aiGenerating: { ...state.aiGenerating, [noteId]: false },
            aiStreamingData: { ...state.aiStreamingData, [noteId]: undefined },
            aiErrors: { ...state.aiErrors, [noteId]: undefined },
          }));

          console.log(`✅ AI生成完成，便签ID: ${noteId.slice(-8)}`);
        } catch (error) {
          console.error("保存AI生成内容失败:", error);
          set((state) => ({
            aiErrors: { ...state.aiErrors, [noteId]: (error as Error).message },
            aiGenerating: { ...state.aiGenerating, [noteId]: false },
          }));
        }
      },

      // 取消AI生成
      cancelAIGeneration: (noteId: string) => {
        set((state) => ({
          aiGenerating: { ...state.aiGenerating, [noteId]: false },
          aiStreamingData: { ...state.aiStreamingData, [noteId]: undefined },
          aiErrors: { ...state.aiErrors, [noteId]: undefined },
        }));
        console.log(`🚫 取消AI生成，便签ID: ${noteId.slice(-8)}`);
      },

      // 切换思维链显示
      toggleThinkingChain: async (noteId: string) => {
        const note = get().notes.find((n) => n.id === noteId);
        if (note?.customProperties?.ai) {
          const currentShow = note.customProperties.ai.showThinking ?? true;
          await get().updateNote(noteId, {
            customProperties: {
              ...note.customProperties,
              ai: {
                ...note.customProperties.ai,
                showThinking: !currentShow,
              },
            },
          });
          console.log(
            `💭 切换思维链显示: ${noteId.slice(-8)}, 显示: ${!currentShow}`
          );
        }
      },

      // 保存AI生成的便签
      saveAINote: async (
        noteData: Partial<Note>,
        aiData: AICustomProperties["ai"]
      ): Promise<string> => {
        const noteWithAI: Partial<Note> = {
          ...noteData,
          customProperties: {
            ...noteData.customProperties,
            ai: aiData,
          },
        };

        // 如果有ID则更新，否则创建新便签
        if (noteWithAI.id) {
          await get().updateNote(noteWithAI.id, noteWithAI);
          return noteWithAI.id;
        } else {
          const canvasId = noteWithAI.canvasId || "default-canvas";
          const position = noteWithAI.position || { x: 100, y: 100 };
          const color = noteWithAI.color || NoteColor.YELLOW;

          return await get().createNote(canvasId, position, color);
        }
      },

      // 从提示词生成便签
      createAINoteFromPrompt: async (
        canvasId: string,
        prompt: string,
        position: Position = { x: 200, y: 200 }
      ): Promise<string> => {
        try {
          // 先创建一个空白便签作为占位符
          const noteId = await get().createNote(
            canvasId,
            position,
            NoteColor.YELLOW
          );

          // 更新便签标题为提示词的前几个字
          const title =
            prompt.length > 20 ? prompt.slice(0, 20) + "..." : prompt;
          await get().updateNote(noteId, {
            title,
            content: "<p>🤖 AI正在生成内容...</p>",
          });

          console.log(
            `📝 创建AI便签占位符: ${noteId.slice(-8)}, 提示: ${prompt.slice(
              0,
              30
            )}...`
          );

          return noteId;
        } catch (error) {
          console.error("创建AI便签失败:", error);
          throw error;
        }
      },
    }),
    {
      name: "note-store",
    }
  )
);

// 设置Store事件监听器
if (typeof window !== "undefined") {
  // 监听便签重新加载请求
  storeEventBus.on("notes:reload", ({ canvasId }) => {
    const store = useNoteStore.getState();
    if (canvasId) {
      // 如果指定了画布ID，只重新加载该画布的便签
      store.loadNotesFromDB();
    } else {
      // 重新加载所有便签
      store.loadNotesFromDB();
    }
  });

  // 监听画布删除事件，清理相关便签
  storeEventBus.on("canvas:deleted", ({ canvasId }) => {
    const store = useNoteStore.getState();
    const canvasNotes = store.notes.filter(
      (note) => note.canvasId === canvasId
    );

    // 从内存中移除该画布的便签
    useNoteStore.setState((state: NoteState) => ({
      notes: state.notes.filter((note: Note) => note.canvasId !== canvasId),
      selectedNoteIds: state.selectedNoteIds.filter(
        (id: string) => !canvasNotes.some((note: Note) => note.id === id)
      ),
    }));
  });

  // 监听数据同步请求
  storeEventBus.on("data:sync-required", ({ type }) => {
    if (type === "notes" || type === "all") {
      const store = useNoteStore.getState();
      store.loadNotesFromDB();
    }
  });
}
