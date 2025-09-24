import Dexie, { type Table } from "dexie";
import type { Note, Canvas } from "../types";
import { withErrorHandling } from "./errorHandler";

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

/**
 * 数据库便签接口
 * 确保与应用层Note接口完全一致，统一使用字符串ID
 */
export interface NoteDB extends Note {
  // 继承Note接口的所有字段，确保类型一致性
  id: string; // 明确指定ID为字符串类型
}

/**
 * 数据库画布接口
 * 确保与应用层Canvas接口完全一致，统一使用字符串ID
 */
export interface CanvasDB extends Canvas {
  // 继承Canvas接口的所有字段，确保类型一致性
  id: string; // 明确指定ID为字符串类型
}

/**
 * AI配置数据库接口
 */
export interface AIConfigDB {
  id: string; // 配置项唯一标识，如 'api_key_zhipu', 'ai_settings' 等
  type: "api_key" | "settings" | "other"; // 配置类型
  provider?: string; // AI提供商名称（仅对api_key类型有效）
  value: string; // 配置值（JSON字符串或加密字符串）
  encrypted: boolean; // 是否已加密
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI生成历史记录数据库接口
 */
export interface AIHistoryDB {
  id: string; // 历史记录唯一标识
  noteId?: string; // 关联的便签ID（可选，用于便签内AI生成）
  prompt: string; // 用户输入的提示词
  provider: string; // 使用的AI提供商
  model: string; // 使用的模型
  temperature: number; // 生成参数
  maxTokens: number; // 最大token数
  stream: boolean; // 是否使用流式输出
  generatedContent: string; // 生成的内容
  thinkingChain?: string; // 思维链内容（JSON字符串）
  status: "success" | "error" | "cancelled"; // 生成状态
  errorMessage?: string; // 错误信息（如果有）
  duration: number; // 生成耗时（毫秒）
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }; // token使用统计
  createdAt: Date; // 创建时间
}

class InfinityNoteDatabase extends Dexie {
  notes!: Table<NoteDB>;
  canvases!: Table<CanvasDB>;
  aiConfigs!: Table<AIConfigDB>;
  aiHistory!: Table<AIHistoryDB>;

  constructor() {
    super("InfinityNoteDatabase");

    // 版本1：基础字段，使用字符串ID作为主键
    this.version(1).stores({
      notes:
        "id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height",
      canvases:
        "id, name, scale, backgroundColor, createdAt, updatedAt, isDefault, offset.x, offset.y",
    });

    // 版本2：添加AI配置表
    this.version(2).stores({
      notes:
        "id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height",
      canvases:
        "id, name, scale, backgroundColor, createdAt, updatedAt, isDefault, offset.x, offset.y",
      aiConfigs: "id, type, provider, value, encrypted, createdAt, updatedAt",
    });

    // 版本3：添加扩展字段，包含customProperties
    this.version(3)
      .stores({
        notes:
          "id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height, tags, priority, reminderAt, isPinned, isArchived, isFavorite, contentType, permission, templateId, parentNoteId, lastAccessedAt, version, isDeleted, deletedAt, customProperties",
        canvases:
          "id, name, scale, backgroundColor, createdAt, updatedAt, isDefault, offset.x, offset.y",
        aiConfigs: "id, type, provider, value, encrypted, createdAt, updatedAt",
      })
      .upgrade((tx) => {
        console.log("🔄 升级数据库到版本3，添加扩展字段支持...");
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
            // 确保customProperties存在，这是存储AI数据的关键字段
            if (note.customProperties === undefined) note.customProperties = {};

            console.log(
              `✅ 便签 ${note.id.slice(-8)} 升级完成，包含AI数据支持`
            );
          });
      });

    // 版本4：添加AI生成历史记录表
    this.version(4).stores({
      notes:
        "id, title, content, color, zIndex, canvasId, createdAt, updatedAt, position.x, position.y, size.width, size.height, tags, priority, reminderAt, isPinned, isArchived, isFavorite, contentType, permission, templateId, parentNoteId, lastAccessedAt, version, isDeleted, deletedAt, customProperties",
      canvases:
        "id, name, scale, backgroundColor, createdAt, updatedAt, isDefault, offset.x, offset.y",
      aiConfigs: "id, type, provider, value, encrypted, createdAt, updatedAt",
      aiHistory:
        "id, noteId, prompt, provider, model, status, createdAt, duration",
    });
  }
}

export const db = new InfinityNoteDatabase();

// 数据库重连辅助函数
const ensureDbOpen = async (): Promise<void> => {
  if (!db.isOpen()) {
    console.log("🔄 数据库未打开，尝试重新打开...");
    await db.open();
  }
};

// 带重连机制的数据库操作包装器
const withDbRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    await ensureDbOpen();
    return await operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Need to reopen db")) {
      try {
        console.log("🔄 尝试重新打开数据库...");
        db.close();
        await db.open();
        return await operation();
      } catch (retryError) {
        console.error("❌ 重新打开数据库后仍然失败:", retryError);
        throw retryError;
      }
    }
    throw error;
  }
};

/**
 * 数据库操作方法
 * 包含完整的错误处理和日志记录
 */
export const dbOperations = {
  // 添加便签
  async addNote(note: NoteDB): Promise<string> {
    return await withErrorHandling(
      async () => {
        return await withDbRetry(async () => {
          await db.notes.add(note);
          console.log(`✅ Note added successfully with ID: ${note.id}`);
          return note.id;
        });
      },
      "addNote",
      { noteId: note.id, canvasId: note.canvasId }
    );
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
      // 去掉频繁的成功日志，避免控制台污染
      // console.log(`✅ Note updated successfully: ${id}`);
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
      const ids = await db.notes.bulkAdd(notes as any, { allKeys: true });
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
      return await withDbRetry(async () => {
        await db.notes.count();
        await db.canvases.count();
        // 移除健康检查的成功日志，减少噪音
        return true;
      });
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
      return await withDbRetry(async () => {
        await db.canvases.add(canvas);
        console.log(`✅ Canvas added successfully with ID: ${canvas.id}`);
        return canvas.id;
      });
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
      return await withDbRetry(async () => {
        const result = await db.canvases.update(id, {
          ...changes,
          updatedAt: new Date(),
        });
        if (result === 0) {
          throw new Error(`画布 ID ${id} 不存在`);
        }
        // 去掉频繁的成功日志，避免控制台污染
        // console.log(`✅ Canvas updated successfully: ${id}`);
        return result;
      });
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
      return await withDbRetry(async () => {
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
      });
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
        .equals(1 as any)
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

  // 清理重复的默认画布，确保只有一个默认画布
  async cleanupDefaultCanvases(): Promise<void> {
    try {
      const allCanvases = await db.canvases.toArray();
      const defaultCanvases = allCanvases.filter((canvas) => canvas.isDefault);
      const fixedIdCanvas = allCanvases.find(
        (canvas) => canvas.id === "canvas_default"
      );

      if (defaultCanvases.length > 1) {
        console.log(
          `🧹 发现 ${defaultCanvases.length} 个默认画布，开始清理...`
        );

        // 如果存在固定ID的默认画布，保留它，将其他的设为非默认
        if (fixedIdCanvas && fixedIdCanvas.isDefault) {
          for (const canvas of defaultCanvases) {
            if (canvas.id !== "canvas_default") {
              await db.canvases.update(canvas.id, { isDefault: false });
              console.log(`🧹 将画布 ${canvas.id.slice(-8)} 设为非默认`);
            }
          }
          console.log(`✅ 清理完成，保留固定ID默认画布: canvas_default`);
        } else {
          // 如果没有固定ID的默认画布，只保留最早创建的一个，其他设为非默认
          const sortedDefaults = defaultCanvases.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          // 保留第一个，其他的设为非默认
          for (let i = 1; i < sortedDefaults.length; i++) {
            await db.canvases.update(sortedDefaults[i].id, {
              isDefault: false,
            });
            console.log(
              `🧹 将画布 ${sortedDefaults[i].id.slice(-8)} 设为非默认`
            );
          }

          console.log(
            `✅ 清理完成，保留默认画布: ${sortedDefaults[0].id.slice(-8)}`
          );
        }
      } else if (defaultCanvases.length === 1) {
        // 如果只有一个默认画布，检查ID是否正确
        const singleDefault = defaultCanvases[0];
        if (singleDefault.id !== "canvas_default") {
          console.log(
            `🧹 发现默认画布ID不是固定ID: ${singleDefault.id.slice(-8)}`
          );
          // 不进行迁移，避免竞态条件，让初始化逻辑处理
        } else {
          console.log("✅ 默认画布ID正确");
        }
      } else {
        console.log("⚠️ 没有找到默认画布");
      }
    } catch (error) {
      console.error("❌ Failed to cleanup default canvases:", error);
      // 清理失败不抛出错误，避免阻止初始化
      console.warn("⚠️ 清理默认画布失败，继续初始化流程");
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

  // ==================== AI配置操作方法 ====================

  // 保存AI配置
  async saveAIConfig(config: AIConfigDB): Promise<void> {
    try {
      await withDbRetry(async () => {
        await db.aiConfigs.put(config);
        console.log(`✅ AI配置保存成功: ${config.id}`);
      });
    } catch (error) {
      console.error(`❌ 保存AI配置失败 ${config.id}:`, error);
      throw new Error(
        `保存AI配置失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 获取AI配置
  async getAIConfig(id: string): Promise<AIConfigDB | undefined> {
    try {
      return await withDbRetry(async () => {
        return await db.aiConfigs.get(id);
      });
    } catch (error) {
      console.error(`❌ 获取AI配置失败 ${id}:`, error);
      return undefined;
    }
  },

  // 获取所有AI配置
  async getAllAIConfigs(): Promise<AIConfigDB[]> {
    try {
      return await withDbRetry(async () => {
        return await db.aiConfigs.toArray();
      });
    } catch (error) {
      console.error("❌ 获取AI配置列表失败:", error);
      return [];
    }
  },

  // 删除AI配置
  async deleteAIConfig(id: string): Promise<void> {
    try {
      await withDbRetry(async () => {
        await db.aiConfigs.delete(id);
        console.log(`✅ AI配置删除成功: ${id}`);
      });
    } catch (error) {
      console.error(`❌ 删除AI配置失败 ${id}:`, error);
      throw new Error(
        `删除AI配置失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 清空所有AI配置
  async clearAllAIConfigs(): Promise<void> {
    try {
      await withDbRetry(async () => {
        await db.aiConfigs.clear();
        console.log("✅ 所有AI配置清空成功");
      });
    } catch (error) {
      console.error("❌ 清空AI配置失败:", error);
      throw new Error(
        `清空AI配置失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },

  // 从localStorage迁移AI配置到IndexedDB
  async migrateAIConfigsFromLocalStorage(): Promise<void> {
    try {
      console.log("🔄 开始从localStorage迁移AI配置到IndexedDB...");

      const configs: AIConfigDB[] = [];
      const now = new Date();

      // 迁移API密钥
      const providers = ["zhipu", "deepseek", "openai"];
      for (const provider of providers) {
        const key = localStorage.getItem(`ai_${provider}_api_key`);
        if (key) {
          configs.push({
            id: `api_key_${provider}`,
            type: "api_key",
            provider,
            value: key, // 已经是加密的
            encrypted: true,
            createdAt: now,
            updatedAt: now,
          });
          // 迁移后删除localStorage中的数据
          localStorage.removeItem(`ai_${provider}_api_key`);
          console.log(`✅ 迁移API密钥: ${provider}`);
        }
      }

      // 迁移AI设置
      const aiSettings = localStorage.getItem("ai_settings");
      if (aiSettings) {
        configs.push({
          id: "ai_settings",
          type: "settings",
          value: aiSettings,
          encrypted: false,
          createdAt: now,
          updatedAt: now,
        });
        // 迁移后删除localStorage中的数据
        localStorage.removeItem("ai_settings");
        console.log("✅ 迁移AI设置");
      }

      // 批量保存到IndexedDB
      if (configs.length > 0) {
        await withDbRetry(async () => {
          await db.aiConfigs.bulkPut(configs);
        });
        console.log(`✅ 成功迁移${configs.length}个AI配置到IndexedDB`);
      } else {
        console.log("📋 没有发现需要迁移的AI配置");
      }
    } catch (error) {
      console.error("❌ AI配置迁移失败:", error);
      // 迁移失败不抛出错误，避免阻止应用启动
      console.warn("⚠️ AI配置迁移失败，将使用默认配置");
    }
  },

  // === AI历史记录操作 ===

  // 保存AI生成历史记录
  async saveAIHistory(history: AIHistoryDB): Promise<void> {
    try {
      await withDbRetry(async () => {
        await db.aiHistory.put(history);
        console.log(`✅ AI历史记录保存成功: ${history.id.slice(-8)}`);
      });
    } catch (error) {
      console.error(`❌ 保存AI历史记录失败 ${history.id}:`, error);
      throw new Error(
        `保存AI历史记录失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },

  // 获取AI历史记录（分页）
  async getAIHistory(
    options: {
      limit?: number;
      offset?: number;
      provider?: string;
      status?: "success" | "error" | "cancelled";
    } = {}
  ): Promise<AIHistoryDB[]> {
    try {
      return await withDbRetry(async () => {
        let query = db.aiHistory.orderBy("createdAt").reverse();

        // 按提供商筛选
        if (options.provider) {
          query = query.filter((h) => h.provider === options.provider);
        }

        // 按状态筛选
        if (options.status) {
          query = query.filter((h) => h.status === options.status);
        }

        // 分页
        if (options.offset) {
          query = query.offset(options.offset);
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        return await query.toArray();
      });
    } catch (error) {
      console.error("❌ 获取AI历史记录失败:", error);
      return [];
    }
  },

  // 获取特定便签的AI历史记录
  async getAIHistoryByNoteId(noteId: string): Promise<AIHistoryDB[]> {
    try {
      return await withDbRetry(async () => {
        return await db.aiHistory
          .where("noteId")
          .equals(noteId)
          .reverse()
          .sortBy("createdAt");
      });
    } catch (error) {
      console.error(`❌ 获取便签AI历史记录失败 ${noteId}:`, error);
      return [];
    }
  },

  // 删除AI历史记录
  async deleteAIHistory(id: string): Promise<void> {
    try {
      await withDbRetry(async () => {
        await db.aiHistory.delete(id);
        console.log(`✅ AI历史记录删除成功: ${id.slice(-8)}`);
      });
    } catch (error) {
      console.error(`❌ 删除AI历史记录失败 ${id}:`, error);
      throw new Error(
        `删除AI历史记录失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  },

  // 清理旧的AI历史记录（保留最近N条）
  async cleanupAIHistory(keepCount: number = 100): Promise<void> {
    try {
      await withDbRetry(async () => {
        const allHistory = await db.aiHistory
          .orderBy("createdAt")
          .reverse()
          .toArray();

        if (allHistory.length > keepCount) {
          const toDelete = allHistory.slice(keepCount);
          const idsToDelete = toDelete.map((h) => h.id);

          await db.aiHistory.bulkDelete(idsToDelete);
          console.log(`✅ 清理了${idsToDelete.length}条旧的AI历史记录`);
        }
      });
    } catch (error) {
      console.error("❌ 清理AI历史记录失败:", error);
    }
  },

  // 获取AI使用统计
  async getAIUsageStats(): Promise<{
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    totalTokens: number;
    providerStats: Record<string, number>;
  }> {
    try {
      return await withDbRetry(async () => {
        const allHistory = await db.aiHistory.toArray();

        const stats = {
          totalGenerations: allHistory.length,
          successfulGenerations: allHistory.filter(
            (h) => h.status === "success"
          ).length,
          failedGenerations: allHistory.filter((h) => h.status === "error")
            .length,
          totalTokens: allHistory.reduce(
            (sum, h) => sum + (h.tokenUsage?.totalTokens || 0),
            0
          ),
          providerStats: {} as Record<string, number>,
        };

        // 统计各提供商使用次数
        allHistory.forEach((h) => {
          stats.providerStats[h.provider] =
            (stats.providerStats[h.provider] || 0) + 1;
        });

        return stats;
      });
    } catch (error) {
      console.error("❌ 获取AI使用统计失败:", error);
      return {
        totalGenerations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        totalTokens: 0,
        providerStats: {},
      };
    }
  },
};
