/**
 * Note Store 选择器
 * 提供从状态中派生数据的函数
 */

import type { Note } from '../../types';
import type { NoteState } from './types';

/**
 * 选择所有便签
 */
export const selectAllNotes = (state: NoteState): Note[] => state.notes;

/**
 * 选择指定画布的便签
 */
export const selectNotesByCanvas = (state: NoteState, canvasId: string): Note[] => {
  return state.notes.filter(note => note.canvasId === canvasId);
};

/**
 * 选择指定ID的便签
 */
export const selectNoteById = (state: NoteState, noteId: string): Note | undefined => {
  return state.notes.find(note => note.id === noteId);
};

/**
 * 选择多个便签
 */
export const selectNotesByIds = (state: NoteState, noteIds: string[]): Note[] => {
  const idSet = new Set(noteIds);
  return state.notes.filter(note => idSet.has(note.id));
};

/**
 * 选择当前选中的便签
 */
export const selectSelectedNotes = (state: NoteState): Note[] => {
  return selectNotesByIds(state, state.selectedNoteIds);
};

/**
 * 选择便签总数
 */
export const selectNoteCount = (state: NoteState): number => {
  return state.notes.length;
};

/**
 * 选择画布便签数
 */
export const selectCanvasNoteCount = (state: NoteState, canvasId: string): number => {
  return state.notes.filter(note => note.canvasId === canvasId).length;
};

/**
 * 选择是否正在拖拽
 */
export const selectIsDragging = (state: NoteState): boolean => {
  return state.dragState.isDragging;
};

/**
 * 选择拖拽中的便签ID
 */
export const selectDraggedNoteId = (state: NoteState): string | null => {
  return state.dragState.draggedNoteId;
};

/**
 * 选择最大层级
 */
export const selectMaxZIndex = (state: NoteState): number => {
  return state.maxZIndex;
};

/**
 * 选择AI生成状态
 */
export const selectAIGenerating = (state: NoteState, noteId: string): boolean => {
  return state.aiGenerating[noteId] || false;
};

/**
 * 选择AI流式数据
 */
export const selectAIStreamingData = (state: NoteState, noteId: string): string | undefined => {
  return state.aiStreamingData[noteId];
};

/**
 * 选择AI错误信息
 */
export const selectAIError = (state: NoteState, noteId: string): string | undefined => {
  return state.aiErrors[noteId];
};

/**
 * 选择是否有任何AI正在生成
 */
export const selectHasAnyAIGenerating = (state: NoteState): boolean => {
  return Object.values(state.aiGenerating).some(Boolean);
};

/**
 * 按颜色分组便签
 */
export const selectNotesByColor = (state: NoteState): Record<string, Note[]> => {
  return state.notes.reduce((acc, note) => {
    const color = note.color || 'default';
    if (!acc[color]) {
      acc[color] = [];
    }
    acc[color].push(note);
    return acc;
  }, {} as Record<string, Note[]>);
};

/**
 * 选择便签按更新时间排序（最新优先）
 */
export const selectNotesSortedByUpdateTime = (state: NoteState): Note[] => {
  return [...state.notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

/**
 * 选择便签按层级排序（顶层优先）
 */
export const selectNotesSortedByZIndex = (state: NoteState): Note[] => {
  return [...state.notes].sort((a, b) => b.zIndex - a.zIndex);
};
