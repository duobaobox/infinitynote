/**
 * 便签相关的命令实现
 */

import type {
  Command,
  OperationType,
  CreateNoteCommandData,
  DeleteNoteCommandData,
  MoveNoteCommandData,
  ResizeNoteCommandData,
  UpdateNoteCommandData,
  BatchMoveNotesCommandData,
  BatchDeleteNotesCommandData,
} from "../types/history";
import type { Position } from "../types";
import { useNoteStore } from "../store/noteStore";

/**
 * 创建便签命令
 */
export class CreateNoteCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: CreateNoteCommandData;

  constructor(data: CreateNoteCommandData) {
    this.type = "CREATE_NOTE" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `创建便签: ${data.note.title}`;
  }

  async execute(): Promise<void> {
    // 命令已在创建时执行，这里不需要重复执行
    // 如果需要重做，则调用 store 的创建方法
  }

  async undo(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.deleteNote(this.data.note.id);
  }
}

/**
 * 删除便签命令
 */
export class DeleteNoteCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: DeleteNoteCommandData;

  constructor(data: DeleteNoteCommandData) {
    this.type = "DELETE_NOTE" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `删除便签: ${data.note.title}`;
  }

  async execute(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.deleteNote(this.data.note.id);
  }

  async undo(): Promise<void> {
    // 恢复被删除的便签（通过重新创建）
    const noteStore = useNoteStore.getState();
    const { note } = this.data;

    // 使用原始数据重新创建便签
    await noteStore.createNote(note.canvasId, note.position, note.color);

    // 注意：由于数据库约束，无法完全恢复原ID
    // 新创建的便签会有新的ID，但其他属性会保持一致
  }
}

/**
 * 移动便签命令
 */
export class MoveNoteCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: MoveNoteCommandData;

  constructor(data: MoveNoteCommandData) {
    this.type = "MOVE_NOTE" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `移动便签`;
  }

  async execute(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.moveNote(this.data.noteId, this.data.newPosition);
  }

  async undo(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.moveNote(this.data.noteId, this.data.oldPosition);
  }

  // 支持与相同便签的移动命令合并
  canMergeWith(other: Command): boolean {
    if (other.type !== "MOVE_NOTE") return false;
    const otherData = (other as MoveNoteCommand).data;
    return this.data.noteId === otherData.noteId;
  }

  mergeWith(other: Command): Command {
    const otherData = (other as MoveNoteCommand).data;
    return new MoveNoteCommand({
      noteId: this.data.noteId,
      oldPosition: otherData.oldPosition, // 保持最初的位置
      newPosition: this.data.newPosition, // 使用最新的位置
    });
  }
}

/**
 * 调整便签大小命令
 */
export class ResizeNoteCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: ResizeNoteCommandData;

  constructor(data: ResizeNoteCommandData) {
    this.type = "RESIZE_NOTE" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `调整便签大小`;
  }

  async execute(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.resizeNote(this.data.noteId, this.data.newSize);
  }

  async undo(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.resizeNote(this.data.noteId, this.data.oldSize);
  }

  // 支持与相同便签的调整大小命令合并
  canMergeWith(other: Command): boolean {
    if (other.type !== "RESIZE_NOTE") return false;
    const otherData = (other as ResizeNoteCommand).data;
    return this.data.noteId === otherData.noteId;
  }

  mergeWith(other: Command): Command {
    const otherData = (other as ResizeNoteCommand).data;
    return new ResizeNoteCommand({
      noteId: this.data.noteId,
      oldSize: otherData.oldSize, // 保持最初的大小
      newSize: this.data.newSize, // 使用最新的大小
    });
  }
}

/**
 * 更新便签命令（用于内容、颜色等属性变更）
 */
export class UpdateNoteCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: UpdateNoteCommandData;

  constructor(data: UpdateNoteCommandData) {
    this.type = "UPDATE_NOTE" as OperationType;
    this.data = data;
    this.timestamp = Date.now();

    // 根据更新的字段生成描述
    const fields = Object.keys(data.newData);
    this.description = `更新便签: ${fields.join(", ")}`;
  }

  async execute(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.updateNote(this.data.noteId, this.data.newData);
  }

  async undo(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.updateNote(this.data.noteId, this.data.oldData);
  }
}

/**
 * 批量移动便签命令
 */
export class BatchMoveNotesCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: BatchMoveNotesCommandData;
  private originalPositions: Map<string, Position>;

  constructor(data: BatchMoveNotesCommandData) {
    this.type = "BATCH_MOVE_NOTES" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `批量移动 ${data.noteIds.length} 个便签`;
    this.originalPositions = new Map();

    // 保存原始位置
    const noteStore = useNoteStore.getState();
    data.noteIds.forEach((id) => {
      const note = noteStore.notes.find((n) => n.id === id);
      if (note) {
        this.originalPositions.set(id, { ...note.position });
      }
    });
  }

  async execute(): Promise<void> {
    const noteStore = useNoteStore.getState();
    await noteStore.moveNotes(this.data.noteIds, this.data.deltaPosition);
  }

  async undo(): Promise<void> {
    const noteStore = useNoteStore.getState();
    // 计算反向的移动量
    const reverseDelta: Position = {
      x: -this.data.deltaPosition.x,
      y: -this.data.deltaPosition.y,
    };
    await noteStore.moveNotes(this.data.noteIds, reverseDelta);
  }
}

/**
 * 批量删除便签命令
 */
export class BatchDeleteNotesCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: BatchDeleteNotesCommandData;

  constructor(data: BatchDeleteNotesCommandData) {
    this.type = "BATCH_DELETE_NOTES" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `批量删除 ${data.notes.length} 个便签`;
  }

  async execute(): Promise<void> {
    const noteStore = useNoteStore.getState();
    const noteIds = this.data.notes.map((n) => n.id);
    await noteStore.deleteNotes(noteIds);
  }

  async undo(): Promise<void> {
    // 恢复所有被删除的便签
    const noteStore = useNoteStore.getState();

    for (const note of this.data.notes) {
      await noteStore.createNote(note.canvasId, note.position, note.color);

      // 注意：由于数据库约束，无法完全恢复原ID
      // 新创建的便签会有新的ID，但其他属性会保持一致
    }
  }
}
