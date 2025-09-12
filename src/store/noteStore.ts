// noteStore.ts
// 用于管理便签数据的 Zustand store

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Note, Position, Size, DragState } from "../types";
import { NOTE_DEFAULT_SIZE, NoteColor } from "../types";

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
  createNote: (canvasId: string, position: Position, color?: string) => string;
  /** 更新便签 */
  updateNote: (
    id: string,
    updates: Partial<Omit<Note, "id" | "createdAt">>
  ) => void;
  /** 删除便签 */
  deleteNote: (id: string) => void;
  /** 删除多个便签 */
  deleteNotes: (ids: string[]) => void;
  /** 移动便签位置 */
  moveNote: (id: string, position: Position) => void;
  /** 调整便签大小 */
  resizeNote: (id: string, size: Size) => void;
  /** 设置便签层级 */
  setNoteZIndex: (id: string, zIndex: number) => void;
  /** 将便签置顶 */
  bringToFront: (id: string) => void;
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
  moveNotes: (noteIds: string[], deltaPosition: Position) => void;
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
      createNote: (
        canvasId: string,
        position: Position,
        color = NoteColor.YELLOW
      ) => {
        const id = generateId();
        const now = new Date();
        const { maxZIndex } = get();

        const newNote: Note = {
          id,
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

        set((state) => ({
          notes: [...state.notes, newNote],
          maxZIndex: maxZIndex + 1,
        }));

        return id;
      },

      // 更新便签
      updateNote: (
        id: string,
        updates: Partial<Omit<Note, "id" | "createdAt">>
      ) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          ),
        }));
      },

      // 删除便签
      deleteNote: (id: string) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          selectedNoteIds: state.selectedNoteIds.filter(
            (selectedId) => selectedId !== id
          ),
        }));
      },

      // 删除多个便签
      deleteNotes: (ids: string[]) => {
        set((state) => ({
          notes: state.notes.filter((note) => !ids.includes(note.id)),
          selectedNoteIds: state.selectedNoteIds.filter(
            (selectedId) => !ids.includes(selectedId)
          ),
        }));
      },

      // 移动便签位置
      moveNote: (id: string, position: Position) => {
        get().updateNote(id, { position });
      },

      // 调整便签大小
      resizeNote: (id: string, size: Size) => {
        get().updateNote(id, { size });
      },

      // 设置便签层级
      setNoteZIndex: (id: string, zIndex: number) => {
        const { maxZIndex } = get();
        const newZIndex = Math.min(zIndex, maxZIndex);
        get().updateNote(id, { zIndex: newZIndex });
      },

      // 将便签置顶
      bringToFront: (id: string) => {
        const { maxZIndex } = get();
        const newZIndex = maxZIndex + 1;

        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, zIndex: newZIndex, updatedAt: new Date() }
              : note
          ),
          maxZIndex: newZIndex,
        }));
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
      moveNotes: (noteIds: string[], deltaPosition: Position) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            noteIds.includes(note.id)
              ? {
                  ...note,
                  position: {
                    x: note.position.x + deltaPosition.x,
                    y: note.position.y + deltaPosition.y,
                  },
                  updatedAt: new Date(),
                }
              : note
          ),
        }));
      },
    }),
    {
      name: "note-store",
    }
  )
);
