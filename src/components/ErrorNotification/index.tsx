import React from "react";
import { notification, Button, Space } from "antd";
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { AppError } from "../../utils/errorHandler";
import { ErrorType, ErrorSeverity } from "../../utils/errorHandler";
import styles from "./index.module.css";

export interface ErrorNotificationConfig {
  error: AppError | Error;
  title?: string;
  duration?: number;
  showRetry?: boolean;
  showSettings?: boolean;
  onRetry?: () => void;
  onSettings?: () => void;
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}

/**
 * 错误通知管理器
 *
 * 功能特性：
 * - 统一的错误通知显示
 * - 根据错误类型和严重程度自动选择样式
 * - 提供恢复操作按钮
 * - 支持自动消失和手动关闭
 * - 防止重复通知
 * - 支持App上下文的notification实例
 */
export class ErrorNotificationManager {
  private static instance: ErrorNotificationManager;
  private activeNotifications = new Set<string>();
  private notificationQueue: ErrorNotificationConfig[] = [];
  private isProcessing = false;
  private notificationApi: any = notification; // 默认使用静态notification，可被覆盖

  static getInstance(): ErrorNotificationManager {
    if (!ErrorNotificationManager.instance) {
      ErrorNotificationManager.instance = new ErrorNotificationManager();
    }
    return ErrorNotificationManager.instance;
  }

  /**
   * 设置notification实例（来自App上下文）
   * 这样可以避免静态方法的上下文警告
   */
  setNotificationApi(notificationApi: any): void {
    this.notificationApi = notificationApi;
  }

  /**
   * 显示错误通知
   */
  show(config: ErrorNotificationConfig): void {
    const error = this.normalizeError(config.error);
    const notificationKey = this.generateKey(error);

    // 防止重复通知
    if (this.activeNotifications.has(notificationKey)) {
      return;
    }

    this.notificationQueue.push({ ...config, error });
    this.processQueue();
  }

  /**
   * 显示成功通知
   */
  success(message: string, description?: string, duration = 3): void {
    this.notificationApi.success({
      message,
      description,
      duration,
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      placement: "topRight",
    });
  }

  /**
   * 显示信息通知
   */
  info(message: string, description?: string, duration = 3): void {
    this.notificationApi.info({
      message,
      description,
      duration,
      icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
      placement: "topRight",
    });
  }

  /**
   * 显示警告通知
   */
  warning(message: string, description?: string, duration = 4): void {
    this.notificationApi.warning({
      message,
      description,
      duration,
      icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
      placement: "topRight",
    });
  }

  private normalizeError(error: AppError | Error): AppError {
    if ("type" in error && "severity" in error) {
      return error as AppError;
    }

    // 转换为AppError
    return {
      ...error,
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date(),
      userMessage: error.message,
    } as AppError;
  }

  private generateKey(error: AppError): string {
    return `${error.type}_${error.code || "unknown"}_${error.message.slice(
      0,
      50
    )}`;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.notificationQueue.length > 0) {
      const config = this.notificationQueue.shift()!;
      await this.showNotification(config);

      // 避免通知过于频繁
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  private async showNotification(
    config: ErrorNotificationConfig
  ): Promise<void> {
    const error = config.error as AppError;
    const notificationKey = this.generateKey(error);

    this.activeNotifications.add(notificationKey);

    const { icon } = this.getNotificationStyle(error);
    const duration = this.getDuration(error, config.duration);
    const actions = this.buildActions(config);

    this.notificationApi.open({
      key: notificationKey,
      message: config.title || this.getTitle(error),
      description: (
        <div className={styles.errorDescription}>
          <div className={styles.userMessage}>
            {error.userMessage || error.message}
          </div>
          {error.code && (
            <div className={styles.errorCode}>错误代码: {error.code}</div>
          )}
          {actions.length > 0 && (
            <div className={styles.errorActions}>
              <Space size="small">{actions}</Space>
            </div>
          )}
        </div>
      ),

      icon,
      duration,
      placement: config.placement || "topRight",
      onClose: () => {
        this.activeNotifications.delete(notificationKey);
      },
      className: styles.errorNotification,
    });
  }

  private getNotificationStyle(error: AppError): {
    icon: React.ReactNode;
    type: string;
  } {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return {
          icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
          type: "error",
        };
      case ErrorSeverity.HIGH:
        return {
          icon: <ExclamationCircleOutlined style={{ color: "#ff7a45" }} />,
          type: "error",
        };
      case ErrorSeverity.MEDIUM:
        return {
          icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
          type: "warning",
        };
      case ErrorSeverity.LOW:
        return {
          icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
          type: "info",
        };
      default:
        return {
          icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
          type: "warning",
        };
    }
  }

  private getDuration(error: AppError, configDuration?: number): number {
    if (configDuration !== undefined) {
      return configDuration;
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 0; // 不自动消失
      case ErrorSeverity.HIGH:
        return 8;
      case ErrorSeverity.MEDIUM:
        return 5;
      case ErrorSeverity.LOW:
        return 3;
      default:
        return 4;
    }
  }

  private getTitle(error: AppError): string {
    switch (error.type) {
      case ErrorType.DATABASE:
        return "数据操作错误";
      case ErrorType.NETWORK:
        return "网络连接错误";
      case ErrorType.VALIDATION:
        return "输入验证错误";
      case ErrorType.PERMISSION:
        return "权限错误";
      case ErrorType.NOT_FOUND:
        return "资源不存在";
      case ErrorType.CONFLICT:
        return "数据冲突";
      default:
        return "系统错误";
    }
  }

  private buildActions(config: ErrorNotificationConfig): React.ReactNode[] {
    const actions: React.ReactNode[] = [];

    if (config.showRetry && config.onRetry) {
      actions.push(
        <Button
          key="retry"
          type="primary"
          size="small"
          icon={<ReloadOutlined />}
          onClick={config.onRetry}
        >
          重试
        </Button>
      );
    }

    if (config.showSettings && config.onSettings) {
      actions.push(
        <Button
          key="settings"
          size="small"
          icon={<SettingOutlined />}
          onClick={config.onSettings}
        >
          设置
        </Button>
      );
    }

    return actions;
  }

  /**
   * 清除所有通知
   */
  clear(): void {
    this.notificationApi.destroy();
    this.activeNotifications.clear();
    this.notificationQueue = [];
  }

  /**
   * 清除特定类型的通知
   */
  clearByType(errorType: ErrorType): void {
    this.activeNotifications.forEach((key) => {
      if (key.startsWith(errorType)) {
        this.notificationApi.destroy(key);
        this.activeNotifications.delete(key);
      }
    });
  }
}

// 导出单例实例
export const errorNotification = ErrorNotificationManager.getInstance();

// 导出React Hook
export function useErrorNotification() {
  return {
    showError: (config: ErrorNotificationConfig) =>
      errorNotification.show(config),
    showSuccess: (message: string, description?: string) =>
      errorNotification.success(message, description),
    showInfo: (message: string, description?: string) =>
      errorNotification.info(message, description),
    showWarning: (message: string, description?: string) =>
      errorNotification.warning(message, description),
    clear: () => errorNotification.clear(),
    clearByType: (type: ErrorType) => errorNotification.clearByType(type),
  };
}

export default ErrorNotificationManager;
