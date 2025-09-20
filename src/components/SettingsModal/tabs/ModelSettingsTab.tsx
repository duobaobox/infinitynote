import React, { useState, useCallback, useEffect } from "react";
import {
  Space,
  Typography,
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
import { useTheme } from "../../../theme";
import type { ModelSettings } from "../types";
import { MODEL_OPTIONS_BY_PROVIDER, API_PROVIDERS } from "../constants";
import { aiService, securityManager } from "../../../services/aiService";
import styles from "../index.module.css";

const { Text } = Typography;
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
  const { isDark } = useTheme();

  const getProviderColor = (providerId: string): string => {
    const lightColors: Record<string, string> = {
      zhipu: "#1890ff",
      deepseek: "#722ed1",
      openai: "#10a37f",
      alibaba: "#ff7a00",
      siliconflow: "#13c2c2",
      anthropic: "#eb2f96",
    };

    const darkColors: Record<string, string> = {
      zhipu: "#3c9ae8",
      deepseek: "#9254de",
      openai: "#2eb88a",
      alibaba: "#ff9a3e",
      siliconflow: "#36cfc9",
      anthropic: "#f759ab",
    };

    const colors = isDark ? darkColors : lightColors;
    return colors[providerId] || (isDark ? "#a6a6a6" : "#666");
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
      const currentSettings = await aiService.getSettings();
      setAiSettings(currentSettings);
      setSelectedProvider(currentSettings.provider);

      const initialApiKeys: { [key: string]: string } = {};
      const providers = [
        "zhipu",
        "deepseek",
        "openai",
        "alibaba",
        "siliconflow",
        "anthropic",
      ];

      for (const provider of providers) {
        const savedKey = await securityManager.getAPIKey(provider);
        if (savedKey) {
          initialApiKeys[provider] = savedKey;
        }
      }
      setApiKeyInputs(initialApiKeys);

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

  const validateAndSaveSettings = useCallback(async (settings: any) => {
    try {
      const currentApiKey = await securityManager.getAPIKey(settings.provider);
      if (!currentApiKey || !settings.defaultModel) return false;
      await aiService.saveSettings(settings);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const handleSettingChange = useCallback(
    async (key: string, value: any) => {
      let newSettings = { ...aiSettings, [key]: value };

      if (key === "provider" && value !== aiSettings.provider) {
        const providerModels =
          MODEL_OPTIONS_BY_PROVIDER[
            value as keyof typeof MODEL_OPTIONS_BY_PROVIDER
          ];
        if (providerModels?.length > 0) {
          newSettings.defaultModel = providerModels[0].value;
          message.info(`已自动切换到 ${providerModels[0].label} 模型`);
        }
      }

      setAiSettings(newSettings);
      const canSave = await validateAndSaveSettings(newSettings);

      if (canSave) {
        onSettingChange("provider", newSettings.provider);
        onSettingChange("defaultModel", newSettings.defaultModel);
      } else {
        onSettingChange(key as keyof ModelSettings, value);
        if (
          key === "provider" &&
          newSettings.defaultModel !== aiSettings.defaultModel
        ) {
          onSettingChange("defaultModel", newSettings.defaultModel);
        }
      }
    },
    [aiSettings, onSettingChange, message, validateAndSaveSettings]
  );

  const handleApiKeyChange = useCallback(
    (value: string) => {
      setApiKeyInputs((prev) => ({ ...prev, [selectedProvider]: value }));
      setConnectionStatus((prev) => ({ ...prev, [selectedProvider]: "idle" }));
    },
    [selectedProvider]
  );

  const testExistingConnection = useCallback(async () => {
    setConnectionStatus((prev) => ({ ...prev, [selectedProvider]: "testing" }));

    try {
      const testResult = await aiService.testProvider(selectedProvider);

      if (testResult) {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "success",
        }));
        message.success("🎉 连接测试成功");
      } else {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "error",
        }));
        message.error("❌ 连接测试失败");
      }
    } catch (error: any) {
      setConnectionStatus((prev) => ({ ...prev, [selectedProvider]: "error" }));
      message.error(`❌ 测试失败: ${error?.message || "未知错误"}`);
    }
  }, [selectedProvider, message]);

  const saveAndTestApiKey = useCallback(async () => {
    const apiKey = apiKeyInputs[selectedProvider];
    if (!apiKey) {
      message.warning("请输入API密钥");
      return;
    }

    setConnectionStatus((prev) => ({ ...prev, [selectedProvider]: "testing" }));

    try {
      // 验证API密钥格式
      if (!securityManager.validateAPIKey(selectedProvider, apiKey)) {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "error",
        }));
        message.error("❌ API密钥格式不正确，请检查后重试");
        return;
      }

      // 保存API密钥
      await securityManager.setAPIKey(selectedProvider, apiKey);

      // 测试连接
      const testResult = await aiService.testProvider(selectedProvider);

      if (testResult) {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "success",
        }));
        message.success("🎉 连接测试成功，模型可以使用");

        // 自动保存设置
        await aiService.saveSettings({
          provider: selectedProvider,
          apiKeys: { [selectedProvider]: apiKey },
        });
      } else {
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: "error",
        }));
        message.error("❌ 连接测试失败，请检查API密钥是否正确");
      }
    } catch (error: any) {
      setConnectionStatus((prev) => ({ ...prev, [selectedProvider]: "error" }));
      const errorMessage = error?.message || "未知错误";
      message.error(`❌ 验证失败: ${errorMessage}`);
    }
  }, [selectedProvider, apiKeyInputs, message]);

  return (
    <div
      className={styles.contentSection}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* 状态栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: isDark
            ? "var(--bg-elevated)"
            : "var(--bg-secondary)",
          borderRadius: "6px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: getProviderColor(aiSettings.provider),
            }}
          />
          <Text strong>
            {API_PROVIDERS.find((p) => p.value === aiSettings.provider)?.label}
          </Text>
          <Text type="secondary">•</Text>
          <Text code style={{ fontSize: "12px" }}>
            {aiSettings.defaultModel || "未选择"}
          </Text>
        </div>
        <div>
          {apiKeyInputs[aiSettings.provider] ? (
            connectionStatus[aiSettings.provider] === "success" ? (
              <Text type="success" style={{ fontSize: "12px" }}>
                ✅ 就绪
              </Text>
            ) : (
              <Text type="warning" style={{ fontSize: "12px" }}>
                ⚠️ 需配置
              </Text>
            )
          ) : (
            <Text type="warning" style={{ fontSize: "12px" }}>
              ⚠️ 需配置
            </Text>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", height: "100%", flex: 1 }}>
        {/* 左侧提供商列表 */}
        <div
          style={{ width: "240px", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: isDark
                ? "var(--bg-elevated)"
                : "var(--bg-container)",
              fontSize: "13px",
              fontWeight: 500,
              color: isDark
                ? "var(--text-color-secondary)"
                : "var(--text-color-secondary)",
            }}
          >
            AI提供商
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {API_PROVIDERS.map((provider) => (
              <div
                key={provider.value}
                style={{
                  padding: "12px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedProvider === provider.value
                      ? isDark
                        ? "var(--primary-color-hover-bg)"
                        : "var(--primary-color-active-bg)"
                      : "transparent",
                  borderLeft:
                    selectedProvider === provider.value
                      ? `3px solid ${getProviderColor(provider.value)}`
                      : "3px solid transparent",
                }}
                onClick={() => {
                  setSelectedProvider(provider.value);
                  handleSettingChange("provider", provider.value);
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: getProviderColor(provider.value),
                    }}
                  />
                  <Text
                    strong={selectedProvider === provider.value}
                    style={{ fontSize: "14px" }}
                  >
                    {provider.label}
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {provider.description}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧配置区域 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* API密钥配置 */}
          <Card
            size="small"
            title={
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>API密钥配置</span>
                {connectionStatus[selectedProvider] === "success" && (
                  <span style={{ color: "#52c41a", fontSize: "12px" }}>
                    ✅ 已连接
                  </span>
                )}
                {connectionStatus[selectedProvider] === "error" && (
                  <span style={{ color: "#ff4d4f", fontSize: "12px" }}>
                    ❌ 连接失败
                  </span>
                )}
              </div>
            }
          >
            <div style={{ marginBottom: "12px" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                请输入{" "}
                {API_PROVIDERS.find((p) => p.value === selectedProvider)?.label}{" "}
                的 API 密钥， 输入后将自动验证连接状态
              </Text>
            </div>

            <Space.Compact style={{ width: "100%" }}>
              <Input.Password
                placeholder={`输入 ${
                  API_PROVIDERS.find((p) => p.value === selectedProvider)?.label
                } 的 API Key`}
                value={apiKeyInputs[selectedProvider] || ""}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                onPressEnter={saveAndTestApiKey}
                style={{ flex: 1 }}
                status={
                  connectionStatus[selectedProvider] === "error"
                    ? "error"
                    : undefined
                }
              />
              <Button
                onClick={saveAndTestApiKey}
                type="primary"
                loading={connectionStatus[selectedProvider] === "testing"}
                disabled={!apiKeyInputs[selectedProvider]?.trim()}
              >
                {connectionStatus[selectedProvider] === "testing"
                  ? "验证中..."
                  : "保存并测试"}
              </Button>
            </Space.Compact>

            {/* 连接状态提示 */}
            {connectionStatus[selectedProvider] === "success" && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#389e0d",
                }}
              >
                🎉 连接成功！现在可以使用AI生成功能了
              </div>
            )}

            {connectionStatus[selectedProvider] === "error" && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#fff2f0",
                  border: "1px solid #ffccc7",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#cf1322",
                }}
              >
                ❌ 连接失败，请检查API密钥是否正确或网络连接是否正常
              </div>
            )}

            {/* 已保存密钥的测试按钮 */}
            {!apiKeyInputs[selectedProvider] &&
              connectionStatus[selectedProvider] !== "testing" && (
                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <Button
                    type="dashed"
                    onClick={testExistingConnection}
                    loading={connectionStatus[selectedProvider] === "testing"}
                    style={{ width: "100%" }}
                  >
                    测试已保存的API密钥连接
                  </Button>
                </div>
              )}
          </Card>

          {/* 模型设置 */}
          <Card size="small" title="模型设置" style={{ flex: 1 }}>
            <Form layout="vertical">
              <Form.Item label="选择模型">
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
                      {model.label} - {model.description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="温度">
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={aiSettings.temperature}
                      onChange={(value) =>
                        handleSettingChange("temperature", value)
                      }
                      marks={{ 0: "精确", 1: "创意" }}
                    />
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="最大Token">
                    <InputNumber
                      min={100}
                      max={32000}
                      value={aiSettings.maxTokens}
                      onChange={(value) =>
                        handleSettingChange("maxTokens", value || 1000)
                      }
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>显示思维链</Text>
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
                  <Text>自动保存</Text>
                  <Switch
                    checked={aiSettings.autoSave}
                    onChange={(value) => handleSettingChange("autoSave", value)}
                  />
                </div>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModelSettingsTab;
