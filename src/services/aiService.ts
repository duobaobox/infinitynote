/**
 * AI 服务层
 * 统一管理 AI 提供商和生成逻辑
 * 重构后的版本，使用BaseAIProvider架构
 */

import type { AIProvider, AIGenerationOptions, AISettings } from "../types/ai";
import { dbOperations, type AIConfigDB, type AIHistoryDB } from "../utils/db";
import {
  createAppError,
  ErrorType,
  ErrorSeverity,
  type AppError,
} from "../utils/errorHandler";
import { AIErrorHandler } from "../utils/aiErrorHandler";

// AI提供商将通过动态导入加载，减少初始包大小

/**
 * 安全管理器 - 处理API密钥存储（使用IndexedDB）
 */
export class SecurityManager {
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
      deepseek: /^sk-[a-zA-Z0-9]{32,}$/,
      alibaba: /^sk-[a-zA-Z0-9]{20,}$/,
      siliconflow: /^sk-[a-zA-Z0-9]{32,}$/,
      anthropic: /^sk-ant-api03-[a-zA-Z0-9\-_]{93}$/,
    };

    const pattern = patterns[provider as keyof typeof patterns];
    return pattern ? pattern.test(key) : key.length > 20;
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
 * AI 服务主类
 */
class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = "zhipu";
  private securityManager: SecurityManager;
  private errorHandler: AIErrorHandler;
  private currentSettings: AISettings = {
    provider: "zhipu",
    apiKeys: {},
    defaultModel: "glm-4",
    temperature: 0.7,
    maxTokens: 1000,
    showThinking: true,
    autoSave: true,
  };

  constructor() {
    this.securityManager = SecurityManager.getInstance();
    this.errorHandler = AIErrorHandler.getInstance();
    this.initializeProviders();
    this.loadUserSettings().catch((error: any) => {
      console.error("初始化时加载AI设置失败:", error);
    });
  }

  /**
   * 懒加载初始化AI提供商
   * 只在需要时才加载对应的提供商，减少初始包大小
   */
  private async initializeProviders() {
    // 不再预先加载所有提供商，改为懒加载
    console.log("✅ AI提供商管理器初始化完成，将按需加载提供商");
  }

  /**
   * 懒加载获取AI提供商
   * 只在第一次使用时才动态导入和实例化
   */
  private async getProvider(providerName: string): Promise<AIProvider> {
    // 检查是否已经加载
    if (this.providers.has(providerName)) {
      return this.providers.get(providerName)!;
    }

    // 动态导入并实例化提供商
    try {
      let ProviderClass: any;

      switch (providerName) {
        case "zhipu":
          const { ZhipuAIProvider } = await import(
            /* webpackChunkName: "ai-zhipu" */ "./ai/ZhipuAIProvider"
          );
          ProviderClass = ZhipuAIProvider;
          break;
        case "deepseek":
          const { DeepSeekProvider } = await import(
            /* webpackChunkName: "ai-deepseek" */ "./ai/DeepSeekProvider"
          );
          ProviderClass = DeepSeekProvider;
          break;
        case "openai":
          const { OpenAIProvider } = await import(
            /* webpackChunkName: "ai-openai" */ "./ai/OpenAIProvider"
          );
          ProviderClass = OpenAIProvider;
          break;
        case "alibaba":
          const { AlibabaProvider } = await import(
            /* webpackChunkName: "ai-alibaba" */ "./ai/AlibabaProvider"
          );
          ProviderClass = AlibabaProvider;
          break;
        case "siliconflow":
          const { SiliconFlowProvider } = await import(
            /* webpackChunkName: "ai-siliconflow" */ "./ai/SiliconFlowProvider"
          );
          ProviderClass = SiliconFlowProvider;
          break;
        case "anthropic":
          const { AnthropicProvider } = await import(
            /* webpackChunkName: "ai-anthropic" */ "./ai/AnthropicProvider"
          );
          ProviderClass = AnthropicProvider;
          break;
        default:
          throw new Error(`不支持的AI提供商: ${providerName}`);
      }

      const provider = new ProviderClass();
      this.providers.set(providerName, provider);
      console.log(`✅ AI提供商 ${providerName} 懒加载完成`);
      return provider;
    } catch (error) {
      console.error(`❌ 加载AI提供商 ${providerName} 失败:`, error);
      throw new Error(`加载AI提供商失败: ${providerName}`);
    }
  }

  private async loadUserSettings(): Promise<void> {
    try {
      await dbOperations.migrateAIConfigsFromLocalStorage();
      const settingsConfig = await dbOperations.getAIConfig("ai_settings");
      if (settingsConfig?.value) {
        const savedSettings = JSON.parse(settingsConfig.value);
        this.currentSettings = { ...this.currentSettings, ...savedSettings };
        if (savedSettings.provider) {
          this.currentProvider = savedSettings.provider;
        }
        console.log("✅ AI设置加载成功:", this.currentSettings);
      }
    } catch (error) {
      console.error("加载AI设置失败:", error);
    }
  }

  async generateNote(options: AIGenerationOptions): Promise<void> {
    const startTime = Date.now();
    const historyId = `ai_history_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // 创建历史记录
    const historyRecord: AIHistoryDB = {
      id: historyId,
      noteId: options.noteId,
      prompt: options.prompt,
      provider: this.currentProvider,
      model: options.model || this.currentSettings.defaultModel,
      temperature: options.temperature ?? this.currentSettings.temperature,
      maxTokens: options.maxTokens ?? this.currentSettings.maxTokens,
      generatedContent: "",
      status: "success",
      duration: 0,
      createdAt: new Date(),
    };

    try {
      // 懒加载获取提供商
      const provider = await this.getProvider(this.currentProvider);
      if (!provider) {
        const error = createAppError(
          `AI提供商 ${this.currentProvider} 不可用`,
          ErrorType.NOT_FOUND,
          ErrorSeverity.HIGH,
          {
            code: "AI_PROVIDER_NOT_FOUND",
            context: { provider: this.currentProvider },
            userMessage: `当前AI服务提供商不可用，请检查配置`,
          }
        );
        this.errorHandler.showErrorNotification(error, {
          retryFn: () => options.onError?.(error),
        });
        throw error;
      }

      // 检查API密钥
      const apiKey = await this.securityManager.getAPIKey(this.currentProvider);
      if (!apiKey) {
        const error = createAppError(
          `API密钥未配置: ${this.currentProvider}`,
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          {
            code: "AI_API_KEY_MISSING",
            context: { provider: this.currentProvider },
            userMessage: `请先配置${this.currentProvider}的API密钥`,
          }
        );
        this.errorHandler.showErrorNotification(error);
        throw error;
      }

      const completeOptions: AIGenerationOptions = {
        ...options,
        model: historyRecord.model,
        temperature: historyRecord.temperature,
        maxTokens: historyRecord.maxTokens,
        // 包装回调函数以收集生成内容
        onStream: (content, aiData) => {
          historyRecord.generatedContent = content;
          options.onStream?.(content, aiData);
        },
        onComplete: async (finalContent, aiData) => {
          // 更新历史记录
          historyRecord.generatedContent = finalContent;
          historyRecord.duration = Date.now() - startTime;
          historyRecord.status = "success";

          // 提取思维链数据
          if (aiData?.thinkingChain) {
            historyRecord.thinkingChain = JSON.stringify(aiData.thinkingChain);
          }

          // 保存历史记录
          try {
            await dbOperations.saveAIHistory(historyRecord);
          } catch (error) {
            console.warn("保存AI历史记录失败:", error);
          }

          options.onComplete?.(finalContent, aiData);
        },
        onError: async (error) => {
          // 记录错误
          historyRecord.status = "error";
          historyRecord.errorMessage = error.message;
          historyRecord.duration = Date.now() - startTime;

          try {
            await dbOperations.saveAIHistory(historyRecord);
          } catch (saveError) {
            console.warn("保存AI历史记录失败:", saveError);
          }

          options.onError?.(error);
        },
      };

      await provider.generateContent(completeOptions);
    } catch (error) {
      // 标准化错误处理
      const appError =
        error instanceof Error && "type" in error
          ? (error as AppError)
          : createAppError(
              error instanceof Error ? error.message : String(error),
              ErrorType.UNKNOWN,
              ErrorSeverity.MEDIUM,
              {
                code: "AI_GENERATION_FAILED",
                context: {
                  provider: this.currentProvider,
                  model: historyRecord.model,
                  prompt: options.prompt.slice(0, 100) + "...",
                },
                cause: error instanceof Error ? error : undefined,
              }
            );

      console.error("AI生成失败:", appError);

      // 记录错误到历史
      historyRecord.status = "error";
      historyRecord.errorMessage = appError.message;
      historyRecord.duration = Date.now() - startTime;

      try {
        await dbOperations.saveAIHistory(historyRecord);
      } catch (saveError) {
        console.warn("保存AI历史记录失败:", saveError);
      }

      // 显示用户友好的错误通知
      if (!(error instanceof Error && "type" in error)) {
        this.errorHandler.showErrorNotification(appError, {
          retryFn: () => this.generateNote(options),
        });
      }

      options.onError?.(appError);
      throw appError;
    }
  }

  setProvider(providerName: string): void {
    // 检查是否为支持的提供商
    const supportedProviders = [
      "zhipu",
      "deepseek",
      "openai",
      "alibaba",
      "siliconflow",
      "anthropic",
    ];
    if (supportedProviders.includes(providerName)) {
      this.currentProvider = providerName;
      this.currentSettings.provider = providerName;
    } else {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  getAvailableProviders(): string[] {
    // 返回所有支持的提供商列表
    return [
      "zhipu",
      "deepseek",
      "openai",
      "alibaba",
      "siliconflow",
      "anthropic",
    ];
  }

  async getProviderInfo(providerName: string): Promise<AIProvider | undefined> {
    try {
      return await this.getProvider(providerName);
    } catch (error) {
      console.error(`获取提供商信息失败: ${providerName}`, error);
      return undefined;
    }
  }

  async isProviderConfigured(providerName: string): Promise<boolean> {
    const apiKey = await this.securityManager.getAPIKey(providerName);
    return !!apiKey;
  }

  async configureProvider(providerName: string, apiKey: string): Promise<void> {
    const supportedProviders = this.getAvailableProviders();
    if (!supportedProviders.includes(providerName)) {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }
    if (!this.securityManager.validateAPIKey(providerName, apiKey)) {
      throw new Error(`无效的API密钥格式: ${providerName}`);
    }
    await this.securityManager.setAPIKey(providerName, apiKey);
  }

  /**
   * 测试提供商连接
   */
  async testProvider(providerName: string): Promise<boolean> {
    try {
      const provider = await this.getProvider(providerName);
      if (!provider) {
        throw new Error(`不支持的AI提供商: ${providerName}`);
      }

      const apiKey = await this.securityManager.getAPIKey(providerName);
      if (!apiKey) {
        throw new Error("API密钥未配置");
      }

      // 发送测试请求
      const testPrompt = "测试连接";
      let testPassed = false;

      await provider.generateContent({
        noteId: "test",
        prompt: testPrompt,
        onStream: () => {
          testPassed = true;
        },
        onComplete: () => {
          testPassed = true;
        },
        onError: () => {
          testPassed = false;
        },
      });

      return testPassed;
    } catch (error) {
      console.error(`测试${providerName}连接失败:`, error);
      return false;
    }
  }

  async getSettings(): Promise<AISettings> {
    await this.loadUserSettings();
    return {
      ...this.currentSettings,
      provider: this.currentProvider,
      defaultModel:
        this.currentSettings.defaultModel ||
        this.providers.get(this.currentProvider)?.supportedModels[0] ||
        "",
    };
  }

  getSettingsSync(): AISettings {
    return {
      ...this.currentSettings,
      provider: this.currentProvider,
      defaultModel:
        this.currentSettings.defaultModel ||
        this.providers.get(this.currentProvider)?.supportedModels[0] ||
        "",
    };
  }

  async saveSettings(settings: Partial<AISettings>): Promise<void> {
    try {
      if (settings.apiKeys) {
        for (const [provider, key] of Object.entries(settings.apiKeys)) {
          if (key) {
            await this.configureProvider(provider, key);
          }
        }
      }

      this.currentSettings = { ...this.currentSettings, ...settings };

      if (settings.provider && settings.provider !== this.currentProvider) {
        this.currentProvider = settings.provider;
        this.currentSettings.provider = settings.provider;
      }

      const settingsToSave = { ...settings };
      delete settingsToSave.apiKeys;

      const config: AIConfigDB = {
        id: "ai_settings",
        type: "settings",
        value: JSON.stringify(settingsToSave),
        encrypted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbOperations.saveAIConfig(config);
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
export { AIService };
