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
 * AI 服务主类 - 重构版本
 */
class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private securityManager: SecurityManager;
  private errorHandler: AIErrorHandler;

  // 新的状态管理架构
  private currentSettings: AISettings = {
    // 活跃配置 - 当前正在使用的配置
    activeConfig: {
      provider: "zhipu",
      model: "glm-4",
      appliedAt: new Date().toISOString(),
    },
    // 全局思维链控制
    globalShowThinking: true,
    // 生成参数
    temperature: 0.7,
    maxTokens: 1000,
    autoSave: true,

    // 向后兼容字段
    provider: "zhipu",
    defaultModel: "glm-4",
    showThinking: true,
    apiKeys: {},
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
   * 获取当前活跃的配置
   */
  getActiveConfig(): AIActiveConfig {
    return this.currentSettings.activeConfig;
  }

  /**
   * 获取当前使用的提供商
   */
  getCurrentProvider(): string {
    return this.currentSettings.activeConfig.provider;
  }

  /**
   * 获取当前使用的模型
   */
  getCurrentModel(): string {
    return this.currentSettings.activeConfig.model;
  }

  /**
   * 测试配置（不影响当前使用状态）
   * @param provider 提供商名称
   * @param model 模型名称
   * @param apiKey API密钥
   * @returns 测试结果
   */
  async testConfiguration(
    provider: string,
    model: string,
    apiKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🧪 测试配置: ${provider} - ${model}`);

      // 验证API密钥格式
      if (!this.securityManager.validateAPIKey(provider, apiKey)) {
        return {
          success: false,
          error: "API密钥格式不正确",
        };
      }

      // 临时保存API密钥用于测试
      await this.securityManager.setAPIKey(provider, apiKey);

      // 测试提供商连接
      const testResult = await this.testProvider(provider);

      if (testResult) {
        console.log(`✅ 配置测试成功: ${provider} - ${model}`);
        return { success: true };
      } else {
        return {
          success: false,
          error: "连接测试失败，请检查API密钥是否正确",
        };
      }
    } catch (error) {
      console.error(`❌ 配置测试失败:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 应用配置（测试成功后调用）
   * @param provider 提供商名称
   * @param model 模型名称
   */
  async applyConfiguration(provider: string, model: string): Promise<void> {
    try {
      console.log(`🔄 应用配置: ${provider} - ${model}`);

      // 更新活跃配置
      this.currentSettings.activeConfig = {
        provider,
        model,
        appliedAt: new Date().toISOString(),
      };

      // 更新向后兼容字段
      this.currentSettings.provider = provider;
      this.currentSettings.defaultModel = model;

      // 保存设置
      await this.saveSettings({
        activeConfig: this.currentSettings.activeConfig,
        provider,
        defaultModel: model,
      });

      console.log(`✅ 配置应用成功: ${provider} - ${model}`);
    } catch (error) {
      console.error(`❌ 配置应用失败:`, error);
      throw new Error("配置应用失败");
    }
  }

  /**
   * 获取全局思维链显示设置
   */
  getGlobalShowThinking(): boolean {
    return this.currentSettings.globalShowThinking;
  }

  /**
   * 设置全局思维链显示
   * @param enabled 是否启用思维链显示
   */
  async setGlobalShowThinking(enabled: boolean): Promise<void> {
    try {
      console.log(`🧠 设置全局思维链显示: ${enabled}`);

      this.currentSettings.globalShowThinking = enabled;
      // 更新向后兼容字段
      this.currentSettings.showThinking = enabled;

      // 保存设置
      await this.saveSettings({
        globalShowThinking: enabled,
        showThinking: enabled,
      });

      console.log(`✅ 全局思维链设置已更新: ${enabled}`);
    } catch (error) {
      console.error(`❌ 更新思维链设置失败:`, error);
      throw new Error("更新思维链设置失败");
    }
  }

  /**
   * 思维链支持的模型配置
   * 便于维护和扩展新的支持思维链的模型
   */
  private static readonly THINKING_SUPPORTED_MODELS = {
    deepseek: ["reasoner"], // DeepSeek 的推理模型支持思维链
    zhipu: ["think"], // 智谱AI的思维模式模型支持思维链
    // 未来可以添加其他提供商的支持：
    // openai: ["o1-preview", "o1-mini"], // OpenAI 的推理模型
    // anthropic: ["claude-3-reasoning"], // Anthropic 的推理模型
  };

  /**
   * 判断当前模型是否支持思维链
   */
  currentModelSupportsThinking(): boolean {
    const currentProvider = this.getCurrentProvider();
    const currentModel = this.getCurrentModel();

    const supportedKeywords =
      AIService.THINKING_SUPPORTED_MODELS[
        currentProvider as keyof typeof AIService.THINKING_SUPPORTED_MODELS
      ];
    if (!supportedKeywords) {
      return false;
    }

    // 检查模型名称是否包含支持思维链的关键词
    return supportedKeywords.some((keyword) =>
      currentModel.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 判断是否应该显示思维链
   * 综合考虑全局设置和模型能力
   */
  shouldShowThinking(): boolean {
    return this.getGlobalShowThinking() && this.currentModelSupportsThinking();
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

  /**
   * 验证和修复模型设置
   * 确保模型名称与提供商支持的模型匹配
   */
  private async validateAndFixModelSettings(settings: any): Promise<any> {
    const fixedSettings = { ...settings };

    if (fixedSettings.provider && fixedSettings.defaultModel) {
      try {
        const provider = await this.getProvider(fixedSettings.provider);
        const supportedModels = provider.supportedModels;

        // 检查当前模型是否在支持列表中
        if (!supportedModels.includes(fixedSettings.defaultModel)) {
          console.warn(
            `⚠️ 模型 ${fixedSettings.defaultModel} 不被 ${fixedSettings.provider} 支持，自动修复为: ${supportedModels[0]}`
          );
          fixedSettings.defaultModel = supportedModels[0];
        }
      } catch (error) {
        console.warn(`⚠️ 验证模型设置时出错:`, error);
      }
    }

    return fixedSettings;
  }

  private async loadUserSettings(): Promise<void> {
    try {
      await dbOperations.migrateAIConfigsFromLocalStorage();
      const settingsConfig = await dbOperations.getAIConfig("ai_settings");
      if (settingsConfig?.value) {
        const savedSettings = JSON.parse(settingsConfig.value);

        // 迁移旧版本设置到新结构
        const migratedSettings =
          this.migrateSettingsToNewStructure(savedSettings);

        // 验证和修复模型设置
        const fixedSettings = await this.validateAndFixModelSettings(
          migratedSettings
        );

        this.currentSettings = { ...this.currentSettings, ...fixedSettings };

        // 如果设置被修复或迁移，保存修复后的设置
        if (JSON.stringify(savedSettings) !== JSON.stringify(fixedSettings)) {
          console.log("🔧 检测到设置需要迁移或修复，已自动处理");
          await this.saveSettings(fixedSettings);
        }

        console.log("✅ AI设置加载成功:", this.currentSettings);
      }
    } catch (error) {
      console.error("加载AI设置失败:", error);
    }
  }

  /**
   * 迁移旧版本设置到新结构
   */
  private migrateSettingsToNewStructure(oldSettings: any): Partial<AISettings> {
    const newSettings: Partial<AISettings> = { ...oldSettings };

    // 如果没有 activeConfig，从旧字段创建
    if (
      !newSettings.activeConfig &&
      (oldSettings.provider || oldSettings.defaultModel)
    ) {
      newSettings.activeConfig = {
        provider: oldSettings.provider || "zhipu",
        model: oldSettings.defaultModel || "glm-4",
        appliedAt: new Date().toISOString(),
      };
      console.log("🔄 迁移活跃配置:", newSettings.activeConfig);
    }

    // 如果没有 globalShowThinking，从旧字段迁移
    if (
      newSettings.globalShowThinking === undefined &&
      oldSettings.showThinking !== undefined
    ) {
      newSettings.globalShowThinking = oldSettings.showThinking;
      console.log("🔄 迁移思维链设置:", newSettings.globalShowThinking);
    }

    return newSettings;
  }

  async generateNote(options: AIGenerationOptions): Promise<void> {
    const startTime = Date.now();
    const historyId = `ai_history_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // 创建历史记录 - 使用新的活跃配置
    const activeConfig = this.getActiveConfig();
    const historyRecord: AIHistoryDB = {
      id: historyId,
      noteId: options.noteId,
      prompt: options.prompt,
      provider: activeConfig.provider,
      model: options.model || activeConfig.model,
      temperature: options.temperature ?? this.currentSettings.temperature,
      maxTokens: options.maxTokens ?? this.currentSettings.maxTokens,
      generatedContent: "",
      status: "success",
      duration: 0,
      createdAt: new Date(),
    };

    try {
      // 懒加载获取提供商 - 使用活跃配置
      const currentProvider = this.getCurrentProvider();
      const provider = await this.getProvider(currentProvider);
      if (!provider) {
        const error = createAppError(
          `AI提供商 ${currentProvider} 不可用`,
          ErrorType.NOT_FOUND,
          ErrorSeverity.HIGH,
          {
            code: "AI_PROVIDER_NOT_FOUND",
            context: { provider: currentProvider },
            userMessage: `当前AI服务提供商不可用，请检查配置`,
          }
        );
        this.errorHandler.showErrorNotification(error, {
          retryFn: () => options.onError?.(error),
        });
        throw error;
      }

      // 检查API密钥
      const apiKey = await this.securityManager.getAPIKey(currentProvider);
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
        // 不在这里显示错误通知，让上层调用者处理
        // this.errorHandler.showErrorNotification(error);
        throw error;
      }

      // 检查思维链功能提示 - 使用新的全局控制逻辑
      if (this.getGlobalShowThinking()) {
        const currentProvider = this.getCurrentProvider();
        const currentModel = this.getCurrentModel();

        if (
          currentProvider === "deepseek" &&
          !currentModel.includes("reasoner")
        ) {
          console.warn(
            `💡 提示: 当前使用的是 ${currentModel} 模型，该模型不支持思维链功能。如需使用思维链，请在设置中切换到 deepseek-reasoner 模型。`
          );
        } else if (!this.currentModelSupportsThinking()) {
          console.warn(
            `💡 提示: 当前模型 ${currentProvider}/${currentModel} 不支持思维链功能。`
          );
        }
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

  /**
   * @deprecated 使用 applyConfiguration 替代
   */
  setProvider(providerName: string): void {
    console.warn("⚠️ setProvider 方法已废弃，请使用 applyConfiguration 方法");
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
      // 更新活跃配置
      this.currentSettings.activeConfig.provider = providerName;
      this.currentSettings.provider = providerName;
    } else {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }
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

  /**
   * 检查提供商是否已配置API密钥
   */
  async hasAPIKey(provider: string): Promise<boolean> {
    try {
      const apiKey = await this.securityManager.getAPIKey(provider);
      return !!apiKey;
    } catch (error) {
      console.error(`检查API密钥失败 (${provider}):`, error);
      return false;
    }
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
    const activeConfig = this.getActiveConfig();

    return {
      ...this.currentSettings,
      // 确保向后兼容字段与活跃配置同步
      provider: activeConfig.provider,
      defaultModel: activeConfig.model,
      showThinking: this.currentSettings.globalShowThinking,
    };
  }

  getSettingsSync(): AISettings {
    const activeConfig = this.getActiveConfig();

    return {
      ...this.currentSettings,
      // 确保向后兼容字段与活跃配置同步
      provider: activeConfig.provider,
      defaultModel: activeConfig.model,
      showThinking: this.currentSettings.globalShowThinking,
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

      // 更新当前设置
      this.currentSettings = { ...this.currentSettings, ...settings };

      // 同步向后兼容字段
      if (settings.activeConfig) {
        this.currentSettings.provider = settings.activeConfig.provider;
        this.currentSettings.defaultModel = settings.activeConfig.model;
      }

      if (settings.globalShowThinking !== undefined) {
        this.currentSettings.showThinking = settings.globalShowThinking;
      }

      // 准备保存的设置（排除敏感信息）
      const settingsToSave = { ...this.currentSettings };
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
