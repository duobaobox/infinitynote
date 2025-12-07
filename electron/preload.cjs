const { contextBridge, ipcRenderer } = require("electron");

// 向渲染进程暴露受控的 API
const api = {
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
  updates: {
    check: () => ipcRenderer.invoke("update:check"),
    download: () => ipcRenderer.invoke("update:download"),
    install: () => ipcRenderer.invoke("update:install"),
    onStatus: (callback) => {
      const handler = (_event, payload) => callback(payload);
      ipcRenderer.on("update:status", handler);
      return () => ipcRenderer.removeListener("update:status", handler);
    },
  },
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
  webdav: {
    test: (config) => ipcRenderer.invoke("webdav:test", config),
    push: (payload) => ipcRenderer.invoke("webdav:push", payload),
    pull: (payload) => ipcRenderer.invoke("webdav:pull", payload),
  },
  onMenuAction: (callback) => {
    const menuEvents = [
      "note-data",
      "note-data-updated",
      "floating-note-updated",
      "floating-note-resized",
    ];

    const handlers = {};

    menuEvents.forEach((event) => {
      const handler = (electronEvent, data) => {
        callback(event, data);
      };
      handlers[event] = handler;
      ipcRenderer.on(event, handler);
    });

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
};

contextBridge.exposeInMainWorld("electronAPI", api);
contextBridge.exposeInMainWorld("isElectron", true);
console.log("Electron preload script loaded");
