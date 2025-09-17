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
  { value: "zhipu", label: "智谱AI", description: "国产AI模型，支持思维链" },
  {
    value: "deepseek",
    label: "深度求索",
    description: "高性能推理模型，支持思维链",
  },
  { value: "siliconflow", label: "硅基流动", description: "高性价比AI服务" },
  { value: "alibaba", label: "阿里百炼", description: "阿里云AI服务" },
  { value: "openai", label: "OpenAI", description: "GPT系列模型" },
  { value: "anthropic", label: "Anthropic", description: "Claude系列模型" },
] as const;

/**
 * 模型选项配置 - 按提供商分组
 */
export const MODEL_OPTIONS_BY_PROVIDER = {
  zhipu: [
    {
      value: "glm-4-plus",
      label: "GLM-4 Plus",
      description: "最新旗舰模型，支持思维链",
    },
    { value: "glm-4-0520", label: "GLM-4", description: "平衡性能与成本" },
    { value: "glm-4-air", label: "GLM-4 Air", description: "轻量级模型" },
    { value: "glm-4-airx", label: "GLM-4 AirX", description: "超快响应" },
    { value: "glm-4-flash", label: "GLM-4 Flash", description: "极速推理" },
  ],
  deepseek: [
    {
      value: "deepseek-chat",
      label: "DeepSeek Chat",
      description: "对话生成模型",
    },
    {
      value: "deepseek-reasoner",
      label: "DeepSeek Reasoner",
      description: "支持思维链的推理模型",
    },
  ],
  siliconflow: [
    {
      value: "deepseek-llm-67b-chat",
      label: "DeepSeek 67B",
      description: "大参数对话模型",
    },
    {
      value: "qwen-72b-chat",
      label: "通义千问 72B",
      description: "阿里大模型",
    },
    {
      value: "internlm2_5-7b-chat",
      label: "InternLM 7B",
      description: "上海AI实验室",
    },
  ],
  alibaba: [
    {
      value: "qwen-plus",
      label: "通义千问 Plus",
      description: "增强版对话模型",
    },
    {
      value: "qwen-turbo",
      label: "通义千问 Turbo",
      description: "快速响应版本",
    },
    { value: "qwen-max", label: "通义千问 Max", description: "顶级性能模型" },
  ],
  openai: [
    { value: "gpt-4", label: "GPT-4", description: "OpenAI旗舰模型" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "更快的GPT-4" },
    {
      value: "gpt-3.5-turbo",
      label: "GPT-3.5 Turbo",
      description: "经济实用选择",
    },
  ],
  anthropic: [
    {
      value: "claude-3-opus",
      label: "Claude-3 Opus",
      description: "最强推理能力",
    },
    {
      value: "claude-3-sonnet",
      label: "Claude-3 Sonnet",
      description: "平衡选择",
    },
    {
      value: "claude-3-haiku",
      label: "Claude-3 Haiku",
      description: "快速响应",
    },
  ],
} as const;

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
 * 画布颜色预设配置
 */
export const CANVAS_COLOR_PRESETS = [
  { name: "经典灰", value: "#f0f2f5", description: "默认淡雅灰色" },
  { name: "纯净白", value: "#ffffff", description: "纯净白色背景" },
  { name: "温暖米", value: "#faf8f5", description: "温暖米色调" },
  { name: "薄荷绿", value: "#f0f9f4", description: "清新薄荷绿" },
  { name: "天空蓝", value: "#f0f8ff", description: "清澈天空蓝" },
  { name: "紫罗兰", value: "#f8f4ff", description: "优雅紫罗兰" },
  { name: "桃花粉", value: "#fff0f6", description: "浪漫桃花粉" },
  { name: "深邃黑", value: "#1a1a1a", description: "专注深色模式" },
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
  provider: "zhipu" as const,
  apiKeys: {} as Record<string, string>,
  defaultModel: "glm-4-plus",
  temperature: 0.7,
  maxTokens: 4000,
  showThinking: true,
  autoSave: true,
  customEndpoints: {} as Record<string, string>,
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
  smoothZoom: false, // 默认关闭平滑缩放
  canvasColor: "#f0f2f5", // 默认画布颜色
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
