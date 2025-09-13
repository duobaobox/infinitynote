/**
 * SettingsModal 常量配置文件
 *
 * 功能说明：
 * 定义 SettingsModal 组件使用的所有常量配置，包括菜单配置、选项列表、
 * 默认值、快捷键定义、应用信息等。集中管理常量便于维护和修改。
 *
 * 主要常量：
 * - MENU_ITEMS: 左侧导航菜单配置
 * - API_PROVIDERS: API 提供商选项
 * - MODEL_OPTIONS: 模型选择选项
 * - LANGUAGE_OPTIONS: 语言选择选项
 * - THEME_OPTIONS: 主题选择选项
 * - TOOLBAR_POSITION_OPTIONS: 工具栏位置选项
 * - ZOOM_POSITION_OPTIONS: 缩放控制位置选项
 * - EDIT_SHORTCUTS: 编辑快捷键列表
 * - VIEW_SHORTCUTS: 视图快捷键列表
 * - DEFAULT_*_SETTINGS: 各模块默认设置值
 * - APP_INFO: 应用基本信息
 * - STORAGE_KEYS: 本地存储键名
 * - MODAL_CONFIG: 模态框尺寸配置
 *
 * 设计原则：
 * - 集中管理：所有常量统一定义，便于维护
 * - 类型安全：使用 TypeScript 的 const assertions
 * - 可配置性：支持通过修改常量调整界面行为
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import type { SettingMenuItem, ShortcutConfig, AppInfo } from "./types";
import React from "react";
import {
  SettingOutlined,
  RobotOutlined,
  EyeOutlined,
  DatabaseOutlined,
  KeyOutlined,
  CloudOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

// ==================== 菜单配置 ====================

/**
 * 左侧菜单配置
 */
export const MENU_ITEMS: SettingMenuItem[] = [
  { key: "model", icon: React.createElement(RobotOutlined), label: "模型服务" },
  {
    key: "general",
    icon: React.createElement(SettingOutlined),
    label: "常规设置",
  },
  { key: "display", icon: React.createElement(EyeOutlined), label: "显示设置" },
  {
    key: "data",
    icon: React.createElement(DatabaseOutlined),
    label: "数据设置",
  },
  { key: "shortcuts", icon: React.createElement(KeyOutlined), label: "快捷键" },
  { key: "cloud", icon: React.createElement(CloudOutlined), label: "云同步" },
  {
    key: "about",
    icon: React.createElement(InfoCircleOutlined),
    label: "关于我们",
  },
];

// ==================== 选项配置 ====================

/**
 * API 提供商选项
 */
export const API_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "local", label: "本地模型" },
] as const;

/**
 * 模型选项配置
 */
export const MODEL_OPTIONS = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3", label: "Claude-3" },
] as const;

/**
 * 语言选项配置
 */
export const LANGUAGE_OPTIONS = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en-US", label: "English" },
  { value: "ja-JP", label: "日本語" },
] as const;

/**
 * 主题选项配置
 */
export const THEME_OPTIONS = [
  { value: "light", label: "浅色模式" },
  { value: "dark", label: "深色模式" },
  { value: "auto", label: "跟随系统" },
] as const;

/**
 * 工具栏位置选项
 */
export const TOOLBAR_POSITION_OPTIONS = [
  { value: "left", label: "左侧" },
  { value: "right", label: "右侧" },
  { value: "top", label: "顶部" },
  { value: "bottom", label: "底部" },
] as const;

/**
 * 缩放控制位置选项
 */
export const ZOOM_POSITION_OPTIONS = [
  { value: "bottom-right", label: "右下角" },
  { value: "bottom-left", label: "左下角" },
  { value: "top-right", label: "右上角" },
  { value: "top-left", label: "左上角" },
] as const;

// ==================== 快捷键配置 ====================

/**
 * 编辑快捷键配置
 */
export const EDIT_SHORTCUTS: ShortcutConfig[] = [
  {
    name: "newNote",
    description: "新建笔记",
    keys: "⌘ + N",
    customizable: true,
  },
  {
    name: "save",
    description: "保存",
    keys: "⌘ + S",
    customizable: false,
  },
  {
    name: "undo",
    description: "撤销",
    keys: "⌘ + Z",
    customizable: false,
  },
  {
    name: "redo",
    description: "重做",
    keys: "⌘ + ⇧ + Z",
    customizable: false,
  },
];

/**
 * 视图快捷键配置
 */
export const VIEW_SHORTCUTS: ShortcutConfig[] = [
  {
    name: "zoomIn",
    description: "放大",
    keys: "⌘ + =",
    customizable: true,
  },
  {
    name: "zoomOut",
    description: "缩小",
    keys: "⌘ + -",
    customizable: true,
  },
  {
    name: "fitToWindow",
    description: "适应窗口",
    keys: "⌘ + 0",
    customizable: true,
  },
];

// ==================== 应用信息 ====================

/**
 * 应用基本信息
 */
export const APP_INFO: AppInfo = {
  name: "InfinityNote",
  version: "v1.5.7",
  description: "一款为创意者提供的 AI 助手",
  buildTime: new Date().toISOString(),
};

// ==================== 默认设置值 ====================

/**
 * 默认模型设置
 */
export const DEFAULT_MODEL_SETTINGS = {
  provider: "openai" as const,
  apiKey: "",
  defaultModel: "gpt-4",
  customEndpoint: "",
};

/**
 * 默认常规设置
 */
export const DEFAULT_GENERAL_SETTINGS = {
  autoSave: true,
  restoreSession: true,
  systemNotifications: false,
  language: "zh-CN" as const,
};

/**
 * 默认显示设置
 */
export const DEFAULT_DISPLAY_SETTINGS = {
  theme: "light" as const,
  showGrid: true,
  smoothZoom: true,
  toolbarPosition: "right" as const,
  zoomControlPosition: "bottom-right" as const,
};

/**
 * 默认云同步设置
 */
export const DEFAULT_CLOUD_SETTINGS = {
  enabled: false,
  syncStatus: "idle" as const,
  lastSyncTime: undefined,
  provider: undefined,
};

// ==================== 存储键名 ====================

/**
 * LocalStorage 存储键名
 */
export const STORAGE_KEYS = {
  SETTINGS: "infinitynote_settings",
  MODEL_CONFIG: "infinitynote_model_config",
  UI_PREFERENCES: "infinitynote_ui_preferences",
} as const;

// ==================== 模态框配置 ====================

/**
 * 模态框尺寸配置
 */
export const MODAL_CONFIG = {
  WIDTH: "80vw",
  HEIGHT: "80vh",
  HEADER_HEIGHT: 55,
  SIDEBAR_WIDTH: 200,
  CONTENT_PADDING: 24,
} as const;
