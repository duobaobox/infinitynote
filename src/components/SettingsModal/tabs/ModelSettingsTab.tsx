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
  InputNumber,
} from "antd";
import { RobotOutlined, KeyOutlined, SettingOutlined } from "@ant-design/icons";
import type { ModelSettings } from "../types";
import { MODEL_OPTIONS_BY_PROVIDER, API_PROVIDERS } from "../constants";
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

  // 获取提供商颜色
  const getProviderColor = (providerId: string): string => {
    const colors: Record<string, string> = {
      zhipu: "#1890ff",
      deepseek: "#722ed1",
      openai: "#10a37f",
      alibaba: "#ff7a00",
      siliconflow: "#13c2c2",
      anthropic: "#eb2f96",
    };
    return colors[providerId] || "#666";
  };

  const [selectedProvider, setSelectedProvider] = useState<string>(
    settings.provider || "zhipu"
  );
  const [connectionStatus, setConnectionStatus] = useState<{
    [key: string]: "idle" | "testing" | "success" | "error";
  }>({});
  const [apiKeyInputs, setApiKeyInputs] = useState<{ [key: string]: string }>(
    {}
  );

  const [aiSettings, setAiSettings] = useState(() =>
    aiService.getSettingsSync()
  );

  useEffect(() => {
    const initializeComponent = async () => {
      // 等待一小段时间让aiService加载完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 获取最新的AI设置（包括从IndexedDB加载的设置）
      const currentSettings = await aiService.getSettings();
      setAiSettings(currentSettings);
      setSelectedProvider(currentSettings.provider);

      // 从securityManager获取实际保存的API密钥（异步）
      const initialApiKeys: { [key: string]: string } = {};
      const providers = ["zhipu", "deepseek", "openai"]; // 支持的提供商列表

      for (const provider of providers) {
        // 异步获取加密保存的密钥
        const savedKey = await securityManager.getAPIKey(provider);
        if (savedKey) {
          initialApiKeys[provider] = savedKey;
        }
      }

      setApiKeyInputs(initialApiKeys);

      // 初始化连接状态
      const initialStatus: {
        [key: string]: "idle" | "testing" | "success" | "error";
      } = {};
      providers.forEach((provider) => {
        initialStatus[provider] = "idle";
      });
      setConnectionStatus(initialStatus);
    };

    initializeComponent();
  }, []);

  // 监听提供商切换，确保显示正确的API密钥
  useEffect(() => {
    if (selectedProvider && !apiKeyInputs[selectedProvider]) {
      // 如果切换到的提供商没有在输入框中显示密钥，尝试从存储加载
      const loadApiKey = async () => {
        const savedKey = await securityManager.getAPIKey(selectedProvider);
        if (savedKey) {
          setApiKeyInputs((prev) => ({
            ...prev,
            [selectedProvider]: savedKey,
          }));
        }
      };
      loadApiKey();
    }
  }, [selectedProvider, apiKeyInputs]);

  const handleSettingChange = useCallback(
    async (key: string, value: any) => {
      let newSettings = {
        ...aiSettings,
        [key]: value,
      };

      // 当切换提供商时，自动选择该提供商的第一个模型
      if (key === "provider" && value !== aiSettings.provider) {
        const providerModels =
          MODEL_OPTIONS_BY_PROVIDER[
            value as keyof typeof MODEL_OPTIONS_BY_PROVIDER
          ];
        if (providerModels && providerModels.length > 0) {
          newSettings.defaultModel = providerModels[0].value;
          message.info(`已自动切换到 ${providerModels[0].label} 模型`);
        }
      }

      setAiSettings(newSettings);

      // 自动保存配置（如果有API密钥的话）
      const canSave = await validateAndSaveSettings(newSettings);
      if (canSave) {
        onSettingChange("provider", newSettings.provider);
        onSettingChange("defaultModel", newSettings.defaultModel);
        message.success("AI配置已自动保存并生效！");
      } else {
        // 如果不能完整保存，至少保存当前选择
        onSettingChange(key as keyof ModelSettings, value);
        if (
          key === "provider" &&
          newSettings.defaultModel !== aiSettings.defaultModel
        ) {
          onSettingChange("defaultModel", newSettings.defaultModel);
        }
      }
    },
    [aiSettings, onSettingChange, message]
  );

  const validateAndSaveSettings = useCallback(async (settings: any) => {
    try {
      // 检查当前提供商是否有API密钥
      const currentApiKey = await securityManager.getAPIKey(settings.provider);
      if (!currentApiKey) {
        console.log("API密钥未配置，暂时保存本地设置");
        return false;
      }

      // 检查是否选择了模型
      if (!settings.defaultModel) {
        console.log("模型未选择，暂时保存本地设置");
        return false;
      }

      // 保存完整设置
      await aiService.saveSettings(settings);
      console.log("✅ AI设置已保存:", settings);
      return true;
    } catch (error) {
      console.error("保存AI设置失败:", error);
      return false;
    }
  }, []);

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

      // 如果用户删除了API密钥，立即清除保存的密钥
      if (!value) {
        securityManager.setAPIKey(selectedProvider, "");
      }
    },
    [selectedProvider]
  );

  const saveAndTestApiKey = useCallback(async () => {
    const apiKey = apiKeyInputs[selectedProvider];
    if (!apiKey) {
      message.warning("请输入API密钥");
      return;
    }

    setConnectionStatus((prev) => ({
      ...prev,
      [selectedProvider]: "testing",
    }));

    try {
      // 保存API密钥
      await securityManager.setAPIKey(selectedProvider, apiKey);

      // 更新当前设置状态
      const updatedSettings = {
        ...aiSettings,
        apiKeys: {
          ...aiSettings.apiKeys,
          [selectedProvider]: apiKey,
        },
      };
      setAiSettings(updatedSettings);

      // 测试连接
      const testResult = await aiService.testProvider(selectedProvider);

      if (testResult) {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "success",
        }));

        // 验证并尝试保存完整配置
        const canSave = await validateAndSaveSettings(updatedSettings);
        if (canSave) {
          message.success("✅ API密钥验证成功，AI配置已生效！");
        } else {
          message.success("✅ API密钥验证成功，请选择模型完成配置！");
        }
      } else {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "error",
        }));
        message.error("❌ API密钥验证失败，请检查密钥是否正确");
      }
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        [selectedProvider]: "error",
      }));
      message.error(
        `验证失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }, [
    aiSettings,
    selectedProvider,
    apiKeyInputs,
    message,
    validateAndSaveSettings,
  ]);

  return (
    <div className={styles.contentSection}>
      <div style={{ marginBottom: "24px" }}>
        <Title level={3}>
          <RobotOutlined /> 模型服务
        </Title>
        <Paragraph type="secondary">
          配置AI服务提供商和模型参数，开始使用AI功能生成便签内容。
        </Paragraph>

        {/* 当前AI配置状态 - 改进版 */}
        <Card
          size="small"
          style={{ marginTop: "16px", backgroundColor: "#f6f8fa" }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <RobotOutlined style={{ color: "#1890ff" }} />
              <Text strong>当前AI配置状态</Text>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>提供商:</Text>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text code>{aiSettings.provider}</Text>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: getProviderColor(aiSettings.provider),
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>模型:</Text>
              <Text code>{aiSettings.defaultModel || "未选择"}</Text>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>API密钥:</Text>
              {apiKeyInputs[aiSettings.provider] ? (
                <Text type="success">✅ 已配置</Text>
              ) : (
                <Text type="warning">⚠️ 未配置</Text>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>连接状态:</Text>
              {connectionStatus[aiSettings.provider] === "success" ? (
                <Text type="success">✅ 连接正常</Text>
              ) : connectionStatus[aiSettings.provider] === "error" ? (
                <Text type="danger">❌ 连接失败</Text>
              ) : connectionStatus[aiSettings.provider] === "testing" ? (
                <Text>🔄 测试中...</Text>
              ) : (
                <Text type="secondary">⚪ 未测试</Text>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Text strong>整体状态:</Text>
              {aiSettings.defaultModel && apiKeyInputs[aiSettings.provider] ? (
                connectionStatus[aiSettings.provider] === "success" ? (
                  <Text type="success" strong>
                    🎉 配置完成，可以使用
                  </Text>
                ) : (
                  <Text type="warning" strong>
                    ⚡ 配置完成，建议测试连接
                  </Text>
                )
              ) : (
                <Text type="warning" strong>
                  ⚠️ 配置不完整
                </Text>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Divider />

      <div style={{ display: "flex", height: "400px" }}>
        <div style={{ width: "250px", borderRight: "1px solid #f0f0f0" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
            <Text strong>AI 服务提供商</Text>
          </div>
          <List
            dataSource={API_PROVIDERS.map((provider) => ({
              id: provider.value,
              name: provider.label,
              description: provider.description,
              icon: (
                <RobotOutlined
                  style={{ color: getProviderColor(provider.value) }}
                />
              ),
            }))}
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
                  description={
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {provider.description}
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
                    : "输入API密钥后将自动保存并测试连接"
                }
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input.Password
                    placeholder={`输入 ${
                      API_PROVIDERS.find((p) => p.value === selectedProvider)
                        ?.label
                    } 的 API Key`}
                    value={apiKeyInputs[selectedProvider] || ""}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    onPressEnter={saveAndTestApiKey}
                    style={{ flex: 1 }}
                    status={
                      connectionStatus[selectedProvider] === "success"
                        ? ""
                        : connectionStatus[selectedProvider] === "error"
                        ? "error"
                        : ""
                    }
                  />
                  <Button
                    onClick={saveAndTestApiKey}
                    type="primary"
                    loading={connectionStatus[selectedProvider] === "testing"}
                    disabled={!apiKeyInputs[selectedProvider]}
                  >
                    {connectionStatus[selectedProvider] === "testing"
                      ? "验证中..."
                      : "保存并测试"}
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
                  onChange={async (value) => {
                    const newSettings = {
                      ...aiSettings,
                      defaultModel: value,
                    };
                    setAiSettings(newSettings);

                    // 自动保存配置
                    const canSave = await validateAndSaveSettings(newSettings);
                    if (canSave) {
                      onSettingChange("defaultModel", value);
                      message.success(`模型已切换到 ${value} 并自动保存！`);
                    } else {
                      onSettingChange("defaultModel", value);
                      message.info(
                        `模型已切换到 ${value}，配置API密钥后将自动生效`
                      );
                    }
                  }}
                  style={{ width: "100%" }}
                  placeholder="选择一个模型"
                >
                  {MODEL_OPTIONS_BY_PROVIDER[
                    selectedProvider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
                  ]?.map((model) => (
                    <Option key={model.value} value={model.value}>
                      {model.label}
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", marginLeft: "8px" }}
                      >
                        {model.description}
                      </Text>
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

              <Form.Item label="最大生成长度 (tokens)">
                <InputNumber
                  min={100}
                  max={32000}
                  value={aiSettings.maxTokens}
                  onChange={(value) =>
                    handleSettingChange("maxTokens", value || 1000)
                  }
                  style={{ width: "200px" }}
                  placeholder="输入token数量"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, "") as any}
                />
                <div
                  style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
                >
                  <Text type="secondary">
                    推荐值: 短文本 500-1000 | 中等内容 1000-2000 | 长文本
                    2000-4000 | 详细内容 4000+
                  </Text>
                </div>
              </Form.Item>

              <Form.Item>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div>
                      <span>显示思维链</span>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "2px",
                        }}
                      >
                        <Text type="secondary">
                          显示AI的推理过程 (智谱AI、DeepSeek
                          Reasoner支持，其他提供商未来可能支持)
                        </Text>
                      </div>
                    </div>
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
                    <div>
                      <span>自动保存AI内容</span>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "2px",
                        }}
                      >
                        <Text type="secondary">AI生成完成后自动保存到便签</Text>
                      </div>
                    </div>
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
