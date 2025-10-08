/**
 * 模型配置组件
 * 专注于AI提供商和模型的配置、测试功能
 */

import React, { useCallback, useMemo } from "react";
import {
  Card,
  Form,
  AutoComplete,
  Input,
  Button,
  Space,
  Typography,
  App,
} from "antd";
import { useTheme } from "../../../theme";
import type { AIConfigurationState } from "../../../types/ai";
import { API_PROVIDERS, MODEL_OPTIONS_BY_PROVIDER } from "../constants";

const { Text } = Typography;

export interface ModelConfigurationProps {
  /** 当前配置状态 */
  configState: AIConfigurationState;
  /** 配置变更回调 */
  onConfigChange: (config: Partial<AIConfigurationState>) => void;
  /** 保存并测试回调 */
  onSaveAndTest: () => Promise<boolean>;
  /** 是否正在测试 */
  isTesting?: boolean;
}

/**
 * 模型配置组件
 */
export const ModelConfiguration: React.FC<ModelConfigurationProps> = ({
  configState,
  onConfigChange,
  onSaveAndTest,
  isTesting = false,
}) => {
  const { message } = App.useApp();
  const { isDark } = useTheme();

  // 获取提供商颜色
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

  // 处理提供商变更
  const handleProviderChange = useCallback(
    (provider: string) => {
      const providerModels =
        MODEL_OPTIONS_BY_PROVIDER[
          provider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
        ];

      onConfigChange({
        selectedProvider: provider,
        selectedModel: providerModels?.[0]?.value || "",
        connectionStatus: "idle",
        errorMessage: undefined,
      });
    },
    [onConfigChange]
  );

  // 处理模型变更
  const handleModelChange = useCallback(
    (model: string) => {
      const sanitizedModel = model.trim();
      onConfigChange({
        selectedModel: sanitizedModel,
        connectionStatus: "idle",
        errorMessage: undefined,
      });
    },
    [onConfigChange]
  );

  // 处理模型输入框清空
  const handleModelClear = useCallback(() => {
    onConfigChange({
      selectedModel: "",
      connectionStatus: "idle",
      errorMessage: undefined,
    });
  }, [onConfigChange]);

  // 处理API密钥变更
  const handleApiKeyChange = useCallback(
    (value: string) => {
      onConfigChange({
        apiKey: value,
        connectionStatus: "idle",
        errorMessage: undefined,
      });
    },
    [onConfigChange]
  );

  // 处理保存并测试
  const handleSaveAndTest = useCallback(async () => {
    try {
      const success = await onSaveAndTest();
      if (success) {
        message.success("🎉 配置测试成功，已应用为默认模型");
      }
    } catch (error) {
      // 错误处理由父组件负责
    }
  }, [onSaveAndTest, message]);

  // 获取当前选择的提供商信息
  const selectedProviderInfo = API_PROVIDERS.find(
    (p) => p.value === configState.selectedProvider
  );

  // 获取当前选择的模型选项
  const providerModelOptions =
    MODEL_OPTIONS_BY_PROVIDER[
      configState.selectedProvider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
    ] || [];

  const modelOptions = useMemo(() => {
    if (!configState.selectedModel) {
      return providerModelOptions;
    }

    const existsInOptions = providerModelOptions.some(
      (option) => option.value === configState.selectedModel
    );

    if (existsInOptions) {
      return providerModelOptions;
    }

    return [
      { value: configState.selectedModel, label: configState.selectedModel },
      ...providerModelOptions,
    ];
  }, [providerModelOptions, configState.selectedModel]);

  return (
    <div style={{ display: "flex", gap: "16px", height: "100%" }}>
      {/* 左侧：提供商选择 */}
      <Card
        size="small"
        title="AI提供商"
        style={{
          width: "200px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{
          flex: 1,
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {API_PROVIDERS.map((provider) => (
            <div
              key={provider.value}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                backgroundColor:
                  configState.selectedProvider === provider.value
                    ? isDark
                      ? "var(--primary-color-hover-bg)"
                      : "var(--primary-color-active-bg)"
                    : "transparent",
                borderLeft:
                  configState.selectedProvider === provider.value
                    ? `3px solid ${getProviderColor(provider.value)}`
                    : "3px solid transparent",
                borderRadius: "4px",
                marginBottom: "6px",
              }}
              onClick={() => handleProviderChange(provider.value)}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: getProviderColor(provider.value),
                  }}
                />
                <Text strong={configState.selectedProvider === provider.value}>
                  {provider.label}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 右侧：配置详情 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "100%",
          minWidth: 0,
        }}
      >
        {/* API密钥配置 */}
        <Card
          size="small"
          style={{ display: "flex", flexDirection: "column" }}
          bodyStyle={{
            display: "flex",
            flexDirection: "column",
            padding: "12px",
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>API密钥配置</span>
              {configState.connectionStatus === "success" && (
                <span style={{ color: "#52c41a", fontSize: "12px" }}>
                  ✅ 已连接
                </span>
              )}
              {configState.connectionStatus === "error" && (
                <span style={{ color: "#ff4d4f", fontSize: "12px" }}>
                  ❌ 连接失败
                </span>
              )}
            </div>
          }
        >
          <div style={{ marginBottom: "12px" }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              请输入 {selectedProviderInfo?.label} 的 API
              密钥，输入后点击"保存并测试"验证连接
            </Text>
          </div>

          <Space.Compact style={{ width: "100%" }}>
            <Input.Password
              placeholder={`输入 ${selectedProviderInfo?.label} 的 API Key`}
              value={configState.apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              onPressEnter={handleSaveAndTest}
              style={{ flex: 1 }}
              status={
                configState.connectionStatus === "error" ? "error" : undefined
              }
            />
            <Button
              onClick={handleSaveAndTest}
              type="primary"
              loading={isTesting}
              disabled={!configState.apiKey?.trim()}
            >
              {isTesting ? "验证中..." : "保存并测试"}
            </Button>
          </Space.Compact>

          {configState.errorMessage && (
            <Text
              type="danger"
              style={{ fontSize: "12px", marginTop: "8px", display: "block" }}
            >
              {configState.errorMessage}
            </Text>
          )}
        </Card>

        {/* 模型选择 */}
        <Card size="small" title="模型选择" bodyStyle={{ padding: "12px" }}>
          <Form layout="vertical" style={{ marginBottom: 0 }}>
            <Form.Item label="选择模型" style={{ marginBottom: 0 }}>
              <AutoComplete
                value={configState.selectedModel}
                onChange={handleModelChange}
                onBlur={() => handleModelChange(configState.selectedModel)}
                style={{ width: "100%" }}
                placeholder="请选择预设模型或输入自定义模型名称"
                allowClear
                options={modelOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                filterOption={(inputValue, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
                onSelect={(value) => handleModelChange(value)}
                onClear={handleModelClear}
              />
            </Form.Item>
          </Form>

          {/* 模型使用提示 */}
          <div
            style={{
              marginTop: "12px",
              padding: "10px 12px",
              backgroundColor: isDark ? "#1f1f1f" : "#f6f6f6",
              borderRadius: "4px",
            }}
          >
            <Text type="secondary" style={{ fontSize: "12px" }}>
              💡
              提示：可以选择预设模型或输入自定义模型名称。不同模型的功能和性能可能有所差异。
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};
