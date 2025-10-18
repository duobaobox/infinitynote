import { memo, useState } from "react";
import { Steps } from "antd";
import type { AICustomProperties } from "../../types/ai";
import { AIGenerationPhase } from "../../types/ai";

interface AntdStepsThinkingChainProps {
  thinkingData: NonNullable<AICustomProperties["ai"]>["thinkingChain"];
  isCollapsed: boolean;
  onToggle: () => void;
  aiStatus?: {
    isStreaming?: boolean;
    generated?: boolean;
    generationPhase?: AIGenerationPhase;
    isThinkingPhase?: boolean;
    isAnsweringPhase?: boolean;
  };
}

function getStepTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    thinking: "思考",
    analysis: "分析",
    reasoning: "推理",
    conclusion: "结论",
  };
  return labels[type || "thinking"] || "思考";
}

export const AntdStepsThinkingChain = memo<AntdStepsThinkingChainProps>(
  ({ thinkingData, isCollapsed, onToggle, aiStatus }) => {
    const isStreaming =
      aiStatus?.isStreaming === true && aiStatus?.generated !== true;
    const generationPhase = aiStatus?.generationPhase;
    const validSteps =
      thinkingData?.steps?.filter(
        (step) =>
          step?.id && step?.content && typeof step?.timestamp === "number"
      ) || [];

    const [isHovered, setIsHovered] = useState(false);

    // 头部
    const getHeaderText = () => {
      if (!isStreaming) return "思考过程";
      switch (generationPhase) {
        case AIGenerationPhase.THINKING:
          return "正在思考";
        case AIGenerationPhase.ANSWERING:
        case AIGenerationPhase.COMPLETED:
          return "思考过程";
        case AIGenerationPhase.INITIALIZING:
        default:
          return isStreaming ? "正在思考" : "思考过程";
      }
    };
    const headerText = getHeaderText();

    return (
      <div style={{ margin: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            cursor: "pointer",
            padding: "8px 12px",
            userSelect: "none",
            fontWeight: 500,
            fontSize: 13,
            background: isHovered ? "rgba(22, 119, 255, 0.08)" : "transparent",
            transition: "background 0.2s ease",
            borderRadius: "6px",
          }}
          onClick={onToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          tabIndex={0}
          role="button"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "展开思考过程" : "收起思考过程"}
        >
          <span style={{ flex: 1, textAlign: "left" }}>
            {headerText}
            {validSteps.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
                （{validSteps.length}步）
              </span>
            )}
          </span>
          <span
            style={{
              fontSize: 14,
              marginLeft: 8,
              color: "#888",
              transform: !isCollapsed ? "rotate(90deg)" : undefined,
              flexShrink: 0,
            }}
          >
            ▶
          </span>
        </div>
        {!isCollapsed && (
          <div
            style={{ height: 80, overflowY: "auto", padding: "0 8px 8px 8px" }}
          >
            <Steps
              progressDot
              direction="vertical"
              size="small"
              current={validSteps.length - 1}
              style={{ minHeight: 80 }}
            >
              {validSteps.length > 0 ? (
                validSteps.map((step, idx) => (
                  <Steps.Step
                    key={step.id}
                    title={
                      getStepTypeLabel((step as any).type) +
                      `（步骤${idx + 1}）`
                    }
                    description={
                      <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
                        {step.content}
                      </div>
                    }
                  />
                ))
              ) : isStreaming ? (
                <Steps.Step title="正在生成思维链" />
              ) : (
                <Steps.Step title="暂无思维链数据" />
              )}
            </Steps>
          </div>
        )}
      </div>
    );
  }
);

export default AntdStepsThinkingChain;
