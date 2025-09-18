/**
 * 思维链显示组件
 * 用于在 TipTap 编辑器中显示 AI 的思维过程
 */

import { memo } from "react";
import { Button, Steps, Typography, Tag } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  BulbOutlined,
  SearchOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { AICustomProperties } from "../../types/ai";
import styles from "./ThinkingChainDisplay.module.css";

const { Text } = Typography;

// 步骤类型定义
type StepType = "analysis" | "reasoning" | "conclusion" | "question" | "idea";

interface ThinkingChainDisplayProps {
  /** 思维链数据 */
  thinkingData: NonNullable<AICustomProperties["ai"]>["thinkingChain"];
  /** 是否折叠 */
  isCollapsed: boolean;
  /** 切换折叠状态回调 */
  onToggle: () => void;
}

/**
 * 获取步骤类型图标和颜色
 */
const getStepIcon = (stepType: StepType) => {
  switch (stepType) {
    case "analysis":
      return { icon: <SearchOutlined />, color: "#1890ff" }; // 蓝色搜索图标
    case "reasoning":
      return { icon: <ExperimentOutlined />, color: "#52c41a" }; // 绿色实验图标
    case "conclusion":
      return { icon: <TrophyOutlined />, color: "#fa8c16" }; // 橙色奖杯图标
    case "question":
      return { icon: <QuestionCircleOutlined />, color: "#eb2f96" }; // 粉色问号图标
    case "idea":
      return { icon: <BulbOutlined />, color: "#722ed1" }; // 紫色灯泡图标
    default:
      return { icon: <ExperimentOutlined />, color: "#52c41a" };
  }
};

/**
 * 获取步骤类型中文标签
 */
const getStepTypeLabel = (stepType: StepType) => {
  switch (stepType) {
    case "analysis":
      return "分析";
    case "reasoning":
      return "推理";
    case "conclusion":
      return "结论";
    case "question":
      return "疑问";
    case "idea":
      return "想法";
    default:
      return "思考";
  }
};

/**
 * 智能检测步骤类型
 */
const detectStepType = (content: string): StepType => {
  const stepTypeRules = [
    {
      keywords: ["分析", "观察", "数据", "检查", "研究", "调查"],
      type: "analysis" as StepType,
    },
    {
      keywords: ["结论", "总结", "因此", "所以", "综上", "最终"],
      type: "conclusion" as StepType,
    },
    {
      keywords: ["?", "？", "如何", "为什么", "是否", "怎么", "疑问"],
      type: "question" as StepType,
    },
    {
      keywords: ["想法", "建议", "可以", "应该", "或许", "不妨", "建议"],
      type: "idea" as StepType,
    },
  ];

  // 智能匹配步骤类型
  for (const rule of stepTypeRules) {
    if (rule.keywords.some((keyword) => content.includes(keyword))) {
      return rule.type;
    }
  }

  return "reasoning"; // 默认类型
};

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

    // 将思维链步骤转换为带类型的 Steps 组件格式
    const stepsItems = thinkingData.steps.map((step, index) => {
      const stepType = detectStepType(step.content);
      const { icon, color } = getStepIcon(stepType);

      return {
        title: (
          <div className={styles.stepTitle}>
            <div className={styles.stepTypeTag} style={{ color }}>
              {icon}
              <span className={styles.stepTypeLabel}>
                {getStepTypeLabel(stepType)}
              </span>
            </div>
            <Text type="secondary" className={styles.stepNumber}>
              第 {index + 1} 步
            </Text>
          </div>
        ),
        description: (
          <div className={styles.stepDescription}>
            <Text type="secondary" className={styles.stepTime}>
              <ClockCircleOutlined />
              {formatTime(step.timestamp)}
            </Text>
            <div className={styles.stepContent}>{step.content}</div>
          </div>
        ),
      };
    });

    // 统计不同类型步骤数量
    const stepStats = thinkingData.steps.reduce((acc, step) => {
      const stepType = detectStepType(step.content);
      acc[stepType] = (acc[stepType] || 0) + 1;
      return acc;
    }, {} as Record<StepType, number>);

    return (
      <div className={styles.thinkingChainContainer}>
        {/* 思维链头部 - 增强版设计 */}
        <div className={styles.thinkingHeader}>
          <div className={styles.thinkingHeaderLeft}>
            <ExperimentOutlined className={styles.thinkingIcon} />
            <span className={styles.thinkingTitle}>AI 思维过程</span>
            <Tag color="blue" className={styles.stepCount}>
              {thinkingData.totalSteps} 步
            </Tag>
            {/* 显示步骤类型统计 */}
            <div className={styles.stepStats}>
              {Object.entries(stepStats).map(([type, count]) => {
                const { color } = getStepIcon(type as StepType);
                return (
                  <span
                    key={type}
                    className={styles.statItem}
                    style={{ color }}
                  >
                    {getStepTypeLabel(type as StepType)}: {count}
                  </span>
                );
              })}
            </div>
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

        {/* 思维链内容 - 使用增强的 Steps 组件 */}
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

            {/* 思维链总结 - 更丰富的显示 */}
            {thinkingData.summary && (
              <div className={styles.thinkingSummary}>
                <BulbOutlined className={styles.summaryIcon} />
                <Text type="secondary" className={styles.summaryText}>
                  {thinkingData.summary}
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

ThinkingChainDisplay.displayName = "ThinkingChainDisplay";

export default ThinkingChainDisplay;
