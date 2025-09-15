/**
 * ModelSettingsTab - 模型服务设置选项卡组件
 *
 * 功能说明：
 * 提供 AI 模型服务的配置界面框架，采用左侧服务商列表的布局。
 * 当前为框架版本，具体功能待后续开发。
 *
 * 界面布局：
 * - 左侧：服务商列表框架
 * - 右侧：空白区域，待后续开发
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import React, { useState } from "react";
import {
  Divider,
  Space,
  Typography,
  List,
} from "antd";
import {
  RobotOutlined,
} from "@ant-design/icons";
import type { ModelSettings } from "../types";
import styles from "../index.module.css";

const { Title, Text } = Typography;

// ==================== 类型定义 ====================

/**
 * AI服务提供商信息（简化版）
 */
interface AIProvider {
  /** 提供商唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 图标组件 */
  icon: React.ReactNode;
}

export interface ModelSettingsTabProps {
  settings: ModelSettings;
  onSettingChange: (key: keyof ModelSettings, value: string) => void;
}

// ==================== 常量数据 ====================

/**
 * AI服务提供商配置数据（框架版本）
 */
const AI_PROVIDERS: AIProvider[] = [
  {
    id: "deepseek",
    name: "深度求索",
    icon: <RobotOutlined style={{ color: "#1890ff" }} />,
  },
  {
    id: "siliconflow", 
    name: "硅基流动",
    icon: <RobotOutlined style={{ color: "#52c41a" }} />,
  },
  {
    id: "alibaba",
    name: "阿里百炼",
    icon: <RobotOutlined style={{ color: "#fa8c16" }} />,
  },
];

const ModelSettingsTab: React.FC<ModelSettingsTabProps> = () => {
  // ==================== 状态管理 ====================

  /** 当前选中的服务提供商 */
  const [selectedProvider, setSelectedProvider] = useState<string>("deepseek");

  // ==================== 渲染函数 ====================

  /**
   * 渲染左侧服务提供商列表
   */
  const renderProviderList = () => (
    <div style={{ width: "300px", borderRight: "1px solid #f0f0f0" }}>
      {/* 服务提供商列表 */}
      <List
        dataSource={AI_PROVIDERS}
        renderItem={(provider) => (
          <List.Item
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor:
                selectedProvider === provider.id ? "#f6ffed" : "transparent",
              borderLeft:
                selectedProvider === provider.id
                  ? "3px solid #52c41a"
                  : "3px solid transparent",
            }}
            onClick={() => setSelectedProvider(provider.id)}
          >
            <List.Item.Meta
              avatar={
                <Space>
                  {provider.icon}
                </Space>
              }
              title={
                <Text strong={selectedProvider === provider.id}>
                  {provider.name}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  /**
   * 渲染右侧空白区域
   */
  const renderEmptyContent = () => (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#999",
      }}
    >
      <Text type="secondary">功能正在开发中...</Text>
    </div>
  );

  // ==================== 主渲染 ====================
  return (
    <div className={styles.contentSection}>
      {/* 页面标题 */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={3}>
          <RobotOutlined /> 模型服务
        </Title>
      </div>

      <Divider />

      {/* 主要内容区域 */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 300px)",
          minHeight: "500px",
        }}
      >
        {/* 左侧服务提供商列表 */}
        {renderProviderList()}

        {/* 右侧空白内容 */}
        {renderEmptyContent()}
      </div>
    </div>
  );
};

export default ModelSettingsTab;
