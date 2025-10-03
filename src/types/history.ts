/**
 * 历史记录和撤销重做系统类型定义
 */

import type { Note, Canvas, Position, Size } from "./index";

/**
 * 操作类型枚举
 */
export enum OperationType {
  // 便签操作
  CREATE_NOTE = "CREATE_NOTE",
  DELETE_NOTE = "DELETE_NOTE",
  UPDATE_NOTE = "UPDATE_NOTE",
  MOVE_NOTE = "MOVE_NOTE",
  RESIZE_NOTE = "RESIZE_NOTE",
  BATCH_MOVE_NOTES = "BATCH_MOVE_NOTES",
  BATCH_DELETE_NOTES = "BATCH_DELETE_NOTES",

  // 画布操作
  CREATE_CANVAS = "CREATE_CANVAS",
  DELETE_CANVAS = "DELETE_CANVAS",
  SWITCH_CANVAS = "SWITCH_CANVAS",
  ZOOM_CANVAS = "ZOOM_CANVAS",
  PAN_CANVAS = "PAN_CANVAS",
}

/**
 * 命令接口 - 所有可撤销操作必须实现此接口
 */
export interface Command {
  /** 命令类型 */
  type: OperationType;
  /** 命令描述（用于UI显示） */
  description: string;
  /** 执行命令 */
  execute(): Promise<void> | void;
  /** 撤销命令 */
  undo(): Promise<void> | void;
  /** 命令时间戳 */
  timestamp: number;
  /** 是否可以与其他命令合并 */
  canMergeWith?: (other: Command) => boolean;
  /** 合并命令 */
  mergeWith?: (other: Command) => Command;
}

/**
 * 便签创建命令数据
 */
export interface CreateNoteCommandData {
  note: Note;
}

/**
 * 便签删除命令数据
 */
export interface DeleteNoteCommandData {
  note: Note;
}

/**
 * 便签更新命令数据
 */
export interface UpdateNoteCommandData {
  noteId: string;
  oldData: Partial<Note>;
  newData: Partial<Note>;
}

/**
 * 便签移动命令数据
 */
export interface MoveNoteCommandData {
  noteId: string;
  oldPosition: Position;
  newPosition: Position;
}

/**
 * 便签调整大小命令数据
 */
export interface ResizeNoteCommandData {
  noteId: string;
  oldSize: Size;
  newSize: Size;
}

/**
 * 批量移动便签命令数据
 */
export interface BatchMoveNotesCommandData {
  noteIds: string[];
  deltaPosition: Position;
}

/**
 * 批量删除便签命令数据
 */
export interface BatchDeleteNotesCommandData {
  notes: Note[];
}

/**
 * 画布创建命令数据
 */
export interface CreateCanvasCommandData {
  canvas: Canvas;
}

/**
 * 画布删除命令数据
 */
export interface DeleteCanvasCommandData {
  canvas: Canvas;
  associatedNotes: Note[];
}

/**
 * 画布切换命令数据
 */
export interface SwitchCanvasCommandData {
  fromCanvasId: string | null;
  toCanvasId: string;
}

/**
 * 画布缩放命令数据
 */
export interface ZoomCanvasCommandData {
  canvasId: string;
  oldScale: number;
  newScale: number;
  oldOffset: Position;
  newOffset: Position;
}

/**
 * 画布平移命令数据
 */
export interface PanCanvasCommandData {
  canvasId: string;
  oldOffset: Position;
  newOffset: Position;
}

/**
 * 历史记录项
 */
export interface HistoryEntry {
  command: Command;
  timestamp: number;
}

/**
 * 历史记录状态
 */
export interface HistoryState {
  /** 撤销栈 */
  undoStack: Command[];
  /** 重做栈 */
  redoStack: Command[];
  /** 最大历史记录数 */
  maxHistorySize: number;
  /** 是否可以撤销 */
  canUndo: boolean;
  /** 是否可以重做 */
  canRedo: boolean;
  /** 当前历史记录索引 */
  currentIndex: number;
}

/**
 * 历史记录操作接口
 */
export interface HistoryActions {
  /** 执行命令并记录到历史 */
  executeCommand(command: Command): Promise<void>;
  /** 记录命令但不执行（用于已完成的操作） */
  recordCommand(command: Command): void;
  /** 撤销上一个操作 */
  undo(): Promise<void>;
  /** 重做下一个操作 */
  redo(): Promise<void>;
  /** 清空历史记录 */
  clear(): void;
  /** 获取可撤销操作列表（用于UI预览） */
  getUndoList(): Command[];
  /** 获取可重做操作列表（用于UI预览） */
  getRedoList(): Command[];
  /** 设置最大历史记录数 */
  setMaxHistorySize(size: number): void;
}

/**
 * 历史记录Store类型
 */
export interface HistoryStore extends HistoryState, HistoryActions {}
