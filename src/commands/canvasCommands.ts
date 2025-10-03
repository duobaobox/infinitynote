/**
 * 画布相关的命令实现
 */

import type {
  Command,
  OperationType,
  CreateCanvasCommandData,
  DeleteCanvasCommandData,
  SwitchCanvasCommandData,
  ZoomCanvasCommandData,
  PanCanvasCommandData,
} from "../types/history";
import { useCanvasStore } from "../store/canvasStore";
import { useNoteStore } from "../store/noteStore";

/**
 * 创建画布命令
 */
export class CreateCanvasCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: CreateCanvasCommandData;

  constructor(data: CreateCanvasCommandData) {
    this.type = "CREATE_CANVAS" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `创建画布: ${data.canvas.name}`;
  }

  async execute(): Promise<void> {
    // 命令已在创建时执行，这里不需要重复执行
  }

  async undo(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    await canvasStore.deleteCanvas(this.data.canvas.id);
  }
}

/**
 * 删除画布命令
 */
export class DeleteCanvasCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: DeleteCanvasCommandData;

  constructor(data: DeleteCanvasCommandData) {
    this.type = "DELETE_CANVAS" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `删除画布: ${data.canvas.name}`;
  }

  async execute(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    await canvasStore.deleteCanvas(this.data.canvas.id);
  }

  async undo(): Promise<void> {
    // 恢复被删除的画布和相关便签
    const canvasStore = useCanvasStore.getState();
    const { canvas, associatedNotes } = this.data;

    // 重新创建画布
    await canvasStore.createCanvas(canvas.name);

    // 恢复关联的便签
    const noteStore = useNoteStore.getState();
    for (const note of associatedNotes) {
      await noteStore.createNote(canvas.id, note.position, note.color);
    }
  }
}

/**
 * 切换画布命令
 */
export class SwitchCanvasCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: SwitchCanvasCommandData;

  constructor(data: SwitchCanvasCommandData) {
    this.type = "SWITCH_CANVAS" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `切换画布`;
  }

  async execute(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    canvasStore.setActiveCanvas(this.data.toCanvasId);
  }

  async undo(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    if (this.data.fromCanvasId) {
      canvasStore.setActiveCanvas(this.data.fromCanvasId);
    }
  }
}

/**
 * 画布缩放命令
 */
export class ZoomCanvasCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: ZoomCanvasCommandData;

  constructor(data: ZoomCanvasCommandData) {
    this.type = "ZOOM_CANVAS" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `缩放画布: ${(data.newScale * 100).toFixed(0)}%`;
  }

  async execute(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    canvasStore.setScale(this.data.newScale);
    canvasStore.setOffset(this.data.newOffset);
  }

  async undo(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    canvasStore.setScale(this.data.oldScale);
    canvasStore.setOffset(this.data.oldOffset);
  }

  // 支持与相同画布的缩放命令合并
  canMergeWith(other: Command): boolean {
    if (other.type !== "ZOOM_CANVAS") return false;
    const otherData = (other as ZoomCanvasCommand).data;
    return this.data.canvasId === otherData.canvasId;
  }

  mergeWith(other: Command): Command {
    const otherData = (other as ZoomCanvasCommand).data;
    return new ZoomCanvasCommand({
      canvasId: this.data.canvasId,
      oldScale: otherData.oldScale, // 保持最初的缩放
      newScale: this.data.newScale, // 使用最新的缩放
      oldOffset: otherData.oldOffset, // 保持最初的偏移
      newOffset: this.data.newOffset, // 使用最新的偏移
    });
  }
}

/**
 * 画布平移命令
 */
export class PanCanvasCommand implements Command {
  type: OperationType;
  description: string;
  timestamp: number;
  private data: PanCanvasCommandData;

  constructor(data: PanCanvasCommandData) {
    this.type = "PAN_CANVAS" as OperationType;
    this.data = data;
    this.timestamp = Date.now();
    this.description = `平移画布`;
  }

  async execute(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    canvasStore.setOffset(this.data.newOffset);
  }

  async undo(): Promise<void> {
    const canvasStore = useCanvasStore.getState();
    canvasStore.setOffset(this.data.oldOffset);
  }

  // 支持与相同画布的平移命令合并
  canMergeWith(other: Command): boolean {
    if (other.type !== "PAN_CANVAS") return false;
    const otherData = (other as PanCanvasCommand).data;
    return this.data.canvasId === otherData.canvasId;
  }

  mergeWith(other: Command): Command {
    const otherData = (other as PanCanvasCommand).data;
    return new PanCanvasCommand({
      canvasId: this.data.canvasId,
      oldOffset: otherData.oldOffset, // 保持最初的偏移
      newOffset: this.data.newOffset, // 使用最新的偏移
    });
  }
}
