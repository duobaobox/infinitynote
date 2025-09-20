/**
 * AI提供商注册中心
 * 统一管理所有AI提供商的元数据和加载逻辑
 *
 * 功能特性：
 * 1. 类型安全的提供商管理
 * 2. 统一的元数据配置
 * 3. 插件化的扩展机制
 * 4. 自动化的提供商发现
 */

import type { AIProvider } from "../../types/ai";

/**
 * 提供商元数据接口
 */
export interface ProviderMetadata {
  /** 提供商唯一标识 */
  readonly id: string;
  /** 显示名称 */
  readonly name: string;
  /** 描述信息 */
  readonly description: string;
  /** 官网链接 */
  readonly website?: string;
  /** 支持的模型列表 */
  readonly supportedModels: readonly string[];
  /** 默认模型 */
  readonly defaultModel: string;
  /** 是否支持流式响应 */
  readonly supportsStreaming: boolean;
  /** 是否支持思维链 */
  readonly supportsThinking: boolean;
  /** API密钥验证正则 */
  readonly apiKeyPattern: RegExp;
  /** 提供商颜色主题 */
  readonly colors: {
    light: string;
    dark: string;
  };
  /** 加载器函数 */
  readonly loader: () => Promise<new () => AIProvider>;
}

/**
 * 提供商类型定义
 */
export type ProviderId =
  | "zhipu"
  | "deepseek"
  | "openai"
  | "alibaba"
  | "siliconflow"
  | "anthropic";

/**
 * 提供商注册表
 */
const PROVIDER_REGISTRY: Record<ProviderId, ProviderMetadata> = {
  zhipu: {
    id: "zhipu",
    name: "智谱AI",
    description: "国产AI模型，支持思维链",
    website: "https://open.bigmodel.cn",
    supportedModels: [
      "glm-4-plus",
      "glm-4-0520",
      "glm-4-air",
      "glm-4-airx",
      "glm-4-flash",
    ] as const,
    defaultModel: "glm-4-plus",
    supportsStreaming: true,
    supportsThinking: true,
    apiKeyPattern: /^[a-zA-Z0-9]{32,}$/,
    colors: {
      light: "#1890ff",
      dark: "#3c9ae8",
    },
    loader: () => import("./ZhipuAIProvider").then((m) => m.ZhipuAIProvider),
  },

  deepseek: {
    id: "deepseek",
    name: "深度求索",
    description: "高性能推理模型，支持思维链",
    website: "https://platform.deepseek.com",
    supportedModels: ["deepseek-chat", "deepseek-reasoner"] as const,
    defaultModel: "deepseek-chat",
    supportsStreaming: true,
    supportsThinking: true,
    apiKeyPattern: /^sk-[a-zA-Z0-9]{32,}$/,
    colors: {
      light: "#722ed1",
      dark: "#9254de",
    },
    loader: () => import("./DeepSeekProvider").then((m) => m.DeepSeekProvider),
  },

  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT系列模型",
    website: "https://platform.openai.com",
    supportedModels: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] as const,
    defaultModel: "gpt-4",
    supportsStreaming: true,
    supportsThinking: false,
    apiKeyPattern: /^sk-[a-zA-Z0-9]{48}$/,
    colors: {
      light: "#10a37f",
      dark: "#2eb88a",
    },
    loader: () => import("./OpenAIProvider").then((m) => m.OpenAIProvider),
  },

  alibaba: {
    id: "alibaba",
    name: "阿里百炼",
    description: "阿里云AI服务",
    website: "https://dashscope.aliyuncs.com",
    supportedModels: ["qwen-plus", "qwen-turbo", "qwen-max"] as const,
    defaultModel: "qwen-plus",
    supportsStreaming: true,
    supportsThinking: false,
    apiKeyPattern: /^sk-[a-zA-Z0-9]{20,}$/,
    colors: {
      light: "#ff7a00",
      dark: "#ff9a3e",
    },
    loader: () => import("./AlibabaProvider").then((m) => m.AlibabaProvider),
  },

  siliconflow: {
    id: "siliconflow",
    name: "硅基流动",
    description: "高性价比AI服务",
    website: "https://siliconflow.cn",
    supportedModels: [
      "deepseek-llm-67b-chat",
      "qwen-72b-chat",
      "internlm2_5-7b-chat",
    ] as const,
    defaultModel: "deepseek-llm-67b-chat",
    supportsStreaming: true,
    supportsThinking: false,
    apiKeyPattern: /^sk-[a-zA-Z0-9]{32,}$/,
    colors: {
      light: "#13c2c2",
      dark: "#36cfc9",
    },
    loader: () =>
      import("./SiliconFlowProvider").then((m) => m.SiliconFlowProvider),
  },

  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude系列模型",
    website: "https://console.anthropic.com",
    supportedModels: [
      "claude-3-opus",
      "claude-3-sonnet",
      "claude-3-haiku",
    ] as const,
    defaultModel: "claude-3-sonnet",
    supportsStreaming: true,
    supportsThinking: false,
    apiKeyPattern: /^sk-ant-api03-[a-zA-Z0-9\-_]{93}$/,
    colors: {
      light: "#eb2f96",
      dark: "#f759ab",
    },
    loader: () =>
      import("./AnthropicProvider").then((m) => m.AnthropicProvider),
  },
} as const;

/**
 * 提供商注册中心类
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private loadedProviders = new Map<ProviderId, AIProvider>();

  private constructor() {}

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * 获取所有提供商ID列表
   */
  getAllProviderIds(): ProviderId[] {
    return Object.keys(PROVIDER_REGISTRY) as ProviderId[];
  }

  /**
   * 获取提供商元数据
   */
  getProviderMetadata(providerId: ProviderId): ProviderMetadata {
    const metadata = PROVIDER_REGISTRY[providerId];
    if (!metadata) {
      throw new Error(`未知的提供商: ${providerId}`);
    }
    return metadata;
  }

  /**
   * 获取所有提供商元数据
   */
  getAllProviderMetadata(): ProviderMetadata[] {
    return Object.values(PROVIDER_REGISTRY);
  }

  /**
   * 验证提供商ID是否有效
   */
  isValidProviderId(providerId: string): providerId is ProviderId {
    return providerId in PROVIDER_REGISTRY;
  }

  /**
   * 验证API密钥格式
   */
  validateApiKey(providerId: ProviderId, apiKey: string): boolean {
    const metadata = this.getProviderMetadata(providerId);
    return metadata.apiKeyPattern.test(apiKey);
  }

  /**
   * 懒加载提供商实例
   */
  async loadProvider(providerId: ProviderId): Promise<AIProvider> {
    // 检查是否已加载
    if (this.loadedProviders.has(providerId)) {
      return this.loadedProviders.get(providerId)!;
    }

    // 动态加载
    const metadata = this.getProviderMetadata(providerId);
    const ProviderClass = await metadata.loader();
    const provider = new ProviderClass();

    // 缓存实例
    this.loadedProviders.set(providerId, provider);

    console.log(`✅ 提供商 ${providerId} 加载完成`);
    return provider;
  }

  /**
   * 获取提供商的默认模型
   */
  getDefaultModel(providerId: ProviderId): string {
    return this.getProviderMetadata(providerId).defaultModel;
  }

  /**
   * 获取提供商支持的模型列表
   */
  getSupportedModels(providerId: ProviderId): readonly string[] {
    return this.getProviderMetadata(providerId).supportedModels;
  }

  /**
   * 获取提供商颜色
   */
  getProviderColor(
    providerId: ProviderId,
    theme: "light" | "dark" = "light"
  ): string {
    return this.getProviderMetadata(providerId).colors[theme];
  }

  /**
   * 检查提供商是否支持思维链
   */
  supportsThinking(providerId: ProviderId): boolean {
    return this.getProviderMetadata(providerId).supportsThinking;
  }

  /**
   * 检查提供商是否支持流式响应
   */
  supportsStreaming(providerId: ProviderId): boolean {
    return this.getProviderMetadata(providerId).supportsStreaming;
  }
}

// 导出单例实例
export const providerRegistry = ProviderRegistry.getInstance();
