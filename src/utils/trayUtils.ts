/**
 * 系统托盘工具函数
 * 提供与 Electron 系统托盘交互的便捷方法
 */

/**
 * 检查是否在 Electron 环境中运行
 */
export const isElectron = (): boolean => {
  return typeof window !== "undefined" && window.isElectron === true;
};

/**
 * 显示应用窗口
 */
export const showWindow = async (): Promise<void> => {
  if (isElectron() && window.electronAPI?.tray) {
    await window.electronAPI.tray.show();
  }
};

/**
 * 隐藏应用窗口到托盘
 */
export const hideToTray = async (): Promise<void> => {
  if (isElectron() && window.electronAPI?.tray) {
    await window.electronAPI.tray.hide();
  }
};

/**
 * 更新托盘提示文字
 * @param tooltip - 提示文字内容
 */
export const updateTrayTooltip = async (tooltip: string): Promise<void> => {
  if (isElectron() && window.electronAPI?.tray) {
    await window.electronAPI.tray.updateTooltip(tooltip);
  }
};

/**
 * 最小化窗口
 */
export const minimizeWindow = async (): Promise<void> => {
  if (isElectron() && window.electronAPI?.window) {
    await window.electronAPI.window.minimize();
  }
};

/**
 * 最大化/还原窗口
 */
export const maximizeWindow = async (): Promise<void> => {
  if (isElectron() && window.electronAPI?.window) {
    await window.electronAPI.window.maximize();
  }
};

/**
 * 关闭窗口（最小化到托盘）
 */
export const closeWindow = async (): Promise<void> => {
  if (isElectron() && window.electronAPI?.window) {
    await window.electronAPI.window.close();
  }
};

/**
 * 检查窗口是否最大化
 */
export const isWindowMaximized = async (): Promise<boolean> => {
  if (isElectron() && window.electronAPI?.window) {
    return await window.electronAPI.window.isMaximized();
  }
  return false;
};

/**
 * 获取应用版本
 */
export const getAppVersion = async (): Promise<string> => {
  if (isElectron() && window.electronAPI) {
    return await window.electronAPI.getVersion();
  }
  return "Web版本";
};

/**
 * 获取平台信息
 */
export const getPlatform = async (): Promise<string> => {
  if (isElectron() && window.electronAPI) {
    return await window.electronAPI.getPlatform();
  }
  return "web";
};
