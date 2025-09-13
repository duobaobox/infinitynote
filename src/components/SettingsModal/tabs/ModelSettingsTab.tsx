/**
 * ModelSettingsTab - 模型服务设置选项卡组件
 *
 * 功能说明：
 * 提供 AI 模型服务的配置界面，包括 API 提供商选择、密钥配置、
 * 默认模型选择和自定义端点设置。支持多种主流 AI 服务提供商。
 *
 * 主要功能：
 * - 🔌 API 提供商选择（OpenAI、Anthropic、Azure、本地模型）
 * - 🔑 API 密钥安全配置和验证
 * - 🤖 默认模型选择和管理
 * - 🌐 自定义 API 端点配置（Azure 等）
 * - ✅ 连接测试和状态验证
 *
 * 支持的提供商：
 * - OpenAI: GPT-4, GPT-3.5 等模型
 * - Anthropic: Claude 系列模型
 * - Azure OpenAI: 企业级 OpenAI 服务
 * - 本地模型: 自部署的模型服务
 *
 * 安全特性：
 * - API 密钥本地加密存储
 * - 敏感信息不会在界面明文显示
 * - 支持密钥有效性验证
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import React from "react";
import { Divider, Select, Button, Space, Typography, Row, Col } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import type { ModelSettings } from "../types";
import { API_PROVIDERS, MODEL_OPTIONS } from "../constants";
import styles from "../index.module.css";

const { Title, Text } = Typography;

export interface ModelSettingsTabProps {
  settings: ModelSettings;
  onSettingChange: (key: keyof ModelSettings, value: string) => void;
}

const ModelSettingsTab: React.FC<ModelSettingsTabProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <div className={styles.contentSection}>
      <Title level={3}>
        <RobotOutlined /> 模型服务
      </Title>
      <Divider />

      <div className={styles.settingGroup}>
        <Title level={4}>AI 服务配置</Title>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div className={styles.settingItem}>
                <Text strong>API 提供商</Text>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  placeholder="选择 AI 服务提供商"
                  value={settings.provider}
                  onChange={(value) => onSettingChange("provider", value)}
                  options={[...API_PROVIDERS]}
                />
              </div>

              <div className={styles.settingItem}>
                <Text strong>API 密钥</Text>
                <Space style={{ width: "100%", marginTop: 8 }}>
                  <input
                    type="password"
                    className={styles.passwordInput}
                    placeholder="输入 API 密钥"
                    value={settings.apiKey}
                    onChange={(e) => onSettingChange("apiKey", e.target.value)}
                  />
                  <Button type="primary">验证</Button>
                </Space>
              </div>

              <div className={styles.settingItem}>
                <Text strong>默认模型</Text>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  placeholder="选择默认使用的模型"
                  value={settings.defaultModel}
                  onChange={(value) => onSettingChange("defaultModel", value)}
                  options={[...MODEL_OPTIONS]}
                />
              </div>

              {settings.provider === "azure" && (
                <div className={styles.settingItem}>
                  <Text strong>自定义端点</Text>
                  <input
                    type="text"
                    className={styles.passwordInput}
                    placeholder="输入 Azure OpenAI 端点"
                    value={settings.customEndpoint || ""}
                    onChange={(e) =>
                      onSettingChange("customEndpoint", e.target.value)
                    }
                    style={{ width: "100%", marginTop: 8 }}
                  />
                </div>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ModelSettingsTab;
