/**
 * AI状态内嵌控制组件
 * 在便签内显示AI生成状态和控制按钮
 */

import React from "react";
import { Button, Progress, Space, Typography, Tooltip, Alert } from "antd";
import {
  StopOutlined,
  ReloadOutlined,
  RobotOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { AIErrorHandler, type AIErrorInfo } from "../../utils/aiErrorHandler";
import styles from "./index.module.css";

const { Text } = Typography;

export interface AIInlineControlProps {
  /** 便签ID */
  noteId: string;
  /** AI生成状态 */
  isGenerating?: boolean;
  /** 生成进度 0-100 */
  progress?: number;
  /** 错误信息 */
  error?: string;
  /** 流式生成的内容 */
  streamingContent?: string;
  /** 取消生成回调 */
  onCancel?: (noteId: string) => void;
  /** 重试生成回调 */
  onRetry?: (noteId: string) => void;
  /** 打开AI配置回调 */
  onOpenSettings?: () => void;
}

/**
 * AI内嵌控制组件
 */
export const AIInlineControl: React.FC<AIInlineControlProps> = ({
  noteId,
  isGenerating = false,
  progress = 0,
  error,
  streamingContent,
  onCancel,
  onRetry,
}) => {
  const errorHandler = AIErrorHandler.getInstance();

  // 处理错误信息
  const errorInfo: AIErrorInfo | null = error
    ? errorHandler.parseError(error, {
        retryFn: () => onRetry?.(noteId),
      })
    : null;

  // 显示详细错误通知（仅在严重错误时）
  React.useEffect(() => {
    if (
      error &&
      (errorInfo?.severity === "high" || errorInfo?.severity === "critical")
    ) {
      errorHandler.showErrorNotification(error, {
        retryFn: () => onRetry?.(noteId),
      });
    }
  }, [error, errorInfo, errorHandler, onRetry, noteId]);

  // AI生成中状态
  if (isGenerating) {
    return (
      <div className={styles.aiInlineControl} data-status="generating">
        <div className={styles.generatingHeader}>
          <Space size="small">
            <RobotOutlined spin style={{ color: "#1890ff" }} />
            <Text type="secondary" className={styles.statusText}>
              AI正在生成内容...
            </Text>
          </Space>
          <Tooltip title="停止生成">
            <Button
              type="text"
              size="small"
              icon={<StopOutlined />}
              onClick={() => onCancel?.(noteId)}
              className={styles.controlButton}
            >
              停止
            </Button>
          </Tooltip>
        </div>

        <Progress
          percent={progress}
          showInfo={false}
          strokeColor="#1890ff"
          trailColor="#f0f0f0"
          strokeWidth={3}
          className={styles.progressBar}
        />

        {/* 显示流式生成的部分内容预览 */}
        {streamingContent && (
          <div className={styles.streamingPreview}>
            <Text type="secondary" className={styles.previewText}>
              {streamingContent.slice(0, 100)}
              {streamingContent.length > 100 && "..."}
            </Text>
          </div>
        )}
      </div>
    );
  }

  // AI错误状态
  if (errorInfo) {
    return (
      <div className={styles.aiInlineControl} data-status="error">
        <Alert
          message={errorInfo.userMessage}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className={styles.errorAlert}
          action={
            <Space size="small">
              {errorInfo.recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  type={action.type === "configure" ? "primary" : "default"}
                  size="small"
                  onClick={action.action}
                  icon={
                    action.type === "configure" ? (
                      <SettingOutlined />
                    ) : action.type === "retry" ? (
                      <ReloadOutlined />
                    ) : undefined
                  }
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          }
        />
      </div>
    );
  }

  // 无AI相关状态时不显示
  return null;
};

export default AIInlineControl;
