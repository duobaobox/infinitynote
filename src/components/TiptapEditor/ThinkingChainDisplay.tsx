/**
 * 思考过程显示组件 - 优化版
 */

import { memo, useEffect, useRef } from "react";
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
 * 获取步骤类型标签
 */
function getStepTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    thinking: "💭 思考",
    analysis: "🔍 分析",
    reasoning: "🧠 推理",
    conclusion: "✅ 结论",
  };
  return labels[type || "thinking"] || "💭 思考";
}

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

    const contentRef = useRef<HTMLDivElement>(null);

    // 当思维链内容更新时自动滚动到底部
    useEffect(() => {
      if (
        isStreaming &&
        !isCollapsed &&
        thinkingData?.steps?.length &&
        contentRef.current
      ) {
        const container = contentRef.current;
        // 使用轻微延迟确保内容已渲染
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }, 50);
      }
    }, [isStreaming, isCollapsed, thinkingData?.steps?.length]);

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
      // 如果生成已完成，显示"思考过程"
      if (!isStreaming) {
        return "思考过程";
      }

      // 流式生成过程中，根据阶段判断
      switch (generationPhase) {
        case AIGenerationPhase.THINKING:
          // 思维链生成阶段，显示"正在思考"
          return "正在思考";
        case AIGenerationPhase.ANSWERING:
        case AIGenerationPhase.COMPLETED:
          // 答案生成阶段或已完成，显示"思考过程"
          return "思考过程";
        case AIGenerationPhase.INITIALIZING:
        default:
          // 初始化或未知阶段，根据是否流式判断
          return isStreaming ? "正在思考" : "思考过程";
      }
    };

    const headerText = getHeaderText();

    // 判断是否应该显示"正在思考"的动画（三个点）
    // 只有在 THINKING 阶段才显示动画
    const shouldShowThinkingAnimation =
      isStreaming && generationPhase === AIGenerationPhase.THINKING;

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
              shouldShowThinkingAnimation ? styles.thinking : ""
            }`}
            aria-live="polite"
          >
            {headerText}
            {validSteps.length > 0 && (
              <span className={styles.stepCount}>
                （{validSteps.length}步）
              </span>
            )}
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
          <div className={styles.thinkingContent} ref={contentRef}>
            {validSteps.length > 0 ? (
              validSteps.map((step, index) => (
                <div key={step.id} className={styles.thinkingStep}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepNumber}>步骤 {index + 1}</span>
                    <span className={styles.stepType}>
                      {getStepTypeLabel((step as any).type)}
                    </span>
                  </div>
                  <div className={styles.stepContent}>{step.content}</div>
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
