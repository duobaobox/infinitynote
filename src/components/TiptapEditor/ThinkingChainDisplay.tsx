/**
 * 思维链显示组件
 * 用于在 TipTap 编辑器中显示 AI 的思维过程
 */

import { memo } from "react";
import { Button } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
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

    return (
      <div className={styles.thinkingChainContainer}>
        {/* 思维链头部 */}
        <div className={styles.thinkingHeader}>
          <div className={styles.thinkingHeaderLeft}>
            <span className={styles.thinkingIcon}>🧠</span>
            <span className={styles.thinkingTitle}>AI 思维过程</span>
            <span className={styles.stepCount}>
              {thinkingData.totalSteps} 步
            </span>
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

        {/* 思维链内容 */}
        {!isCollapsed && (
          <div className={styles.thinkingContent}>
            <div className={styles.thinkingSteps}>
              {thinkingData.steps.map((step, index) => (
                <div key={step.id} className={styles.thinkingStep}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepNumber}>步骤 {index + 1}</span>
                    <span className={styles.stepTime}>
                      <ClockCircleOutlined />
                      {formatTime(step.timestamp)}
                    </span>
                  </div>
                  <div className={styles.stepContent}>{step.content}</div>
                </div>
              ))}
            </div>

            {/* 思维链总结 */}
            {thinkingData.summary && (
              <div className={styles.thinkingSummary}>
                <div className={styles.summaryIcon}>💡</div>
                <div className={styles.summaryText}>{thinkingData.summary}</div>
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
