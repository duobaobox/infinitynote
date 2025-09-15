/**
 * ModelSettingsTab - 模型服务设置选项卡组件
 *
 * 功能说明：
 * 提供 AI 模型服务的配置界面，采用左侧服务商列表 + 右侧配置详情的布局。
 * 支持多种主流 AI 服务提供商的独立配置和管理。
 *
 * 主要功能：
 * - 🔍 深度求索：DeepSeek Chat 和 DeepSeek Reasoner 模型配置
 * - 🔌 多服务商支持：链基流动、OpenRouter、Ollama、Anthropic 等
 * - 🔑 API 密钥安全配置和验证
 * - 🌐 自定义 API 端点配置
 * - ✅ 连接测试和状态验证
 * - 🎛️ 模型参数调节（温度、最大令牌等）
 *
 * 支持的提供商：
 * - 深度求索: DeepSeek Chat, DeepSeek Reasoner
 * - 链基流动: 多种开源模型
 * - OpenRouter: 统一模型接口
 * - Ollama: 本地模型部署
 * - Anthropic: Claude 系列模型
 * - 百度云千帆: 文心一言等
 * - PPIO 派盾云: 企业级服务
 * - ocoolAI: 新兴AI服务
 * - BurnCloud: 云端AI服务
 * - Alaya New: 创新AI平台
 * - 无问芯穹: 专业AI解决方案
 * - Cephalon: 高性能AI服务
 * - PH8 大模型开放平台: 开放生态
 * - 302.AI: 综合AI服务
 *
 * 界面布局：
 * - 左侧：服务商列表，支持搜索和开关控制
 * - 右侧：选中服务商的详细配置界面
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import React, { useState } from "react";
import {
  Divider,
  Input,
  Button,
  Space,
  Typography,
  Switch,
  List,
  Collapse,
  message,
  Badge,
  Tooltip,
} from "antd";
import {
  RobotOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  EditOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import type { ModelSettings } from "../types";
import styles from "../index.module.css";

const { Title, Text } = Typography;
const { Panel } = Collapse;

// ==================== 类型定义 ====================

/**
 * AI服务提供商信息
 */
interface AIProvider {
  /** 提供商唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 图标组件 */
  icon: React.ReactNode;
  /** 是否启用 */
  enabled: boolean;
  /** 连接状态 */
  status: "connected" | "disconnected" | "testing";
  /** API密钥 */
  apiKey: string;
  /** API地址 */
  apiUrl: string;
  /** 可用模型列表 */
  models: ModelInfo[];
  /** 是否支持流式输出 */
  supportsStreaming?: boolean;
  /** 描述信息 */
  description?: string;
}

/**
 * 模型信息
 */
interface ModelInfo {
  /** 模型ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 模型描述 */
  description?: string;
  /** 是否支持多模态 */
  multimodal?: boolean;
  /** 最大上下文长度 */
  maxTokens?: number;
  /** 是否为推荐模型 */
  recommended?: boolean;
}

/**
 * 模型参数配置
 */

export interface ModelSettingsTabProps {
  settings: ModelSettings;
  onSettingChange: (key: keyof ModelSettings, value: string) => void;
}

// ==================== 常量数据 ====================

/**
 * AI服务提供商配置数据
 */
const AI_PROVIDERS: AIProvider[] = [
  {
    id: "deepseek",
    name: "深度求索",
    icon: <RobotOutlined style={{ color: "#1890ff" }} />,
    enabled: true,
    status: "connected",
    apiKey: "",
    apiUrl: "https://api.deepseek.com",
    description: "深度求索提供高质量的AI推理服务",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        description: "通用对话模型，适合日常交流",
        maxTokens: 32768,
        recommended: true,
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek Reasoner",
        description: "推理专用模型，擅长逻辑分析",
        maxTokens: 65536,
        recommended: true,
      },
    ],
  },
  {
    id: "siliconflow",
    name: "硅基流动",
    icon: <SettingOutlined style={{ color: "#52c41a" }} />,
    enabled: false,
    status: "disconnected",
    apiKey: "",
    apiUrl: "https://api.siliconflow.cn",
    description: "硅基流动提供多种开源模型服务",
    models: [
      {
        id: "qwen-turbo",
        name: "Qwen Turbo",
        description: "快速响应的通用模型",
        maxTokens: 8192,
      },
      {
        id: "qwen-plus",
        name: "Qwen Plus",
        description: "平衡性能的高质量模型",
        maxTokens: 32768,
      },
    ],
  },
  {
    id: "alibaba",
    name: "阿里百炼",
    icon: <RobotOutlined style={{ color: "#fa8c16" }} />,
    enabled: false,
    status: "disconnected",
    apiKey: "",
    apiUrl: "https://dashscope.aliyuncs.com",
    description: "阿里云百炼大模型服务平台",
    models: [
      {
        id: "qwen-max",
        name: "Qwen Max",
        description: "阿里云最强大的通用模型",
        maxTokens: 8192,
      },
      {
        id: "qwen-long",
        name: "Qwen Long",
        description: "支持长文本的专用模型",
        maxTokens: 128000,
      },
    ],
  },
];

const ModelSettingsTab: React.FC<ModelSettingsTabProps> = () => {
  // ==================== 状态管理 ====================


  /** 当前选中的服务提供商 */
  const [selectedProvider, setSelectedProvider] = useState<string>("deepseek");

  /** 服务提供商列表状态 */
  const [providers, setProviders] = useState<AIProvider[]>(AI_PROVIDERS);

  /** 密钥显示状态 */
  const [showApiKey, setShowApiKey] = useState(false);

  // ==================== 事件处理函数 ====================

  /**
   * 处理服务提供商开关切换
   */
  const handleProviderToggle = (providerId: string, enabled: boolean) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId ? { ...provider, enabled } : provider
      )
    );

    if (enabled) {
      message.success(
        `已启用 ${providers.find((p) => p.id === providerId)?.name}`
      );
    } else {
      message.info(
        `已禁用 ${providers.find((p) => p.id === providerId)?.name}`
      );
    }
  };

  /**
   * 处理API密钥更新
   */
  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId ? { ...provider, apiKey } : provider
      )
    );
  };

  /**
   * 处理API地址更新
   */
  const handleApiUrlChange = (providerId: string, apiUrl: string) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId ? { ...provider, apiUrl } : provider
      )
    );
  };

  /**
   * 测试API连接
   */
  const handleTestConnection = async (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;

    // 更新状态为测试中
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, status: "testing" } : p))
    );

    try {
      // TODO: 实际的API测试逻辑
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 模拟测试结果
      const success = Math.random() > 0.3; // 70% 成功率

      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { ...p, status: success ? "connected" : "disconnected" }
            : p
        )
      );

      if (success) {
        message.success(`${provider.name} 连接测试成功`);
      } else {
        message.error(`${provider.name} 连接测试失败，请检查配置`);
      }
    } catch (error) {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId ? { ...p, status: "disconnected" } : p
        )
      );
      message.error(`${provider.name} 连接测试出错`);
    }
  };

  // ==================== 数据处理 ====================

  /** 服务提供商列表（不再支持搜索） */
  const filteredProviders = providers;

  /** 当前选中的服务提供商详情 */
  const currentProvider = providers.find((p) => p.id === selectedProvider);

  // ==================== 渲染函数 ====================

  /**
   * 渲染服务提供商状态图标
   */
  const renderStatusIcon = (status: AIProvider["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "testing":
        return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
      case "disconnected":
      default:
        return <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />;
    }
  };

  /**
   * 渲染左侧服务提供商列表
   */
  const renderProviderList = () => (
    <div style={{ width: "300px", borderRight: "1px solid #f0f0f0" }}>

      {/* 服务提供商列表 */}
      <List
        dataSource={filteredProviders}
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
                  {renderStatusIcon(provider.status)}
                </Space>
              }
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text strong={selectedProvider === provider.id}>
                    {provider.name}
                  </Text>
                  <Switch
                    size="small"
                    checked={provider.enabled}
                    onChange={(checked) =>
                      handleProviderToggle(provider.id, checked)
                    }
                    onClick={(_, e) => e.stopPropagation()}
                  />
                </div>
              }
              description={
                provider.enabled ? (
                  <Badge
                    status={
                      provider.status === "connected" ? "success" : "error"
                    }
                    text={provider.status === "connected" ? "已连接" : "未连接"}
                  />
                ) : (
                  <Text type="secondary">已禁用</Text>
                )
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  /**
   * 渲染右侧配置详情
   */
  const renderProviderConfig = () => {
    if (!currentProvider) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
          }}
        >
          <Text type="secondary">请选择一个服务提供商</Text>
        </div>
      );
    }

    return (
      <div style={{ flex: 1, padding: "24px" }}>
        {/* 服务商标题 */}
        <div style={{ marginBottom: "24px" }}>
          <Space size="large">
            {currentProvider.icon}
            <Title level={4} style={{ margin: 0 }}>
              {currentProvider.name}
            </Title>
            {renderStatusIcon(currentProvider.status)}
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleTestConnection(currentProvider.id)}
              loading={currentProvider.status === "testing"}
            >
              检测
            </Button>
          </Space>
          {currentProvider.description && (
            <Text
              type="secondary"
              style={{ display: "block", marginTop: "8px" }}
            >
              {currentProvider.description}
            </Text>
          )}
        </div>

        {/* 配置表单 */}
        <Collapse defaultActiveKey={["api", "models"]} ghost>
          {/* API 配置 */}
          <Panel header="API 密钥" key="api">
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <Text strong>API 密钥</Text>
                <div style={{ marginTop: "8px" }}>
                  <Input.Password
                    placeholder="点击这里获取密钥"
                    value={currentProvider.apiKey}
                    onChange={(e) =>
                      handleApiKeyChange(currentProvider.id, e.target.value)
                    }
                    visibilityToggle={{
                      visible: showApiKey,
                      onVisibleChange: setShowApiKey,
                    }}
                    addonAfter={
                      <Tooltip title="复制密钥">
                        <Button
                          type="text"
                          icon={<CopyOutlined />}
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              currentProvider.apiKey
                            );
                            message.success("已复制到剪贴板");
                          }}
                        />
                      </Tooltip>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    全部密钥使用时需要支付费用
                  </Text>
                </div>
              </div>

              <div>
                <Text strong>API 地址</Text>
                <div style={{ marginTop: "8px" }}>
                  <Input
                    placeholder="输入API地址"
                    value={currentProvider.apiUrl}
                    onChange={(e) =>
                      handleApiUrlChange(currentProvider.id, e.target.value)
                    }
                    addonBefore="https://api.deepseek.com/v1/chat/completions"
                  />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    / 精度高低 v1 版本，# 精度高低使用时需要支付费用
                  </Text>
                </div>
              </div>
            </Space>
          </Panel>

          {/* 模型配置 */}
          <Panel header="模型" key="models">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <Text strong>模型</Text>
                <Text type="secondary" style={{ marginLeft: "8px" }}>
                  ?
                </Text>
                <Button
                  type="link"
                  icon={<SettingOutlined />}
                  size="small"
                  style={{ marginLeft: "auto" }}
                />
              </div>

              {/* DeepSeek 特殊配置 */}
              {currentProvider.id === "deepseek" && (
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="large"
                >
                  {/* DeepSeek Chat */}
                  <Collapse size="small">
                    <Panel
                      header={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Space>
                            <RobotOutlined style={{ color: "#1890ff" }} />
                            <Text strong>DeepSeek Chat</Text>
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              size="small"
                            />
                          </Space>
                          <Space>
                            <Button
                              type="text"
                              icon={<SettingOutlined />}
                              size="small"
                            />
                            <Button
                              type="text"
                              icon={<MinusOutlined />}
                              size="small"
                            />
                          </Space>
                        </div>
                      }
                      key="deepseek-chat"
                    >
                      <div style={{ padding: "16px 0" }}>
                        <Text type="secondary">
                          查看 深度求索 文档 模型 收取多少钱
                        </Text>
                      </div>
                    </Panel>
                  </Collapse>

                  {/* DeepSeek Reasoner */}
                  <Collapse size="small">
                    <Panel
                      header={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Space>
                            <RobotOutlined style={{ color: "#722ed1" }} />
                            <Text strong>DeepSeek Reasoner</Text>
                            <Badge
                              count="★"
                              style={{ backgroundColor: "#faad14" }}
                            />
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              size="small"
                            />
                          </Space>
                          <Space>
                            <Button
                              type="text"
                              icon={<SettingOutlined />}
                              size="small"
                            />
                            <Button
                              type="text"
                              icon={<MinusOutlined />}
                              size="small"
                            />
                          </Space>
                        </div>
                      }
                      key="deepseek-reasoner"
                    >
                      <div style={{ padding: "16px 0" }}>
                        <Text type="secondary">
                          查看 深度求索 文档 模型 收取多少钱
                        </Text>
                      </div>
                    </Panel>
                  </Collapse>
                </Space>
              )}

              {/* 添加模型按钮 */}
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <Space>
                  <Button type="primary" icon={<SettingOutlined />}>
                    管理
                  </Button>
                  <Button icon={<EditOutlined />}>添加</Button>
                </Space>
              </div>
            </div>
          </Panel>
        </Collapse>
      </div>
    );
  };

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

        {/* 右侧配置详情 */}
        {renderProviderConfig()}
      </div>
    </div>
  );
};

export default ModelSettingsTab;
