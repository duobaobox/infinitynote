import type { Note } from "../types";
import { dbOperations } from "./db";

export interface ExportData {
  version: string;
  exportDate: string;
  notes: Note[];
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
        id: note.id?.toString() || "",
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
