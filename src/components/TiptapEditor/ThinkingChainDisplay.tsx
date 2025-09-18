/**
 * 思维链显示组件
 * 用于在 TipTap 编辑器中显示 AI 的思维过程
 */

import { memo } from "react";
import { Button, Steps, Typography } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import type { AICustomProperties } from "../../types/ai";
import styles from "./ThinkingChainDisplay.module.css";

const { Text } = Typography;

interface ThinkingChainDisplayProps {
  /** 思维链数据 */
  thinkingData: NonNullable<AICustomProperties["ai"]>["thinkingChain"];
  /** 是否折叠 */
  isCollapsed: boolean;
  /** 切换折叠状态回调 */
  onToggle: () => void;
}

/**
 * 思维链显示组件
 */
export const ThinkingChainDisplay = memo<ThinkingChainDisplayProps>(
  ({ thinkingData, isCollapsed, onToggle }) => {
    console.log("🧠 ThinkingChainDisplay 渲染:", {
      hasThinkingData: !!thinkingData,
      stepsLength: thinkingData?.steps?.length || 0,
      totalSteps: thinkingData?.totalSteps || 0,
      summary: thinkingData?.summary,
      isCollapsed,
    });

    if (
      !thinkingData ||
      !thinkingData.steps ||
      thinkingData.steps.length === 0
    ) {
      console.log("⚠️ ThinkingChainDisplay 数据无效，不显示");
      return null;
    }

    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    // 将思维链步骤转换为 Steps 组件需要的格式
    const stepsItems = thinkingData.steps.map((step, index) => ({
      title: `步骤 ${index + 1}`,
      description: (
        <div className={styles.stepDescription}>
          <Text type="secondary" className={styles.stepTime}>
            {formatTime(step.timestamp)}
          </Text>
          <div className={styles.stepContent}>{step.content}</div>
        </div>
      ),
    }));

    return (
      <div className={styles.thinkingChainContainer}>
        {/* 思维链头部 - 更紧凑的设计 */}
        <div className={styles.thinkingHeader}>
          <div className={styles.thinkingHeaderLeft}>
            <BulbOutlined className={styles.thinkingIcon} />
            <span className={styles.thinkingTitle}>AI 思维过程</span>
            <span className={styles.stepCount}>{thinkingData.totalSteps}</span>
          </div>
          <Button
            type="text"
            size="small"
            icon={isCollapsed ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={onToggle}
            className={styles.toggleButton}
            title={isCollapsed ? "展开思维过程" : "折叠思维过程"}
          />
        </div>

        {/* 思维链内容 - 使用 Ant Design Steps 组件 */}
        {!isCollapsed && (
          <div className={styles.thinkingContent}>
            <div className={styles.stepsContainer}>
              <Steps
                direction="vertical"
                size="small"
                current={stepsItems.length}
                items={stepsItems}
                className={styles.thinkingSteps}
              />
            </div>

            {/* 思维链总结 - 更紧凑的显示 */}
            {thinkingData.summary && (
              <div className={styles.thinkingSummary}>
                <Text type="secondary" className={styles.summaryText}>
                  💡 {thinkingData.summary}
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ThinkingChainDisplay.displayName = "ThinkingChainDisplay";

export default ThinkingChainDisplay;
