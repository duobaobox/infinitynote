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
import { AIGenerationPhase } from "../../types/ai";
import { ThinkingChainDetector } from "../../utils/thinkingChainDetector";

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
        abortController,
        {
          noteId: options.noteId,
          prompt: options.prompt,
        }
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
    abortController: AbortController,
    options?: { noteId?: string; prompt?: string }
  ): Promise<Response> {
    const headers = this.buildHeaders(apiKey);
    const endpoint = this.getApiEndpoint();
    const requestStartTime = Date.now();

    // 生成请求ID用于关联请求和响应
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log(`🌐 [${this.name}] 发起请求:`, {
      endpoint,
      method: "POST",
      headers: { ...headers, Authorization: "Bearer ***" }, // 隐藏敏感信息
      bodyPreview: JSON.stringify(requestBody).substring(0, 200),
    });

    // 记录API请求到测试面板
    try {
      const { useTestPanelStore } = await import("../../store/testPanelStore");
      const testPanelStore = useTestPanelStore.getState();

      const bodyString = JSON.stringify(requestBody, null, 2);
      const sessionId = `session_${options?.noteId}_${Date.now()}`;

      testPanelStore.addRequest({
        id: requestId,
        timestamp: requestStartTime,
        provider: this.name,
        model: requestBody.model || "unknown",
        endpoint,
        method: "POST",
        headers: { ...headers, Authorization: "Bearer ***" }, // 隐藏敏感信息
        body: bodyString,
        prompt:
          options?.prompt || requestBody.messages?.[0]?.content || "unknown",
        noteId: options?.noteId || "unknown",
        // 增强字段
        requestSize: new Blob([bodyString]).size,
        userAgent: navigator.userAgent,
        sessionId,
      });
    } catch (error) {
      console.warn("记录API请求到测试面板失败:", error);
    }

    // 增加超时机制，30秒未响应自动中断 - 针对AI生成请求需要更长的超时时间
    const fetchPromise = fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        abortController.abort();
        reject(new Error("请求超时（5分钟）"));
      }, 300000); // 增加到5分钟以适应复杂AI生成
    });

    let response: Response;
    let responseBody = "";

    try {
      response = await Promise.race([fetchPromise, timeoutPromise]);

      // 对于流式响应，不尝试读取完整响应体，而是记录流式响应信息
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        responseBody = `流式响应 - Content-Type: ${response.headers.get(
          "content-type"
        )}`;
        console.log(`📡 [${this.name}] 检测到流式响应，跳过完整体读取`);
      } else {
        // 对于非流式响应，尝试读取完整body
        const responseClone = response.clone();
        try {
          responseBody = await responseClone.text();
        } catch (bodyError) {
          console.warn("读取响应体失败:", bodyError);
          responseBody = "读取响应体失败";
        }
      }

      console.log(`📡 [${this.name}] 收到响应:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // 记录API响应到测试面板
      try {
        const { useTestPanelStore } = await import(
          "../../store/testPanelStore"
        );
        const testPanelStore = useTestPanelStore.getState();

        // 尝试解析token信息
        let tokenInfo = {};
        try {
          const parsedBody = JSON.parse(responseBody);
          if (parsedBody.usage) {
            tokenInfo = {
              totalTokens: parsedBody.usage.total_tokens,
              promptTokens: parsedBody.usage.prompt_tokens,
              completionTokens: parsedBody.usage.completion_tokens,
            };
          }
        } catch {}

        testPanelStore.addResponse({
          id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          timestamp: Date.now(),
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          duration: Date.now() - requestStartTime,
          success: response.ok,
          error: response.ok
            ? undefined
            : `HTTP ${response.status}: ${response.statusText}`,
          // 增强字段
          responseSize: new Blob([responseBody]).size,
          firstByteTime: Date.now() - requestStartTime, // 首字节时间近似等于总响应时间
          ...tokenInfo,
        });
      } catch (error) {
        console.warn("记录API响应到测试面板失败:", error);
      }

      return response;
    } catch (error) {
      // 记录错误响应到测试面板
      try {
        const { useTestPanelStore } = await import(
          "../../store/testPanelStore"
        );
        const testPanelStore = useTestPanelStore.getState();

        testPanelStore.addResponse({
          id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId,
          timestamp: Date.now(),
          status: 0,
          statusText: "Network Error",
          headers: {},
          body: "",
          duration: Date.now() - requestStartTime,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          responseSize: 0, // 网络错误时响应大小为0
        });
      } catch (recordError) {
        console.warn("记录错误响应到测试面板失败:", recordError);
      }

      throw error;
    }
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

    // 生成阶段追踪
    let currentPhase: AIGenerationPhase = AIGenerationPhase.INITIALIZING;
    let thinkingPhaseCompleted = false;
    let lastThinkingUpdateTime = Date.now();

    // 性能监控数据
    const streamStartTime = Date.now();
    let firstChunkTime: number | null = null;
    let streamingSteps = 0;
    let totalChunkSize = 0;
    let errorCount = 0;

    console.log(
      `🔍 [${this.name}] 开始处理流式响应，响应状态: ${response.status}`
    );
    console.log(
      `🔍 [${this.name}] 响应头 Content-Type: ${response.headers.get(
        "content-type"
      )}`
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

          // 记录性能数据
          if (firstChunkTime === null) {
            firstChunkTime = Date.now();
          }
          streamingSteps++;
          totalChunkSize += chunk.length;

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

            // 将 Markdown 转换为 HTML 以供编辑器显示
            const MarkdownItConstructor = await import("markdown-it");
            const md = new MarkdownItConstructor.default({
              html: false,
              breaks: true,
              linkify: true,
              typographer: true,
              quotes: "\"\"''",
            });
            const html = md.render(fullMarkdown);

            // 构建实时AI数据，包含当前的思维链信息
            const currentAIData = this.buildStreamingAIData(
              options,
              thinkingChain,
              currentPhase
            );
            options.onStream?.(html, currentAIData);
          } else {
            console.log(`⚠️ [${this.name}] 数据块中未提取到有效内容`);
          }

          // 提取思维链内容 - 使用统一检测器
          const streamThinking =
            ThinkingChainDetector.detectFromStreamChunk(chunk);
          const legacyThinking =
            this.responseParser.extractThinkingFromChunk?.(chunk);

          if (streamThinking || legacyThinking) {
            fullThinking += streamThinking || legacyThinking || "";

            // 设置为思维链生成阶段
            if (currentPhase === AIGenerationPhase.INITIALIZING) {
              currentPhase = AIGenerationPhase.THINKING;
              console.log(`🧠 [${this.name}] 进入思维链生成阶段`);
            }

            // 更新思维链最后更新时间
            lastThinkingUpdateTime = Date.now();

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
            const MarkdownItConstructor = await import("markdown-it");
            const md = new MarkdownItConstructor.default({
              html: false,
              breaks: true,
              linkify: true,
              typographer: true,
              quotes: "\"\"''",
            });
            const html = md.render(fullMarkdown);
            const currentAIData = this.buildStreamingAIData(
              options,
              thinkingChain,
              currentPhase
            );
            options.onStream?.(html, currentAIData);
          } else {
            // 如果当前在思维链阶段，但已经超过一定时间没有新的思维链内容
            // 则判定思维链阶段结束，进入答案生成阶段
            if (
              currentPhase === AIGenerationPhase.THINKING &&
              !thinkingPhaseCompleted &&
              thinkingChain.length > 0 &&
              Date.now() - lastThinkingUpdateTime > 500 // 500ms内没有新的思维链内容
            ) {
              thinkingPhaseCompleted = true;
              currentPhase = AIGenerationPhase.ANSWERING;
              console.log(`✅ [${this.name}] 思维链生成完成，进入答案生成阶段`);

              // 发送一次更新通知，让UI知道思维链阶段已结束
              const MarkdownItConstructor = await import("markdown-it");
              const md = new MarkdownItConstructor.default({
                html: false,
                breaks: true,
                linkify: true,
                typographer: true,
                quotes: "\"\"''",
              });
              const html = md.render(fullMarkdown);
              const currentAIData = this.buildStreamingAIData(
                options,
                thinkingChain,
                currentPhase
              );
              options.onStream?.(html, currentAIData);
            }
          }

          retryCount = 0; // 重置重试计数
        } catch (parseError) {
          console.warn(`解析${this.name}响应数据失败:`, parseError);
          errorCount++;
          retryCount++;
          if (retryCount > maxRetries) {
            throw new Error("连续解析失败，中止生成");
          }
        }
      }

      // 生成完成，构建最终数据
      if (!abortController.signal.aborted) {
        // 将最终的 Markdown 转换为 HTML 以供编辑器正确显示（保持与流式过程一致）
        const MarkdownItConstructor = await import("markdown-it");
        const md = new MarkdownItConstructor.default({
          html: false,
          breaks: true,
          linkify: true,
          typographer: true,
          quotes: "\"\"''",
        });
        const finalHtml = md.render(fullMarkdown);
        const aiData = this.buildAIData(options, fullMarkdown, thinkingChain);

        // 记录便签生成结果到测试面板
        try {
          const { useTestPanelStore } = await import(
            "../../store/testPanelStore"
          );
          const testPanelStore = useTestPanelStore.getState();

          const totalGenerationTime = Date.now() - streamStartTime;
          const contentLength = fullMarkdown.length;
          const wordCount = fullMarkdown
            .split(/\s+/)
            .filter((word) => word.length > 0).length;

          // 计算性能指标
          const ttfb = firstChunkTime ? firstChunkTime - streamStartTime : 0;
          const streamingRate =
            totalGenerationTime > 0
              ? (contentLength / totalGenerationTime) * 1000
              : 0; // 字符/秒
          const avgChunkSize =
            streamingSteps > 0 ? totalChunkSize / streamingSteps : 0;

          testPanelStore.addGeneration({
            id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            requestId: aiData?.requestId || "unknown",
            noteId: options.noteId,
            timestamp: Date.now(),
            finalContent: finalHtml, // 保存HTML格式的最终内容
            hasThinkingChain: !!aiData?.thinkingChain,
            thinkingChain: aiData?.thinkingChain,
            aiData: {
              provider: this.name,
              model: aiData?.model || "unknown",
              generated: aiData?.generated || false,
              generatedAt: aiData?.generatedAt || new Date().toISOString(),
              prompt: options.prompt,
            },
            // 增强字段
            totalGenerationTime,
            contentLength,
            wordCount,
            streamingSteps,
            errorCount,
            retryCount: retryCount,
            performance: {
              ttfb,
              streamingRate: Math.round(streamingRate * 100) / 100, // 保留2位小数
              avgChunkSize: Math.round(avgChunkSize * 100) / 100,
            },
          });
        } catch (error) {
          console.warn("记录便签生成结果到测试面板失败:", error);
        }

        options.onComplete?.(finalHtml, aiData); // 传递HTML格式的最终内容
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
    // 使用统一检测器进行最终检测
    const finalDetection = ThinkingChainDetector.detectFromText(fullMarkdown);

    // 如果从流式中没有检测到思维链，但在最终内容中检测到了，则使用检测结果
    let finalThinkingChain = thinkingChain;

    if (finalDetection.hasThinkingChain && thinkingChain.length === 0) {
      // 从完整内容中检测到了思维链，但流式过程中没有
      finalThinkingChain = finalDetection.thinkingContent?.steps || [];
      // cleanContent = finalDetection.cleanContent; // 已移除未使用变量
      console.log(
        `🧠 [${this.name}] 从完整响应中检测到思维链，步骤数: ${finalThinkingChain.length}`
      );
    } else if (thinkingChain.length > 0) {
      // 使用流式过程中收集的思维链
      // cleanContent = fullMarkdown; // 已移除未使用变量
    }

    const aiData: AICustomProperties["ai"] = {
      generated: true,
      model: options.model || this.config.defaultModel,
      provider: this.name,
      generatedAt: new Date().toISOString(),
      prompt: options.prompt,
      requestId: `req_${Date.now()}`,
      thinkingCollapsed: true,
      isStreaming: false,
    };

    // 如果检测到思维链，添加思维链数据
    if (finalThinkingChain.length > 0) {
      aiData.thinkingChain = {
        steps: finalThinkingChain,
        summary:
          finalDetection.thinkingContent?.summary ||
          `通过${finalThinkingChain.length}步推理完成`,
        totalSteps: finalThinkingChain.length,
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
    thinkingChain: any[],
    currentPhase: AIGenerationPhase = AIGenerationPhase.INITIALIZING
  ): AICustomProperties["ai"] {
    const aiData: AICustomProperties["ai"] = {
      generated: false, // 还在生成中
      model: options.model || this.config.defaultModel,
      provider: this.name,
      generatedAt: new Date().toISOString(),
      prompt: options.prompt,
      requestId: `req_${Date.now()}`,
      thinkingCollapsed: false, // 生成过程中默认展开
      isStreaming: true, // 正在流式生成
      generationPhase: currentPhase, // 当前生成阶段
      isThinkingPhase: currentPhase === AIGenerationPhase.THINKING,
      isAnsweringPhase: currentPhase === AIGenerationPhase.ANSWERING,
    };

    // 如果有思维链数据，添加思维链结构
    if (thinkingChain.length > 0) {
      aiData.thinkingChain = {
        steps: thinkingChain,
        summary:
          currentPhase === AIGenerationPhase.THINKING
            ? `正在生成思维链 (${thinkingChain.length}步)`
            : `完成了${thinkingChain.length}步思考过程`,
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
