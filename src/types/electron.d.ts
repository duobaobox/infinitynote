/**
 * Electron API 类型定义
 */

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  // WebDAV 同步 API
  webdav?: {
    test: (config: {
      baseUrl: string;
      username: string;
      password: string;
      remoteDir: string;
    }) => Promise<{ success: boolean; error?: string }>;
    push: (payload: {
      config: {
        baseUrl: string;
        username: string;
        password: string;
        remoteDir: string;
      };
      filename?: string;
      content: string;
    }) => Promise<{ success: boolean; etag?: string; error?: string }>;
    pull: (payload: {
      config: {
        baseUrl: string;
        username: string;
        password: string;
        remoteDir: string;
      };
      filename?: string;
    }) => Promise<{ success: boolean; content?: string; error?: string }>;
  };
  tray: {
    show: () => Promise<void>;
    hide: () => Promise<void>;
    updateTooltip: (tooltip: string) => Promise<void>;
  };
  // 悬浮便签 API
  floating: {
    createFloatingNote: (noteData: {
      noteId: string;
      title: string;
      content: string;
      color: string;
      width: number;
      height: number;
    }) => Promise<{ success: boolean; error?: string }>;
    closeFloatingNote: (
      noteId: string
    ) => Promise<{ success: boolean; error?: string }>;
    updateFloatingNote: (
      noteId: string,
      updates: Record<string, any>,
      fromMainWindow?: boolean
    ) => Promise<{ success: boolean; error?: string }>;
    getFloatingNoteData: (
      noteId: string
    ) => Promise<{ success: boolean; error?: string }>;
  };
  // 事件监听
  onMenuAction: (
    callback: (eventName: string, data: any) => void
  ) => () => void;
  platform: string;
  isDev: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    isElectron?: boolean;
  }
}

export {};
