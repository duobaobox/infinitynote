const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  getPlatform: () => ipcRenderer.invoke("app:getPlatform"),
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  },
  tray: {
    show: () => ipcRenderer.invoke("tray:show"),
    hide: () => ipcRenderer.invoke("tray:hide"),
    updateTooltip: (tooltip) =>
      ipcRenderer.invoke("tray:updateTooltip", tooltip),
  },
  // 安全存储 API
  secureStorage: {
    set: (key, value) => ipcRenderer.invoke("secure-storage:set", key, value),
    get: (key) => ipcRenderer.invoke("secure-storage:get", key),
    remove: (key) => ipcRenderer.invoke("secure-storage:remove", key),
    clear: () => ipcRenderer.invoke("secure-storage:clear"),
  },
  // 悬浮便签功能
  floating: {
    createFloatingNote: (noteData) =>
      ipcRenderer.invoke("create-floating-note", noteData),
    closeFloatingNote: (noteId) =>
      ipcRenderer.invoke("close-floating-note", noteId),
    updateFloatingNote: (noteId, updates, fromMainWindow) =>
      ipcRenderer.invoke(
        "update-floating-note",
        noteId,
        updates,
        fromMainWindow
      ),
    getFloatingNoteData: (noteId) =>
      ipcRenderer.invoke("get-floating-note-data", noteId),
  },
  // WebDAV 同步
  webdav: {
    test: (config) => ipcRenderer.invoke("webdav:test", config),
    push: (payload) => ipcRenderer.invoke("webdav:push", payload),
    pull: (payload) => ipcRenderer.invoke("webdav:pull", payload),
  },
  // 事件监听
  onMenuAction: (callback) => {
    const menuEvents = [
      "note-data", // 悬浮便签数据
      "note-data-updated", // 便签数据更新
      "floating-note-updated", // 悬浮便签更新通知主窗口
      "floating-note-resized", // 悬浮便签大小变化
    ];

    const handlers = {};

    menuEvents.forEach((event) => {
      const handler = (electronEvent, data) => {
        callback(event, data);
      };
      handlers[event] = handler;
      ipcRenderer.on(event, handler);
    });

    // 返回清理函数
    return () => {
      menuEvents.forEach((event) => {
        if (handlers[event]) {
          ipcRenderer.removeListener(event, handlers[event]);
        }
      });
    };
  },
  platform: process.platform,
  isDev: process.env.NODE_ENV === "development",
});

contextBridge.exposeInMainWorld("isElectron", true);
console.log("Electron preload script loaded");
