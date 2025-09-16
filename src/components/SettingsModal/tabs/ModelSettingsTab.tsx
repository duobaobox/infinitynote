import React, { useState, useCallback, useEffect } from "react";
import {
  Divider,
  Space,
  Typography,
  List,
  Card,
  Form,
  Input,
  Select,
  Slider,
  Switch,
  Button,
  App,
} from "antd";
import { RobotOutlined, KeyOutlined, SettingOutlined } from "@ant-design/icons";
import type { ModelSettings } from "../types";
import { MODEL_OPTIONS_BY_PROVIDER } from "../constants";
import { aiService, securityManager } from "../../../services/aiService";
import styles from "../index.module.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export interface ModelSettingsTabProps {
  settings: ModelSettings;
  onSettingChange: (key: keyof ModelSettings, value: any) => void;
}

const ModelSettingsTab: React.FC<ModelSettingsTabProps> = ({
  settings,
  onSettingChange,
}) => {
  const { message } = App.useApp();

  const [selectedProvider, setSelectedProvider] = useState<string>(
    settings.provider || "zhipu"
  );
  const [connectionStatus, setConnectionStatus] = useState<{
    [key: string]: "idle" | "testing" | "success" | "error";
  }>({});
  const [apiKeyInputs, setApiKeyInputs] = useState<{ [key: string]: string }>(
    {}
  );

  const [aiSettings, setAiSettings] = useState(() => aiService.getSettings());

  useEffect(() => {
    const currentSettings = aiService.getSettings();
    setAiSettings(currentSettings);
    setSelectedProvider(currentSettings.provider);

    // 从securityManager获取实际保存的API密钥
    const initialApiKeys: { [key: string]: string } = {};
    const providers = ["zhipu", "deepseek", "openai"]; // 支持的提供商列表

    providers.forEach((provider) => {
      // 直接从securityManager获取加密保存的密钥
      const savedKey = securityManager.getAPIKey(provider);
      if (savedKey) {
        initialApiKeys[provider] = savedKey;
      }
    });

    setApiKeyInputs(initialApiKeys);

    // 初始化连接状态
    const initialStatus: {
      [key: string]: "idle" | "testing" | "success" | "error";
    } = {};
    providers.forEach((provider) => {
      initialStatus[provider] = "idle";
    });
    setConnectionStatus(initialStatus);
  }, []);

  // 监听提供商切换，确保显示正确的API密钥
  useEffect(() => {
    if (selectedProvider && !apiKeyInputs[selectedProvider]) {
      // 如果切换到的提供商没有在输入框中显示密钥，尝试从存储加载
      const savedKey = securityManager.getAPIKey(selectedProvider);
      if (savedKey) {
        setApiKeyInputs((prev) => ({
          ...prev,
          [selectedProvider]: savedKey,
        }));
      }
    }
  }, [selectedProvider, apiKeyInputs]);

  const handleSettingChange = useCallback(
    (key: string, value: any) => {
      const newSettings = {
        ...aiSettings,
        [key]: value,
      };

      setAiSettings(newSettings);
      aiService.saveSettings(newSettings);
      onSettingChange(key as keyof ModelSettings, value);
    },
    [aiSettings, onSettingChange]
  );

  const handleApiKeyChange = useCallback(
    (value: string) => {
      setApiKeyInputs((prev) => ({
        ...prev,
        [selectedProvider]: value,
      }));

      // 重置连接状态
      setConnectionStatus((prev) => ({
        ...prev,
        [selectedProvider]: "idle",
      }));
    },
    [selectedProvider]
  );

  const saveApiKey = useCallback(async () => {
    const apiKey = apiKeyInputs[selectedProvider];
    if (!apiKey) {
      message.warning("请输入API密钥");
      return;
    }

    try {
      // 直接使用securityManager保存API密钥，更可靠
      securityManager.setAPIKey(selectedProvider, apiKey);

      // 更新当前设置状态
      const updatedSettings = {
        ...aiSettings,
        apiKeys: {
          ...aiSettings.apiKeys,
          [selectedProvider]: apiKey,
        },
      };
      setAiSettings(updatedSettings);

      message.success("API密钥保存成功！");
    } catch (error) {
      message.error(
        `保存失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }, [aiSettings, selectedProvider, apiKeyInputs, message]);

  const testConnection = async () => {
    const apiKey = apiKeyInputs[selectedProvider];
    if (!apiKey) {
      message.warning("请先输入API密钥");
      return;
    }

    setConnectionStatus((prev) => ({
      ...prev,
      [selectedProvider]: "testing",
    }));

    try {
      // 先保存API密钥到securityManager，再测试
      securityManager.setAPIKey(selectedProvider, apiKey);

      // 测试连接
      const result = await aiService.testProvider(selectedProvider);

      if (result) {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "success",
        }));
        message.success("连接测试成功！模型可以使用");
      } else {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "error",
        }));
        message.error("连接测试失败，请检查API密钥是否正确");
      }
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        [selectedProvider]: "error",
      }));
      message.error(
        `连接测试失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  };

  return (
    <div className={styles.contentSection}>
      <div style={{ marginBottom: "24px" }}>
        <Title level={3}>
          <RobotOutlined /> 模型服务
        </Title>
        <Paragraph type="secondary">
          配置AI服务提供商和模型参数，开始使用AI功能生成便签内容。
        </Paragraph>
      </div>

      <Divider />

      <div style={{ display: "flex", height: "400px" }}>
        <div style={{ width: "250px", borderRight: "1px solid #f0f0f0" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
            <Text strong>AI 服务提供商</Text>
          </div>
          <List
            dataSource={[
              {
                id: "zhipu",
                name: "智谱AI",
                icon: <RobotOutlined style={{ color: "#1890ff" }} />,
              },
              {
                id: "deepseek",
                name: "深度求索",
                icon: <RobotOutlined style={{ color: "#722ed1" }} />,
              },
              {
                id: "openai",
                name: "OpenAI",
                icon: <RobotOutlined style={{ color: "#10a37f" }} />,
              },
            ]}
            renderItem={(provider) => (
              <List.Item
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedProvider === provider.id
                      ? "#f6ffed"
                      : "transparent",
                }}
                onClick={() => {
                  setSelectedProvider(provider.id);
                  handleSettingChange("provider", provider.id);
                }}
              >
                <List.Item.Meta
                  avatar={provider.icon}
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

        <div style={{ flex: 1, padding: "24px" }}>
          <Form layout="vertical">
            <Card
              title={
                <>
                  <KeyOutlined /> API 密钥配置
                </>
              }
              style={{ marginBottom: "16px" }}
            >
              <Form.Item
                label="API Key"
                help={
                  connectionStatus[selectedProvider] === "success"
                    ? "✅ 连接测试成功，模型可以使用"
                    : connectionStatus[selectedProvider] === "error"
                    ? "❌ 连接测试失败，请检查API密钥"
                    : "请输入API密钥并测试连接"
                }
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input.Password
                    placeholder={`输入 ${selectedProvider} 的 API Key`}
                    value={apiKeyInputs[selectedProvider] || ""}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    style={{ flex: 1 }}
                    status={
                      connectionStatus[selectedProvider] === "success"
                        ? ""
                        : connectionStatus[selectedProvider] === "error"
                        ? "error"
                        : ""
                    }
                  />
                  <Button onClick={saveApiKey} type="default">
                    保存
                  </Button>
                  <Button
                    onClick={testConnection}
                    type="primary"
                    loading={connectionStatus[selectedProvider] === "testing"}
                    disabled={!apiKeyInputs[selectedProvider]}
                  >
                    {connectionStatus[selectedProvider] === "testing"
                      ? "测试中..."
                      : "测试连接"}
                  </Button>
                </Space.Compact>
              </Form.Item>
            </Card>

            <Card
              title={
                <>
                  <SettingOutlined /> 模型配置
                </>
              }
            >
              <Form.Item label="默认模型">
                <Select
                  value={aiSettings.defaultModel}
                  onChange={(value) =>
                    handleSettingChange("defaultModel", value)
                  }
                  style={{ width: "100%" }}
                >
                  {MODEL_OPTIONS_BY_PROVIDER[
                    selectedProvider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
                  ]?.map((model) => (
                    <Option key={model.value} value={model.value}>
                      {model.label}
                    </Option>
                  )) || null}
                </Select>
              </Form.Item>

              <Form.Item label="温度参数">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={aiSettings.temperature}
                  onChange={(value) =>
                    handleSettingChange("temperature", value)
                  }
                  marks={{ 0: "精确", 0.5: "平衡", 1: "创意" }}
                />
              </Form.Item>

              <Form.Item label="最大生成长度">
                <Slider
                  min={500}
                  max={8000}
                  step={500}
                  value={aiSettings.maxTokens}
                  onChange={(value) => handleSettingChange("maxTokens", value)}
                  marks={{
                    500: "简短",
                    2000: "中等",
                    4000: "详细",
                    8000: "完整",
                  }}
                />
              </Form.Item>

              <Form.Item>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>显示思维链</span>
                    <Switch
                      checked={aiSettings.showThinking}
                      onChange={(value) =>
                        handleSettingChange("showThinking", value)
                      }
                    />
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>自动保存</span>
                    <Switch
                      checked={aiSettings.autoSave}
                      onChange={(value) =>
                        handleSettingChange("autoSave", value)
                      }
                    />
                  </div>
                </Space>
              </Form.Item>
            </Card>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ModelSettingsTab;
