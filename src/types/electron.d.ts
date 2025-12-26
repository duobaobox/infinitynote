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
        updates?: {
          check: () => Promise<{
            success: boolean;
            message?: string;
            info?: any;
          }>;
          download: () => Promise<{ success: boolean; message?: string }>;
          install: () => Promise<{ success: boolean; message?: string }>;
          onStatus: (
            callback: (payload: {
              status:
                | "checking"
                | "available"
                | "not-available"
                | "download-progress"
                | "downloaded"
                | "error";
              message?: string;
              info?: any;
              progress?: any;
            }) => void
          ) => () => void;
        };
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
  updates?: {
    check: () => Promise<{ success: boolean; message?: string; info?: any }>;
    download: () => Promise<{ success: boolean; message?: string }>;
    install: () => Promise<{ success: boolean; message?: string }>;
    onStatus: (
      callback: (payload: {
        status:
          | "checking"
          | "available"
          | "not-available"
          | "download-progress"
          | "downloaded"
          | "error";
        message?: string;
        info?: any;
        progress?: any;
      }) => void
    ) => () => void;
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
  // 安全存储 API
  secureStorage?: {
    set: (key: string, value: string) => Promise<{ success: boolean; fallback?: boolean; error?: string }>;
    get: (key: string) => Promise<string | null>;
    remove: (key: string) => Promise<{ success: boolean; error?: string }>;
    clear: () => Promise<{ success: boolean; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    isElectron?: boolean;
  }
}

export {};
