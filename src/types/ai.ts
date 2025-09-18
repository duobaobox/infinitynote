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
 * AI 设置接口
 */
export interface AISettings {
  provider: string;
  apiKeys: Record<string, string>;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  showThinking: boolean;
  autoSave: boolean;
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
