/**
 * 设置模态框相关类型定义
 */

import type { ReactNode } from "react";

// ==================== 基础接口定义 ====================

/**
 * 设置模态框主组件属性
 */
export interface SettingsModalProps {
  /** 模态框是否可见 */
  open: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
}

/**
 * 设置菜单项配置
 */
export interface SettingMenuItem {
  /** 菜单项唯一标识 */
  key: SettingTabKey;
  /** 菜单项图标 */
  icon: ReactNode;
  /** 菜单项显示标签 */
  label: string;
}

/**
 * 设置选项卡类型
 */
export type SettingTabKey =
  | "model" // 模型服务
  | "general" // 常规设置
  | "display" // 显示设置
  | "data" // 数据设置
  | "shortcuts" // 快捷键
  | "cloud" // 云同步
  | "about"; // 关于我们

// ==================== 设置数据模型 ====================

/**
 * 模型服务设置
 */
export interface ModelSettings {
  /** API 提供商 */
  provider: "openai" | "anthropic" | "azure" | "local";
  /** API 密钥 */
  apiKey: string;
  /** 默认模型 */
  defaultModel: string;
  /** 自定义 API 端点 */
  customEndpoint?: string;
}

/**
 * 常规设置
 */
export interface GeneralSettings {
  /** 自动保存 */
  autoSave: boolean;
  /** 启动时恢复上次会话 */
  restoreSession: boolean;
  /** 系统通知 */
  systemNotifications: boolean;
  /** 界面语言 */
  language: "zh-CN" | "en-US" | "ja-JP";
}

/**
 * 显示设置
 */
export interface DisplaySettings {
  /** 主题模式 */
  theme: "light" | "dark" | "auto";
  /** 显示网格 */
  showGrid: boolean;
  /** 平滑缩放 */
  smoothZoom: boolean;
  /** 工具栏位置 */
  toolbarPosition: "left" | "right" | "top" | "bottom";
  /** 缩放显示位置 */
  zoomControlPosition:
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left";
}

/**
 * 数据设置
 */
export interface DataSettings {
  /** 存储使用情况 */
  storageUsed: string;
  /** 笔记数量 */
  noteCount: number;
  /** 最后备份时间 */
  lastBackupTime?: Date;
}

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  /** 快捷键名称 */
  name: string;
  /** 快捷键描述 */
  description: string;
  /** 快捷键组合 */
  keys: string;
  /** 是否可自定义 */
  customizable: boolean;
}

/**
 * 云同步设置
 */
export interface CloudSettings {
  /** 是否启用云同步 */
  enabled: boolean;
  /** 同步状态 */
  syncStatus: "idle" | "syncing" | "error";
  /** 上次同步时间 */
  lastSyncTime?: Date;
  /** 云服务提供商 */
  provider?: "icloud" | "google" | "dropbox";
}

/**
 * 应用信息
 */
export interface AppInfo {
  /** 应用名称 */
  name: string;
  /** 应用版本 */
  version: string;
  /** 应用描述 */
  description: string;
  /** 构建时间 */
  buildTime?: string;
}

// ==================== 完整设置对象 ====================

/**
 * 完整的设置配置对象
 */
export interface SettingsConfig {
  model: ModelSettings;
  general: GeneralSettings;
  display: DisplaySettings;
  data: DataSettings;
  shortcuts: ShortcutConfig[];
  cloud: CloudSettings;
  app: AppInfo;
}

// ==================== 设置操作相关 ====================

/**
 * 设置更新回调函数类型
 */
export type SettingUpdateCallback<T = any> = (key: string, value: T) => void;

/**
 * 设置导入导出格式
 */
export interface SettingsExportData {
  /** 导出时间 */
  exportTime: string;
  /** 应用版本 */
  appVersion: string;
  /** 设置数据 */
  settings: Partial<SettingsConfig>;
}

// ==================== 组件属性类型 ====================

/**
 * 设置内容区域组件属性
 */
export interface SettingContentProps {
  /** 当前选中的标签页 */
  activeTab: SettingTabKey;
  /** 设置数据 */
  settings: SettingsConfig;
  /** 设置更新回调 */
  onSettingChange: SettingUpdateCallback;
}

/**
 * 设置项组件属性
 */
export interface SettingItemProps {
  /** 设置项标题 */
  title: string;
  /** 设置项描述 */
  description?: string;
  /** 子元素 */
  children: ReactNode;
  /** 是否垂直布局 */
  vertical?: boolean;
}

/**
 * 设置分组组件属性
 */
export interface SettingGroupProps {
  /** 分组标题 */
  title: string;
  /** 子元素 */
  children: ReactNode;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
}
