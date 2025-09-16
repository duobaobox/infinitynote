/**
 * AI 生成状态显示组件
 * 用于显示 AI 内容生成的实时状态、进度和错误信息
 */

import { memo, useState, useEffect } from "react";
import {
  Card,
  Button,
  Progress,
  Alert,
  Space,
  Typography,
  Divider,
} from "antd";
import {
  RobotOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import styles from "./index.module.css";

const { Text, Paragraph } = Typography;

export interface AIGenerationStatusProps {
  /** 生成状态 */
  status: "idle" | "generating" | "completed" | "error" | "paused";
  /** 当前生成的内容 */
  content?: string;
  /** 生成进度 (0-100) */
  progress?: number;
  /** 错误信息 */
  error?: string;
  /** 是否显示思维链 */
  showThinking?: boolean;
  /** 思维链步骤 */
  thinkingSteps?: Array<{
    id: string;
    content: string;
    timestamp: number;
  }>;
  /** 当前使用的模型 */
  model?: string;
  /** 当前使用的提供商 */
  provider?: string;
  /** 生成开始时间 */
  startTime?: number;
  /** 暂停生成回调 */
  onPause?: () => void;
  /** 恢复生成回调 */
  onResume?: () => void;
  /** 停止生成回调 */
  onStop?: () => void;
  /** 重试生成回调 */
  onRetry?: () => void;
  /** 关闭状态显示回调 */
  onClose?: () => void;
}

/**
 * AI 生成状态组件
 */
export const AIGenerationStatus = memo<AIGenerationStatusProps>(
  ({
    status,
    content = "",
    progress = 0,
    error,
    showThinking = false,
    thinkingSteps = [],
    model,
    provider,
    startTime,
    onPause,
    onResume,
    onStop,
    onRetry,
    onClose,
  }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [wordCount, setWordCount] = useState(0);

    // 计算经过时间
    useEffect(() => {
      if (status === "generating" && startTime) {
        const timer = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
      }
    }, [status, startTime]);

    // 计算字数
    useEffect(() => {
      setWordCount(content.replace(/<[^>]*>/g, "").length);
    }, [content]);

    // 格式化时间
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // 获取状态图标
    const getStatusIcon = () => {
      switch (status) {
        case "generating":
          return <LoadingOutlined className={styles.spinIcon} />;
        case "completed":
          return <CheckCircleOutlined className={styles.successIcon} />;
        case "error":
          return <CloseCircleOutlined className={styles.errorIcon} />;
        case "paused":
          return <PauseCircleOutlined className={styles.pauseIcon} />;
        default:
          return <RobotOutlined />;
      }
    };

    // 获取状态文本
    const getStatusText = () => {
      switch (status) {
        case "generating":
          return "AI 正在生成内容...";
        case "completed":
          return "AI 内容生成完成";
        case "error":
          return "AI 生成遇到问题";
        case "paused":
          return "AI 生成已暂停";
        default:
          return "AI 准备就绪";
      }
    };

    // 获取状态颜色
    const getStatusColor = () => {
      switch (status) {
        case "generating":
          return "processing";
        case "completed":
          return "success";
        case "error":
          return "exception";
        case "paused":
          return "normal";
        default:
          return "normal";
      }
    };

    if (status === "idle") {
      return null;
    }

    return (
      <Card className={styles.statusCard} size="small">
        {/* 状态头部 */}
        <div className={styles.statusHeader}>
          <Space>
            {getStatusIcon()}
            <Text strong>{getStatusText()}</Text>
            {model && provider && (
              <Text type="secondary">
                ({provider} / {model})
              </Text>
            )}
          </Space>

          <Space>
            {/* 控制按钮 */}
            {status === "generating" && (
              <>
                {onPause && (
                  <Button
                    type="text"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={onPause}
                    title="暂停生成"
                  />
                )}
                {onStop && (
                  <Button
                    type="text"
                    size="small"
                    icon={<StopOutlined />}
                    onClick={onStop}
                    title="停止生成"
                    danger
                  />
                )}
              </>
            )}

            {status === "paused" && onResume && (
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={onResume}
                title="继续生成"
              />
            )}

            {status === "error" && onRetry && (
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={onRetry}
                title="重试生成"
              />
            )}

            {onClose && (
              <Button
                type="text"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={onClose}
                title="关闭状态"
              />
            )}
          </Space>
        </div>

        {/* 进度条 */}
        {(status === "generating" || status === "paused") && (
          <div className={styles.progressSection}>
            <Progress
              percent={progress}
              status={getStatusColor() as any}
              showInfo={false}
              size="small"
            />
            <div className={styles.progressInfo}>
              <Text type="secondary">
                {wordCount} 字 · {formatTime(elapsedTime)}
              </Text>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {status === "error" && error && (
          <Alert
            message="生成失败"
            description={error}
            type="error"
            showIcon
            closable={false}
            className={styles.errorAlert}
          />
        )}

        {/* 思维链显示 */}
        {showThinking && thinkingSteps.length > 0 && (
          <>
            <Divider className={styles.divider} />
            <div className={styles.thinkingSection}>
              <Text type="secondary" className={styles.thinkingTitle}>
                🧠 AI 思维过程
              </Text>
              <div className={styles.thinkingSteps}>
                {thinkingSteps.map((step, index) => (
                  <div key={step.id} className={styles.thinkingStep}>
                    <div className={styles.stepIndicator}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                    </div>
                    <div className={styles.stepContent}>
                      <Paragraph
                        className={styles.stepText}
                        ellipsis={{ rows: 2, expandable: true, symbol: "展开" }}
                      >
                        {step.content}
                      </Paragraph>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 实时内容预览 */}
        {(status === "generating" || status === "paused") && content && (
          <>
            <Divider className={styles.divider} />
            <div className={styles.contentPreview}>
              <Text type="secondary" className={styles.previewTitle}>
                📝 生成内容预览
              </Text>
              <div
                className={styles.previewContent}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </>
        )}
      </Card>
    );
  }
);

AIGenerationStatus.displayName = "AIGenerationStatus";

export default AIGenerationStatus;
