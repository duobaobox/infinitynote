/**
 * AI配置验证工具
 * 提供统一的配置验证、修复和迁移功能
 * 
 * 功能特性：
 * 1. 配置完整性验证
 * 2. 自动配置修复
 * 3. 版本迁移支持
 * 4. 配置健康检查
 */

import { providerRegistry, type ProviderId } from "./ProviderRegistry";
import type { AISettings, AIActiveConfig } from "../../types/ai";

/**
 * 配置验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings: string[];
  /** 修复建议 */
  fixes: ConfigFix[];
}

/**
 * 配置修复建议
 */
export interface ConfigFix {
  /** 修复类型 */
  type: 'provider' | 'model' | 'apiKey' | 'settings';
  /** 修复描述 */
  description: string;
  /** 修复操作 */
  action: () => Promise<void>;
  /** 是否自动应用 */
  autoApply: boolean;
}

/**
 * 配置健康状态
 */
export interface ConfigHealth {
  /** 整体健康状态 */
  status: 'healthy' | 'warning' | 'error';
  /** 配置的提供商数量 */
  configuredProviders: number;
  /** 总提供商数量 */
  totalProviders: number;
  /** 问题列表 */
  issues: string[];
  /** 建议列表 */
  recommendations: string[];
}

/**
 * AI配置验证器
 */
export class ConfigValidator {
  /**
   * 验证活跃配置
   */
  static validateActiveConfig(config: AIActiveConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: ConfigFix[] = [];

    // 验证提供商
    if (!config.provider) {
      errors.push("缺少提供商配置");
    } else if (!providerRegistry.isValidProviderId(config.provider)) {
      errors.push(`无效的提供商: ${config.provider}`);
      fixes.push({
        type: 'provider',
        description: `将提供商重置为默认值 (zhipu)`,
        action: async () => {
          config.provider = 'zhipu';
        },
        autoApply: true,
      });
    }

    // 验证模型
    if (!config.model) {
      errors.push("缺少模型配置");
    } else if (providerRegistry.isValidProviderId(config.provider)) {
      const supportedModels = providerRegistry.getSupportedModels(config.provider as ProviderId);
      if (!supportedModels.includes(config.model)) {
        warnings.push(`模型 ${config.model} 不在提供商 ${config.provider} 的支持列表中`);
        fixes.push({
          type: 'model',
          description: `将模型重置为 ${config.provider} 的默认模型`,
          action: async () => {
            config.model = providerRegistry.getDefaultModel(config.provider as ProviderId);
          },
          autoApply: false,
        });
      }
    }

    // 验证时间戳
    if (!config.appliedAt) {
      warnings.push("缺少配置应用时间");
      fixes.push({
        type: 'settings',
        description: "添加当前时间戳",
        action: async () => {
          config.appliedAt = new Date().toISOString();
        },
        autoApply: true,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixes,
    };
  }

  /**
   * 验证完整设置
   */
  static validateSettings(settings: AISettings): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: ConfigFix[] = [];

    // 验证活跃配置
    const activeConfigResult = this.validateActiveConfig(settings.activeConfig);
    errors.push(...activeConfigResult.errors);
    warnings.push(...activeConfigResult.warnings);
    fixes.push(...activeConfigResult.fixes);

    // 验证生成参数
    if (settings.temperature < 0 || settings.temperature > 2) {
      warnings.push(`温度参数 ${settings.temperature} 超出推荐范围 [0, 2]`);
      fixes.push({
        type: 'settings',
        description: "将温度重置为默认值 0.7",
        action: async () => {
          settings.temperature = 0.7;
        },
        autoApply: false,
      });
    }

    if (settings.maxTokens < 1 || settings.maxTokens > 32000) {
      warnings.push(`最大Token数 ${settings.maxTokens} 超出合理范围 [1, 32000]`);
      fixes.push({
        type: 'settings',
        description: "将最大Token数重置为默认值 4000",
        action: async () => {
          settings.maxTokens = 4000;
        },
        autoApply: false,
      });
    }

    // 检查向后兼容性
    if (settings.provider !== settings.activeConfig.provider) {
      warnings.push("向后兼容字段与活跃配置不一致");
      fixes.push({
        type: 'settings',
        description: "同步向后兼容字段",
        action: async () => {
          settings.provider = settings.activeConfig.provider;
          settings.defaultModel = settings.activeConfig.model;
        },
        autoApply: true,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixes,
    };
  }

  /**
   * 自动修复配置
   */
  static async autoFixConfig(settings: AISettings): Promise<{
    fixed: boolean;
    appliedFixes: string[];
  }> {
    const result = this.validateSettings(settings);
    const appliedFixes: string[] = [];

    for (const fix of result.fixes) {
      if (fix.autoApply) {
        try {
          await fix.action();
          appliedFixes.push(fix.description);
        } catch (error) {
          console.error(`自动修复失败: ${fix.description}`, error);
        }
      }
    }

    return {
      fixed: appliedFixes.length > 0,
      appliedFixes,
    };
  }

  /**
   * 检查配置健康状态
   */
  static async checkConfigHealth(): Promise<ConfigHealth> {
    const allProviders = providerRegistry.getAllProviderIds();
    const configuredProviders: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查每个提供商的配置状态
    for (const providerId of allProviders) {
      try {
        // 这里需要从AIService获取API密钥状态
        // 暂时跳过具体实现，因为需要依赖注入
        configuredProviders.push(providerId);
      } catch (error) {
        issues.push(`提供商 ${providerId} 配置检查失败`);
      }
    }

    // 生成建议
    if (configuredProviders.length === 0) {
      issues.push("没有配置任何AI提供商");
      recommendations.push("至少配置一个AI提供商以开始使用AI功能");
    } else if (configuredProviders.length === 1) {
      recommendations.push("建议配置多个AI提供商作为备选方案");
    }

    // 确定健康状态
    let status: ConfigHealth['status'] = 'healthy';
    if (issues.length > 0) {
      status = 'error';
    } else if (recommendations.length > 0) {
      status = 'warning';
    }

    return {
      status,
      configuredProviders: configuredProviders.length,
      totalProviders: allProviders.length,
      issues,
      recommendations,
    };
  }

  /**
   * 迁移旧版本配置
   */
  static migrateConfig(oldConfig: any): AISettings {
    // 创建新的配置结构
    const newConfig: AISettings = {
      activeConfig: {
        provider: oldConfig.provider || 'zhipu',
        model: oldConfig.defaultModel || 'glm-4-plus',
        appliedAt: new Date().toISOString(),
      },
      globalShowThinking: oldConfig.showThinking ?? true,
      temperature: oldConfig.temperature ?? 0.7,
      maxTokens: oldConfig.maxTokens ?? 3500,
      stream: oldConfig.stream ?? true,
      autoSave: oldConfig.autoSave ?? true,
      
      // 向后兼容字段
      provider: oldConfig.provider || 'zhipu',
      defaultModel: oldConfig.defaultModel || 'glm-4-plus',
      showThinking: oldConfig.showThinking ?? true,
      apiKeys: oldConfig.apiKeys || {},
    };

    // 验证并修复迁移后的配置
    const validationResult = this.validateSettings(newConfig);
    if (!validationResult.isValid) {
      console.warn("配置迁移后存在问题:", validationResult.errors);
      // 应用自动修复
      this.autoFixConfig(newConfig);
    }

    return newConfig;
  }
}

// 导出验证器实例
export const configValidator = ConfigValidator;
