const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
} = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow;
let tray = null;

// 获取系统托盘图标路径（所有平台统一使用 tray@2x.png）
function getTrayIcon() {
  if (isDev) {
    return path.join(__dirname, "../src/assets/tray@2x.png");
  }
  return path.join(process.resourcesPath, "tray@2x.png");
}

// 创建系统托盘
function createTray() {
  const iconPath = getTrayIcon();
  console.log("🎯 正在创建系统托盘...");
  console.log("📁 托盘图标路径:", iconPath);
  console.log("💻 当前平台:", process.platform);

  // 创建托盘图标
  let icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    console.error("❌ 托盘图标加载失败！路径:", iconPath);
    return;
  }

  console.log("✅ 托盘图标加载成功，原始尺寸:", icon.getSize());

  // macOS 系统托盘图标特殊处理
  if (process.platform === "darwin") {
    // 设置为模板图标，macOS 会自动根据系统主题调整颜色
    icon.setTemplateImage(true);
    console.log("🍎 macOS: 已设置为模板图标");
  }

  tray = new Tray(icon);
  console.log("✅ 系统托盘创建成功！");

  // 设置托盘提示文字
  tray.setToolTip("无限便签");

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "隐藏窗口",
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      },
    },
    { type: "separator" },
    {
      label: "关于",
      click: () => {
        const { dialog } = require("electron");
        dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "关于无限便签",
          message: "无限便签 v" + app.getVersion(),
          detail: "无限画布便签应用\n\n© 2025 无限便签团队",
          buttons: ["确定"],
        });
      },
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        // 完全退出应用
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  // 设置托盘菜单
  tray.setContextMenu(contextMenu);

  // 双击托盘图标显示窗口（Windows 和 Linux）
  tray.on("double-click", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // macOS 单击也显示窗口
  if (process.platform === "darwin") {
    tray.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: "无限便签",
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

  // 最小化到托盘而不是任务栏（可选）
  mainWindow.on("minimize", (event) => {
    if (process.platform === "darwin") {
      // macOS 上保持默认行为
      return;
    }
    // Windows 和 Linux 可以选择最小化到托盘
    // 如果想要最小化到托盘，取消下面的注释
    // event.preventDefault();
    // mainWindow.hide();
  });

  // 关闭窗口时最小化到托盘而不是退出
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();

      // 首次最小化到托盘时显示提示（可选）
      if (!app.hasShownTrayTip) {
        tray.displayBalloon({
          title: "无限便签",
          content: "应用已最小化到系统托盘，双击托盘图标可以重新打开。",
          icon: nativeImage.createFromPath(getTrayIcon()),
        });
        app.hasShownTrayTip = true;
      }

      return false;
    }
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

  // 创建系统托盘
  createTray();

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // 所有平台都保持在后台运行（托盘模式）
  // 如果想要关闭所有窗口时退出应用，使用：app.quit();
  // 注意：macOS 传统行为是保持应用运行
});

ipcMain.handle("app:getVersion", () => app.getVersion());
ipcMain.handle("app:getPlatform", () => process.platform);

// 托盘相关 IPC 接口
ipcMain.handle("tray:show", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle("tray:hide", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle("tray:updateTooltip", (event, tooltip) => {
  if (tray) {
    tray.setToolTip(tooltip || "无限便签");
  }
});

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
