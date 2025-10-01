/**
 * AI 服务层
 * 统一管理 AI 提供商和生成逻辑
 * 重构后的版本，使用BaseAIProvider架构
 */

import type {
  AIProvider,
  AIGenerationOptions,
  AISettings,
  AIActiveConfig,
} from "../types/ai";
import { dbOperations, type AIConfigDB, type AIHistoryDB } from "../utils/db";
import {
  createAppError,
  ErrorType,
  ErrorSeverity,
  type AppError,
} from "../utils/errorHandler";
import { AIErrorHandler } from "../utils/aiErrorHandler";
import { providerRegistry, type ProviderId } from "./ai/ProviderRegistry";

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
    if (!providerRegistry.isValidProviderId(provider)) {
      return key.length > 20; // 兜底验证
    }
    return providerRegistry.validateApiKey(provider as ProviderId, key);
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
    maxTokens: 3500,
    // 系统内部使用的固定配置（不再暴露给用户）
    stream: true, // 流式输出：默认启用，提供更好的用户体验
    autoSave: true, // 自动保存：默认启用，避免数据丢失

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

      // 测试提供商连接，传递指定的模型
      const testResult = await this.testProvider(provider, model);

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

      // 保存提供商的首选模型配置
      await this.saveProviderModel(provider, model);

      // 保存全局设置
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
   * 现在基于内容检测，不再依赖全局开关
   * @deprecated 此方法已废弃，思维链显示现在基于内容自动检测
   */
  shouldShowThinking(): boolean {
    // 始终返回true，让BaseAIProvider的检测器决定
    return true;
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
   * 使用注册中心统一管理提供商加载
   */
  private async getProvider(providerName: string): Promise<AIProvider> {
    // 检查是否已经加载
    if (this.providers.has(providerName)) {
      return this.providers.get(providerName)!;
    }

    // 验证提供商ID
    if (!providerRegistry.isValidProviderId(providerName)) {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }

    try {
      // 使用注册中心加载提供商
      const provider = await providerRegistry.loadProvider(
        providerName as ProviderId
      );
      this.providers.set(providerName, provider);
      return provider;
    } catch (error) {
      console.error(`❌ 加载AI提供商 ${providerName} 失败:`, error);
      throw new Error(`加载AI提供商失败: ${providerName}`);
    }
  }

  /**
   * 验证和修复模型设置
   * 仅处理缺失的必要字段，不校验模型有效性
   */
  private async validateAndFixModelSettings(settings: any): Promise<any> {
    const fixedSettings = { ...settings };

    if (fixedSettings.provider) {
      try {
        // 当默认模型缺失时使用提供商默认模型兜底
        if (!fixedSettings.defaultModel) {
          const providerRegistry = (await import("./ai/ProviderRegistry"))
            .providerRegistry;
          const defaultModel = providerRegistry.getDefaultModel(
            fixedSettings.provider
          );
          fixedSettings.defaultModel = defaultModel || "gpt-3.5-turbo";
        }

        // 如果活跃配置缺失模型信息，也同步兜底
        if (!fixedSettings.activeConfig?.model) {
          fixedSettings.activeConfig = {
            ...(fixedSettings.activeConfig ?? {}),
            model: fixedSettings.defaultModel,
          };
        }

        // 保留用户设置的模型，不做校验（交给测试时处理）
        console.log(
          `ℹ️ 保留用户配置的模型: ${fixedSettings.provider}/${fixedSettings.activeConfig.model}`
        );
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
      stream: options.stream ?? this.currentSettings.stream,
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
          "API密钥未配置",
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          {
            code: "AI_API_KEY_MISSING",
            context: { provider: currentProvider },
            userMessage: "请先配置API密钥",
          }
        );
        // 不在这里显示错误通知，让上层调用者处理
        // this.errorHandler.showErrorNotification(error);
        throw error;
      }

      // 思维链功能现在基于内容自动检测，不再需要全局开关提示
      // 保留模型兼容性检查用于调试
      const currentModel = this.getCurrentModel();

      if (
        currentProvider === "deepseek" &&
        !currentModel.includes("reasoner")
      ) {
        console.info(
          `💡 提示: 当前使用的是 ${currentModel} 模型，该模型不支持思维链功能。如需使用思维链，请在设置中切换到 deepseek-reasoner 模型。`
        );
      } else if (!this.currentModelSupportsThinking()) {
        console.info(
          `💡 提示: 当前模型 ${currentProvider}/${currentModel} 不支持思维链功能。`
        );
      }

      const completeOptions: AIGenerationOptions = {
        ...options,
        model: historyRecord.model,
        temperature: historyRecord.temperature,
        maxTokens: historyRecord.maxTokens,
        stream: historyRecord.stream,
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
                  provider: activeConfig.provider,
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

      // 不在AIService层显示错误通知，交由上层调用者统一处理
      // 这样可以避免重复显示通知，并让上层有更好的控制权

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
    // 使用注册中心获取所有支持的提供商列表
    return providerRegistry.getAllProviderIds();
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

  /**
   * 检查当前活跃配置是否就绪
   * 检查当前正在使用的提供商+模型是否完全配置好并可用
   */
  async isCurrentConfigurationReady(): Promise<{
    status: "ready" | "unconfigured" | "error";
    message?: string;
  }> {
    try {
      const activeConfig = this.getActiveConfig();

      // 1. 检查提供商是否有效
      if (!providerRegistry.isValidProviderId(activeConfig.provider)) {
        return {
          status: "error",
          message: "无效的AI提供商",
        };
      }

      // 2. 检查是否有API密钥
      const hasApiKey = await this.hasAPIKey(activeConfig.provider);
      if (!hasApiKey) {
        return {
          status: "unconfigured",
          message: "未配置API密钥",
        };
      }

      // 3. 跳过模型校验（用户可以配置任何模型名称）
      // 实际的模型有效性将在"保存并测试"时进行验证
      console.info(
        `ℹ️ 当前配置的模型: ${activeConfig.provider}/${activeConfig.model}`
      );

      // 4. 验证API密钥格式
      const apiKey = await this.getAPIKey(activeConfig.provider);
      if (
        !apiKey ||
        !this.securityManager.validateAPIKey(activeConfig.provider, apiKey)
      ) {
        return {
          status: "error",
          message: "API密钥格式无效",
        };
      }

      return {
        status: "ready",
        message: "AI配置已就绪",
      };
    } catch (error) {
      console.error("检查当前配置状态失败:", error);
      return {
        status: "error",
        message: "配置检查失败",
      };
    }
  }

  /**
   * 获取提供商的API密钥
   * @param provider 提供商名称
   * @returns API密钥字符串，如果未配置则返回null
   */
  async getAPIKey(provider: string): Promise<string | null> {
    try {
      return await this.securityManager.getAPIKey(provider);
    } catch (error) {
      console.error(`获取API密钥失败 (${provider}):`, error);
      return null;
    }
  }

  /**
   * 保存提供商的首选模型配置
   * @param provider 提供商名称
   * @param model 模型名称
   */
  async saveProviderModel(provider: string, model: string): Promise<void> {
    try {
      const config: AIConfigDB = {
        id: `provider_model_${provider}`,
        type: "settings",
        provider,
        value: JSON.stringify({ model, updatedAt: new Date().toISOString() }),
        encrypted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await dbOperations.saveAIConfig(config);
      console.log(`✅ 保存提供商模型配置: ${provider} -> ${model}`);
    } catch (error) {
      console.error(`❌ 保存提供商模型配置失败 (${provider}):`, error);
      throw new Error("保存提供商模型配置失败");
    }
  }

  /**
   * 获取提供商的首选模型配置
   * @param provider 提供商名称
   * @returns 模型名称，如果未配置则返回null
   */
  async getProviderModel(provider: string): Promise<string | null> {
    try {
      const config = await dbOperations.getAIConfig(
        `provider_model_${provider}`
      );
      if (config?.value) {
        const data = JSON.parse(config.value);
        return data.model || null;
      }
      return null;
    } catch (error) {
      console.error(`❌ 获取提供商模型配置失败 (${provider}):`, error);
      return null;
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
   * @param providerName 提供商名称
   * @param model 要测试的模型名称（可选）
   */
  async testProvider(providerName: string, model?: string): Promise<boolean> {
    try {
      const provider = await this.getProvider(providerName);
      if (!provider) {
        throw new Error(`不支持的AI提供商: ${providerName}`);
      }

      const apiKey = await this.securityManager.getAPIKey(providerName);
      if (!apiKey) {
        throw new Error("API密钥未配置");
      }

      // 发送测试请求，使用指定的模型
      const testPrompt = "hi";
      let testPassed = false;

      await provider.generateContent({
        noteId: "test",
        prompt: testPrompt,
        model: model, // 传递指定的模型
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
      delete (settingsToSave as any).apiKeys;

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
