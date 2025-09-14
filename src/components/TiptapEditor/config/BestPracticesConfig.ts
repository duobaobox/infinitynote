/**
 * TipTap 官方最佳实践配置
 * 基于 TipTap v3.4+ 官方推荐配置
 */

import type { EditorOptions } from "@tiptap/core";
import type { ExtensionConfig } from "../extensions/index";

/**
 * TipTap 官方推荐的编辑器配置
 */
export const TIPTAP_BEST_PRACTICES_CONFIG: Partial<EditorOptions> = {
  // 性能优化
  shouldRerenderOnTransaction: false, // v3.4+ 推荐
  enableInputRules: true,
  enablePasteRules: true,
  enableCoreExtensions: true,

  // 可访问性
  parseOptions: {
    preserveWhitespace: "full",
  },

  // 编辑器属性
  editorProps: {
    attributes: {
      role: "textbox",
      "aria-multiline": "true",
      "aria-label": "富文本编辑器",
    },
    // 拖放处理
    handleDrop: (view, event, slice, moved) => {
      // 自定义拖放逻辑
      return false;
    },
    // 粘贴处理
    handlePaste: (view, event, slice) => {
      // 自定义粘贴逻辑
      return false;
    },
  },
};

/**
 * 生产环境优化配置
 */
export const PRODUCTION_OPTIMIZATIONS: Partial<EditorOptions> = {
  // 禁用开发工具
  enableDebugTools: false,

  // 减少不必要的重渲染
  shouldRerenderOnTransaction: false,

  // 优化解析选项
  parseOptions: {
    preserveWhitespace: false,
  },
};

/**
 * 开发环境调试配置
 */
export const DEVELOPMENT_CONFIG: Partial<EditorOptions> = {
  // 启用调试工具
  enableDebugTools: true,

  // 详细错误信息
  onError: ({ error, editor, event }) => {
    console.error("TipTap Error:", error);
    console.error("Editor State:", editor?.state);
    console.error("Event:", event);
  },
};

/**
 * 无障碍访问配置
 */
export const ACCESSIBILITY_CONFIG: Partial<EditorOptions> = {
  editorProps: {
    attributes: {
      role: "textbox",
      "aria-multiline": "true",
      "aria-label": "富文本编辑器",
      "aria-describedby": "editor-description",
    },
  },
};

/**
 * 协作编辑配置
 */
export const COLLABORATION_CONFIG: Partial<EditorOptions> = {
  // 协作相关配置
  enableCollaboration: true,

  // 冲突解决策略
  onTransaction: ({ transaction, editor }) => {
    // 处理协作事务
  },
};

/**
 * 移动端优化配置
 */
export const MOBILE_OPTIMIZATIONS: Partial<EditorOptions> = {
  editorProps: {
    attributes: {
      // 移动端输入优化
      inputmode: "text",
      autocorrect: "on",
      spellcheck: "true",
    },
  },
};

/**
 * 根据环境获取最佳配置
 */
export function getBestPracticesConfig(
  environment: "development" | "production" = "production",
  options: {
    accessibility?: boolean;
    collaboration?: boolean;
    mobile?: boolean;
  } = {}
): Partial<EditorOptions> {
  let config = { ...TIPTAP_BEST_PRACTICES_CONFIG };

  // 环境特定配置
  if (environment === "development") {
    config = { ...config, ...DEVELOPMENT_CONFIG };
  } else {
    config = { ...config, ...PRODUCTION_OPTIMIZATIONS };
  }

  // 可选功能配置
  if (options.accessibility) {
    config = { ...config, ...ACCESSIBILITY_CONFIG };
  }

  if (options.collaboration) {
    config = { ...config, ...COLLABORATION_CONFIG };
  }

  if (options.mobile) {
    config = { ...config, ...MOBILE_OPTIMIZATIONS };
  }

  return config;
}

/**
 * 推荐的扩展配置优先级
 */
export const EXTENSION_PRIORITY_ORDER: ExtensionConfig[] = [
  { name: "starterKit", enabled: true, priority: 1 },
  { name: "textStyle", enabled: true, priority: 2 },
  { name: "color", enabled: true, priority: 3 },
  { name: "textAlign", enabled: true, priority: 4 },
  // 用户自定义扩展应该有更高的优先级 (5+)
];

/**
 * 性能监控最佳实践
 */
export const PERFORMANCE_MONITORING = {
  // 推荐的防抖延迟
  DEBOUNCE_DELAY: 300,

  // 推荐的字符数限制
  MAX_CHARACTERS: 10000,

  // 推荐的历史记录深度
  HISTORY_DEPTH: 100,

  // 虚拟化阈值
  VIRTUALIZATION_THRESHOLD: 1000,
};
