/**
 * 设置数据管理工具
 */

import type { SettingsConfig, SettingsExportData } from "./types";
import {
  DEFAULT_MODEL_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_DISPLAY_SETTINGS,
  DEFAULT_CLOUD_SETTINGS,
  STORAGE_KEYS,
  APP_INFO,
  EDIT_SHORTCUTS,
  VIEW_SHORTCUTS,
} from "./constants";

// ==================== 默认设置配置 ====================

/**
 * 获取默认设置配置
 */
export const getDefaultSettings = (): SettingsConfig => ({
  model: DEFAULT_MODEL_SETTINGS,
  general: DEFAULT_GENERAL_SETTINGS,
  display: DEFAULT_DISPLAY_SETTINGS,
  data: {
    storageUsed: "0 MB",
    noteCount: 0,
    lastBackupTime: undefined,
  },
  shortcuts: [...EDIT_SHORTCUTS, ...VIEW_SHORTCUTS],
  cloud: DEFAULT_CLOUD_SETTINGS,
  app: APP_INFO,
});

// ==================== 本地存储管理 ====================

/**
 * 从本地存储加载设置
 */
export const loadSettingsFromStorage = (): SettingsConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      return getDefaultSettings();
    }

    const parsedSettings = JSON.parse(stored);

    // 合并默认设置，确保新增的设置项不会丢失
    const defaultSettings = getDefaultSettings();
    return deepMerge(defaultSettings, parsedSettings);
  } catch (error) {
    console.warn("Failed to load settings from localStorage:", error);
    return getDefaultSettings();
  }
};

/**
 * 保存设置到本地存储
 */
export const saveSettingsToStorage = (settings: SettingsConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

/**
 * 清除本地存储的设置
 */
export const clearSettingsFromStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear settings from localStorage:", error);
  }
};

// ==================== 设置导入导出 ====================

/**
 * 导出设置数据
 */
export const exportSettings = (
  settings: SettingsConfig
): SettingsExportData => {
  return {
    exportTime: new Date().toISOString(),
    appVersion: APP_INFO.version,
    settings: {
      // 只导出用户可配置的设置，排除运行时数据
      model: settings.model,
      general: settings.general,
      display: settings.display,
      shortcuts: settings.shortcuts,
      cloud: {
        ...settings.cloud,
        // 不导出敏感的同步状态信息
        syncStatus: "idle",
        lastSyncTime: undefined,
      },
    },
  };
};

/**
 * 导入设置数据
 */
export const importSettings = (
  exportData: SettingsExportData,
  currentSettings: SettingsConfig
): SettingsConfig => {
  try {
    // 验证导入数据格式
    if (!exportData.settings) {
      throw new Error("Invalid export data format");
    }

    // 合并导入的设置与当前设置
    return deepMerge(currentSettings, {
      ...exportData.settings,
      // 保持当前的数据统计和应用信息
      data: currentSettings.data,
      app: currentSettings.app,
    });
  } catch (error) {
    console.error("Failed to import settings:", error);
    throw error;
  }
};

/**
 * 下载设置文件
 */
export const downloadSettingsFile = (settings: SettingsConfig): void => {
  try {
    const exportData = exportSettings(settings);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `infinitynote-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download settings file:", error);
    throw error;
  }
};

/**
 * 从文件读取设置
 */
export const readSettingsFromFile = (
  file: File
): Promise<SettingsExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const exportData = JSON.parse(content) as SettingsExportData;
        resolve(exportData);
      } catch (error) {
        reject(new Error("Invalid settings file format"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read settings file"));
    };

    reader.readAsText(file);
  });
};

// ==================== 存储使用统计 ====================

/**
 * 计算本地存储使用情况
 */
export const calculateStorageUsage = (): {
  used: string;
  noteCount: number;
} => {
  try {
    let totalSize = 0;
    let noteCount = 0;

    // 遍历所有 localStorage 项目
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("infinitynote_")) {
        const value = localStorage.getItem(key) || "";
        totalSize += new Blob([value]).size;

        // 统计笔记数量（简单估算）
        if (key.includes("note") || key.includes("canvas")) {
          try {
            const data = JSON.parse(value);
            if (Array.isArray(data)) {
              noteCount += data.length;
            } else if (data && typeof data === "object") {
              noteCount += 1;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    // 转换为可读格式
    const used = formatBytes(totalSize);

    return { used, noteCount };
  } catch (error) {
    console.error("Failed to calculate storage usage:", error);
    return { used: "0 MB", noteCount: 0 };
  }
};

// ==================== 工具函数 ====================

/**
 * 深度合并对象
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        (result as any)[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        (result as any)[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * 格式化字节数为可读格式
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ==================== 设置验证 ====================

/**
 * 验证 API 密钥格式
 */
export const validateApiKey = (provider: string, apiKey: string): boolean => {
  if (!apiKey.trim()) return false;

  switch (provider) {
    case "openai":
      return /^sk-[A-Za-z0-9]{48}$/.test(apiKey);
    case "anthropic":
      return /^sk-ant-[A-Za-z0-9-_]{48,}$/.test(apiKey);
    case "azure":
      return apiKey.length >= 32; // Azure keys vary in format
    default:
      return apiKey.length > 0;
  }
};

/**
 * 验证设置配置的完整性
 */
export const validateSettings = (
  settings: Partial<SettingsConfig>
): string[] => {
  const errors: string[] = [];

  if (settings.model?.apiKey && settings.model?.provider) {
    if (!validateApiKey(settings.model.provider, settings.model.apiKey)) {
      errors.push("API 密钥格式不正确");
    }
  }

  if (
    settings.general?.language &&
    !["zh-CN", "en-US", "ja-JP"].includes(settings.general.language)
  ) {
    errors.push("不支持的语言设置");
  }

  if (
    settings.display?.theme &&
    !["light", "dark", "auto"].includes(settings.display.theme)
  ) {
    errors.push("不支持的主题设置");
  }

  return errors;
};
