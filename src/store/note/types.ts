/**
 * Note Store 类型定义
 * 集中管理所有便签相关的类型
 */

import type { Note, Position, Size, DragState } from '../../types';
import type { AICustomProperties } from '../../types/ai';
import type { OrganizeConfig } from '../../utils/noteOrganizer';

/**
 * 便签状态接口
 */
export interface NoteState {
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
 * 便签基础操作接口
 */
export interface NoteBaseActions {
  /** 创建便签 */
  createNote: (
    canvasId: string,
    position: Position,
    color?: string
  ) => Promise<string>;
  /** 更新便签 */
  updateNote: (
    id: string,
    updates: Partial<Omit<Note, 'id' | 'createdAt'>>
  ) => Promise<void>;
  /** 删除便签 */
  deleteNote: (id: string) => Promise<void>;
  /** 删除多个便签 */
  deleteNotes: (ids: string[]) => Promise<void>;
  /** 从数据库加载所有便签 */
  loadNotesFromDB: () => Promise<void>;
  /** 初始化数据 */
  initialize: () => Promise<void>;
}

/**
 * 便签位置/尺寸操作接口
 */
export interface NotePositionActions {
  /** 移动便签位置 */
  moveNote: (id: string, position: Position) => Promise<void>;
  /** 调整便签大小 */
  resizeNote: (id: string, size: Size) => Promise<void>;
  /** 批量移动便签 */
  moveNotes: (noteIds: string[], deltaPosition: Position) => Promise<void>;
}

/**
 * 便签层级操作接口
 */
export interface NoteZIndexActions {
  /** 设置便签层级 */
  setNoteZIndex: (id: string, zIndex: number) => Promise<void>;
  /** 重平衡所有便签的 zIndex */
  rebalanceZIndexes: () => Promise<void>;
  /** 将便签置顶 */
  bringToFront: (id: string) => Promise<void>;
  /** 带防抖的置顶方法 */
  debouncedBringToFront: (id: string, delay?: number) => void;
  
  // 层级管理常量
  readonly LAYER_STEP: number;
  readonly MAX_Z_INDEX: number;
  readonly MIN_Z_INDEX: number;
  readonly _debouncedBringToFrontMap: Map<string, number>;
}

/**
 * 便签选择操作接口
 */
export interface NoteSelectionActions {
  /** 选中便签 */
  selectNote: (id: string, multi?: boolean) => void;
  /** 取消选中便签 */
  deselectNote: (id: string) => void;
  /** 清空选中 */
  clearSelection: () => void;
  /** 选中多个便签 */
  selectMultiple: (ids: string[]) => void;
}

/**
 * 便签拖拽操作接口
 */
export interface NoteDragActions {
  /** 开始拖拽 */
  startDrag: (noteId: string, startPosition: Position) => void;
  /** 更新拖拽位置 */
  updateDragPosition: (position: Position) => void;
  /** 结束拖拽 */
  endDrag: () => void;
}

/**
 * 便签查询接口
 */
export interface NoteQueryActions {
  /** 根据画布ID获取便签 */
  getNotesByCanvas: (canvasId: string) => Note[];
  /** 获取最大支持的便签数量 */
  getMaxSupportedNotes: () => number;
  /** 检查便签数量限制 */
  checkNoteCountLimit: () => void;
}

/**
 * AI 相关操作接口
 */
export interface NoteAIActions {
  /** 开始AI生成 */
  startAIGeneration: (noteId: string, prompt: string) => Promise<void>;
  /** 更新流式生成内容 */
  updateAIStreamingContent: (
    noteId: string,
    content: string,
    aiData?: AICustomProperties['ai']
  ) => void;
  /** 完成AI生成 */
  completeAIGeneration: (
    noteId: string,
    finalContent: string,
    aiData: AICustomProperties['ai']
  ) => Promise<void>;
  /** 取消AI生成 */
  cancelAIGeneration: (noteId: string) => void;
  /** 切换思维链显示 */
  toggleThinkingChain: (noteId: string) => Promise<void>;
  /** 保存AI生成的便签 */
  saveAINote: (
    noteData: Partial<Note>,
    aiData: AICustomProperties['ai']
  ) => Promise<string>;
  /** 从提示词生成便签 */
  createAINoteFromPrompt: (
    canvasId: string,
    prompt: string,
    position?: Position
  ) => Promise<string>;
}

/**
 * 便签整理操作接口
 */
export interface NoteOrganizeActions {
  /** 整理当前画布的便签 */
  organizeCurrentCanvasNotes: (
    canvasId: string,
    config?: Partial<OrganizeConfig>
  ) => Promise<void>;
  /** 检查便签是否需要整理 */
  checkNeedsOrganization: (canvasId: string) => boolean;
}

/**
 * 完整的便签操作接口
 */
export type NoteActions = 
  NoteBaseActions & 
  NotePositionActions & 
  NoteZIndexActions & 
  NoteSelectionActions & 
  NoteDragActions & 
  NoteQueryActions & 
  NoteAIActions & 
  NoteOrganizeActions;

/**
 * 完整的 NoteStore 类型
 */
export type NoteStore = NoteState & NoteActions;

/**
 * 初始状态
 */
export const initialNoteState: NoteState = {
  notes: [],
  selectedNoteIds: [],
  dragState: {
    isDragging: false,
    draggedNoteId: null,
    dragStartPosition: null,
    currentDragPosition: null,
  },
  maxZIndex: 0,
  aiGenerating: {},
  aiStreamingData: {},
  aiErrors: {},
};
