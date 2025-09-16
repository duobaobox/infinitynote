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
import { markdownConverter } from "../utils/markdownConverter";
import { dbOperations, type AIConfigDB } from "../utils/db";

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
        throw new Error(
          `智谱AI API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      await this.handleStreamResponse(response, options, abortController);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("智谱AI生成已被中止");
        return; // 正常中止，不抛出错误
      }

      console.error("智谱AI API调用失败:", error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  private async handleStreamResponse(
    response: Response,
    options: AIGenerationOptions,
    abortController: AbortController
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
          model: options.model || "glm-4",
          provider: "zhipu",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking: true,
          thinkingCollapsed: false,
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
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      // 简化的流式处理（与智谱AI类似的逻辑）
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      let fullMarkdown = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          // 简化的解析逻辑
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

        options.onComplete?.(finalHTML, aiData);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("OpenAI API调用失败:", error);
      options.onError?.(error as Error);
      throw error;
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
  supportedModels = ["deepseek-chat", "deepseek-coder"];
  supportsStreaming = true;
  supportsThinking = false; // DeepSeek 不支持思维链显示

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const securityManager = SecurityManager.getInstance();
    const apiKey = await securityManager.getAPIKey("deepseek");

    if (!apiKey) {
      throw new Error("DeepSeek API密钥未配置");
    }

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
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DeepSeek API请求失败: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      // 流式处理
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
          provider: "deepseek",
          generatedAt: new Date().toISOString(),
          prompt: options.prompt,
          requestId: `req_${Date.now()}`,
          showThinking: false, // DeepSeek不支持思维链
          thinkingCollapsed: false,
          isStreaming: false,
          originalMarkdown: fullMarkdown,
        };

        options.onComplete?.(finalHTML, aiData);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("DeepSeek API调用失败:", error);
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
 * AI 服务主类
 */
class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = "zhipu";
  private securityManager: SecurityManager;

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

        // 加载用户配置的提供商
        if (parsed.provider && this.providers.has(parsed.provider)) {
          this.currentProvider = parsed.provider;
          console.log(`📋 已加载用户配置的AI提供商: ${this.currentProvider}`);
        }
      }
    } catch (error) {
      console.error("加载用户AI设置失败:", error);
      // 保持默认设置
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

      console.log(
        `🚀 使用 ${provider.name} 开始生成内容，提示: ${options.prompt.slice(
          0,
          50
        )}...`
      );

      await provider.generateContent(options);
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
   * 同步获取AI设置（基础版本，用于向后兼容）
   */
  getSettingsSync(): AISettings {
    return {
      provider: this.currentProvider,
      apiKeys: {},
      defaultModel:
        this.providers.get(this.currentProvider)?.supportedModels[0] || "",
      temperature: 0.7,
      maxTokens: 1000,
      showThinking: true,
      autoSave: true,
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

      // 保存其他设置
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

      // 更新当前提供商
      if (settings.provider && settings.provider !== this.currentProvider) {
        this.setProvider(settings.provider);
      }

      console.log("✅ AI设置保存成功");
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
