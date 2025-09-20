/**
 * AI错误处理工具类
 * 提供用户友好的错误信息和恢复建议
 */

import {
  createAppError,
  ErrorType,
  ErrorSeverity,
  type AppError,
} from "./errorHandler";
import { errorNotification } from "../components/ErrorNotification";

export interface AIErrorInfo {
  type: string;
  code?: string;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: RecoveryAction[];
  severity: "low" | "medium" | "high" | "critical";
  appError: AppError;
}

export interface RecoveryAction {
  type: "configure" | "retry" | "switch" | "help" | "contact";
  label: string;
  description?: string;
  action: () => void;
  primary?: boolean;
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
    const severity = this.getErrorSeverity(errorType);

    // 创建标准化的AppError
    const appError = createAppError(
      errorMessage,
      this.mapToErrorType(errorType),
      this.mapToErrorSeverity(severity),
      {
        code: this.getErrorCode(errorType),
        context,
        userMessage: this.getUserFriendlyMessage(errorType),
      }
    );

    return {
      type: errorType,
      code: appError.code,
      userMessage: this.getUserFriendlyMessage(errorType),
      technicalMessage: errorMessage,
      recoveryActions: this.getRecoveryActions(errorType, context),
      severity,
      appError,
    };
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(error: Error | string, context?: any): void {
    const errorInfo = this.parseError(error, context);

    errorNotification.show({
      error: errorInfo.appError,
      title: this.getErrorTitle(errorInfo.type),
      showRetry: errorInfo.recoveryActions.some(
        (action) => action.type === "retry"
      ),
      showSettings: errorInfo.recoveryActions.some(
        (action) => action.type === "configure"
      ),
      onRetry: () => {
        const retryAction = errorInfo.recoveryActions.find(
          (action) => action.type === "retry"
        );
        retryAction?.action();
      },
      onSettings: () => {
        const configAction = errorInfo.recoveryActions.find(
          (action) => action.type === "configure"
        );
        configAction?.action();
      },
    });
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

  private getErrorSeverity(
    errorType: string
  ): "low" | "medium" | "high" | "critical" {
    const severityMap: Record<string, "low" | "medium" | "high" | "critical"> =
      {
        API_KEY_MISSING: "medium",
        API_KEY_INVALID: "medium",
        NETWORK_ERROR: "high",
        QUOTA_EXCEEDED: "high",
        MODEL_UNAVAILABLE: "medium",
        INVALID_PROMPT: "low",
        GENERATION_FAILED: "medium",
        UNKNOWN_ERROR: "medium",
      };
    return severityMap[errorType] || "medium";
  }

  private getErrorCode(errorType: string): string {
    const codeMap: Record<string, string> = {
      API_KEY_MISSING: "AI_001",
      API_KEY_INVALID: "AI_002",
      NETWORK_ERROR: "AI_003",
      QUOTA_EXCEEDED: "AI_004",
      MODEL_UNAVAILABLE: "AI_005",
      INVALID_PROMPT: "AI_006",
      GENERATION_FAILED: "AI_007",
      UNKNOWN_ERROR: "AI_999",
    };
    return codeMap[errorType] || "AI_999";
  }

  private getErrorTitle(errorType: string): string {
    const titleMap: Record<string, string> = {
      API_KEY_MISSING: "API密钥未配置",
      API_KEY_INVALID: "API密钥无效",
      NETWORK_ERROR: "网络连接错误",
      QUOTA_EXCEEDED: "API额度不足",
      MODEL_UNAVAILABLE: "AI模型不可用",
      INVALID_PROMPT: "提示词格式错误",
      GENERATION_FAILED: "AI生成失败",
      UNKNOWN_ERROR: "未知错误",
    };
    return titleMap[errorType] || "系统错误";
  }

  private mapToErrorType(aiErrorType: string): ErrorType {
    const typeMap: Record<string, ErrorType> = {
      API_KEY_MISSING: ErrorType.VALIDATION,
      API_KEY_INVALID: ErrorType.VALIDATION,
      NETWORK_ERROR: ErrorType.NETWORK,
      QUOTA_EXCEEDED: ErrorType.PERMISSION,
      MODEL_UNAVAILABLE: ErrorType.NOT_FOUND,
      INVALID_PROMPT: ErrorType.VALIDATION,
      GENERATION_FAILED: ErrorType.UNKNOWN,
      UNKNOWN_ERROR: ErrorType.UNKNOWN,
    };
    return typeMap[aiErrorType] || ErrorType.UNKNOWN;
  }

  private mapToErrorSeverity(
    severity: "low" | "medium" | "high" | "critical"
  ): ErrorSeverity {
    const severityMap = {
      low: ErrorSeverity.LOW,
      medium: ErrorSeverity.MEDIUM,
      high: ErrorSeverity.HIGH,
      critical: ErrorSeverity.CRITICAL,
    };
    return severityMap[severity];
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
          primary: true,
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
          primary: true,
          action: () => {
            if (context?.retryFn) {
              context.retryFn();
            }
          },
        },
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
      ],
      QUOTA_EXCEEDED: [
        {
          type: "help" as const,
          label: "查看解决方案",
          description: "了解如何解决额度问题",
          primary: true,
          action: () => {
            window.open("https://docs.infinitynote.com/ai-quota", "_blank");
          },
        },
        {
          type: "switch" as const,
          label: "切换提供商",
          description: "使用其他AI服务提供商",
          action: () => {
            window.dispatchEvent(new CustomEvent("openAISettings"));
          },
        },
      ],
    };

    const defaultActions: RecoveryAction[] = [
      {
        type: "retry" as const,
        label: "重试",
        description: "重新尝试操作",
        action: () => {
          if (context?.retryFn) {
            context.retryFn();
          }
        },
      },
      {
        type: "help" as const,
        label: "获取帮助",
        description: "查看使用说明",
        action: () => {
          window.open(
            "https://docs.infinitynote.com/troubleshooting",
            "_blank"
          );
        },
      },
      {
        type: "contact" as const,
        label: "联系支持",
        description: "联系技术支持团队",
        action: () => {
          window.open(
            "mailto:support@infinitynote.com?subject=AI错误报告",
            "_blank"
          );
        },
      },
    ];

    return baseActions[errorType] || defaultActions;
  }
}
