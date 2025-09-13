import Dexie, { type Table } from "dexie";
import type { Note } from "../types";

export interface NoteDB extends Omit<Note, "id"> {
  id?: number;
}

class InfinityNoteDatabase extends Dexie {
  notes!: Table<NoteDB>;

  constructor() {
    super("InfinityNoteDatabase");
    this.version(1).stores({
      notes:
        "++id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height",
    });
  }
}

export const db = new InfinityNoteDatabase();

/**
 * 数据库操作方法
 * 包含完整的错误处理和日志记录
 */
export const dbOperations = {
  // 添加便签
  async addNote(note: Omit<NoteDB, "id">): Promise<number> {
    try {
      const id = await db.notes.add(note);
      console.log(`✅ Note added successfully with ID: ${id}`);
      return id;
    } catch (error) {
      console.error("❌ Failed to add note:", error);
      throw new Error(
        `添加便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 更新便签
  async updateNote(id: number, changes: Partial<NoteDB>): Promise<number> {
    try {
      const result = await db.notes.update(id, {
        ...changes,
        updatedAt: new Date(),
      });
      if (result === 0) {
        throw new Error(`便签 ID ${id} 不存在`);
      }
      console.log(`✅ Note updated successfully: ${id}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to update note ${id}:`, error);
      throw new Error(
        `更新便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 删除便签
  async deleteNote(id: number): Promise<void> {
    try {
      await db.notes.delete(id);
      console.log(`✅ Note deleted successfully: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to delete note ${id}:`, error);
      throw new Error(
        `删除便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 获取所有便签
  async getAllNotes(): Promise<NoteDB[]> {
    try {
      const notes = await db.notes.toArray();
      console.log(`✅ Retrieved ${notes.length} notes from database`);
      return notes;
    } catch (error) {
      console.error("❌ Failed to get all notes:", error);
      throw new Error(
        `获取便签列表失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },

  // 根据ID获取便签
  async getNoteById(id: number): Promise<NoteDB | undefined> {
    try {
      const note = await db.notes.get(id);
      if (note) {
        console.log(`✅ Note retrieved successfully: ${id}`);
      } else {
        console.warn(`⚠️ Note not found: ${id}`);
      }
      return note;
    } catch (error) {
      console.error(`❌ Failed to get note ${id}:`, error);
      throw new Error(
        `获取便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 清空所有便签
  async clearAllNotes(): Promise<void> {
    try {
      await db.notes.clear();
      console.log("✅ All notes cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear all notes:", error);
      throw new Error(
        `清空便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 批量操作：添加多个便签
  async addMultipleNotes(notes: Omit<NoteDB, "id">[]): Promise<number[]> {
    try {
      const ids = await db.notes.bulkAdd(notes, { allKeys: true });
      console.log(`✅ ${notes.length} notes added successfully`);
      return ids as number[];
    } catch (error) {
      console.error("❌ Failed to add multiple notes:", error);
      throw new Error(
        `批量添加便签失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },

  // 数据库健康检查
  async healthCheck(): Promise<boolean> {
    try {
      await db.notes.count();
      return true;
    } catch (error) {
      console.error("❌ Database health check failed:", error);
      return false;
    }
  },

  // 获取数据库统计信息
  async getStats(): Promise<{
    totalNotes: number;
    databaseSize: number;
    lastModified: Date | null;
  }> {
    try {
      const totalNotes = await db.notes.count();
      const allNotes = await db.notes.toArray();
      const lastModified =
        allNotes.length > 0
          ? new Date(
              Math.max(...allNotes.map((note) => note.updatedAt.getTime()))
            )
          : null;

      // 估算数据库大小（字节）
      const databaseSize = JSON.stringify(allNotes).length;

      return {
        totalNotes,
        databaseSize,
        lastModified,
      };
    } catch (error) {
      console.error("❌ Failed to get database stats:", error);
      throw new Error(
        `获取数据库统计失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },
};
