/**
 * AI 服务层
 * 统一管理 AI 提供商和生成逻辑
 */

import type {
  AIProvider,
  AIGenerationOptions,
  AISettings,
  ZhipuAPIResponse,
  AICustomProperties,
} from "../types/ai";
import { AIGenerationPhase } from "../types/ai";
import { markdownConverter } from "../utils/markdownConverter";
import { dbOperations, type AIConfigDB } from "../utils/db";
import { aiDebugCollector } from "../utils/aiDebugCollector";

/**
 * 安全管理器 - 处理API密钥存储（使用IndexedDB）
 */
class SecurityManager {
  private static instance: SecurityManager;

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * 安全存储API密钥（使用IndexedDB）
   */
  async setAPIKey(provider: string, key: string): Promise<void> {
    try {
      // 简单的本地加密（生产环境应使用更强的加密）
      const encrypted = btoa(key);
      const config: AIConfigDB = {
        id: `api_key_${provider}`,
        type: "api_key",
        provider,
        value: encrypted,
        encrypted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await dbOperations.saveAIConfig(config);
    } catch (error) {
      console.error("存储API密钥失败:", error);
      throw new Error("密钥存储失败");
    }
  }

  /**
   * 安全获取API密钥（从IndexedDB）
   */
  async getAPIKey(provider: string): Promise<string | null> {
    try {
      const config = await dbOperations.getAIConfig(`api_key_${provider}`);
      if (!config || !config.value) return null;
      return atob(config.value);
    } catch (error) {
      console.error("获取API密钥失败:", error);
      return null;
    }
  }

  /**
   * 验证API密钥格式
   */
  validateAPIKey(provider: string, key: string): boolean {
    const patterns = {
      zhipu: /^[a-zA-Z0-9]{32,}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      deepseek: /^sk-[a-zA-Z0-9]{32,}$/, // DeepSeek API密钥格式
      alibaba: /^sk-[a-zA-Z0-9]{20,}$/, // 阿里百炼 API密钥格式
      siliconflow: /^sk-[a-zA-Z0-9]{32,}$/, // 硅基流动 API密钥格式
      anthropic: /^sk-ant-api03-[a-zA-Z0-9\-_]{93}$/, // Anthropic API密钥格式
    };

    const pattern = patterns[provider as keyof typeof patterns];
    return pattern ? pattern.test(key) : key.length > 20; // 默认验证长度
  }

  /**
   * 清理API密钥（从IndexedDB）
   */
  async clearAPIKey(provider: string): Promise<void> {
    try {
      await dbOperations.deleteAIConfig(`api_key_${provider}`);
    } catch (error) {
      console.error("清理API密钥失败:", error);
    }
  }
}

/**
 * 智谱AI提供商实现
 */
class ZhipuAIProvider implements AIProvider {
  name = "zhipu";
  supportedModels = ["glm-4", "glm-4-plus"];
  supportsStreaming = true;
  supportsThinking = true;

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const securityManager = SecurityManager.getInstance();
    const apiKey = await securityManager.getAPIKey("zhipu");

    if (!apiKey) {
      throw new Error("智谱AI API密钥未配置");
    }

    // 开始调试会话
    const debugSessionId = aiDebugCollector.startSession(options);
    aiDebugCollector.updateSessionProvider(debugSessionId, "zhipu");

    const abortController = new AbortController();

    try {
      const response = await fetch(
        "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model || "glm-4",
            messages: [
              {
                role: "user",
                content: options.prompt,
              },
            ],
            stream: true,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `智谱AI API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
        aiDebugCollector.recordError(debugSessionId, error, {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
        });
        throw error;
      }

      await this.handleStreamResponse(
        response,
        options,
        abortController,
        debugSessionId
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        aiDebugCollector.cancelSession(debugSessionId);
        console.log("智谱AI生成已被中止");
        return; // 正常中止，不抛出错误
      }

      console.error("智谱AI API调用失败:", error);
      aiDebugCollector.recordError(debugSessionId, error as Error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  private async handleStreamResponse(
    response: Response,
    options: AIGenerationOptions,
    abortController: AbortController,
    debugSessionId: string
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    let fullContent = "";
    let fullMarkdown = "";
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
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (abortController.signal.aborted) {
              return;
            }

            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed: ZhipuAPIResponse = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content || "";

                if (deltaContent) {
                  fullMarkdown += deltaContent;
                  // 实时转换为HTML
                  fullContent =
                    markdownConverter.convertStreamChunk(fullMarkdown);
                  options.onStream?.(fullContent);
                }

                // 解析思维链（如果支持）
                const thinking = parsed.choices?.[0]?.delta?.thinking;
                if (thinking) {
                  thinkingChain.push({
                    id: `step_${thinkingChain.length + 1}`,
                    content: thinking,
                    timestamp: Date.now(),
                  });
                }

                // 记录调试数据
                aiDebugCollector.recordStreamChunk(
                  debugSessionId,
                  parsed,
                  deltaContent,
                  thinking
                );

                retryCount = 0; // 重置重试计数
              } catch (parseError) {
                console.warn(
                  "解析响应数据失败:",
                  parseError,
                  "原始数据:",
                  data
                );
                retryCount++;
                if (retryCount > maxRetries) {
                  throw new Error("连续解析失败，中止生成");
                }
              }
            }
          }
        } catch (readError) {
          if (readError instanceof Error && readError.name === "AbortError") {
            return;
          }
          console.error("读取流数据失败:", readError);
          retryCount++;
          if (retryCount > maxRetries) {
            throw readError;
          }
          // 短暂延迟后继续
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (!abortController.signal.aborted) {
        // 最终转换
        const finalHTML = markdownConverter.convertComplete(fullMarkdown);

        // 构造AI数据
        const aiData: AICustomProperties["ai"] = {
          generated: true,
          model: options.model || "deepseek-reasoner",
          provider: "deepseek",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking: true,
          thinkingCollapsed: true,
          isStreaming: false,
          originalMarkdown: fullMarkdown,
        };

        if (thinkingChain.length > 0) {
          aiData.thinkingChain = {
            steps: thinkingChain,
            summary: `通过${thinkingChain.length}步推理完成`,
            totalSteps: thinkingChain.length,
          };
        }

        // 记录调试完成数据
        aiDebugCollector.completeSession(debugSessionId, finalHTML, aiData);

        options.onComplete?.(finalHTML, aiData);
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * OpenAI 提供商实现（基础版本）
 */
class OpenAIProvider implements AIProvider {
  name = "openai";
  supportedModels = ["gpt-4", "gpt-4o", "gpt-3.5-turbo"];
  supportsStreaming = true;
  supportsThinking = false; // OpenAI 不支持思维链显示

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const securityManager = SecurityManager.getInstance();
    const apiKey = await securityManager.getAPIKey("openai");

    if (!apiKey) {
      throw new Error("OpenAI API密钥未配置");
    }

    // 开始调试会话
    const debugSessionId = aiDebugCollector.startSession(options);
    aiDebugCollector.updateSessionProvider(debugSessionId, "openai");

    const abortController = new AbortController();

    // 基础实现，可以后续扩展
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model || "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: options.prompt,
              },
            ],
            stream: true,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `OpenAI API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
        aiDebugCollector.recordError(debugSessionId, error, {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
        });
        throw error;
      }

      await this.handleStreamResponse(
        response,
        options,
        abortController,
        debugSessionId
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        aiDebugCollector.cancelSession(debugSessionId);
        console.log("OpenAI生成已被中止");
        return;
      }

      console.error("OpenAI API调用失败:", error);
      aiDebugCollector.recordError(debugSessionId, error as Error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  private async handleStreamResponse(
    response: Response,
    options: AIGenerationOptions,
    abortController: AbortController,
    debugSessionId: string
  ): Promise<void> {
    // 简化的流式处理（与智谱AI类似的逻辑）
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    let fullMarkdown = "";
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
          // 简化的解析逻辑
          const content = this.extractContentFromChunk(chunk);
          if (content) {
            fullMarkdown += content;
            const html = markdownConverter.convertStreamChunk(fullMarkdown);
            options.onStream?.(html);

            // 记录调试数据
            aiDebugCollector.recordStreamChunk(
              debugSessionId,
              { raw: chunk, type: "openai_chunk" },
              content
            );
          }

          retryCount = 0; // 重置重试计数
        } catch (readError) {
          if (readError instanceof Error && readError.name === "AbortError") {
            return;
          }
          console.error("读取OpenAI流数据失败:", readError);
          retryCount++;
          if (retryCount > maxRetries) {
            throw readError;
          }
          // 短暂延迟后继续
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (!abortController.signal.aborted) {
        const finalHTML = markdownConverter.convertComplete(fullMarkdown);
        const aiData: AICustomProperties["ai"] = {
          generated: true,
          model: options.model || "gpt-3.5-turbo",
          provider: "openai",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking: false, // OpenAI不支持思维链
          thinkingCollapsed: false,
          isStreaming: false,
          originalMarkdown: fullMarkdown,
        };

        // 记录调试完成数据
        aiDebugCollector.completeSession(debugSessionId, finalHTML, aiData);

        options.onComplete?.(finalHTML, aiData);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private extractContentFromChunk(chunk: string): string {
    // 简化的内容提取逻辑，实际应该解析SSE格式
    // 这里只是示例，真实实现需要更复杂的解析
    try {
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));
      let content = "";
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        const parsed = JSON.parse(data);
        content += parsed.choices?.[0]?.delta?.content || "";
      }
      return content;
    } catch {
      return "";
    }
  }
}

/**
 * DeepSeek 提供商实现
 */
class DeepSeekProvider implements AIProvider {
  name = "deepseek";
  supportedModels = ["deepseek-chat", "deepseek-reasoner"];
  supportsStreaming = true;
  supportsThinking = true; // DeepSeek-V3.1 支持思维链显示

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const securityManager = SecurityManager.getInstance();
    const apiKey = await securityManager.getAPIKey("deepseek");

    if (!apiKey) {
      throw new Error("DeepSeek API密钥未配置");
    }

    // 开始调试会话
    const debugSessionId = aiDebugCollector.startSession(options);
    aiDebugCollector.updateSessionProvider(debugSessionId, "deepseek");

    const abortController = new AbortController();

    try {
      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model || "deepseek-chat",
            messages: [
              {
                role: "user",
                content: options.prompt,
              },
            ],
            stream: true,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `DeepSeek API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
        aiDebugCollector.recordError(debugSessionId, error, {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
        });
        throw error;
      }

      await this.handleStreamResponse(
        response,
        options,
        abortController,
        debugSessionId
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        aiDebugCollector.cancelSession(debugSessionId);
        console.log("DeepSeek生成已被中止");
        return; // 正常中止，不抛出错误
      }

      console.error("DeepSeek API调用失败:", error);
      aiDebugCollector.recordError(debugSessionId, error as Error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  private async handleStreamResponse(
    response: Response,
    options: AIGenerationOptions,
    abortController: AbortController,
    debugSessionId: string
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    let fullContent = "";
    let fullMarkdown = "";
    let fullReasoning = "";
    const thinkingChain: any[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    let hasStartedThinking = false; // 标记是否已开始思维过程
    let hasStartedAnswering = false; // 标记是否已开始回复阶段

    try {
      while (true) {
        if (abortController.signal.aborted) {
          break;
        }

        try {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (abortController.signal.aborted) {
              return;
            }

            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);

                // 添加详细的调试日志
                if (options.model?.includes("reasoner")) {
                  console.log("🧠 DeepSeek-Reasoner 响应数据:", {
                    fullParsed: parsed,
                    choices: parsed.choices,
                    delta: parsed.choices?.[0]?.delta,
                    deltaKeys: parsed.choices?.[0]?.delta
                      ? Object.keys(parsed.choices[0].delta)
                      : [],
                  });
                }

                const deltaContent = parsed.choices?.[0]?.delta?.content || "";

                if (deltaContent) {
                  fullMarkdown += deltaContent;
                  // 实时转换为HTML
                  fullContent =
                    markdownConverter.convertStreamChunk(fullMarkdown);

                  // 检测是否从思维阶段切换到回复阶段
                  if (
                    hasStartedThinking &&
                    !hasStartedAnswering &&
                    deltaContent.trim()
                  ) {
                    // 第一次收到content内容时，切换到回复阶段
                    hasStartedAnswering = true;
                    const answeringAiData: AICustomProperties["ai"] = {
                      generated: false,
                      model: options.model || "deepseek-reasoner",
                      provider: "deepseek",
                      generatedAt: new Date().toISOString(),
                      prompt: options.prompt,
                      requestId: `req_${Date.now()}`,
                      showThinking: true,
                      thinkingCollapsed: true,
                      isStreaming: true,
                      originalMarkdown: fullMarkdown,
                      // 新增：切换到回复阶段
                      generationPhase: AIGenerationPhase.ANSWERING, // 最终答案生成阶段
                      isThinkingPhase: false, // 思维链生成已完成
                      isAnsweringPhase: true, // 正在最终答案生成阶段
                      thinkingChain: {
                        steps: [
                          {
                            id: "thinking_complete",
                            content: fullReasoning,
                            timestamp: Date.now(),
                          },
                        ],
                        summary: `思考过程完成，正在生成回复 (${fullReasoning.length}字符)`,
                        totalSteps: 1,
                      },
                    };

                    console.log(
                      "🔄 切换到回复阶段，思维链内容长度:",
                      fullReasoning.length
                    );
                    options.onStream?.(fullContent, answeringAiData);
                  } else {
                    // 普通的content更新
                    options.onStream?.(fullContent);
                  }
                }

                // 解析思维链内容 - DeepSeek Reasoner的思维链数据
                // 根据官方文档，可能的字段名包括：reasoning_content, reasoning, thinking
                const delta = parsed.choices?.[0]?.delta;
                let reasoning = null;

                if (delta && options.model?.includes("reasoner")) {
                  reasoning =
                    delta.reasoning_content || // DeepSeek官方字段名
                    delta.reasoning || // 可能的字段名
                    delta.thinking || // 另一种可能
                    delta.thought || // 备选字段名
                    delta["reasoning-content"]; // 可能使用连字符

                  // 累积完整的reasoning内容，不要为每个片段创建独立步骤
                  if (reasoning) {
                    fullReasoning += reasoning;

                    // 第一次收到reasoning时，立即显示思维链容器
                    if (!hasStartedThinking) {
                      hasStartedThinking = true;
                      console.log("🧠 开始思考过程，立即显示思维链容器");

                      // 创建初始的思维链数据并通过onStream回调
                      const initialAiData: AICustomProperties["ai"] = {
                        generated: false, // 标记为正在生成中
                        model: options.model || "deepseek-reasoner",
                        provider: "deepseek",
                        generatedAt: new Date().toISOString(),
                        prompt: options.prompt,
                        requestId: `req_${Date.now()}`,
                        showThinking: true,
                        thinkingCollapsed: true,
                        isStreaming: true, // 标记为流式生成中
                        originalMarkdown: "",
                        // 新增：生成阶段状态
                        generationPhase: AIGenerationPhase.THINKING, // 思维链生成阶段
                        isThinkingPhase: true, // 正在思维链生成阶段
                        isAnsweringPhase: false, // 尚未进入最终答案生成阶段
                        thinkingChain: {
                          steps: [
                            {
                              id: "thinking_in_progress",
                              content: "正在思考中...",
                              timestamp: Date.now(),
                            },
                          ],
                          summary: "思考过程进行中",
                          totalSteps: 1,
                        },
                      };

                      // 通过onStream立即显示思维链容器
                      options.onStream?.("", initialAiData);
                    }

                    // 实时更新思维链内容
                    if (hasStartedThinking) {
                      const updatedAiData: AICustomProperties["ai"] = {
                        generated: false,
                        model: options.model || "deepseek-reasoner",
                        provider: "deepseek",
                        generatedAt: new Date().toISOString(),
                        prompt: options.prompt,
                        requestId: `req_${Date.now()}`,
                        showThinking: true,
                        thinkingCollapsed: true,
                        isStreaming: true,
                        originalMarkdown: fullMarkdown,
                        // 新增：生成阶段状态
                        generationPhase: AIGenerationPhase.THINKING, // 仍在思维链生成阶段
                        isThinkingPhase: true, // 正在思维链生成阶段
                        isAnsweringPhase: false, // 尚未进入最终答案生成阶段
                        thinkingChain: {
                          steps: [
                            {
                              id: "thinking_live",
                              content: fullReasoning,
                              timestamp: Date.now(),
                            },
                          ],
                          summary: `思考过程进行中 (${fullReasoning.length}字符)`,
                          totalSteps: 1,
                        },
                      };

                      // 实时更新思维链内容
                      options.onStream?.(fullMarkdown, updatedAiData);
                    }

                    // 只在第一次收到reasoning时记录调试信息
                    if (fullReasoning.length === reasoning.length) {
                      console.log("🧠 开始收集思维链内容:", {
                        fieldName: Object.keys(delta).find(
                          (key) =>
                            key.includes("reason") || key.includes("think")
                        ),
                        initialContent: reasoning.substring(0, 50) + "...",
                      });
                    }
                  }
                }

                // 记录调试数据 - 传递单个reasoning片段用于调试，但不创建独立步骤
                aiDebugCollector.recordStreamChunk(
                  debugSessionId,
                  parsed,
                  deltaContent,
                  reasoning // 这里传递片段，但调试收集器需要修改处理逻辑
                );

                retryCount = 0; // 重置重试计数
              } catch (parseError) {
                console.warn(
                  "解析DeepSeek响应数据失败:",
                  parseError,
                  "原始数据:",
                  data
                );
                retryCount++;
                if (retryCount > maxRetries) {
                  throw new Error("连续解析失败，中止生成");
                }
              }
            }
          }
        } catch (readError) {
          if (readError instanceof Error && readError.name === "AbortError") {
            return;
          }
          console.error("读取DeepSeek流数据失败:", readError);
          retryCount++;
          if (retryCount > maxRetries) {
            throw readError;
          }
          // 短暂延迟后继续
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (!abortController.signal.aborted) {
        // 最终转换
        const finalHTML = markdownConverter.convertComplete(fullMarkdown);

        // 构造AI数据
        const aiData: AICustomProperties["ai"] = {
          generated: true,
          model: options.model || "deepseek-chat",
          provider: "deepseek",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking:
            options.model?.includes("reasoner") && thinkingChain.length > 0,
          thinkingCollapsed: false,
          isStreaming: false,
          originalMarkdown: fullMarkdown,
          // 新增：最终完成状态
          generationPhase: AIGenerationPhase.COMPLETED, // 生成完成阶段
          isThinkingPhase: false, // 思维链生成已完成
          isAnsweringPhase: false, // 最终答案生成已完成
        };

        // 如果是reasoner模型且有完整的reasoning内容
        if (options.model?.includes("reasoner") && fullReasoning.trim()) {
          // 将完整的reasoning作为一个思维链步骤，而不是多个碎片
          const completeThinkingStep = {
            id: "reasoning_complete",
            content: fullReasoning.trim(),
            timestamp: Date.now(),
          };

          console.log("🧠 构造完整思维链数据:", {
            model: options.model,
            reasoningLength: fullReasoning.length,
            reasoningPreview: fullReasoning.substring(0, 100) + "...",
            totalSteps: 1,
          });

          aiData.thinkingChain = {
            steps: [completeThinkingStep],
            summary: `完整思考过程 (${fullReasoning.length}字符)`,
            totalSteps: 1,
          };
        } else {
          console.log("⚠️ 未构造思维链数据:", {
            model: options.model,
            isReasonerModel: options.model?.includes("reasoner"),
            reasoningLength: fullReasoning?.length || 0,
            showThinking: aiData.showThinking,
          });
        }

        console.log("🎯 最终AI数据:", {
          model: aiData.model,
          provider: aiData.provider,
          hasThinkingChain: !!aiData.thinkingChain,
          showThinking: aiData.showThinking,
          thinkingSteps: aiData.thinkingChain?.totalSteps || 0,
        });

        // 记录调试完成数据
        aiDebugCollector.completeSession(debugSessionId, finalHTML, aiData);

        options.onComplete?.(finalHTML, aiData);
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * 阿里百炼 提供商实现
 */
class AlibabaProvider implements AIProvider {
  name = "alibaba";
  supportedModels = ["qwen-plus", "qwen-turbo", "qwen-max"];
  supportsStreaming = true;
  supportsThinking = false; // 暂时不支持思维链，待官方API更新

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const securityManager = SecurityManager.getInstance();
    const apiKey = await securityManager.getAPIKey("alibaba");

    if (!apiKey) {
      throw new Error("阿里百炼 API密钥未配置");
    }

    try {
      const response = await fetch(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model || "qwen-turbo",
            input: {
              messages: [
                {
                  role: "user",
                  content: options.prompt,
                },
              ],
            },
            parameters: {
              temperature: options.temperature || 0.7,
              max_tokens: options.maxTokens || 2000,
              stream: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `阿里百炼 API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      // 简化的流式处理
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      let fullMarkdown = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const content = this.extractContentFromChunk(chunk);
          if (content) {
            fullMarkdown += content;
            const html = markdownConverter.convertStreamChunk(fullMarkdown);
            options.onStream?.(html);
          }
        }

        const finalHTML = markdownConverter.convertComplete(fullMarkdown);
        const aiData: AICustomProperties["ai"] = {
          generated: true,
          model: options.model || "qwen-turbo",
          provider: "alibaba",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking: false, // 不支持思维链
          thinkingCollapsed: true,
          isStreaming: false,
          originalMarkdown: fullMarkdown,
        };

        options.onComplete?.(finalHTML, aiData);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("阿里百炼 API调用失败:", error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  private extractContentFromChunk(chunk: string): string {
    try {
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));
      let content = "";
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        const parsed = JSON.parse(data);
        // 阿里百炼可能使用不同的字段结构
        content +=
          parsed.output?.choices?.[0]?.message?.content ||
          parsed.output?.text ||
          "";
      }
      return content;
    } catch {
      return "";
    }
  }
}

/**
 * 硅基流动 提供商实现（使用OpenAI兼容API）
 */
class SiliconFlowProvider implements AIProvider {
  name = "siliconflow";
  supportedModels = ["deepseek-chat", "qwen-72b-chat", "internlm2_5-7b-chat"];
  supportsStreaming = true;
  supportsThinking = false; // 作为代理服务，不支持思维链

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const securityManager = SecurityManager.getInstance();
    const apiKey = await securityManager.getAPIKey("siliconflow");

    if (!apiKey) {
      throw new Error("硅基流动 API密钥未配置");
    }

    try {
      const response = await fetch(
        "https://api.siliconflow.cn/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model || "deepseek-chat",
            messages: [
              {
                role: "user",
                content: options.prompt,
              },
            ],
            stream: true,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `硅基流动 API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      // 使用OpenAI兼容的流式处理
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      let fullMarkdown = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const content = this.extractContentFromChunk(chunk);
          if (content) {
            fullMarkdown += content;
            const html = markdownConverter.convertStreamChunk(fullMarkdown);
            options.onStream?.(html);
          }
        }

        const finalHTML = markdownConverter.convertComplete(fullMarkdown);
        const aiData: AICustomProperties["ai"] = {
          generated: true,
          model: options.model || "deepseek-chat",
          provider: "siliconflow",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking: false, // 不支持思维链
          thinkingCollapsed: true,
          isStreaming: false,
          originalMarkdown: fullMarkdown,
        };

        options.onComplete?.(finalHTML, aiData);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("硅基流动 API调用失败:", error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  private extractContentFromChunk(chunk: string): string {
    try {
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));
      let content = "";
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        const parsed = JSON.parse(data);
        content += parsed.choices?.[0]?.delta?.content || "";
      }
      return content;
    } catch {
      return "";
    }
  }
}

/**
 * Anthropic 提供商实现
 */
class AnthropicProvider implements AIProvider {
  name = "anthropic";
  supportedModels = ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"];
  supportsStreaming = true;
  supportsThinking = false; // Claude暂时不支持思维链

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const securityManager = SecurityManager.getInstance();
    const apiKey = await securityManager.getAPIKey("anthropic");

    if (!apiKey) {
      throw new Error("Anthropic API密钥未配置");
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: options.model || "claude-3-sonnet-20240229",
          messages: [
            {
              role: "user",
              content: options.prompt,
            },
          ],
          stream: true,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Anthropic API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      // Claude的流式处理
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      let fullMarkdown = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const content = this.extractContentFromChunk(chunk);
          if (content) {
            fullMarkdown += content;
            const html = markdownConverter.convertStreamChunk(fullMarkdown);
            options.onStream?.(html);
          }
        }

        const finalHTML = markdownConverter.convertComplete(fullMarkdown);
        const aiData: AICustomProperties["ai"] = {
          generated: true,
          model: options.model || "claude-3-sonnet",
          provider: "anthropic",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking: false, // 不支持思维链
          thinkingCollapsed: true,
          isStreaming: false,
          originalMarkdown: fullMarkdown,
        };

        options.onComplete?.(finalHTML, aiData);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Anthropic API调用失败:", error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  private extractContentFromChunk(chunk: string): string {
    try {
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));
      let content = "";
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        const parsed = JSON.parse(data);
        // Anthropic使用不同的字段结构
        content += parsed.delta?.text || "";
      }
      return content;
    } catch {
      return "";
    }
  }
}

/**
 * AI 服务主类
 */
class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = "zhipu";
  private securityManager: SecurityManager;
  private currentSettings: AISettings = {
    provider: "zhipu",
    apiKeys: {},
    defaultModel: "",
    temperature: 0.7,
    maxTokens: 1000,
    showThinking: true,
    autoSave: true,
  };

  constructor() {
    this.securityManager = SecurityManager.getInstance();
    this.initializeProviders();
    // 异步加载用户设置，不阻塞构造函数
    this.loadUserSettings().catch((error: any) =>
      console.error("初始化时加载AI设置失败:", error)
    );
  }

  private initializeProviders() {
    // 智谱AI提供商
    this.providers.set("zhipu", new ZhipuAIProvider());

    // DeepSeek提供商
    this.providers.set("deepseek", new DeepSeekProvider());

    // OpenAI提供商
    this.providers.set("openai", new OpenAIProvider());

    // 阿里百炼提供商
    this.providers.set("alibaba", new AlibabaProvider());

    // 硅基流动提供商
    this.providers.set("siliconflow", new SiliconFlowProvider());

    // Anthropic提供商
    this.providers.set("anthropic", new AnthropicProvider());
  }

  /**
   * 加载用户保存的AI配置（从IndexedDB）
   */
  private async loadUserSettings(): Promise<void> {
    try {
      // 首先检查是否需要从localStorage迁移数据
      await dbOperations.migrateAIConfigsFromLocalStorage();

      // 从IndexedDB加载AI设置
      const settingsConfig = await dbOperations.getAIConfig("ai_settings");
      if (settingsConfig && settingsConfig.value) {
        const parsed = JSON.parse(settingsConfig.value);

        // 更新完整的设置
        this.currentSettings = {
          ...this.currentSettings,
          ...parsed,
        };

        // 加载用户配置的提供商
        if (parsed.provider && this.providers.has(parsed.provider)) {
          this.currentProvider = parsed.provider;
          this.currentSettings.provider = parsed.provider;
          console.log(`📋 已加载用户配置的AI提供商: ${this.currentProvider}`);
        }

        // 加载用户选择的模型
        if (parsed.defaultModel) {
          this.currentSettings.defaultModel = parsed.defaultModel;
          console.log(`📋 已加载用户配置的默认模型: ${parsed.defaultModel}`);
        } else {
          // 如果没有保存的模型，使用当前提供商的第一个模型
          this.currentSettings.defaultModel =
            this.providers.get(this.currentProvider)?.supportedModels[0] || "";
        }
      } else {
        // 如果没有保存的设置，使用默认值
        this.currentSettings.defaultModel =
          this.providers.get(this.currentProvider)?.supportedModels[0] || "";
      }
    } catch (error) {
      console.error("加载用户AI设置失败:", error);
      // 保持默认设置
      this.currentSettings.defaultModel =
        this.providers.get(this.currentProvider)?.supportedModels[0] || "";
    }
  }

  /**
   * 生成便签内容
   */
  async generateNote(options: AIGenerationOptions): Promise<void> {
    try {
      const provider = this.providers.get(this.currentProvider);
      if (!provider) {
        throw new Error(`AI提供商 ${this.currentProvider} 不可用`);
      }

      // 确保options包含完整的配置信息
      const completeOptions: AIGenerationOptions = {
        ...options,
        // 如果没有指定model，使用当前设置的默认模型
        model:
          options.model ||
          this.currentSettings.defaultModel ||
          provider.supportedModels[0] ||
          "unknown",
        // 如果没有指定其他参数，使用默认值
        temperature: options.temperature ?? this.currentSettings.temperature,
        maxTokens: options.maxTokens ?? this.currentSettings.maxTokens,
      };

      console.log(
        `🚀 使用 ${provider.name} 开始生成内容，模型: ${
          completeOptions.model
        }，提示: ${completeOptions.prompt.slice(0, 50)}...`
      );

      await provider.generateContent(completeOptions);
    } catch (error) {
      console.error("AI生成失败:", error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 设置AI提供商
   */
  setProvider(providerName: string): void {
    if (this.providers.has(providerName)) {
      this.currentProvider = providerName;
      this.currentSettings.provider = providerName;
      console.log(`🔄 切换AI提供商: ${providerName}`);
    } else {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider(): string {
    return this.currentProvider;
  }

  /**
   * 获取可用提供商列表
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取提供商信息
   */
  getProviderInfo(providerName: string): AIProvider | undefined {
    return this.providers.get(providerName);
  }

  /**
   * 检查提供商是否配置完成（异步）
   */
  async isProviderConfigured(providerName: string): Promise<boolean> {
    const apiKey = await this.securityManager.getAPIKey(providerName);
    return !!apiKey;
  }

  /**
   * 配置提供商API密钥（异步）
   */
  async configureProvider(providerName: string, apiKey: string): Promise<void> {
    if (!this.providers.has(providerName)) {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }

    if (!this.securityManager.validateAPIKey(providerName, apiKey)) {
      throw new Error(`无效的API密钥格式: ${providerName}`);
    }

    await this.securityManager.setAPIKey(providerName, apiKey);
    console.log(`✅ ${providerName} API密钥配置成功`);
  }

  /**
   * 测试提供商连接
   */
  async testProvider(providerName: string): Promise<boolean> {
    try {
      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new Error(`不支持的AI提供商: ${providerName}`);
      }

      const apiKey = await this.securityManager.getAPIKey(providerName);
      if (!apiKey) {
        throw new Error("API密钥未配置");
      }

      // 发送测试请求
      const testPrompt = "测试连接";
      let testEndpoint = "";
      let testHeaders = {};
      let testBody = {};

      switch (providerName) {
        case "zhipu":
          testEndpoint =
            "https://open.bigmodel.cn/api/paas/v4/chat/completions";
          testHeaders = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
          testBody = {
            model: "glm-4-flash",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 10,
          };
          break;
        case "deepseek":
          testEndpoint = "https://api.deepseek.com/v1/chat/completions";
          testHeaders = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
          testBody = {
            model: "deepseek-chat",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 10,
          };
          break;
        case "openai":
          testEndpoint = "https://api.openai.com/v1/chat/completions";
          testHeaders = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
          testBody = {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 10,
          };
          break;
        case "alibaba":
          testEndpoint =
            "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
          testHeaders = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
          testBody = {
            model: "qwen-turbo",
            input: {
              messages: [{ role: "user", content: testPrompt }],
            },
            parameters: {
              max_tokens: 10,
            },
          };
          break;
        case "siliconflow":
          testEndpoint = "https://api.siliconflow.cn/v1/chat/completions";
          testHeaders = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
          testBody = {
            model: "deepseek-chat",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 10,
          };
          break;
        case "anthropic":
          testEndpoint = "https://api.anthropic.com/v1/messages";
          testHeaders = {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          };
          testBody = {
            model: "claude-3-haiku-20240307",
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 10,
          };
          break;
        default:
          return false;
      }

      const response = await fetch(testEndpoint, {
        method: "POST",
        headers: testHeaders,
        body: JSON.stringify(testBody),
      });

      return response.ok;
    } catch (error) {
      console.error(`${providerName} 连接测试失败:`, error);
      return false;
    }
  }

  /**
   * 获取AI设置（从IndexedDB异步加载）
   */
  async getSettings(): Promise<AISettings> {
    const settings: AISettings = {
      provider: this.currentProvider,
      apiKeys: {},
      defaultModel:
        this.providers.get(this.currentProvider)?.supportedModels[0] || "",
      temperature: 0.7,
      maxTokens: 1000,
      showThinking: true,
      autoSave: true,
    };

    // 从IndexedDB加载其他设置
    try {
      const settingsConfig = await dbOperations.getAIConfig("ai_settings");
      if (settingsConfig && settingsConfig.value) {
        const parsed = JSON.parse(settingsConfig.value);
        Object.assign(settings, parsed);
      }
    } catch (error) {
      console.error("加载AI设置失败:", error);
    }

    return settings;
  }

  /**
   * 同步获取AI设置（返回已加载的设置）
   */
  getSettingsSync(): AISettings {
    return {
      ...this.currentSettings,
      provider: this.currentProvider,
      // 如果没有默认模型，使用当前提供商的第一个模型
      defaultModel:
        this.currentSettings.defaultModel ||
        this.providers.get(this.currentProvider)?.supportedModels[0] ||
        "",
    };
  }

  /**
   * 保存AI设置（异步保存到IndexedDB）
   */
  async saveSettings(settings: Partial<AISettings>): Promise<void> {
    try {
      // 保存API密钥到独立存储
      if (settings.apiKeys) {
        for (const [provider, key] of Object.entries(settings.apiKeys)) {
          if (key) {
            await this.configureProvider(provider, key);
          }
        }
      }

      // 更新内存中的设置
      this.currentSettings = {
        ...this.currentSettings,
        ...settings,
      };

      // 更新当前提供商
      if (settings.provider && settings.provider !== this.currentProvider) {
        this.currentProvider = settings.provider;
        this.currentSettings.provider = settings.provider;
      }

      // 保存其他设置到IndexedDB
      const settingsToSave = { ...settings };
      delete settingsToSave.apiKeys; // 不保存明文密钥

      const config: AIConfigDB = {
        id: "ai_settings",
        type: "settings",
        value: JSON.stringify(settingsToSave),
        encrypted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbOperations.saveAIConfig(config);

      console.log("✅ AI设置保存成功:", settingsToSave);
    } catch (error) {
      console.error("保存AI设置失败:", error);
      throw error;
    }
  }
}

// 导出单例实例
export const aiService = new AIService();

// 导出安全管理器实例
export const securityManager = SecurityManager.getInstance();

// 导出类和接口
export { AIService, ZhipuAIProvider, OpenAIProvider };
