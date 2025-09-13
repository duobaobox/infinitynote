import type { Note, Canvas } from "../types";
import { dbOperations } from "./db";
import type { SettingsConfig } from "../components/SettingsModal/types";
import { loadSettingsFromStorage } from "../components/SettingsModal/utils";

// 原有的便签导出数据格式（保持向后兼容）
export interface ExportData {
  version: string;
  exportDate: string;
  notes: Note[];
}

// 完整的应用数据导出格式
export interface FullExportData {
  version: string;
  exportDate: string;
  appVersion: string;
  dataType: "full"; // 标识这是完整数据导出
  notes: Note[];
  canvases: Canvas[];
  settings: SettingsConfig;
}

// 导出所有便签数据
export const exportNotes = async (): Promise<void> => {
  try {
    const notes = await dbOperations.getAllNotes();
    const exportData: ExportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      notes: notes.map((note) => ({
        ...note,
        id: note.id || "", // ID已经是字符串，无需转换
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `infinitynote-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("导出失败:", error);
    throw new Error("导出便签失败");
  }
};

// 导入便签数据
export const importNotes = async (file: File): Promise<void> => {
  try {
    const text = await file.text();
    const importData: ExportData = JSON.parse(text);

    // 验证数据格式
    if (!importData.notes || !Array.isArray(importData.notes)) {
      throw new Error("无效的数据格式");
    }

    // 清空现有数据
    await dbOperations.clearAllNotes();

    // 导入新数据
    for (const note of importData.notes) {
      await dbOperations.addNote({
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.color,
        position: note.position,
        size: note.size,
        zIndex: note.zIndex,
        canvasId: note.canvasId,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      });
    }
  } catch (error) {
    console.error("导入失败:", error);
    throw new Error("导入便签失败");
  }
};

// 导出为纯文本格式
export const exportAsText = async (): Promise<void> => {
  try {
    const notes = await dbOperations.getAllNotes();
    let textContent = `InfinityNote 导出 - ${new Date().toLocaleString()}\n`;
    textContent += "=".repeat(50) + "\n\n";

    notes.forEach((note, index) => {
      textContent += `便签 ${index + 1}: ${note.title || "无标题"}\n`;
      textContent += "-".repeat(20) + "\n";
      textContent += `${note.content}\n\n`;
    });

    const dataBlob = new Blob([textContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `infinitynote-export-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("导出文本失败:", error);
    throw new Error("导出文本失败");
  }
};

// 导出所有应用数据（笔记、画布、设置）
export const exportAllData = async (): Promise<void> => {
  try {
    // 获取所有数据
    const [notes, canvases, settings] = await Promise.all([
      dbOperations.getAllNotes(),
      dbOperations.getAllCanvases(),
      Promise.resolve(loadSettingsFromStorage()),
    ]);

    // 构建完整导出数据
    const exportData: FullExportData = {
      version: "2.0.0", // 新版本格式
      exportDate: new Date().toISOString(),
      appVersion: "1.5.7", // 应用版本
      dataType: "full",
      notes: notes.map((note) => ({
        ...note,
        id: note.id || "", // 确保ID存在
      })),
      canvases: canvases.map((canvas) => ({
        ...canvas,
        id: canvas.id || "", // 确保ID存在
      })),
      settings,
    };

    // 创建并下载文件
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `infinitynote-full-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ 完整数据导出成功", {
      notesCount: notes.length,
      canvasesCount: canvases.length,
      settingsIncluded: true,
    });
  } catch (error) {
    console.error("❌ 完整数据导出失败:", error);
    throw new Error("导出所有数据失败");
  }
};

// 导入所有应用数据
export const importAllData = async (file: File): Promise<void> => {
  try {
    const text = await file.text();
    let importData: FullExportData | ExportData;

    try {
      importData = JSON.parse(text);
    } catch (parseError) {
      throw new Error("文件格式无效，请选择有效的JSON文件");
    }

    // 检查数据格式
    if (!importData.notes || !Array.isArray(importData.notes)) {
      throw new Error("无效的数据格式：缺少笔记数据");
    }

    // 判断是完整导出还是仅笔记导出
    const isFullExport =
      "dataType" in importData && importData.dataType === "full";

    if (isFullExport) {
      const fullData = importData as FullExportData;

      // 验证完整数据格式
      if (!fullData.canvases || !Array.isArray(fullData.canvases)) {
        throw new Error("无效的数据格式：缺少画布数据");
      }
      if (!fullData.settings) {
        throw new Error("无效的数据格式：缺少设置数据");
      }

      // 清空所有现有数据
      await Promise.all([
        dbOperations.clearAllNotes(),
        dbOperations.clearAllCanvases(),
      ]);

      // 导入画布数据（先导入画布，因为笔记依赖画布）
      for (const canvas of fullData.canvases) {
        await dbOperations.addCanvas({
          id: canvas.id,
          name: canvas.name,
          scale: canvas.scale || 1,
          backgroundColor: canvas.backgroundColor || "#ffffff",
          offset: canvas.offset || { x: 0, y: 0 },
          isDefault: canvas.isDefault || false,
          createdAt: new Date(canvas.createdAt),
          updatedAt: new Date(canvas.updatedAt),
        });
      }

      // 创建画布ID映射，用于验证笔记的画布关联
      const canvasIds = new Set(fullData.canvases.map((canvas) => canvas.id));

      // 导入笔记数据
      for (const note of fullData.notes) {
        // 验证画布ID是否存在，如果不存在则使用默认画布
        let canvasId = note.canvasId;
        if (!canvasIds.has(canvasId)) {
          console.warn(
            `⚠️ 笔记 ${note.id} 的画布 ${canvasId} 不存在，使用默认画布`
          );
          canvasId =
            fullData.canvases.find((c) => c.isDefault)?.id ||
            fullData.canvases[0]?.id ||
            "canvas_default";
        }

        // 确保所有必需字段都存在
        const noteData = {
          id: note.id,
          title: note.title || "",
          content: note.content || "",
          color: note.color || "#FFF2CC",
          position: note.position || { x: 100, y: 100 },
          size: note.size || { width: 200, height: 150 },
          zIndex: note.zIndex || 1,
          canvasId: canvasId,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          // 添加可能缺少的字段，使用默认值
          tags: note.tags || [],
          priority: note.priority || 2,
          isPinned: note.isPinned || false,
          isArchived: note.isArchived || false,
          isFavorite: note.isFavorite || false,
          contentType: note.contentType || "text",
          permission: note.permission || "private",
          version: note.version || 1,
          isDeleted: note.isDeleted || false,
          lastAccessedAt: note.lastAccessedAt
            ? new Date(note.lastAccessedAt)
            : new Date(note.updatedAt),
          customProperties: note.customProperties || {},
        };

        await dbOperations.addNote(noteData);
      }

      // 导入设置数据（保存到localStorage）
      localStorage.setItem(
        "infinitynote-settings",
        JSON.stringify(fullData.settings)
      );

      console.log("✅ 完整数据导入成功", {
        notesCount: fullData.notes.length,
        canvasesCount: fullData.canvases.length,
        settingsImported: true,
      });
    } else {
      // 兼容旧格式：仅导入笔记
      const noteData = importData as ExportData;

      // 清空现有笔记数据
      await dbOperations.clearAllNotes();

      // 导入笔记数据
      for (const note of noteData.notes) {
        // 确保所有必需字段都存在
        const noteDataCompat = {
          id: note.id,
          title: note.title || "",
          content: note.content || "",
          color: note.color || "#FFF2CC",
          position: note.position || { x: 100, y: 100 },
          size: note.size || { width: 200, height: 150 },
          zIndex: note.zIndex || 1,
          canvasId: note.canvasId,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          // 添加可能缺少的字段，使用默认值
          tags: note.tags || [],
          priority: note.priority || 2,
          isPinned: note.isPinned || false,
          isArchived: note.isArchived || false,
          isFavorite: note.isFavorite || false,
          contentType: note.contentType || "text",
          permission: note.permission || "private",
          version: note.version || 1,
          isDeleted: note.isDeleted || false,
          lastAccessedAt: note.lastAccessedAt
            ? new Date(note.lastAccessedAt)
            : new Date(note.updatedAt),
          customProperties: note.customProperties || {},
        };

        await dbOperations.addNote(noteDataCompat);
      }

      console.log("✅ 笔记数据导入成功（兼容模式）", {
        notesCount: noteData.notes.length,
      });
    }

    console.log("🔄 数据导入完成，准备刷新页面...");

    // 延迟刷新页面，确保数据库操作完全完成
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error("❌ 数据导入失败:", error);
    throw new Error(error instanceof Error ? error.message : "导入数据失败");
  }
};

// 清除所有应用数据
export const clearAllData = async (): Promise<void> => {
  try {
    console.log("🗑️ 开始清除所有数据...");

    // 清除数据库中的所有数据
    console.log("🗑️ 清除数据库数据...");
    await Promise.all([
      dbOperations.clearAllNotes(),
      dbOperations.clearAllCanvases(),
    ]);

    // 清除本地存储
    console.log("🗑️ 清除本地存储...");
    localStorage.clear();

    // 清除会话存储
    sessionStorage.clear();

    // 清除IndexedDB缓存
    try {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map((db) => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
          return Promise.resolve();
        })
      );
    } catch (dbError) {
      console.warn("⚠️ 清除IndexedDB时出现警告:", dbError);
    }

    console.log("✅ 所有数据清除成功");

    // 延迟刷新页面，确保清除操作完成
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    console.error("❌ 清除数据失败:", error);
    throw new Error(
      `清除所有数据失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
};

// 文件上传处理器
export const handleFileImport = (): Promise<File> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error("未选择文件"));
      }
    };
    input.click();
  });
};
