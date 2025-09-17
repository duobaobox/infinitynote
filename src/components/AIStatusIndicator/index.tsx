/**
 * AI状态指示器组件
 * 简化版的AI状态显示，替代原有的AIInlineControl
 * 仅显示基本的生成状态，具体调试信息在调试面板中查看
 */

import React from "react";
import { LoadingOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import styles from "./index.module.css";

export interface AIStatusIndicatorProps {
  /** 便签ID */
  noteId: string;
  /** AI生成状态 */
  isGenerating?: boolean;
  /** 错误信息 */
  error?: string;
  /** 取消生成回调 */
  onCancel?: (noteId: string) => void;
  /** 重试生成回调 */
  onRetry?: (noteId: string) => void;
}

/**
 * AI状态指示器组件
 */
export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  noteId,
  isGenerating = false,
  error,
  onCancel,
  onRetry,
}) => {
  // AI生成中状态
  if (isGenerating) {
    return (
      <div className={styles.aiStatusIndicator} data-status="generating">
        <div className={styles.statusContent}>
          <LoadingOutlined className={styles.loadingIcon} />
          <span className={styles.statusText}>AI正在生成...</span>
          <Button
            type="text"
            size="small"
            onClick={() => onCancel?.(noteId)}
            className={styles.cancelButton}
          >
            停止
          </Button>
        </div>
      </div>
    );
  }

  // AI错误状态
  if (error) {
    return (
      <div className={styles.aiStatusIndicator} data-status="error">
        <div className={styles.statusContent}>
          <ExclamationCircleOutlined className={styles.errorIcon} />
          <span className={styles.statusText}>AI生成失败</span>
          <Button
            type="text"
            size="small"
            onClick={() => onRetry?.(noteId)}
            className={styles.retryButton}
          >
            重试
          </Button>
        </div>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  // 无AI相关状态时不显示
  return null;
};

export default AIStatusIndicator;
