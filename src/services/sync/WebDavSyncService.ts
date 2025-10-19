import { dbOperations } from "../../utils/db";

export interface WebDavConfig {
  baseUrl: string; // e.g. https://dav.example.com/remote.php/dav/files/user
  username: string;
  password: string;
  remoteDir: string; // e.g. /InfinityNote
  filename?: string; // default infinitynote-full.json
}

export interface SyncResult {
  success: boolean;
  message?: string;
}

declare global {
  interface Window {
    electronAPI?: import("../../types/electron").ElectronAPI;
  }
}

/**
 * WebDAV 全量同步 MVP：
 * - push: 将本地完整数据导出为单文件并上传
 * - pull: 从远端下载单文件并导入（覆盖）
 *
 * 增量、冲突合并将在后续迭代
 */
export class WebDavSyncService {
  constructor(private config: WebDavConfig) {}

  async testConnection(): Promise<SyncResult> {
    if (!window.electronAPI || !window.electronAPI.webdav) {
      return {
        success: false,
        message: "Electron IPC 不可用，无法使用 WebDAV",
      };
    }
    const resp = await window.electronAPI.webdav.test(this.config);
    return { success: !!resp?.success, message: resp?.error };
  }

  /**
   * 推送本地全量数据到 WebDAV
   */
  async pushFull(): Promise<SyncResult> {
    try {
      // 利用现有导出逻辑拼装全量数据字符串
      // 直接收集数据并序列化为字符串
      // 更稳妥的做法是提取出一个 getAllData() 返回对象再 JSON.stringify，
      // 暂以简单方式：直接从 dbOperations 读取并构造。
      const [notes, canvases] = await Promise.all([
        dbOperations.getAllNotes(),
        dbOperations.getAllCanvases(),
      ]);
      const payload = {
        version: "2.0.0",
        exportDate: new Date().toISOString(),
        appVersion: "unknown",
        dataType: "full" as const,
        notes: notes.map((n) => ({ ...n })),
        canvases: canvases.map((c) => ({ ...c })),
        settings: (() => {
          try {
            const raw = localStorage.getItem("infinitynote-settings");
            return raw ? JSON.parse(raw) : {};
          } catch {
            return {} as any;
          }
        })(),
      };
      const content = JSON.stringify(payload, null, 2);

      if (!window.electronAPI || !window.electronAPI.webdav) {
        return { success: false, message: "Electron IPC 不可用" };
      }
      const resp = await window.electronAPI.webdav.push({
        config: this.config,
        filename: this.config.filename || "infinitynote-full.json",
        content,
      });

      if (!resp?.success) return { success: false, message: resp?.error };
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  /**
   * 从 WebDAV 拉取全量数据并导入（覆盖本地）
   */
  async pullFull(): Promise<SyncResult> {
    try {
      if (!window.electronAPI || !window.electronAPI.webdav) {
        return { success: false, message: "Electron IPC 不可用" };
      }
      const resp = await window.electronAPI.webdav.pull({
        config: this.config,
        filename: this.config.filename || "infinitynote-full.json",
      });
      if (!resp?.success) return { success: false, message: resp?.error };

      const text: string = resp.content ?? "";
      if (!text) return { success: false, message: "远端返回空内容" };
      // 解析并覆盖本地（简单模式：清空再写入）
      const obj = JSON.parse(text);
      if (!obj || !Array.isArray(obj.notes)) {
        return { success: false, message: "远端数据格式无效" };
      }

      // 清空现有数据
      await Promise.all([
        dbOperations.clearAllNotes(),
        dbOperations.clearAllCanvases(),
      ]);

      // 导入画布
      if (Array.isArray(obj.canvases)) {
        for (const canvas of obj.canvases) {
          await dbOperations.addCanvas({
            id: canvas.id,
            name: canvas.name,
            scale: canvas.scale || 1,
            backgroundColor: canvas.backgroundColor || "#ffffff",
            offset: canvas.offset || { x: 0, y: 0 },
            isDefault: !!canvas.isDefault,
            createdAt: new Date(canvas.createdAt),
            updatedAt: new Date(canvas.updatedAt),
          });
        }
      }

      // 导入笔记
      for (const note of obj.notes) {
        await dbOperations.addNote({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        });
      }

      // 导入设置
      if (obj.settings) {
        try {
          localStorage.setItem(
            "infinitynote-settings",
            JSON.stringify(obj.settings)
          );
        } catch {}
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || String(e) };
    }
  }
}

export default WebDavSyncService;
