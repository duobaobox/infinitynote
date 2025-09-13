import Dexie, { type Table } from "dexie";
import type { Note, Canvas } from "../types";

// 日志去重机制
const loggedMessages = new Set<string>();
const logWithDedup = (message: string, ...args: any[]) => {
  const key = `${message}_${JSON.stringify(args)}`;
  if (!loggedMessages.has(key)) {
    loggedMessages.add(key);
    console.log(message, ...args);
    // 5秒后清除记录，允许重新打印
    setTimeout(() => loggedMessages.delete(key), 5000);
  }
};

export interface NoteDB extends Note {
  // 使用完整的 Note 接口，包括 id 字段
}

export interface CanvasDB extends Canvas {
  // 使用完整的 Canvas 接口，包括 id 字段
}

class InfinityNoteDatabase extends Dexie {
  notes!: Table<NoteDB>;
  canvases!: Table<CanvasDB>;

  constructor() {
    super("InfinityNoteDatabase");

    // 版本1：基础字段，使用字符串ID作为主键
    this.version(1).stores({
      notes:
        "id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height",
      canvases:
        "id, name, scale, backgroundColor, createdAt, updatedAt, isDefault, offset.x, offset.y",
    });

    // 暂时注释版本2，避免数据库升级问题
    // 当需要新字段时再启用
    /*
    this.version(2)
      .stores({
        notes:
          "++id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height, tags, priority, reminderAt, isPinned, isArchived, isFavorite, contentType, permission, templateId, parentNoteId, lastAccessedAt, version, isDeleted, deletedAt",
      })
      .upgrade((tx) => {
        // 数据迁移：为现有便签添加默认值
        return tx
          .table("notes")
          .toCollection()
          .modify((note) => {
            // 添加新字段的默认值
            if (note.tags === undefined) note.tags = [];
            if (note.priority === undefined) note.priority = 2; // 默认中等优先级
            if (note.isPinned === undefined) note.isPinned = false;
            if (note.isArchived === undefined) note.isArchived = false;
            if (note.isFavorite === undefined) note.isFavorite = false;
            if (note.contentType === undefined) note.contentType = "text";
            if (note.permission === undefined) note.permission = "private";
            if (note.version === undefined) note.version = 1;
            if (note.isDeleted === undefined) note.isDeleted = false;
            if (note.lastAccessedAt === undefined)
              note.lastAccessedAt = note.updatedAt;
          });
      });
    */
  }
}

export const db = new InfinityNoteDatabase();

/**
 * 数据库操作方法
 * 包含完整的错误处理和日志记录
 */
export const dbOperations = {
  // 添加便签
  async addNote(note: NoteDB): Promise<string> {
    try {
      await db.notes.add(note);
      console.log(`✅ Note added successfully with ID: ${note.id}`);
      return note.id;
    } catch (error) {
      console.error("❌ Failed to add note:", error);
      throw new Error(
        `添加便签失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 更新便签
  async updateNote(id: string, changes: Partial<NoteDB>): Promise<number> {
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
  async deleteNote(id: string): Promise<void> {
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
      if (notes.length > 0) {
        logWithDedup(
          `📋 从数据库加载 ${notes.length} 个便签:`,
          notes.map((note) => ({
            id: note.id.slice(-8),
            title: note.title,
            canvasId: note.canvasId.slice(-8),
          }))
        );
      }
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
  async getNoteById(id: string): Promise<NoteDB | undefined> {
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
      await db.canvases.count();
      // 移除健康检查的成功日志，减少噪音
      return true;
    } catch (error) {
      console.error("❌ Database health check failed:", error);
      return false;
    }
  },

  // 获取数据库统计信息
  async getStats(): Promise<{
    totalNotes: number;
    totalCanvases: number;
    databaseSize: number;
    lastModified: Date | null;
  }> {
    try {
      const totalNotes = await db.notes.count();
      const totalCanvases = await db.canvases.count();
      const allNotes = await db.notes.toArray();
      const allCanvases = await db.canvases.toArray();

      const noteLastModified =
        allNotes.length > 0
          ? Math.max(...allNotes.map((note) => note.updatedAt.getTime()))
          : 0;

      const canvasLastModified =
        allCanvases.length > 0
          ? Math.max(...allCanvases.map((canvas) => canvas.updatedAt.getTime()))
          : 0;

      const lastModified =
        Math.max(noteLastModified, canvasLastModified) > 0
          ? new Date(Math.max(noteLastModified, canvasLastModified))
          : null;

      // 估算数据库大小（字节）
      const databaseSize =
        JSON.stringify(allNotes).length + JSON.stringify(allCanvases).length;

      return {
        totalNotes,
        totalCanvases,
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

  // ==================== 画布操作方法 ====================

  // 添加画布
  async addCanvas(canvas: CanvasDB): Promise<string> {
    try {
      await db.canvases.add(canvas);
      console.log(`✅ Canvas added successfully with ID: ${canvas.id}`);
      return canvas.id;
    } catch (error) {
      console.error("❌ Failed to add canvas:", error);
      throw new Error(
        `添加画布失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 更新画布
  async updateCanvas(id: string, changes: Partial<CanvasDB>): Promise<number> {
    try {
      const result = await db.canvases.update(id, {
        ...changes,
        updatedAt: new Date(),
      });
      if (result === 0) {
        throw new Error(`画布 ID ${id} 不存在`);
      }
      console.log(`✅ Canvas updated successfully: ${id}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to update canvas ${id}:`, error);
      throw new Error(
        `更新画布失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 删除画布
  async deleteCanvas(id: string): Promise<void> {
    try {
      await db.canvases.delete(id);
      console.log(`✅ Canvas deleted successfully: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to delete canvas ${id}:`, error);
      throw new Error(
        `删除画布失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 获取所有画布
  async getAllCanvases(): Promise<CanvasDB[]> {
    try {
      const canvases = await db.canvases.toArray();
      if (canvases.length > 0) {
        logWithDedup(
          `🎨 从数据库加载 ${canvases.length} 个画布:`,
          canvases.map((canvas) => ({
            id: canvas.id.slice(-8),
            name: canvas.name,
            isDefault: canvas.isDefault,
          }))
        );
      }
      return canvases;
    } catch (error) {
      console.error("❌ Failed to get all canvases:", error);
      throw new Error(
        `获取画布列表失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },

  // 根据ID获取画布
  async getCanvasById(id: string): Promise<CanvasDB | undefined> {
    try {
      const canvas = await db.canvases.get(id);
      if (canvas) {
        console.log(`✅ Canvas retrieved successfully: ${id}`);
      } else {
        console.warn(`⚠️ Canvas not found: ${id}`);
      }
      return canvas;
    } catch (error) {
      console.error(`❌ Failed to get canvas ${id}:`, error);
      throw new Error(
        `获取画布失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 获取默认画布
  async getDefaultCanvas(): Promise<CanvasDB | undefined> {
    try {
      const defaultCanvas = await db.canvases
        .where("isDefault")
        .equals(true)
        .first();
      if (defaultCanvas) {
        console.log(`✅ Default canvas found: ${defaultCanvas.id}`);
      } else {
        console.warn("⚠️ No default canvas found");
      }
      return defaultCanvas;
    } catch (error) {
      console.error("❌ Failed to get default canvas:", error);
      throw new Error(
        `获取默认画布失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },

  // 设置默认画布
  async setDefaultCanvas(id: string): Promise<void> {
    try {
      // 先清除所有画布的默认标记
      await db.canvases.toCollection().modify({ isDefault: false });

      // 设置指定画布为默认
      const result = await db.canvases.update(id, {
        isDefault: true,
        updatedAt: new Date(),
      });

      if (result === 0) {
        throw new Error(`画布 ID ${id} 不存在`);
      }

      console.log(`✅ Default canvas set to: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to set default canvas ${id}:`, error);
      throw new Error(
        `设置默认画布失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },

  // 清空所有画布
  async clearAllCanvases(): Promise<void> {
    try {
      await db.canvases.clear();
      console.log("✅ All canvases cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear canvases:", error);
      throw new Error(
        `清空画布失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },
};
