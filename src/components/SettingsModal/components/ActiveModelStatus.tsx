/**
 * 活跃模型状态组件
 * 显示当前正在使用的AI模型和全局思维链开关
 */

import React from "react";
import { Typography } from "antd";
import { useTheme } from "../../../theme";
import type { AIActiveConfig } from "../../../types/ai";

const { Text } = Typography;

export interface ActiveModelStatusProps {
  /** 当前活跃的配置 */
  activeConfig: AIActiveConfig;
  /** 提供商显示名称 */
  providerLabel: string;
  /** 模型显示名称 */
  modelLabel: string;
  /** 提供商颜色 */
  providerColor: string;
  /** 连接状态 */
  connectionStatus: "ready" | "error" | "unconfigured";
}

/**
 * 活跃模型状态组件
 */
export const ActiveModelStatus: React.FC<ActiveModelStatusProps> = ({
  providerLabel,
  modelLabel,
  connectionStatus,
}) => {
  const { isDark } = useTheme();

  // 获取状态显示信息
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case "ready":
        return {
          text: "✅ 就绪",
          color: "#52c41a",
        };
      case "error":
        return {
          text: "❌ 错误",
          color: "#ff4d4f",
        };
      case "unconfigured":
        return {
          text: "⚠️ 需配置",
          color: "#faad14",
        };
      default:
        return {
          text: "⚠️ 未知",
          color: "#d9d9d9",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "6px",
        marginBottom: "16px",
        border: `1px solid ${isDark ? "#303030" : "#f0f0f0"}`,
      }}
    >
      {/* 左侧：模型信息 */}
      <div>
        <Text strong style={{ fontSize: "12px" }}>
          {providerLabel} / {modelLabel}
        </Text>
      </div>{" "}
      {/* 右侧：连接状态 */}
      <div>
        <Text style={{ fontSize: "12px", color: statusInfo.color }}>
          {statusInfo.text}
        </Text>
      </div>
    </div>
  );
};

/**
 * 活跃模型状态组件的容器版本
 * 自动获取数据并处理状态
 */
export interface ActiveModelStatusContainerProps {
  // 将来可以扩展其他属性
}

// 这个容器组件将在后续实现，用于连接 AIService
export const ActiveModelStatusContainer: React.FC<
  ActiveModelStatusContainerProps
> = () => {
  // TODO: 连接 AIService，获取实际数据
  // 这里先返回一个占位符
  return (
    <div style={{ padding: "16px", textAlign: "center", color: "#999" }}>
      <Text type="secondary">活跃模型状态组件容器 - 待实现</Text>
    </div>
  );
};
