/**
 * 思维链显示组件 - 精简版
 */

import { memo } from "react";
import { Button, Steps } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import type { AICustomProperties } from "../../types/ai";
import styles from "./ThinkingChainDisplay.module.css";

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
    if (!thinkingData?.steps?.length) return null;

    // 过滤有效的思维步骤
    const validSteps = thinkingData.steps.filter(
      step => step?.id && step?.content && typeof step?.timestamp === "number"
    );

    if (!validSteps.length) return null;

    // 格式化时间
    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    // 简化的步骤数据
    const stepsItems = validSteps.map(step => ({
      title: formatTime(step.timestamp),
      description: <div className={styles.stepContent}>{step.content}</div>,
    }));

    return (
      <div className={styles.thinkingChainContainer}>
        <div className={styles.thinkingHeader}>
          <div className={styles.thinkingHeaderLeft}>
            <span className={styles.thinkingTitle}>AI 思维过程</span>
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

        {!isCollapsed && (
          <div className={styles.thinkingContent}>
            <Steps
              direction="vertical"
              size="small"
              current={stepsItems.length}
              items={stepsItems}
              className={styles.thinkingSteps}
            />
          </div>
        )}
      </div>
    );
  }
);

ThinkingChainDisplay.displayName = "ThinkingChainDisplay";

export default ThinkingChainDisplay;