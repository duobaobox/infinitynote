/**
 * 历史记录助手
 * 提供便捷的方法来创建和执行命令
 */

import { useHistoryStore } from "../store/historyStore";
import type { Command } from "../types/history";
import type { Note, Canvas, Position, Size } from "../types";
import {
  CreateNoteCommand,
  DeleteNoteCommand,
  MoveNoteCommand,
  ResizeNoteCommand,
  UpdateNoteCommand,
  BatchMoveNotesCommand,
  BatchDeleteNotesCommand,
  CreateCanvasCommand,
  DeleteCanvasCommand,
  SwitchCanvasCommand,
  ZoomCanvasCommand,
  PanCanvasCommand,
} from "../commands";

/**
 * 历史记录助手类
 */
export class HistoryHelper {
  /**
   * 记录便签创建操作
   */
  static recordNoteCreation(note: Note): void {
    const command = new CreateNoteCommand({ note });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录便签删除操作
   */
  static recordNoteDeletion(note: Note): void {
    const command = new DeleteNoteCommand({ note });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录便签移动操作
   */
  static recordNoteMove(
    noteId: string,
    oldPosition: Position,
    newPosition: Position
  ): void {
    const command = new MoveNoteCommand({ noteId, oldPosition, newPosition });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录便签调整大小操作
   */
  static recordNoteResize(noteId: string, oldSize: Size, newSize: Size): void {
    const command = new ResizeNoteCommand({ noteId, oldSize, newSize });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录便签更新操作
   */
  static recordNoteUpdate(
    noteId: string,
    oldData: Partial<Note>,
    newData: Partial<Note>
  ): void {
    const command = new UpdateNoteCommand({ noteId, oldData, newData });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录批量移动便签操作
   */
  static recordBatchNotesMove(
    noteIds: string[],
    deltaPosition: Position
  ): void {
    const command = new BatchMoveNotesCommand({ noteIds, deltaPosition });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录批量删除便签操作
   */
  static recordBatchNotesDeletion(notes: Note[]): void {
    const command = new BatchDeleteNotesCommand({ notes });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录画布创建操作
   */
  static recordCanvasCreation(canvas: Canvas): void {
    const command = new CreateCanvasCommand({ canvas });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录画布删除操作
   */
  static recordCanvasDeletion(canvas: Canvas, associatedNotes: Note[]): void {
    const command = new DeleteCanvasCommand({ canvas, associatedNotes });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录画布切换操作
   */
  static recordCanvasSwitch(
    fromCanvasId: string | null,
    toCanvasId: string
  ): void {
    const command = new SwitchCanvasCommand({ fromCanvasId, toCanvasId });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录画布缩放操作
   */
  static recordCanvasZoom(
    canvasId: string,
    oldScale: number,
    newScale: number,
    oldOffset: Position,
    newOffset: Position
  ): void {
    const command = new ZoomCanvasCommand({
      canvasId,
      oldScale,
      newScale,
      oldOffset,
      newOffset,
    });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 记录画布平移操作
   */
  static recordCanvasPan(
    canvasId: string,
    oldOffset: Position,
    newOffset: Position
  ): void {
    const command = new PanCanvasCommand({ canvasId, oldOffset, newOffset });
    // 不执行，因为操作已经完成
    this.addToHistory(command);
  }

  /**
   * 将命令添加到历史记录（不执行）
   */
  private static addToHistory(command: Command): void {
    const historyStore = useHistoryStore.getState();

    // 直接添加到历史栈，不执行命令
    historyStore.recordCommand(command);
  }

  /**
   * 执行撤销操作
   */
  static async undo(): Promise<void> {
    const historyStore = useHistoryStore.getState();
    await historyStore.undo();
  }

  /**
   * 执行重做操作
   */
  static async redo(): Promise<void> {
    const historyStore = useHistoryStore.getState();
    await historyStore.redo();
  }

  /**
   * 检查是否可以撤销
   */
  static canUndo(): boolean {
    return useHistoryStore.getState().canUndo;
  }

  /**
   * 检查是否可以重做
   */
  static canRedo(): boolean {
    return useHistoryStore.getState().canRedo;
  }

  /**
   * 清空历史记录
   */
  static clear(): void {
    const historyStore = useHistoryStore.getState();
    historyStore.clear();
  }
}
