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
import {
  providerRegistry,
  type ProviderId,
} from "../../../services/ai/ProviderRegistry";
import type { AIActiveConfig, AIConfigurationState } from "../../../types/ai";
import { useTheme } from "../../../theme";

export interface ModelSettingsContainerProps {
  /** 设置变更回调（用于向后兼容） */
  onSettingChange?: (key: string | number | symbol, value: any) => void;
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
    try {
      return providerRegistry.getProviderColor(
        providerId as ProviderId,
        isDark ? "dark" : "light"
      );
    } catch {
      return isDark ? "#a6a6a6" : "#666";
    }
  };

  // 加载指定提供商的API密钥
  const loadProviderApiKey = useCallback(
    async (provider: string): Promise<string> => {
      try {
        const apiKey = await aiService.getAPIKey(provider);
        return apiKey || "";
      } catch (error) {
        console.error(`❌ 加载${provider}的API密钥失败:`, error);
        return "";
      }
    },
    []
  );

  // 加载指定提供商的首选模型
  const loadProviderModel = useCallback(
    async (provider: string): Promise<string> => {
      try {
        const savedModel = await aiService.getProviderModel(provider);
        if (savedModel) {
          return savedModel;
        }

        // 如果没有保存的模型，返回该提供商的默认模型
        const providerModels =
          MODEL_OPTIONS_BY_PROVIDER[
            provider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
          ];
        return providerModels?.[0]?.value || "";
      } catch (error) {
        console.error(`❌ 加载${provider}的首选模型失败:`, error);
        // 返回默认模型
        const providerModels =
          MODEL_OPTIONS_BY_PROVIDER[
            provider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
          ];
        return providerModels?.[0]?.value || "";
      }
    },
    []
  );

  // 检查当前活跃配置状态
  const checkCurrentConfigurationStatus = useCallback(async () => {
    try {
      const configStatus = await aiService.isCurrentConfigurationReady();
      setConnectionStatus(configStatus.status);

      console.log("🔍 当前配置状态检查:", {
        status: configStatus.status,
        message: configStatus.message,
        activeConfig: aiService.getActiveConfig(),
      });

      return configStatus;
    } catch (error) {
      console.error("❌ 检查配置状态失败:", error);
      setConnectionStatus("error");
      return { status: "error" as const, message: "状态检查失败" };
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 获取当前设置
        const settings = await aiService.getSettings();
        const currentActiveConfig = aiService.getActiveConfig();

        setActiveConfig(currentActiveConfig);
        // setGlobalShowThinking(aiService.getGlobalShowThinking()); // 已移除思维链开关

        // 加载当前提供商的API密钥和首选模型
        const currentApiKey = await loadProviderApiKey(
          currentActiveConfig.provider
        );
        const currentModel = await loadProviderModel(
          currentActiveConfig.provider
        );

        // 初始化配置状态
        setConfigState({
          selectedProvider: currentActiveConfig.provider,
          selectedModel: currentModel || currentActiveConfig.model, // 优先使用保存的模型
          apiKey: currentApiKey, // 加载已保存的密钥
          connectionStatus: "idle",
          isConfigured: true,
        });

        // 检查当前活跃配置的完整状态
        await checkCurrentConfigurationStatus();

        console.log("✅ 模型设置容器初始化完成", {
          currentActiveConfig,
          settings,
          hasApiKey: !!currentApiKey,
        });
      } catch (error) {
        console.error("❌ 模型设置容器初始化失败:", error);
        setConnectionStatus("error");
      }
    };

    initializeData();
  }, [loadProviderApiKey, loadProviderModel, checkCurrentConfigurationStatus]);

  // 处理配置变更
  const handleConfigChange = useCallback(
    async (config: Partial<AIConfigurationState>) => {
      // 如果提供商发生变化，需要加载对应的API密钥
      if (
        config.selectedProvider &&
        config.selectedProvider !== configState.selectedProvider
      ) {
        try {
          const providerApiKey = await loadProviderApiKey(
            config.selectedProvider
          );
          const providerModel = await loadProviderModel(
            config.selectedProvider
          );
          setConfigState((prev) => ({
            ...prev,
            ...config,
            selectedModel: providerModel, // 自动加载对应提供商的首选模型
            apiKey: providerApiKey, // 自动加载对应提供商的API密钥
            connectionStatus: "idle",
            errorMessage: undefined,
          }));

          // 注意：这里不检查状态，因为用户还在配置中
          // 状态检测应该基于实际应用的活跃配置，而不是临时选择的配置
          // setConnectionStatus("idle"); // 不改变全局连接状态

          console.log(`✅ 切换到${config.selectedProvider}，已加载配置:`, {
            hasApiKey: !!providerApiKey,
            model: providerModel,
          });
        } catch (error) {
          console.error(`❌ 切换提供商时加载配置失败:`, error);
          // 获取默认模型作为备选
          const defaultModel =
            MODEL_OPTIONS_BY_PROVIDER[
              config.selectedProvider as keyof typeof MODEL_OPTIONS_BY_PROVIDER
            ]?.[0]?.value || "";

          setConfigState((prev) => ({
            ...prev,
            ...config,
            selectedModel: defaultModel, // 使用默认模型
            apiKey: "",
            connectionStatus: "idle",
            errorMessage: undefined,
          }));
          setConnectionStatus("unconfigured");
        }
      } else {
        // 其他配置变更，直接更新
        setConfigState((prev) => ({ ...prev, ...config }));
      }
    },
    [configState.selectedProvider, loadProviderApiKey, loadProviderModel]
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

        // 重新检查当前配置状态（基于新应用的活跃配置）
        await checkCurrentConfigurationStatus();

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
