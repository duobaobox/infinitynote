/**
 * 思考过程显示组件 - 精简版
 */

import { memo } from "react";
import type { AICustomProperties } from "../../types/ai";
import styles from "./ThinkingChainDisplay.module.css";

interface ThinkingChainDisplayProps {
  /** 思考链数据 */
  thinkingData: NonNullable<AICustomProperties["ai"]>["thinkingChain"];
  /** 是否折叠 */
  isCollapsed: boolean;
  /** 切换折叠状态回调 */
  onToggle: () => void;
  /** AI状态信息 */
  aiStatus?: {
    isStreaming?: boolean;
    generated?: boolean;
  };
}

/**
 * 思考过程显示组件
 */
export const ThinkingChainDisplay = memo<ThinkingChainDisplayProps>(
  ({ thinkingData, isCollapsed, onToggle, aiStatus }) => {
    if (!thinkingData?.steps?.length) return null;

    // 过滤有效的思考步骤
    const validSteps = thinkingData.steps.filter(
      (step) => step?.id && step?.content && typeof step?.timestamp === "number"
    );

    if (!validSteps.length) return null;

    // 判断AI当前状态
    const isThinking =
      aiStatus?.isStreaming === true && aiStatus?.generated !== true;

    return (
      <div className={styles.thinkingChainContainer}>
        <div
          className={styles.thinkingHeader}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          tabIndex={0}
          role="button"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "展开思考过程" : "收起思考过程"}
        >
          {isThinking ? (
            <span
              className={`${styles.thinkingTitle} ${styles.thinking}`}
              aria-live="polite"
            >
              正在思考
            </span>
          ) : (
            <span className={styles.thinkingTitle}>思考过程</span>
          )}
          <span
            className={`${styles.expandIcon} ${
              !isCollapsed ? styles.expanded : ""
            }`}
            aria-hidden="true"
          >
            ▶
          </span>
        </div>

        {!isCollapsed && (
          <div className={styles.thinkingContent}>
            {validSteps.map((step) => (
              <div key={step.id} className={styles.thinkingText}>
                {step.content}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ThinkingChainDisplay.displayName = "ThinkingChainDisplay";

export default ThinkingChainDisplay;
