const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
} = require("electron");
const path = require("path");

// 设置应用名称（确保在所有平台显示正确的名称）
app.name = "无限便签";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow;
let tray = null;

// 悬浮窗口管理 - 使用 Map 管理多个悬浮窗口
let floatingWindows = new Map(); // key: noteId, value: BrowserWindow

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

// 创建悬浮窗口函数
function createFloatingNoteWindow(noteData) {
  const { noteId, title, content, color, width, height } = noteData;

  // 检查窗口是否已存在
  if (floatingWindows.has(noteId)) {
    const existingWindow = floatingWindows.get(noteId);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      existingWindow.show();
      return existingWindow;
    } else {
      floatingWindows.delete(noteId);
    }
  }

  // 创建新的悬浮窗口
  const floatingWindow = new BrowserWindow({
    width: Math.max(width || 400, 300),
    height: Math.max(height || 300, 200),
    minWidth: 250,
    minHeight: 150,
    frame: false, // 无边框窗口
    transparent: true, // 透明背景
    alwaysOnTop: true, // 始终在顶部
    resizable: true,
    movable: true,
    skipTaskbar: false,
    title: `悬浮便签 - ${title || "无标题"}`,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: false,
    },
    show: false, // 延迟显示
  });

  // 加载悬浮页面
  const floatingUrl = isDev
    ? `http://localhost:5173/floating.html?noteId=${encodeURIComponent(noteId)}`
    : `file://${path.join(
        __dirname,
        "../dist/floating.html"
      )}?noteId=${encodeURIComponent(noteId)}`;

  floatingWindow.loadURL(floatingUrl);

  // 窗口准备显示时的回调
  floatingWindow.once("ready-to-show", () => {
    floatingWindow.show();
    floatingWindow.focus();

    // 发送便签数据到渲染进程
    setTimeout(() => {
      if (!floatingWindow.isDestroyed()) {
        floatingWindow.webContents.send("note-data", noteData);
      }
    }, 500);
  });

  // 窗口关闭时清理
  floatingWindow.on("closed", () => {
    floatingWindows.delete(noteId);
  });

  // 注意：悬浮窗口的大小调整不同步到画布便签
  // 悬浮窗口和画布便签保持独立的尺寸

  // 存储窗口引用
  floatingWindows.set(noteId, floatingWindow);

  // 开发环境打开开发者工具
  if (isDev) {
    floatingWindow.webContents.openDevTools();
  }

  return floatingWindow;
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
  // 设置应用菜单（macOS 保留应用名称菜单，符合系统规范）
  const isMac = process.platform === "darwin";

  const menuTemplate = [
    // macOS 应用菜单（显示应用名称）
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: "关于 " + app.name,
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
                label: "偏好设置...",
                accelerator: "CmdOrCtrl+,",
                enabled: false, // 可以后续实现设置功能
              },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              {
                label: "退出",
                accelerator: "CmdOrCtrl+Q",
                click: () => {
                  app.isQuiting = true;
                  app.quit();
                },
              },
            ],
          },
        ]
      : []),
    // 窗口菜单
    {
      label: "窗口",
      submenu: [
        { role: "minimize", label: "最小化" },
        { role: "zoom", label: "缩放" },
        ...(isMac
          ? [{ type: "separator" }, { role: "front", label: "全部置于顶层" }]
          : [{ role: "close", label: "关闭" }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

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

// ===== 悬浮便签 IPC 处理 =====

// 创建悬浮便签
ipcMain.handle("create-floating-note", (event, noteData) => {
  try {
    createFloatingNoteWindow(noteData);
    return { success: true };
  } catch (error) {
    console.error("创建悬浮便签失败:", error);
    return { success: false, error: error.message };
  }
});

// 关闭悬浮便签
ipcMain.handle("close-floating-note", (event, noteId) => {
  try {
    const window = floatingWindows.get(noteId);
    if (window && !window.isDestroyed()) {
      window.close();
    }
    floatingWindows.delete(noteId);
    return { success: true };
  } catch (error) {
    console.error("关闭悬浮便签失败:", error);
    return { success: false, error: error.message };
  }
});

// 更新悬浮便签 - 双向同步的核心
ipcMain.handle(
  "update-floating-note",
  (event, noteId, updates, fromMainWindow = false) => {
    try {
      const window = floatingWindows.get(noteId);

      // 更新悬浮窗口
      if (window && !window.isDestroyed()) {
        window.webContents.send("note-data-updated", { noteId, ...updates });
      }

      // 只有当更新来自悬浮窗口时，才通知主窗口
      // 避免循环更新
      if (!fromMainWindow && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("floating-note-updated", {
          noteId,
          updates,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("更新悬浮便签失败:", error);
      return { success: false, error: error.message };
    }
  }
);

// 获取悬浮便签数据
ipcMain.handle("get-floating-note-data", (event, noteId) => {
  try {
    return { success: true };
  } catch (error) {
    console.error("获取悬浮便签数据失败:", error);
    return { success: false, error: error.message };
  }
});

process.on("uncaughtException", (error) =>
  console.error("Uncaught Exception:", error)
);
process.on("unhandledRejection", (error) =>
  console.error("Unhandled Rejection:", error)
);
