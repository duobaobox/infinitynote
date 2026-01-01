const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  safeStorage,
} = require("electron");
const path = require("path");
const { URL } = require("url");
const { autoUpdater } = require("electron-updater");

// 设置应用名称（确保在所有平台显示正确的名称）
app.name = "无限便签";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// 配置 autoUpdater
autoUpdater.autoDownload = false; // 不自动下载，由用户手动触发
autoUpdater.autoInstallOnAppQuit = false; // 不自动安装
let mainWindow;
let tray = null;

// 安全存储缓存（内存中的解密数据）
const secureStorageCache = new Map();

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

  // 移除托盘图标点击事件 - 托盘图标不应唤出主窗口
  // 用户应该通过托盘菜单或程序坞图标来显示主窗口
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
    transparent: false, // 关闭透明，保证可缩放
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
      sandbox: false, // 保持关闭以确保跨平台兼容性
      enableWebSQL: false,
      spellcheck: false,
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

  // 注册编辑快捷键 - 为悬浮窗口添加与主窗口相同的快捷键支持
  floatingWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;

    const { control, meta, shift, alt, key } = input;
    const isMac = process.platform === "darwin";
    const modifier = isMac ? meta : control;

    // 开发者工具快捷键：Cmd+Option+I (macOS) 或 Ctrl+Shift+I (Windows/Linux)
    if (isMac && meta && alt && key.toLowerCase() === "i") {
      floatingWindow.webContents.toggleDevTools();
      return;
    }
    if (!isMac && control && shift && key.toLowerCase() === "i") {
      floatingWindow.webContents.toggleDevTools();
      return;
    }

    if (!modifier) return;

    switch (key.toLowerCase()) {
      case "c":
        event.preventDefault();
        floatingWindow.webContents.copy();
        break;
      case "v":
        event.preventDefault();
        floatingWindow.webContents.paste();
        break;
      case "x":
        event.preventDefault();
        floatingWindow.webContents.cut();
        break;
      case "a":
        event.preventDefault();
        floatingWindow.webContents.selectAll();
        break;
      case "z":
        event.preventDefault();
        if (shift) {
          floatingWindow.webContents.redo();
        } else {
          floatingWindow.webContents.undo();
        }
        break;
    }
  });

  // 窗口关闭时清理
  floatingWindow.on("closed", () => {
    floatingWindows.delete(noteId);
  });

  // 注意：悬浮窗口的大小调整不同步到画布便签
  // 悬浮窗口和画布便签保持独立的尺寸

  // 存储窗口引用
  floatingWindows.set(noteId, floatingWindow);

  // 不在生产环境打开开发者工具
  // if (isDev) {
  //   floatingWindow.webContents.openDevTools();
  // }

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
      sandbox: false, // 保持关闭以确保跨平台兼容性
      enableWebSQL: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
    titleBarStyle: "default",
    frame: true,
    backgroundColor: "#ffffff",
    show: false,
  });

  // 窗口准备好后再显示，避免白屏闪烁
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // 仅在开发环境打开 DevTools
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    // 生产环境禁用 DevTools
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
        event.preventDefault();
        mainWindow.webContents.copy();
        break;
      case "v":
        event.preventDefault();
        mainWindow.webContents.paste();
        break;
      case "x":
        event.preventDefault();
        mainWindow.webContents.cut();
        break;
      case "a":
        event.preventDefault();
        mainWindow.webContents.selectAll();
        break;
      case "z":
        event.preventDefault();
        if (shift) {
          mainWindow.webContents.redo();
        } else {
          mainWindow.webContents.undo();
        }
        break;
    }
  });
}

// ===== 性能优化配置（跨平台兼容）=====

// 根据平台条件性地启用优化
if (!isDev) {
  // 生产环境通用优化
  app.commandLine.appendSwitch("disable-renderer-backgrounding");

  // macOS 特定优化
  if (process.platform === "darwin") {
    app.commandLine.appendSwitch("enable-smooth-scrolling");
  }

  // Windows 特定优化
  if (process.platform === "win32") {
    app.commandLine.appendSwitch("high-dpi-support", "1");
    app.commandLine.appendSwitch("force-color-profile", "srgb");
  }
}

app.whenReady().then(() => {
  // 初始化自动更新（仅生产环境）
  if (!isDev) {
    setupAutoUpdater();
  }

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
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  // 创建系统托盘
  createTray();

  createWindow();

  // macOS 点击程序坞图标时激活应用
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      // 如果主窗口存在但被隐藏，显示并聚焦
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on("window-all-closed", () => {
  // 所有平台都保持在后台运行（托盘模式）
  // 如果想要关闭所有窗口时退出应用，使用：app.quit();
  // 注意：macOS 传统行为是保持应用运行
});

ipcMain.handle("app:getVersion", () => app.getVersion());
ipcMain.handle("app:getPlatform", () => process.platform);

// ===== 安全存储 IPC 处理 =====

// 使用 safeStorage 加密存储数据
ipcMain.handle("secure-storage:set", async (event, key, value) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn("⚠️ safeStorage 加密不可用，使用内存存储");
      secureStorageCache.set(key, value);
      return { success: true, fallback: true };
    }

    const encrypted = safeStorage.encryptString(value);
    // 存储到文件或其他持久化存储
    // 这里使用简单的内存缓存演示
    secureStorageCache.set(key, encrypted);
    console.log(`✅ 安全存储成功: ${key}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ 安全存储失败: ${key}`, error);
    return { success: false, error: error.message };
  }
});

// 从 safeStorage 解密读取数据
ipcMain.handle("secure-storage:get", async (event, key) => {
  try {
    const stored = secureStorageCache.get(key);
    if (!stored) {
      return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      // 如果加密不可用，假设存储的是明文
      return stored;
    }

    // 如果是 Buffer（加密数据），则解密
    if (Buffer.isBuffer(stored)) {
      return safeStorage.decryptString(stored);
    }

    return stored;
  } catch (error) {
    console.error(`❌ 安全读取失败: ${key}`, error);
    return null;
  }
});

// 删除安全存储的数据
ipcMain.handle("secure-storage:remove", async (event, key) => {
  try {
    secureStorageCache.delete(key);
    console.log(`✅ 安全删除成功: ${key}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ 安全删除失败: ${key}`, error);
    return { success: false, error: error.message };
  }
});

// 清除所有安全存储
ipcMain.handle("secure-storage:clear", async () => {
  try {
    secureStorageCache.clear();
    console.log("✅ 安全存储已清除");
    return { success: true };
  } catch (error) {
    console.error("❌ 清除安全存储失败", error);
    return { success: false, error: error.message };
  }
});

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

// =============== WebDAV 同步（主进程实现以避免CORS） ===============

/**
 * 组合远端路径
 * @param {string} baseUrl 例如 https://dav.example.com/remote.php/dav/files/user
 * @param {string} remoteDir 例如 /InfinityNote
 * @param {string} filename 例如 infinitynote-full.json
 */
function buildRemoteUrl(baseUrl, remoteDir, filename) {
  try {
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      throw new Error("无效或缺失的 WebDAV 基础地址");
    }
    // 规范化斜杠
    const base = String(baseUrl).replace(/\/+$/g, "");
    let dir = (remoteDir || "/").trim();
    if (!dir.startsWith("/")) dir = "/" + dir;
    // 确保目录末尾没有多余斜杠（MKCOL时会单独处理）
    dir = dir.replace(/\/+$/g, "");
    const file = filename.replace(/^\/+/, "");
    return `${base}${dir}/${file}`;
  } catch (e) {
    throw new Error("无效的 WebDAV URL 配置");
  }
}

function buildDirUrl(baseUrl, remoteDir) {
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    throw new Error("无效或缺失的 WebDAV 基础地址");
  }
  const base = String(baseUrl).replace(/\/+$/g, "");
  let dir = (remoteDir || "/").trim();
  if (!dir.startsWith("/")) dir = "/" + dir;
  // 目录URL以斜杠结尾，便于部分服务识别
  if (!dir.endsWith("/")) dir += "/";
  return `${base}${dir}`;
}

function buildAuthHeader(username, password) {
  const token = Buffer.from(`${username || ""}:${password || ""}`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

async function ensureRemoteDirExists({
  baseUrl,
  remoteDir,
  username,
  password,
}) {
  const dirUrl = buildDirUrl(baseUrl, remoteDir);
  const headers = {
    Authorization: buildAuthHeader(username, password),
  };

  // 尝试 HEAD 检查
  try {
    const headResp = await fetch(dirUrl, { method: "HEAD", headers });
    if (headResp.ok) return true;
  } catch (_) {
    // 忽略，继续尝试 MKCOL
  }

  // MKCOL 创建目录（如果已存在可能返回405/409，视为可接受）
  const mkcolResp = await fetch(dirUrl, { method: "MKCOL", headers });
  if (mkcolResp.ok) return true;
  if ([405, 409, 301, 302].includes(mkcolResp.status)) return true;
  const txt = await mkcolResp.text().catch(() => "");
  throw new Error(`创建远端目录失败: ${mkcolResp.status} ${txt}`);
}

// 测试连接：尝试 HEAD 目录，不行则 MKCOL 再 HEAD
ipcMain.handle("webdav:test", async (event, config) => {
  try {
    if (!config || !config.baseUrl) throw new Error("缺少基础地址");
    await ensureRemoteDirExists(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || String(error) };
  }
});

// 推送全量备份（content 为字符串JSON）
ipcMain.handle("webdav:push", async (event, { config, content, filename }) => {
  try {
    if (!config || !config.baseUrl) throw new Error("缺少基础地址");
    if (!content) throw new Error("缺少上传内容");
    const name = filename || "infinitynote-full.json";
    await ensureRemoteDirExists(config);
    const url = buildRemoteUrl(config.baseUrl, config.remoteDir, name);

    const headers = {
      Authorization: buildAuthHeader(config.username, config.password),
      "Content-Type": "application/json",
    };

    const resp = await fetch(url, { method: "PUT", headers, body: content });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`上传失败: ${resp.status} ${txt}`);
    }
    const etag = resp.headers.get("etag");
    return { success: true, etag };
  } catch (error) {
    return { success: false, error: error?.message || String(error) };
  }
});

// 拉取全量备份（返回文本）
ipcMain.handle("webdav:pull", async (event, { config, filename }) => {
  try {
    if (!config || !config.baseUrl) throw new Error("缺少基础地址");
    const name = filename || "infinitynote-full.json";
    const url = buildRemoteUrl(config.baseUrl, config.remoteDir, name);
    const headers = {
      Authorization: buildAuthHeader(config.username, config.password),
      Accept: "application/json,text/plain, */*",
    };
    const resp = await fetch(url, { method: "GET", headers });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`下载失败: ${resp.status} ${txt}`);
    }
    const text = await resp.text();
    return { success: true, content: text };
  } catch (error) {
    return { success: false, error: error?.message || String(error) };
  }
});

// ===== 自动更新 IPC 处理 =====

// 自动更新事件监听
function setupAutoUpdater() {
  // 检查更新
  autoUpdater.on("checking-for-update", () => {
    console.log("正在检查更新...");
    sendUpdateStatus("checking", "正在检查更新...");
  });

  // 发现新版本
  autoUpdater.on("update-available", (info) => {
    console.log("发现新版本:", info.version);
    sendUpdateStatus("available", `发现新版本 ${info.version}`, info);
  });

  // 没有可用更新
  autoUpdater.on("update-not-available", (info) => {
    console.log("当前已是最新版本");
    sendUpdateStatus("not-available", "当前已是最新版本", info);
  });

  // 下载进度
  autoUpdater.on("download-progress", (progressObj) => {
    console.log(`下载进度: ${Math.round(progressObj.percent)}%`);
    sendUpdateStatus("download-progress", "正在下载更新", null, progressObj);
  });

  // 下载完成
  autoUpdater.on("update-downloaded", (info) => {
    console.log("更新包已下载完成");
    sendUpdateStatus("downloaded", "更新包已下载，请点击安装并重启", info);
  });

  // 更新错误
  autoUpdater.on("error", (err) => {
    console.error("更新错误:", err);
    sendUpdateStatus("error", err.message || "更新失败");
  });
}

// 发送更新状态到渲染进程
function sendUpdateStatus(status, message, info = null, progress = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", {
      status,
      message,
      info,
      progress,
    });
  }
}

// 检查更新
ipcMain.handle("updates:check", async () => {
  if (isDev) {
    return { success: false, message: "开发环境不支持自动更新" };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, info: result };
  } catch (error) {
    console.error("检查更新失败:", error);
    return { success: false, message: error.message || "检查更新失败" };
  }
});

// 下载更新
ipcMain.handle("updates:download", async () => {
  if (isDev) {
    return { success: false, message: "开发环境不支持自动更新" };
  }

  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error("下载更新失败:", error);
    return { success: false, message: error.message || "下载更新失败" };
  }
});

// 安装更新并重启
ipcMain.handle("updates:install", async () => {
  if (isDev) {
    return { success: false, message: "开发环境不支持自动更新" };
  }

  try {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (error) {
    console.error("安装更新失败:", error);
    return { success: false, message: error.message || "安装更新失败" };
  }
});
