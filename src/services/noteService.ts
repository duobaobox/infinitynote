import type { Note } from "../types";
import { dbOperations } from "../utils/db";

/**
 * 便签服务层
 *
 * 职责：
 * - 提供便签CRUD操作的高级接口
 * - 处理业务逻辑和数据转换
 * - 统一错误处理和日志记录
 * - 确保数据类型一致性
 */
export class NoteService {
  /**
   * 创建新便签
   * @param noteData 便签数据（不包含id、创建时间、更新时间）
   * @returns 新创建便签的ID
   */
  static async createNote(
    noteData: Omit<Note, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const now = new Date();
      const noteWithTimestamps = {
        ...noteData,
        createdAt: now,
        updatedAt: now,
      };

      const id = await dbOperations.addNote(noteWithTimestamps);
      return id; // 数据库操作已经返回字符串ID，无需转换
    } catch (error) {
      console.error("❌ NoteService: 创建便签失败:", error);
      throw new Error(
        `创建便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 获取所有便签
   * @returns 便签列表
   */
  static async getAllNotes(): Promise<Note[]> {
    try {
      const dbNotes = await dbOperations.getAllNotes();
      return dbNotes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.color,
        position: note.position,
        size: note.size,
        zIndex: note.zIndex,
        canvasId: note.canvasId,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        // 添加可选字段的默认值
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
    } catch (error) {
      console.error("❌ NoteService: 获取便签列表失败:", error);
      throw new Error(
        `获取便签列表失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 根据画布ID获取便签
   * @param canvasId 画布ID
   * @returns 该画布上的便签列表
   */
  static async getNotesByCanvasId(canvasId: string): Promise<Note[]> {
    try {
      const allNotes = await this.getAllNotes();
      return allNotes.filter((note) => note.canvasId === canvasId);
    } catch (error) {
      console.error("❌ NoteService: 根据画布ID获取便签失败:", error);
      throw new Error(
        `获取画布便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 更新便签
   * @param id 便签ID
   * @param changes 要更新的字段
   */
  static async updateNote(
    id: string,
    changes: Partial<Omit<Note, "id" | "createdAt">>
  ): Promise<void> {
    try {
      const updatesWithTime = {
        ...changes,
        updatedAt: new Date(),
      };

      await dbOperations.updateNote(id, updatesWithTime); // 直接使用字符串ID
    } catch (error) {
      console.error("❌ NoteService: 更新便签失败:", error);
      throw new Error(
        `更新便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 删除便签
   * @param id 便签ID
   */
  static async deleteNote(id: string): Promise<void> {
    try {
      await dbOperations.deleteNote(id); // 直接使用字符串ID
    } catch (error) {
      console.error("❌ NoteService: 删除便签失败:", error);
      throw new Error(
        `删除便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 批量删除便签
   * @param ids 便签ID列表
   */
  static async deleteNotes(ids: string[]): Promise<void> {
    try {
      // 使用并发删除提高性能
      await Promise.all(ids.map(id => dbOperations.deleteNote(id)));
    } catch (error) {
      console.error("❌ NoteService: 批量删除便签失败:", error);
      throw new Error(
        `批量删除便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 根据ID获取单个便签
   * @param id 便签ID
   * @returns 便签对象或null
   */
  static async getNoteById(id: string): Promise<Note | null> {
    try {
      const dbNote = await dbOperations.getNoteById(id);
      if (!dbNote) {
        return null;
      }

      return {
        id: dbNote.id,
        title: dbNote.title,
        content: dbNote.content,
        color: dbNote.color,
        position: dbNote.position,
        size: dbNote.size,
        zIndex: dbNote.zIndex,
        canvasId: dbNote.canvasId,
        createdAt: dbNote.createdAt,
        updatedAt: dbNote.updatedAt,
        // 添加可选字段的默认值
        tags: dbNote.tags || [],
        priority: dbNote.priority || 2,
        isPinned: dbNote.isPinned || false,
        isArchived: dbNote.isArchived || false,
        isFavorite: dbNote.isFavorite || false,
        contentType: dbNote.contentType || "text",
        permission: dbNote.permission || "private",
        version: dbNote.version || 1,
        isDeleted: dbNote.isDeleted || false,
        lastAccessedAt: dbNote.lastAccessedAt || dbNote.updatedAt,
      };
    } catch (error) {
      console.error("❌ NoteService: 获取便签失败:", error);
      throw new Error(
        `获取便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }
}

  /**
   * 复制便签
   * @param id 便签ID
   * @param offset 偏移位置
   * @returns 新便签的ID
   */
  static async duplicateNote(
    id: string,
    offset: { x: number; y: number } = { x: 10, y: 10 }
  ): Promise<string> {
    try {
      const note = await dbOperations.getNoteById(id); // 直接使用字符串ID
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
    } catch (error) {
      console.error("❌ NoteService: 复制便签失败:", error);
      throw new Error(
        `复制便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
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
