/**
 * 模型设置容器组件
 * 连接新的UI组件和AIService，管理状态和数据流
 */

import React, { useState, useEffect, useCallback } from "react";
import { App } from "antd";
import { ActiveModelStatus } from "./ActiveModelStatus";
import { ModelConfiguration } from "./ModelConfiguration";
import { aiService } from "../../../services/aiService";
import { API_PROVIDERS, MODEL_OPTIONS_BY_PROVIDER } from "../constants";
import type { AIActiveConfig, AIConfigurationState } from "../../../types/ai";
import { useTheme } from "../../../theme";

export interface ModelSettingsContainerProps {
  /** 设置变更回调（用于向后兼容） */
  onSettingChange?: (key: string, value: any) => void;
}

/**
 * 模型设置容器组件
 */
export const ModelSettingsContainer: React.FC<ModelSettingsContainerProps> = ({
  onSettingChange,
}) => {
  const { message } = App.useApp();
  const { isDark } = useTheme();

  // 状态管理
  const [activeConfig, setActiveConfig] = useState<AIActiveConfig>({
    provider: "zhipu",
    model: "glm-4",
    appliedAt: new Date().toISOString(),
  });

  const [globalShowThinking, setGlobalShowThinking] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "ready" | "error" | "unconfigured"
  >("unconfigured");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const [configState, setConfigState] = useState<AIConfigurationState>({
    selectedProvider: "zhipu",
    selectedModel: "glm-4",
    apiKey: "",
    connectionStatus: "idle",
    isConfigured: false,
  });

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

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 获取当前设置
        const settings = await aiService.getSettings();
        const currentActiveConfig = aiService.getActiveConfig();

        setActiveConfig(currentActiveConfig);
        setGlobalShowThinking(aiService.getGlobalShowThinking());

        // 初始化配置状态
        setConfigState({
          selectedProvider: currentActiveConfig.provider,
          selectedModel: currentActiveConfig.model,
          apiKey: "", // 不显示已保存的密钥
          connectionStatus: "idle",
          isConfigured: true,
        });

        // 检查连接状态
        const hasApiKey = await aiService.hasAPIKey(
          currentActiveConfig.provider
        );
        setConnectionStatus(hasApiKey ? "ready" : "unconfigured");

        console.log("✅ 模型设置容器初始化完成", {
          currentActiveConfig,
          settings,
        });
      } catch (error) {
        console.error("❌ 模型设置容器初始化失败:", error);
        setConnectionStatus("error");
      }
    };

    initializeData();
  }, []);

  // 处理思维链开关
  const handleThinkingToggle = useCallback(
    async (enabled: boolean) => {
      try {
        await aiService.setGlobalShowThinking(enabled);
        setGlobalShowThinking(enabled);

        // 向后兼容回调
        onSettingChange?.("showThinking", enabled);

        message.success(`思维链显示已${enabled ? "开启" : "关闭"}`);
      } catch (error) {
        console.error("❌ 更新思维链设置失败:", error);
        message.error("更新思维链设置失败");
      }
    },
    [onSettingChange, message]
  );

  // 处理配置变更
  const handleConfigChange = useCallback(
    (config: Partial<AIConfigurationState>) => {
      setConfigState((prev) => ({ ...prev, ...config }));
    },
    []
  );

  // 处理保存并测试
  const handleSaveAndTest = useCallback(async (): Promise<boolean> => {
    setIsTesting(true);
    setConfigState((prev) => ({
      ...prev,
      connectionStatus: "testing",
      errorMessage: undefined,
    }));

    try {
      // 测试配置
      const testResult = await aiService.testConfiguration(
        configState.selectedProvider,
        configState.selectedModel,
        configState.apiKey
      );

      if (testResult.success) {
        // 应用配置
        await aiService.applyConfiguration(
          configState.selectedProvider,
          configState.selectedModel
        );

        // 更新状态
        const newActiveConfig = aiService.getActiveConfig();
        setActiveConfig(newActiveConfig);
        setConnectionStatus("ready");
        setConfigState((prev) => ({
          ...prev,
          connectionStatus: "success",
          isConfigured: true,
        }));

        // 向后兼容回调
        onSettingChange?.("provider", configState.selectedProvider);
        onSettingChange?.("defaultModel", configState.selectedModel);

        return true;
      } else {
        // 测试失败
        setConfigState((prev) => ({
          ...prev,
          connectionStatus: "error",
          errorMessage: testResult.error,
        }));
        setConnectionStatus("error");
        message.error(`❌ ${testResult.error}`);
        return false;
      }
    } catch (error) {
      console.error("❌ 配置测试失败:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      setConfigState((prev) => ({
        ...prev,
        connectionStatus: "error",
        errorMessage,
      }));
      setConnectionStatus("error");
      message.error(`❌ 配置测试失败: ${errorMessage}`);
      return false;
    } finally {
      setIsTesting(false);
    }
  }, [configState, onSettingChange, message]);

  // 获取显示标签
  const getProviderLabel = (provider: string): string => {
    return API_PROVIDERS.find((p) => p.value === provider)?.label || provider;
  };

  const getModelLabel = (provider: string, model: string): string => {
    const models =
      MODEL_OPTIONS_BY_PROVIDER[
        provider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
      ];
    return models?.find((m) => m.value === model)?.label || model;
  };

  // 检查当前模型是否支持思维链
  return (
    <div>
      {/* 头部状态组件 */}
      <ActiveModelStatus
        activeConfig={activeConfig}
        providerLabel={getProviderLabel(activeConfig.provider)}
        modelLabel={getModelLabel(activeConfig.provider, activeConfig.model)}
        providerColor={getProviderColor(activeConfig.provider)}
        connectionStatus={connectionStatus}
        globalShowThinking={globalShowThinking}
        onThinkingToggle={handleThinkingToggle}
      />

      {/* 配置区域组件 */}
      <ModelConfiguration
        configState={configState}
        onConfigChange={handleConfigChange}
        onSaveAndTest={handleSaveAndTest}
        isTesting={isTesting}
      />
    </div>
  );
};
