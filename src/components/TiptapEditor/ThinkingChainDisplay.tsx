/**
 * 思考过程显示组件 - 精简版
 */

import { memo } from "react";
import type { AICustomProperties } from "../../types/ai";
import { AIGenerationPhase } from "../../types/ai";
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
    generationPhase?: AIGenerationPhase; // 当前生成阶段
    isThinkingPhase?: boolean; // 是否正在思维链生成阶段
    isAnsweringPhase?: boolean; // 是否正在最终答案生成阶段
  };
}

/**
 * 思考过程显示组件
 */
export const ThinkingChainDisplay = memo<ThinkingChainDisplayProps>(
  ({ thinkingData, isCollapsed, onToggle, aiStatus }) => {
    // 判断AI当前状态和生成阶段
    const isStreaming =
      aiStatus?.isStreaming === true && aiStatus?.generated !== true;
    const generationPhase = aiStatus?.generationPhase;

    // 注释掉这个逻辑，让头部始终显示
    // if (!thinkingData?.steps?.length && !isStreaming) {
    //   return null;
    // }

    // 过滤有效的思考步骤
    const validSteps =
      thinkingData?.steps?.filter(
        (step) =>
          step?.id && step?.content && typeof step?.timestamp === "number"
      ) || [];

    // 根据生成阶段确定头部显示文本
    const getHeaderText = () => {
      if (!isStreaming) {
        return "思考过程"; // 生成完成后显示
      }

      switch (generationPhase) {
        case AIGenerationPhase.THINKING:
          return "正在思考"; // 思维链生成阶段，不包含省略号
        case AIGenerationPhase.ANSWERING:
          return "正在回复"; // 最终答案生成阶段，不包含省略号
        case AIGenerationPhase.COMPLETED:
          return "思考过程"; // 生成完成阶段
        default:
          // 兼容旧版本逻辑
          return isStreaming ? "正在思考" : "思考过程";
      }
    };

    const headerText = getHeaderText();

    return (
      <div className={styles.thinkingChainContainer}>
        <div
          className={styles.thinkingHeader}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onToggle();
            }
          }}
          tabIndex={0}
          role="button"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "展开思考过程" : "收起思考过程"}
        >
          <span
            className={`${styles.thinkingTitle} ${
              isStreaming ? styles.thinking : ""
            }`}
            aria-live="polite"
          >
            {headerText}
          </span>
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
            {validSteps.length > 0 ? (
              validSteps.map((step) => (
                <div key={step.id} className={styles.thinkingText}>
                  {step.content}
                </div>
              ))
            ) : isStreaming ? (
              <div className={styles.thinkingText}>
                <span className={styles.thinking}>正在生成思维链</span>
              </div>
            ) : (
              <div className={styles.thinkingText}>暂无思维链数据</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ThinkingChainDisplay.displayName = "ThinkingChainDisplay";

export default ThinkingChainDisplay;
