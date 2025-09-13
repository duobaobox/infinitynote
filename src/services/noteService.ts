import type { Note } from "../types";
import { dbOperations } from "../utils/db";

export class NoteService {
  // 创建新便签
  static async createNote(
    noteData: Omit<Note, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const now = new Date();
    const id = await dbOperations.addNote({
      ...noteData,
      createdAt: now,
      updatedAt: now,
    });
    return id.toString();
  }

  // 获取所有便签
  static async getAllNotes(): Promise<Note[]> {
    const dbNotes = await dbOperations.getAllNotes();
    return dbNotes.map((note) => ({
      id: note.id?.toString() || "",
      title: note.title,
      content: note.content,
      color: note.color,
      position: note.position,
      size: note.size,
      zIndex: note.zIndex,
      canvasId: note.canvasId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  }

  // 根据画布ID获取便签
  static async getNotesByCanvasId(canvasId: string): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.filter((note) => note.canvasId === canvasId);
  }

  // 更新便签
  static async updateNote(
    id: string,
    changes: Partial<Omit<Note, "id" | "createdAt">>
  ): Promise<void> {
    await dbOperations.updateNote(parseInt(id), {
      ...changes,
      updatedAt: new Date(),
    });
  }

  // 删除便签
  static async deleteNote(id: string): Promise<void> {
    await dbOperations.deleteNote(parseInt(id));
  }

  // 批量删除便签
  static async deleteNotes(ids: string[]): Promise<void> {
    for (const id of ids) {
      await dbOperations.deleteNote(parseInt(id));
    }
  }

  // 复制便签
  static async duplicateNote(
    id: string,
    offset: { x: number; y: number } = { x: 10, y: 10 }
  ): Promise<string> {
    const note = await dbOperations.getNoteById(parseInt(id));
    if (!note) {
      throw new Error("便签不存在");
    }

    return this.createNote({
      title: note.title + " (副本)",
      content: note.content,
      color: note.color,
      position: {
        x: note.position.x + offset.x,
        y: note.position.y + offset.y,
      },
      size: note.size,
      zIndex: note.zIndex + 1,
      canvasId: note.canvasId,
    });
  }

  // 获取便签统计信息
  static async getNotesStats(): Promise<{
    total: number;
    byCanvas: Record<string, number>;
    byColor: Record<string, number>;
    recentlyCreated: number;
    recentlyUpdated: number;
  }> {
    const notes = await this.getAllNotes();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const byCanvas: Record<string, number> = {};
    const byColor: Record<string, number> = {};

    notes.forEach((note) => {
      // 按画布统计
      byCanvas[note.canvasId] = (byCanvas[note.canvasId] || 0) + 1;

      // 按颜色统计
      byColor[note.color] = (byColor[note.color] || 0) + 1;
    });

    return {
      total: notes.length,
      byCanvas,
      byColor,
      recentlyCreated: notes.filter((note) => note.createdAt > oneDayAgo)
        .length,
      recentlyUpdated: notes.filter((note) => note.updatedAt > oneDayAgo)
        .length,
    };
  }

  // 搜索便签
  static async searchNotes(query: string): Promise<Note[]> {
    const notes = await this.getAllNotes();
    const lowercaseQuery = query.toLowerCase();

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery)
    );
  }

  // 获取最近修改的便签
  static async getRecentNotes(limit: number = 10): Promise<Note[]> {
    const notes = await this.getAllNotes();
    return notes
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }
}
