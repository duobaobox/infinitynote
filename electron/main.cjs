const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: "InfinityNote 2",
    icon: path.join(__dirname, "../src/assets/logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: false,
    },
    titleBarStyle: "default",
    frame: true,
    backgroundColor: "#ffffff",
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // 注册编辑快捷键
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;

    const { control, meta, shift, alt, key } = input;
    const isMac = process.platform === "darwin";
    const modifier = isMac ? meta : control;

    // 开发者工具快捷键：Cmd+Option+I (macOS) 或 Ctrl+Shift+I (Windows/Linux)
    if (isMac && meta && alt && key.toLowerCase() === "i") {
      mainWindow.webContents.toggleDevTools();
      return;
    }
    if (!isMac && control && shift && key.toLowerCase() === "i") {
      mainWindow.webContents.toggleDevTools();
      return;
    }

    if (!modifier) return;

    switch (key.toLowerCase()) {
      case "c":
        mainWindow.webContents.copy();
        break;
      case "v":
        mainWindow.webContents.paste();
        break;
      case "x":
        mainWindow.webContents.cut();
        break;
      case "a":
        mainWindow.webContents.selectAll();
        break;
      case "z":
        if (shift) {
          mainWindow.webContents.redo();
        } else {
          mainWindow.webContents.undo();
        }
        break;
    }
  });
}

app.whenReady().then(() => {
  // 隐藏默认菜单栏（File、Edit、Window、Help等），兼容 macOS
  Menu.setApplicationMenu(Menu.buildFromTemplate([]));

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("app:getVersion", () => app.getVersion());
ipcMain.handle("app:getPlatform", () => process.platform);
ipcMain.handle("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.handle("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.handle("window:close", () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.handle("window:isMaximized", () =>
  mainWindow ? mainWindow.isMaximized() : false
);

process.on("uncaughtException", (error) =>
  console.error("Uncaught Exception:", error)
);
process.on("unhandledRejection", (error) =>
  console.error("Unhandled Rejection:", error)
);
