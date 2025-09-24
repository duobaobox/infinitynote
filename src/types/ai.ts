/**
 * AI 功能相关类型定义
 */

/**
 * AI 生成的便签自定义属性接口
 */
export interface AICustomProperties {
  ai?: {
    // 基础信息
    generated: boolean; // 是否AI生成
    model: string; // 使用的AI模型
    provider: string; // AI服务提供商
    generatedAt: string; // 生成时间

    // 生成参数
    prompt: string; // 用户输入的提示
    temperature?: number; // 生成温度
    maxTokens?: number; // 最大token数

    // 思维链数据（如果支持）
    thinkingChain?: {
      steps: Array<{
        id: string;
        content: string;
        timestamp: number;
      }>;
      summary: string;
      totalSteps: number;
    };

    // UI状态
    showThinking?: boolean; // 是否显示思维链
    thinkingCollapsed?: boolean; // 思维链是否折叠

    // 元数据
    requestId: string; // 请求ID，用于调试
    cost?: {
      // 成本信息（可选）
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    };

    // 流式生成状态
    isStreaming?: boolean; // 是否正在流式生成
    originalMarkdown?: string; // 原始Markdown内容（用于调试）

    // AI生成阶段状态 - 用于区分思维链生成和最终答案生成
    generationPhase?: AIGenerationPhase; // 当前生成阶段
    isThinkingPhase?: boolean; // 是否正在思维链生成阶段
    isAnsweringPhase?: boolean; // 是否正在最终答案生成阶段
  };
}

/**
 * AI 生成选项接口
 */
export interface AIGenerationOptions {
  noteId: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onStream?: (content: string, aiData?: AICustomProperties["ai"]) => void;
  onComplete?: (finalContent: string, aiData: AICustomProperties["ai"]) => void;
  onError?: (error: Error) => void;
}

/**
 * AI 服务提供商接口
 */
export interface AIProvider {
  name: string;
  generateContent: (options: AIGenerationOptions) => Promise<void>;
  supportedModels: string[];
  supportsStreaming: boolean;
  supportsThinking: boolean;
}

/**
 * 智谱AI API响应接口
 */
export interface ZhipuAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
      thinking?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * AI 活跃配置接口 - 当前正在使用的配置
 */
export interface AIActiveConfig {
  /** 当前使用的提供商 */
  provider: string;
  /** 当前使用的模型 */
  model: string;
  /** 配置生效时间 */
  appliedAt: string;
}

/**
 * AI 配置状态接口 - 配置界面的临时状态
 */
export interface AIConfigurationState {
  /** 选择的提供商 */
  selectedProvider: string;
  /** 选择的模型 */
  selectedModel: string;
  /** API密钥 */
  apiKey: string;
  /** 连接状态 */
  connectionStatus: "idle" | "testing" | "success" | "error";
  /** 是否已配置 */
  isConfigured: boolean;
  /** 测试错误信息 */
  errorMessage?: string;
}

/**
 * AI 设置接口 - 重构后的完整设置
 */
export interface AISettings {
  /** 当前活跃的配置 */
  activeConfig: AIActiveConfig;
  /** 全局思维链显示控制 */
  globalShowThinking: boolean;
  /** 生成参数 */
  temperature: number;
  maxTokens: number;
  stream: boolean;
  /** 是否自动保存AI生成的内容 */
  autoSave: boolean;

  // 向后兼容字段（将逐步废弃）
  /** @deprecated 使用 activeConfig.provider 替代 */
  provider: string;
  /** @deprecated 使用 activeConfig.model 替代 */
  defaultModel: string;
  /** @deprecated 使用 globalShowThinking 替代 */
  showThinking: boolean;
  /** @deprecated API密钥现在独立管理 */
  apiKeys: Record<string, string>;
}

/**
 * AI 生成状态枚举
 */
export enum AIGenerationStatus {
  IDLE = "idle",
  GENERATING = "generating",
  COMPLETED = "completed",
  ERROR = "error",
  CANCELLED = "cancelled",
}

/**
 * AI 生成阶段枚举 - 用于区分思维链生成和最终答案生成阶段
 */
export enum AIGenerationPhase {
  /** 初始化阶段 */
  INITIALIZING = "initializing",
  /** 思维链生成阶段 - 显示"正在思考…" */
  THINKING = "thinking",
  /** 最终答案生成阶段 - 显示"正在回复…" */
  ANSWERING = "answering",
  /** 生成完成阶段 - 显示"思维过程" */
  COMPLETED = "completed",
}

/**
 * AI 错误类型
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "AIError";
  }
}
