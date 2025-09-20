/**
 * 活跃模型状态组件
 * 显示当前正在使用的AI模型和全局思维链开关
 */

import React from "react";
import { Typography, Switch, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
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
  /** 全局思维链显示设置 */
  globalShowThinking: boolean;
  /** 思维链开关变更回调 */
  onThinkingToggle: (enabled: boolean) => void;
}

/**
 * 活跃模型状态组件
 */
export const ActiveModelStatus: React.FC<ActiveModelStatusProps> = ({
  activeConfig,
  providerLabel,
  modelLabel,
  providerColor,
  connectionStatus,
  globalShowThinking,
  onThinkingToggle,
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
      {/* 左侧：当前使用的模型信息 */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* 当前使用标识 */}
        <Text type="secondary" style={{ fontSize: "12px", fontWeight: 500 }}>
          当前使用
        </Text>

        {/* 提供商指示器 */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: providerColor,
          }}
        />

        {/* 提供商名称 */}
        <Text strong>{providerLabel}</Text>

        {/* 分隔符 */}
        <Text type="secondary">•</Text>

        {/* 模型名称 */}
        <Text code style={{ fontSize: "12px" }}>
          {activeConfig.model}
        </Text>

        {/* 思维链开关 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: "16px",
          }}
        >
          <Text style={{ fontSize: "12px" }}>思维链</Text>
          <Switch
            size="small"
            checked={globalShowThinking}
            onChange={onThinkingToggle}
          />
          {/* 思维链提醒符号 - 使用 Ant Design Tooltip */}
          <Tooltip
            title="开启思维链后，只有支持思维链的模型才会显示思考过程。不支持的模型不会显示思维链内容。"
            placement="top"
          >
            <InfoCircleOutlined
              style={{
                color: "#8c8c8c",
                fontSize: "12px",
                cursor: "help",
              }}
            />
          </Tooltip>
        </div>
      </div>

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
  /** 思维链开关变更回调 */
  onThinkingToggle: (enabled: boolean) => void;
}

// 这个容器组件将在后续实现，用于连接 AIService
export const ActiveModelStatusContainer: React.FC<
  ActiveModelStatusContainerProps
> = ({ onThinkingToggle }) => {
  // TODO: 连接 AIService，获取实际数据
  // 这里先返回一个占位符
  return (
    <div style={{ padding: "16px", textAlign: "center", color: "#999" }}>
      <Text type="secondary">活跃模型状态组件容器 - 待实现</Text>
    </div>
  );
};
