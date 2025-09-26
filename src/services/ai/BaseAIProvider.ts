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
   * 获取API端点URL
   * 在开发环境中使用代理路径避免CORS问题
   */
  protected getApiEndpoint(): string {
    // 检测是否为开发环境
    const isDev = import.meta.env.DEV;

    if (!isDev) {
      return this.config.apiEndpoint;
    }

    // 开发环境使用代理路径
    const providerProxyMap: Record<string, string> = {
      alibaba: "/api/alibaba",
      openai: "/api/openai",
      anthropic: "/api/anthropic",
      siliconflow: "/api/siliconflow",
    };

    return providerProxyMap[this.name] || this.config.apiEndpoint;
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
    const endpoint = this.getApiEndpoint();

    console.log(`🌐 [${this.name}] 发起请求:`, {
      endpoint,
      method: "POST",
      headers: { ...headers, Authorization: "Bearer ***" }, // 隐藏敏感信息
      bodyPreview: JSON.stringify(requestBody).substring(0, 200),
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    console.log(`📡 [${this.name}] 收到响应:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    return response;
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

    console.log(
      `🔍 [${this.name}] 开始处理流式响应，响应状态: ${response.status}`
    );

    try {
      while (true) {
        if (abortController.signal.aborted) {
          console.log(`🛑 [${this.name}] 流式响应已中止`);
          break;
        }

        try {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`✅ [${this.name}] 流式响应读取完成`);
            break;
          }

          const chunk = new TextDecoder().decode(value);
          console.log(
            `📦 [${this.name}] 接收到数据块:`,
            chunk.substring(0, 200) + (chunk.length > 200 ? "..." : "")
          );

          // 检查流是否完成
          if (this.responseParser.isStreamComplete(chunk)) {
            console.log(`🏁 [${this.name}] 检测到流结束标志`);
            break;
          }

          // 提取内容
          const deltaContent =
            this.responseParser.extractContentFromChunk(chunk);
          if (deltaContent) {
            console.log(
              `📝 [${this.name}] 提取到内容:`,
              deltaContent.substring(0, 100) +
                (deltaContent.length > 100 ? "..." : "")
            );
            fullMarkdown += deltaContent;
            const html = markdownConverter.convertStreamChunk(fullMarkdown);

            // 构建实时AI数据，包含当前的思维链信息
            const currentAIData = this.buildStreamingAIData(
              options,
              fullMarkdown,
              thinkingChain
            );
            options.onStream?.(html, currentAIData);
          } else {
            console.log(`⚠️ [${this.name}] 数据块中未提取到有效内容`);
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

              // 更新或创建思维链步骤 - 使用累积方式而非分段方式
              if (thinkingChain.length === 0) {
                // 创建第一个思维步骤
                thinkingChain.push({
                  id: `thinking_step_1`,
                  content: fullThinking,
                  timestamp: Date.now(),
                });
              } else {
                // 更新现有的思维步骤内容
                thinkingChain[0].content = fullThinking;
              }

              // 思维链数据更新时也要通知
              const html = markdownConverter.convertStreamChunk(fullMarkdown);
              const currentAIData = this.buildStreamingAIData(
                options,
                fullMarkdown,
                thinkingChain
              );
              options.onStream?.(html, currentAIData);
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
   * 构建流式生成过程中的AI数据
   * 与buildAIData类似，但标记为正在生成状态
   */
  protected buildStreamingAIData(
    options: AIGenerationOptions,
    fullMarkdown: string,
    thinkingChain: any[]
  ): AICustomProperties["ai"] {
    const aiData: AICustomProperties["ai"] = {
      generated: false, // 还在生成中
      model: options.model || this.config.defaultModel,
      provider: this.name,
      generatedAt: new Date().toISOString(),
      prompt: options.prompt,
      requestId: `req_${Date.now()}`,
      showThinking: this.config.supportsThinking, // 支持思维链就显示
      thinkingCollapsed: false, // 生成过程中默认展开
      isStreaming: true, // 正在流式生成
      originalMarkdown: fullMarkdown,
    };

    // 添加思维链数据（即使为空也添加结构）
    if (this.config.supportsThinking) {
      aiData.thinkingChain = {
        steps: thinkingChain,
        summary:
          thinkingChain.length > 0
            ? `已生成${thinkingChain.length}步推理`
            : "正在生成思维链",
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
