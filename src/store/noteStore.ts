// noteStore.ts
// 用于管理便签数据的 Zustand store

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Note, Position, Size, DragState } from "../types";
import { NOTE_DEFAULT_SIZE, NoteColor } from "../types";
import { dbOperations } from "../utils/db";

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
  /** 将便签置顶 */
  bringToFront: (id: string) => Promise<void>;
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
  /** 初始化数据 */
  initialize: () => Promise<void>;
}

type NoteStore = NoteState & NoteActions;

/**
 * 生成UUID
 */
const generateId = (): string => {
  return (
    "note_" + Date.now().toString(36) + Math.random().toString(36).substr(2)
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

          // 移除创建成功的日志，减少噪音
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

          console.log(`✅ 便签更新成功，ID: ${id}`);
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
        await get().updateNote(id, { position });
      },

      // 调整便签大小
      resizeNote: async (id: string, size: Size) => {
        await get().updateNote(id, { size });
      },

      // 设置便签层级
      setNoteZIndex: async (id: string, zIndex: number) => {
        const { maxZIndex } = get();
        const newZIndex = Math.min(zIndex, maxZIndex);
        await get().updateNote(id, { zIndex: newZIndex });
      },

      // 将便签置顶
      bringToFront: async (id: string) => {
        const { maxZIndex } = get();
        const newZIndex = maxZIndex + 1;
        const updatedAt = new Date();

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

          console.log(`✅ 便签置顶成功，ID: ${id}`);
        } catch (error) {
          console.error("❌ 便签置顶失败:", error);
          // 重新加载数据以恢复状态
          await get().loadNotesFromDB();
          throw new Error(
            `便签置顶失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 选中便签
      selectNote: (id: string, multi = false) => {
        set((state) => {
          if (multi) {
            const isSelected = state.selectedNoteIds.includes(id);
            return {
              selectedNoteIds: isSelected
                ? state.selectedNoteIds.filter(
                    (selectedId) => selectedId !== id
                  )
                : [...state.selectedNoteIds, id],
            };
          } else {
            return { selectedNoteIds: [id] };
          }
        });
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

          // 输出详细信息但去重
          if (formattedNotes.length > 0) {
            logWithDedup(
              `📋 Store加载 ${formattedNotes.length} 个便签:`,
              formattedNotes.map((note) => ({
                id: note.id.slice(-8),
                title: note.title,
                canvasId: note.canvasId.slice(-8),
                position: note.position,
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
    }),
    {
      name: "note-store",
    }
  )
);
