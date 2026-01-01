/**
 * 自定义 AI 提供商实现
 * 支持 OpenAI 兼容的第三方 API 端点
 *
 * 功能特性：
 * 1. 支持用户自定义 API 端点
 * 2. 使用 OpenAI 兼容的请求/响应格式
 * 3. 支持动态模型列表
 * 4. 在运行时动态配置
 */

import { BaseAIProvider } from "./BaseAIProvider";
import type {
  AIProviderConfig,
  RequestBodyBuilder,
  ResponseParser,
} from "./BaseAIProvider";
import type { AIGenerationOptions } from "../../types/ai";

/**
 * 自定义提供商配置接口
 */
export interface CustomProviderConfig {
  /** 唯一标识 (custom_xxx) */
  id: string;
  /** 显示名称 */
  name: string;
  /** API 端点 URL */
  baseUrl: string;
  /** API 密钥（可选，部分本地服务不需要） */
  apiKey?: string;
  /** 支持的模型列表 */
  models: string[];
  /** 默认模型 */
  defaultModel: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * OpenAI 兼容的请求体构建器
 */
class CustomRequestBuilder implements RequestBodyBuilder {
  constructor(private defaultModel: string) {}

  buildRequestBody(options: AIGenerationOptions): any {
    return {
      model: options.model || this.defaultModel,
      messages: [
        {
          role: "user",
          content: options.prompt,
        },
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 3500,
      stream: options.stream !== false, // 默认启用流式
    };
  }
}

/**
 * OpenAI 兼容的响应解析器
 */
class CustomResponseParser implements ResponseParser {
  /**
   * 从 SSE 数据块中提取内容
   */
  extractContentFromChunk(chunk: string): string {
    let content = "";

    // 按行分割，处理 SSE 格式
    const lines = chunk.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith(":")) {
        continue;
      }

      // 处理 data: 前缀
      if (trimmedLine.startsWith("data:")) {
        const dataContent = trimmedLine.slice(5).trim();

        // 检查是否是结束标志
        if (dataContent === "[DONE]") {
          continue;
        }

        try {
          const json = JSON.parse(dataContent);

          // OpenAI 格式：choices[0].delta.content
          if (json.choices?.[0]?.delta?.content) {
            content += json.choices[0].delta.content;
          }
          // 也支持 choices[0].message.content（非流式）
          else if (json.choices?.[0]?.message?.content) {
            content += json.choices[0].message.content;
          }
        } catch {
          // 忽略解析错误，可能是不完整的数据块
        }
      }
    }

    return content;
  }

  /**
   * 从数据块中提取思维链内容（如果支持）
   */
  extractThinkingFromChunk(chunk: string): string | null {
    // OpenAI 标准 API 不支持思维链
    // 但某些兼容服务可能会通过特殊字段传递
    try {
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const dataContent = line.slice(5).trim();
          if (dataContent === "[DONE]") continue;

          const json = JSON.parse(dataContent);

          // 检查是否有思维链字段（非标准，但某些服务可能支持）
          if (json.choices?.[0]?.delta?.reasoning_content) {
            return json.choices[0].delta.reasoning_content;
          }
          if (json.choices?.[0]?.delta?.thinking) {
            return json.choices[0].delta.thinking;
          }
        }
      }
    } catch {
      // 忽略错误
    }

    return null;
  }

  /**
   * 检查流是否完成
   */
  isStreamComplete(chunk: string): boolean {
    return chunk.includes("data: [DONE]") || chunk.includes('"finish_reason":"stop"');
  }
}

/**
 * 自定义 AI 提供商类
 * 支持 OpenAI 兼容的第三方 API
 */
export class CustomProvider extends BaseAIProvider {
  readonly name: string;
  protected readonly config: AIProviderConfig;
  protected readonly requestBuilder: RequestBodyBuilder;
  protected readonly responseParser: ResponseParser;

  /** 自定义的 API 端点 */
  private customBaseUrl: string;
  /** 自定义的 API 密钥 */
  private customApiKey?: string;

  constructor(providerConfig: CustomProviderConfig) {
    super();

    this.name = providerConfig.id; // 使用 id 作为内部名称
    this.customBaseUrl = providerConfig.baseUrl;
    this.customApiKey = providerConfig.apiKey;

    // 配置
    this.config = {
      apiEndpoint: this.normalizeEndpoint(providerConfig.baseUrl),
      defaultModel: providerConfig.defaultModel,
      supportedModels: providerConfig.models,
      supportsStreaming: true,
      supportsThinking: false, // OpenAI 兼容 API 通常不支持思维链
    };

    this.requestBuilder = new CustomRequestBuilder(providerConfig.defaultModel);
    this.responseParser = new CustomResponseParser();
  }

  /**
   * 规范化 API 端点
   * 智能处理各种 URL 格式，支持：
   * - http://localhost:1234 → http://localhost:1234/v1/chat/completions
   * - http://localhost:1234/v1 → http://localhost:1234/v1/chat/completions
   * - https://api.example.com/v4 → https://api.example.com/v4/chat/completions
   * - https://api.example.com/v1/chat/completions → 不变
   */
  private normalizeEndpoint(baseUrl: string): string {
    let url = baseUrl.trim();

    // 移除末尾的斜杠
    url = url.replace(/\/+$/, "");

    // 如果已经包含 /chat/completions，不做处理
    if (url.includes("/chat/completions")) {
      return url;
    }

    // 检查是否已有版本路径（如 /v1, /v4 等）
    const versionMatch = url.match(/\/v\d+$/);
    if (versionMatch) {
      // 已有版本路径，只添加 /chat/completions
      return url + "/chat/completions";
    }

    // 没有版本路径，添加完整的 /v1/chat/completions
    return url + "/v1/chat/completions";
  }

  /**
   * 重写获取 API 端点的方法
   * 自定义提供商直接使用用户配置的端点
   */
  protected getApiEndpoint(): string {
    return this.config.apiEndpoint;
  }

  /**
   * 重写获取 API 密钥的方法
   * 优先使用实例配置的密钥，否则从安全存储获取
   */
  protected async getApiKey(): Promise<string | null> {
    // 如果实例有配置密钥，直接使用
    if (this.customApiKey) {
      return this.customApiKey;
    }

    // 否则尝试从安全存储获取
    try {
      const { SecurityManager } = await import("../aiService");
      const securityManager = SecurityManager.getInstance();
      return await securityManager.getAPIKey(this.name);
    } catch {
      return null;
    }
  }

  /**
   * 重写构建请求头的方法
   * 某些本地服务（如 LMStudio）不需要 API 密钥
   */
  protected buildHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 只有在有密钥时才添加 Authorization 头
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    return headers;
  }

  /**
   * 更新提供商配置
   * 用于在运行时更新 API 端点或密钥
   */
  updateConfig(config: Partial<CustomProviderConfig>): void {
    if (config.baseUrl) {
      this.customBaseUrl = config.baseUrl;
      (this.config as any).apiEndpoint = this.normalizeEndpoint(config.baseUrl);
    }
    if (config.apiKey !== undefined) {
      this.customApiKey = config.apiKey;
    }
    if (config.models) {
      (this.config as any).supportedModels = config.models;
    }
    if (config.defaultModel) {
      (this.config as any).defaultModel = config.defaultModel;
    }
  }

  /**
   * 获取当前配置的 Base URL
   */
  getBaseUrl(): string {
    return this.customBaseUrl;
  }
}

/**
 * 创建自定义提供商实例的工厂函数
 */
export function createCustomProvider(config: CustomProviderConfig): CustomProvider {
  return new CustomProvider(config);
}
