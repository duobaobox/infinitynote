/**
 * 统一错误处理系统
 *
 * 提供一致的错误处理、日志记录和用户提示机制
 */

// 错误类型枚举
export enum ErrorType {
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  PERMISSION = "PERMISSION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  UNKNOWN = "UNKNOWN",
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = "LOW", // 不影响核心功能
  MEDIUM = "MEDIUM", // 影响部分功能
  HIGH = "HIGH", // 影响核心功能
  CRITICAL = "CRITICAL", // 应用无法正常使用
}

// 应用错误接口
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
  userMessage?: string;
  timestamp: Date;
}

/**
 * 创建应用错误
 */
export function createAppError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  options: {
    code?: string;
    context?: Record<string, any>;
    userMessage?: string;
    cause?: Error;
  } = {}
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.severity = severity;
  error.code = options.code;
  error.context = options.context;
  error.userMessage = options.userMessage || message;
  error.timestamp = new Date();

  if (options.cause) {
    error.cause = options.cause;
  }

  return error;
}

/**
 * 数据库错误处理器
 */
export function handleDatabaseError(
  error: unknown,
  operation: string,
  context?: Record<string, any>
): AppError {
  const baseMessage = `数据库操作失败: ${operation}`;

  if (error instanceof Error) {
    // 处理常见的数据库错误
    if (error.message.includes("Key already exists")) {
      return createAppError(
        `${baseMessage} - 数据已存在`,
        ErrorType.CONFLICT,
        ErrorSeverity.MEDIUM,
        {
          code: "DB_DUPLICATE_KEY",
          context: { operation, originalError: error.message, ...context },
          userMessage: "数据已存在，请检查后重试",
          cause: error,
        }
      );
    }

    if (
      error.message.includes("not found") ||
      error.message.includes("不存在")
    ) {
      return createAppError(
        `${baseMessage} - 数据不存在`,
        ErrorType.NOT_FOUND,
        ErrorSeverity.LOW,
        {
          code: "DB_NOT_FOUND",
          context: { operation, originalError: error.message, ...context },
          userMessage: "请求的数据不存在",
          cause: error,
        }
      );
    }

    if (error.message.includes("Need to reopen db")) {
      return createAppError(
        `${baseMessage} - 数据库连接中断`,
        ErrorType.DATABASE,
        ErrorSeverity.HIGH,
        {
          code: "DB_CONNECTION_LOST",
          context: { operation, originalError: error.message, ...context },
          userMessage: "数据库连接中断，正在尝试重新连接...",
          cause: error,
        }
      );
    }
  }

  // 通用数据库错误
  return createAppError(baseMessage, ErrorType.DATABASE, ErrorSeverity.MEDIUM, {
    code: "DB_GENERAL_ERROR",
    context: {
      operation,
      originalError: error instanceof Error ? error.message : String(error),
      ...context,
    },
    userMessage: "数据操作失败，请稍后重试",
    cause: error instanceof Error ? error : undefined,
  });
}

/**
 * 验证错误处理器
 */
export function handleValidationError(
  field: string,
  value: any,
  rule: string,
  context?: Record<string, any>
): AppError {
  return createAppError(
    `验证失败: ${field} - ${rule}`,
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    {
      code: "VALIDATION_ERROR",
      context: { field, value, rule, ...context },
      userMessage: `${field}格式不正确，请检查后重试`,
    }
  );
}

/**
 * 错误日志记录器
 */
export function logError(
  error: AppError | Error,
  context?: Record<string, any>
): void {
  const isAppError = "type" in error && "severity" in error;

  if (isAppError) {
    const appError = error as AppError;
    const logLevel = getLogLevel(appError.severity);
    const logMessage = `[${appError.type}] ${appError.message}`;
    const logContext = {
      code: appError.code,
      severity: appError.severity,
      timestamp: appError.timestamp,
      context: { ...appError.context, ...context },
    };

    switch (logLevel) {
      case "error":
        console.error(logMessage, logContext);
        break;
      case "warn":
        console.warn(logMessage, logContext);
        break;
      case "info":
        console.info(logMessage, logContext);
        break;
      default:
        console.log(logMessage, logContext);
    }
  } else {
    console.error("Unhandled Error:", error, context);
  }
}

/**
 * 根据错误严重级别获取日志级别
 */
function getLogLevel(
  severity: ErrorSeverity
): "error" | "warn" | "info" | "log" {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return "error";
    case ErrorSeverity.MEDIUM:
      return "warn";
    case ErrorSeverity.LOW:
      return "info";
    default:
      return "log";
  }
}

/**
 * 错误恢复策略
 */
export interface ErrorRecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<void>;
}

/**
 * 数据库重连恢复策略
 */
export const databaseReconnectStrategy: ErrorRecoveryStrategy = {
  canRecover: (error: AppError) =>
    error.type === ErrorType.DATABASE && error.code === "DB_CONNECTION_LOST",

  recover: async (_error: AppError) => {
    console.log("🔄 尝试重新连接数据库...");
    // 这里可以添加数据库重连逻辑
    // 例如：重新初始化数据库连接
    // 模拟重连过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("✅ 数据库连接已重新建立");
  },
};

/**
 * 错误处理中心
 */
export class ErrorHandler {
  private static strategies: ErrorRecoveryStrategy[] = [
    databaseReconnectStrategy,
  ];

  /**
   * 处理错误
   */
  static async handle(
    error: AppError | Error,
    context?: Record<string, any>
  ): Promise<void> {
    // 确保是AppError
    const appError =
      error instanceof Error && "type" in error
        ? (error as AppError)
        : createAppError(
            error instanceof Error ? error.message : String(error),
            ErrorType.UNKNOWN,
            ErrorSeverity.MEDIUM,
            { cause: error instanceof Error ? error : undefined }
          );

    // 记录错误
    logError(appError, context);

    // 尝试恢复
    for (const strategy of this.strategies) {
      if (strategy.canRecover(appError)) {
        try {
          await strategy.recover(appError);
          console.log("✅ 错误恢复成功");
          return;
        } catch (recoveryError) {
          console.error("❌ 错误恢复失败:", recoveryError);
        }
      }
    }
  }

  /**
   * 添加恢复策略
   */
  static addStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 初始化默认恢复策略
   */
  static initializeDefaultStrategies(): void {
    // 数据库连接恢复策略
    this.addStrategy({
      canRecover: (error: AppError) =>
        error.type === ErrorType.DATABASE &&
        error.code === "DB_CONNECTION_LOST",
      recover: async (_error: AppError) => {
        console.log("🔄 尝试重新连接数据库...");
        // 这里可以添加数据库重连逻辑
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("✅ 数据库连接已恢复");
      },
    });

    // 网络错误重试策略
    this.addStrategy({
      canRecover: (error: AppError) => error.type === ErrorType.NETWORK,
      recover: async (_error: AppError) => {
        console.log("🔄 检测网络连接...");
        if (navigator.onLine) {
          console.log("✅ 网络连接正常，可以重试");
        } else {
          throw new Error("网络连接不可用");
        }
      },
    });

    // API密钥验证策略
    this.addStrategy({
      canRecover: (error: AppError) =>
        error.code === "AI_API_KEY_MISSING" ||
        error.code === "AI_API_KEY_INVALID",
      recover: async (_error: AppError) => {
        console.log("🔑 提示用户配置API密钥...");
        // 触发API密钥配置界面
        window.dispatchEvent(new CustomEvent("openAISettings"));
      },
    });
  }
}

/**
 * 异步操作包装器，提供统一的错误处理
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = handleDatabaseError(error, operationName, context);
    await ErrorHandler.handle(appError, context);
    throw appError;
  }
}
