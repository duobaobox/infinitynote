/**
 * SettingsModal 类型定义文件
 *
 * 功能说明：
 * 定义 SettingsModal 组件及其子组件所需的所有 TypeScript 类型接口。
 * 包含设置数据模型、组件属性接口、枚举类型等完整的类型系统。
 *
 * 主要类型：
 * - SettingsModalProps: 主组件属性接口
 * - SettingsConfig: 完整设置配置数据结构
 * - ModelSettings: 模型服务设置
 * - GeneralSettings: 常规应用设置
 * - DisplaySettings: 界面显示设置
 * - DataSettings: 数据管理设置
 * - CloudSettings: 云同步设置
 * - ShortcutConfig: 快捷键配置
 * - AppInfo: 应用信息
 *
 * 设计原则：
 * - 类型安全：严格的类型约束，避免运行时错误
 * - 可扩展性：便于添加新的设置项和模块
 * - 向后兼容：支持设置数据的版本迁移
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
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
  /** 初始打开的标签页（可选） */
  initialTab?: SettingTabKey;
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
  | "prompt-templates" // AI提示词模板
  | "cloud" // 云同步
  | "about"; // 关于我们

// ==================== 设置数据模型 ====================

/**
 * 模型服务设置
 */
export interface ModelSettings {
  /** API 提供商 */
  provider:
    | "zhipu"
    | "openai"
    | "anthropic"
    | "deepseek"
    | "siliconflow"
    | "alibaba";
  /** API 密钥映射 */
  apiKeys: Record<string, string>;
  /** 默认模型 */
  defaultModel: string;
  /** 生成参数 */
  temperature: number;
  /** 最大生成长度 */
  maxTokens: number;
  /** 是否显示思维链 */
  showThinking: boolean;
  /** @internal 是否自动保存AI生成的内容 - 系统内部使用，不再暴露给用户 */
  autoSave: boolean;
  /** 自定义API端点映射 */
  customEndpoints?: Record<string, string>;
}

/**
 * 常规设置
 */
export interface GeneralSettings {
  /** @internal 自动保存 - 系统内部使用，不再暴露给用户 */
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
  /** 画布背景颜色 */
  canvasColor: string;
}

/**
 * 便签设置
 */
export interface NoteSettings {
  /** 默认便签宽度 */
  defaultWidth: number;
  /** 默认便签高度 */
  defaultHeight: number;
  /** 便签透明度 */
  noteOpacity: number;
  /** 随机颜色 */
  randomColor: boolean;
}

/**
 * 数据设置
 */
export interface DataSettings {
  /** 存储使用情况 */
  storageUsed: string;
  /** 笔记数量 */
  noteCount: number;
  /** 画布数量 */
  canvasCount?: number;
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
  note: NoteSettings;
  data: DataSettings;
  shortcuts: ShortcutConfig[];
  cloud: CloudSettings;
  app: AppInfo;
}

// ==================== 设置操作相关 ====================

/**
 * 设置更新回调函数类型
 */
export type SettingUpdateCallback<T = string | boolean | number> = (
  key: string,
  value: T
) => void;

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
