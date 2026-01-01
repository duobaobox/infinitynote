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
import type { CustomProviderConfig } from "./CustomProvider";

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
 * 内置提供商类型定义
 */
export type BuiltinProviderId =
  | "zhipu"
  | "deepseek"
  | "openai"
  | "alibaba"
  | "siliconflow"
  | "anthropic";

/**
 * 提供商类型定义（包含内置和自定义）
 */
export type ProviderId = BuiltinProviderId | `custom_${string}`;

/**
 * 检查是否为自定义提供商 ID
 */
export function isCustomProviderId(id: string): id is `custom_${string}` {
  return id.startsWith("custom_");
}

/**
 * 提供商注册表
 */
const PROVIDER_REGISTRY: Record<BuiltinProviderId, ProviderMetadata> = {
  zhipu: {
    id: "zhipu",
    name: "智谱AI",
    description: "国产AI模型，支持思维链",
    website: "https://open.bigmodel.cn",
    supportedModels: [
      // GLM-4.6（最新）
      "glm-4.6",
      // GLM-4.5 系列
      "glm-4.5-flash",
      "glm-4.5-air",
      "glm-4.5-x",
      "glm-4.5v",
      "glm-4.5",
      // GLM-4 系列
      "glm-4-plus",
      "glm-4-alltools",
      "glm-4",
    ] as const,
    defaultModel: "glm-4.6",
    supportsStreaming: true,
    supportsThinking: true,
    apiKeyPattern: /^[a-zA-Z0-9._-]{32,}$/,
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
    supportedModels: [
      "qwen3-max",
      "qwen-plus",
      "qwen-turbo",
      "qwen-max",
      "qwen-plus-2025-07-28",
      "qwen3-omni-flash",
      "deepseek-v3.1",
      "qwen-plus-instruct",
      "Moonshot-Kimi-K2-Instruct",
      "glm-4.5",
      "qwen-3-instruct",
      "qvq-max-2025-05-15",
      "qwen-flash-2025-07-28",
    ] as const,
    defaultModel: "qwen3-max",
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
      "deepseek-ai/DeepSeek-V3.1",
      "deepseek-ai/DeepSeek-R1",
      "deepseek-ai/DeepSeek-V3",
      "THUDM/GLM-4.1V-9B-Thinking",
      "moonshotai/Kimi-K2-Instruct-0905",
      "Qwen/Qwen3-Next-80B-A3B-Thinking",
      "Qwen/Qwen3-Next-80B-A3B-Instruct",
      "MiniMaxAI/MiniMax-M1-80k",
    ] as const,
    defaultModel: "deepseek-ai/DeepSeek-V3.1",
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
  /** 自定义提供商配置存储 */
  private customProviders = new Map<string, CustomProviderConfig>();
  /** 自定义提供商元数据缓存 */
  private customProviderMetadata = new Map<string, ProviderMetadata>();

  private constructor() {}

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * 获取所有内置提供商ID列表
   */
  getAllBuiltinProviderIds(): BuiltinProviderId[] {
    return Object.keys(PROVIDER_REGISTRY) as BuiltinProviderId[];
  }

  /**
   * 获取所有提供商ID列表（包含自定义）
   */
  getAllProviderIds(): ProviderId[] {
    const builtinIds = this.getAllBuiltinProviderIds();
    const customIds = Array.from(this.customProviders.keys()) as ProviderId[];
    return [...builtinIds, ...customIds];
  }

  /**
   * 获取提供商元数据（支持内置和自定义）
   */
  getProviderMetadata(providerId: ProviderId): ProviderMetadata {
    // 先检查是否为自定义提供商
    if (isCustomProviderId(providerId)) {
      const customMetadata = this.customProviderMetadata.get(providerId);
      if (!customMetadata) {
        throw new Error(`未找到自定义提供商: ${providerId}`);
      }
      return customMetadata;
    }

    // 内置提供商
    const metadata = PROVIDER_REGISTRY[providerId as BuiltinProviderId];
    if (!metadata) {
      throw new Error(`未知的提供商: ${providerId}`);
    }
    return metadata;
  }

  /**
   * 获取所有提供商元数据（包含自定义）
   */
  getAllProviderMetadata(): ProviderMetadata[] {
    const builtinMetadata = Object.values(PROVIDER_REGISTRY);
    const customMetadata = Array.from(this.customProviderMetadata.values());
    return [...builtinMetadata, ...customMetadata];
  }

  /**
   * 验证提供商ID是否有效（包含自定义提供商）
   */
  isValidProviderId(providerId: string): providerId is ProviderId {
    return providerId in PROVIDER_REGISTRY || this.customProviders.has(providerId);
  }

  /**
   * 检查是否为内置提供商
   */
  isBuiltinProvider(providerId: string): providerId is BuiltinProviderId {
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

    let provider: AIProvider;

    // 检查是否为自定义提供商
    if (isCustomProviderId(providerId)) {
      const customConfig = this.customProviders.get(providerId);
      if (!customConfig) {
        throw new Error(`未找到自定义提供商配置: ${providerId}`);
      }
      // 动态加载 CustomProvider
      const { CustomProvider } = await import("./CustomProvider");
      provider = new CustomProvider(customConfig);
    } else {
      // 内置提供商：动态加载
      const metadata = this.getProviderMetadata(providerId);
      const ProviderClass = await metadata.loader();
      provider = new ProviderClass();
    }

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

  // ==================== 自定义提供商管理 ====================

  /**
   * 注册自定义提供商
   */
  registerCustomProvider(config: CustomProviderConfig): void {
    // 验证 ID 格式
    if (!config.id.startsWith("custom_")) {
      throw new Error("自定义提供商 ID 必须以 'custom_' 开头");
    }

    // 存储配置
    this.customProviders.set(config.id, config);

    // 生成并缓存元数据
    const metadata = this.buildCustomProviderMetadata(config);
    this.customProviderMetadata.set(config.id, metadata);

    // 清除已加载的实例（如果存在），以便下次使用新配置
    this.loadedProviders.delete(config.id as ProviderId);

    console.log(`✅ 自定义提供商已注册: ${config.name} (${config.id})`);
  }

  /**
   * 注销自定义提供商
   */
  unregisterCustomProvider(providerId: string): boolean {
    if (!isCustomProviderId(providerId)) {
      console.warn(`尝试注销非自定义提供商: ${providerId}`);
      return false;
    }

    const existed = this.customProviders.delete(providerId);
    this.customProviderMetadata.delete(providerId);
    this.loadedProviders.delete(providerId as ProviderId);

    if (existed) {
      console.log(`✅ 自定义提供商已注销: ${providerId}`);
    }

    return existed;
  }

  /**
   * 获取所有自定义提供商配置
   */
  getAllCustomProviders(): CustomProviderConfig[] {
    return Array.from(this.customProviders.values());
  }

  /**
   * 获取单个自定义提供商配置
   */
  getCustomProvider(providerId: string): CustomProviderConfig | undefined {
    return this.customProviders.get(providerId);
  }

  /**
   * 更新自定义提供商配置
   */
  updateCustomProvider(providerId: string, updates: Partial<CustomProviderConfig>): boolean {
    const existing = this.customProviders.get(providerId);
    if (!existing) {
      return false;
    }

    const updated: CustomProviderConfig = {
      ...existing,
      ...updates,
      id: existing.id, // ID 不可更改
      updatedAt: new Date().toISOString(),
    };

    this.registerCustomProvider(updated);
    return true;
  }

  /**
   * 构建自定义提供商的元数据
   */
  private buildCustomProviderMetadata(config: CustomProviderConfig): ProviderMetadata {
    return {
      id: config.id,
      name: config.name,
      description: `自定义提供商 - ${config.baseUrl}`,
      website: config.baseUrl,
      supportedModels: config.models,
      defaultModel: config.defaultModel,
      supportsStreaming: true,
      supportsThinking: false,
      apiKeyPattern: /.*/, // 自定义提供商不强制验证密钥格式
      colors: {
        light: "#8c8c8c", // 自定义提供商使用灰色
        dark: "#a6a6a6",
      },
      loader: async () => {
        const { CustomProvider } = await import("./CustomProvider");
        return class extends CustomProvider {
          constructor() {
            super(config);
          }
        } as unknown as new () => AIProvider;
      },
    };
  }

  /**
   * 批量加载自定义提供商（用于应用启动时恢复）
   */
  loadCustomProviders(configs: CustomProviderConfig[]): void {
    for (const config of configs) {
      try {
        this.registerCustomProvider(config);
      } catch (error) {
        console.error(`加载自定义提供商失败: ${config.id}`, error);
      }
    }
    console.log(`✅ 已加载 ${configs.length} 个自定义提供商`);
  }

  /**
   * 获取自定义提供商的元数据
   */
  getCustomProviderMetadata(providerId: string): ProviderMetadata | undefined {
    return this.customProviderMetadata.get(providerId);
  }
}

// 导出单例实例
export const providerRegistry = ProviderRegistry.getInstance();
