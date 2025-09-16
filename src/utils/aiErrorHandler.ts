/**
 * AI错误处理工具类
 * 提供用户友好的错误信息和恢复建议
 */

export interface AIErrorInfo {
  type: string;
  code?: string;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: RecoveryAction[];
}

export interface RecoveryAction {
  type: "configure" | "retry" | "switch" | "help";
  label: string;
  description?: string;
  action: () => void;
}

export class AIErrorHandler {
  private static instance: AIErrorHandler;

  static getInstance(): AIErrorHandler {
    if (!AIErrorHandler.instance) {
      AIErrorHandler.instance = new AIErrorHandler();
    }
    return AIErrorHandler.instance;
  }

  /**
   * 解析错误并返回用户友好的信息
   */
  parseError(error: Error | string, context?: any): AIErrorInfo {
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorType = this.detectErrorType(errorMessage);

    return {
      type: errorType,
      userMessage: this.getUserFriendlyMessage(errorType),
      technicalMessage: errorMessage,
      recoveryActions: this.getRecoveryActions(errorType, context),
    };
  }

  private detectErrorType(errorMessage: string): string {
    const errorPatterns = {
      API_KEY_MISSING: ["api密钥未配置", "api key", "authentication"],
      API_KEY_INVALID: ["invalid api key", "密钥无效", "unauthorized"],
      NETWORK_ERROR: ["网络", "network", "timeout", "fetch failed"],
      QUOTA_EXCEEDED: ["quota", "额度", "rate limit", "billing"],
      MODEL_UNAVAILABLE: ["model", "模型", "service unavailable"],
      INVALID_PROMPT: ["prompt", "提示词", "input too long"],
      GENERATION_FAILED: [
        "生成失败",
        "generation failed",
        "internal server error",
      ],
    };

    const message = errorMessage.toLowerCase();

    for (const [type, patterns] of Object.entries(errorPatterns)) {
      if (patterns.some((pattern) => message.includes(pattern))) {
        return type;
      }
    }

    return "UNKNOWN_ERROR";
  }

  private getUserFriendlyMessage(errorType: string): string {
    const messages: Record<string, string> = {
      API_KEY_MISSING: "🔑 请先配置AI服务的API密钥才能使用AI功能",
      API_KEY_INVALID: "🔑 API密钥无效，请检查密钥是否正确",
      NETWORK_ERROR: "🌐 网络连接出现问题，请检查网络后重试",
      QUOTA_EXCEEDED: "💰 API调用次数已达上限，请检查账户余额",
      MODEL_UNAVAILABLE: "🤖 AI模型暂时不可用，请稍后重试或切换其他模型",
      INVALID_PROMPT: "📝 输入的提示词有问题，请修改后重试",
      GENERATION_FAILED: "😅 AI生成过程中出现问题，请重试",
      UNKNOWN_ERROR: "❌ 出现未知错误，请重试或联系技术支持",
    };

    return messages[errorType] || messages["UNKNOWN_ERROR"];
  }

  private getRecoveryActions(
    errorType: string,
    context?: any
  ): RecoveryAction[] {
    const baseActions: Record<string, RecoveryAction[]> = {
      API_KEY_MISSING: [
        {
          type: "configure" as const,
          label: "配置API密钥",
          description: "打开设置页面配置AI服务",
          action: () => {
            // 打开设置模态框的AI配置页
            window.dispatchEvent(new CustomEvent("openAISettings"));
          },
        },
      ],
      API_KEY_INVALID: [
        {
          type: "configure" as const,
          label: "重新配置密钥",
          description: "检查并重新设置API密钥",
          action: () => {
            window.dispatchEvent(new CustomEvent("openAISettings"));
          },
        },
      ],
      NETWORK_ERROR: [
        {
          type: "retry" as const,
          label: "重试",
          description: "重新尝试AI生成",
          action: () => {
            if (context?.retryFn) {
              context.retryFn();
            }
          },
        },
      ],
      MODEL_UNAVAILABLE: [
        {
          type: "switch" as const,
          label: "切换模型",
          description: "尝试使用其他AI模型",
          action: () => {
            window.dispatchEvent(
              new CustomEvent("openAISettings", {
                detail: { activeTab: "model" },
              })
            );
          },
        },
        {
          type: "retry" as const,
          label: "重试",
          description: "重新尝试生成",
          action: () => {
            if (context?.retryFn) {
              context.retryFn();
            }
          },
        },
      ],
      GENERATION_FAILED: [
        {
          type: "retry" as const,
          label: "重试",
          description: "重新生成内容",
          action: () => {
            if (context?.retryFn) {
              context.retryFn();
            }
          },
        },
      ],
    };

    return (
      baseActions[errorType] || [
        {
          type: "help" as const,
          label: "获取帮助",
          description: "查看使用说明",
          action: () => {
            console.log("打开帮助文档");
          },
        },
      ]
    );
  }
}
