/**
 * Note Store 工具函数
 */

import type { Note } from '../../types';
import { LOG_DEDUP_TIMEOUT } from './constants';

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 日志去重机制
 */
const loggedMessages = new Set<string>();

export const logWithDedup = (message: string, ...args: unknown[]): void => {
  const key = `${message}_${JSON.stringify(args)}`;
  if (!loggedMessages.has(key)) {
    loggedMessages.add(key);
    console.warn(message, ...args);
    setTimeout(() => loggedMessages.delete(key), LOG_DEDUP_TIMEOUT);
  }
};

/**
 * 防抖保存便签状态的超时引用映射
 */
export const saveNoteTimeouts = new Map<string, number>();

/**
 * 流式更新的时间戳映射，用于节流控制
 */
export const streamingUpdateTimestamps = new Map<string, number>();

/**
 * 防抖置顶的超时引用映射
 */
export const debouncedBringToFrontMap = new Map<string, number>();

/**
 * 计算便签排序（按层级）
 */
export const sortNotesByZIndex = (notes: Note[]): Note[] => {
  return [...notes].sort((a, b) => a.zIndex - b.zIndex);
};

/**
 * 查找便签在列表中的索引
 */
export const findNoteIndex = (notes: Note[], noteId: string): number => {
  return notes.findIndex(note => note.id === noteId);
};

/**
 * 检查便签是否存在
 */
export const noteExists = (notes: Note[], noteId: string): boolean => {
  return notes.some(note => note.id === noteId);
};

/**
 * 过滤画布便签
 */
export const filterNotesByCanvas = (notes: Note[], canvasId: string): Note[] => {
  return notes.filter(note => note.canvasId === canvasId);
};

/**
 * 获取便签的最大层级
 */
export const getMaxZIndex = (notes: Note[]): number => {
  if (notes.length === 0) return 0;
  return Math.max(...notes.map(note => note.zIndex));
};

/**
 * 合并便签更新
 */
export const mergeNoteUpdates = (
  note: Note,
  updates: Partial<Omit<Note, 'id' | 'createdAt'>>
): Note => {
  return {
    ...note,
    ...updates,
    updatedAt: new Date(),
  };
};
