/**
 * 基础AI提供商抽象类
 * 提供统一的AI提供商实现基础，减少代码重复
 *
 * 功能特性：
 * 1. 统一的API密钥管理
 * 2. 通用的错误处理机制
 * 3. 标准化的流式响应处理
 * 4. 可扩展的配置系统
 */

import type {
  AIProvider,
  AIGenerationOptions,
  AICustomProperties,
} from "../../types/ai";
import { markdownConverter } from "../../utils/markdownConverter";

/**
 * AI提供商配置接口
 */
export interface AIProviderConfig {
  /** API端点URL */
  apiEndpoint: string;
  /** 默认模型 */
  defaultModel: string;
  /** 支持的模型列表 */
  supportedModels: string[];
  /** 是否支持流式响应 */
  supportsStreaming: boolean;
  /** 是否支持思维链 */
  supportsThinking: boolean;
  /** 默认温度参数 */
  defaultTemperature?: number;
  /** 默认最大Token数 */
  defaultMaxTokens?: number;
}

/**
 * 请求体构建接口
 */
export interface RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any;
}

/**
 * 响应解析接口
 */
export interface ResponseParser {
  extractContentFromChunk(chunk: string): string;
  extractThinkingFromChunk?(chunk: string): string | null;
  isStreamComplete(chunk: string): boolean;
}

/**
 * 基础AI提供商抽象类
 * 所有AI提供商都应该继承此类
 */
export abstract class BaseAIProvider implements AIProvider {
  /** 提供商名称 */
  abstract readonly name: string;

  /** 提供商配置 */
  protected abstract readonly config: AIProviderConfig;

  /** 请求体构建器 */
  protected abstract readonly requestBuilder: RequestBodyBuilder;

  /** 响应解析器 */
  protected abstract readonly responseParser: ResponseParser;

  // 实现AIProvider接口
  get supportedModels(): string[] {
    return this.config.supportedModels;
  }

  get supportsStreaming(): boolean {
    return this.config.supportsStreaming;
  }

  get supportsThinking(): boolean {
    return this.config.supportsThinking;
  }

  /**
   * 生成内容的主要方法
   * 子类通常不需要重写此方法
   */
  async generateContent(options: AIGenerationOptions): Promise<void> {
    // 1. 获取API密钥
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error(`${this.name} API密钥未配置`);
    }

    // 2. 创建中止控制器
    const abortController = new AbortController();

    try {
      // 3. 构建请求
      const requestBody = this.requestBuilder.buildRequestBody(options);
      const response = await this.makeRequest(
        apiKey,
        requestBody,
        abortController
      );

      // 4. 处理响应
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // 5. 处理流式响应
      await this.handleStreamResponse(response, options, abortController);
    } catch (error) {
      this.handleError(error, options);
      throw error;
    }
  }

  /**
   * 获取API密钥
   * 使用统一的安全管理器
   */
  protected async getApiKey(): Promise<string | null> {
    // 动态导入SecurityManager以避免循环依赖
    const { SecurityManager } = await import("../aiService");
    const securityManager = SecurityManager.getInstance();
    return await securityManager.getAPIKey(this.name);
  }

  /**
   * 发起HTTP请求
   * 统一的请求处理逻辑
   */
  protected async makeRequest(
    apiKey: string,
    requestBody: any,
    abortController: AbortController
  ): Promise<Response> {
    const headers = this.buildHeaders(apiKey);

    return await fetch(this.config.apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });
  }

  /**
   * 构建请求头
   * 子类可以重写以自定义请求头
   */
  protected buildHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * 处理错误响应
   */
  protected async handleErrorResponse(response: Response): Promise<void> {
    const errorText = await response.text();
    throw new Error(
      `${this.name} API请求失败: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  /**
   * 处理流式响应
   * 统一的流式处理逻辑
   */
  protected async handleStreamResponse(
    response: Response,
    options: AIGenerationOptions,
    abortController: AbortController
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    let fullMarkdown = "";
    let fullThinking = "";
    const thinkingChain: any[] = [];
    let retryCount = 0;
    const maxRetries = 3;

    try {
      while (true) {
        if (abortController.signal.aborted) {
          break;
        }

        try {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);

          // 检查流是否完成
          if (this.responseParser.isStreamComplete(chunk)) {
            break;
          }

          // 提取内容
          const deltaContent =
            this.responseParser.extractContentFromChunk(chunk);
          if (deltaContent) {
            fullMarkdown += deltaContent;
            const html = markdownConverter.convertStreamChunk(fullMarkdown);
            options.onStream?.(html);
          }

          // 提取思维链（如果支持）
          if (
            this.config.supportsThinking &&
            this.responseParser.extractThinkingFromChunk
          ) {
            const thinking =
              this.responseParser.extractThinkingFromChunk(chunk);
            if (thinking) {
              fullThinking += thinking;
              thinkingChain.push({
                id: `step_${thinkingChain.length + 1}`,
                content: thinking,
                timestamp: Date.now(),
              });
            }
          }

          retryCount = 0; // 重置重试计数
        } catch (parseError) {
          console.warn(`解析${this.name}响应数据失败:`, parseError);
          retryCount++;
          if (retryCount > maxRetries) {
            throw new Error("连续解析失败，中止生成");
          }
        }
      }

      // 生成完成，构建最终数据
      if (!abortController.signal.aborted) {
        const finalHTML = markdownConverter.convertComplete(fullMarkdown);
        const aiData = this.buildAIData(options, fullMarkdown, thinkingChain);
        options.onComplete?.(finalHTML, aiData);
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 构建AI数据
   * 统一的AI数据构建逻辑
   */
  protected buildAIData(
    options: AIGenerationOptions,
    fullMarkdown: string,
    thinkingChain: any[]
  ): AICustomProperties["ai"] {
    const aiData: AICustomProperties["ai"] = {
      generated: true,
      model: options.model || this.config.defaultModel,
      provider: this.name,
      generatedAt: new Date().toISOString(),
      prompt: options.prompt,
      requestId: `req_${Date.now()}`,
      showThinking: this.config.supportsThinking && thinkingChain.length > 0,
      thinkingCollapsed: true,
      isStreaming: false,
      originalMarkdown: fullMarkdown,
    };

    // 添加思维链数据
    if (this.config.supportsThinking && thinkingChain.length > 0) {
      aiData.thinkingChain = {
        steps: thinkingChain,
        summary: `通过${thinkingChain.length}步推理完成`,
        totalSteps: thinkingChain.length,
      };
    }

    return aiData;
  }

  /**
   * 统一的错误处理
   */
  protected handleError(error: any, options: AIGenerationOptions): void {
    if (error instanceof Error && error.name === "AbortError") {
      console.log(`${this.name}生成已被中止`);
      return;
    }

    console.error(`${this.name} API调用失败:`, error);
    options.onError?.(error as Error);
  }
}
