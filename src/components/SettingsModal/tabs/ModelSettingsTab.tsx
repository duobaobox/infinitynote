import React, { useState, useCallback, useEffect } from "react";
import { useTheme } from "../../../theme";
import type { ModelSettings } from "../types";
import { aiService } from "../../../services/aiService";
import { ModelSettingsContainer } from "../components/ModelSettingsContainer";
import styles from "../index.module.css";

export interface ModelSettingsTabProps {
  settings: ModelSettings;
  onSettingChange: (key: keyof ModelSettings, value: any) => void;
}

const ModelSettingsTab: React.FC<ModelSettingsTabProps> = ({
  onSettingChange,
}) => {
  useTheme();
  const [aiSettings, setAiSettings] = useState(() =>
    aiService.getSettingsSync()
  );

  useEffect(() => {
    const initializeComponent = async () => {
      const currentSettings = await aiService.getSettings();
      setAiSettings(currentSettings);
    };
    initializeComponent();
  }, []);

  // 处理生成参数变更
  const handleParameterChange = useCallback(
    async (key: string, value: any) => {
      const newSettings = { ...aiSettings, [key]: value };
      setAiSettings(newSettings);

      try {
        await aiService.saveSettings({ [key]: value });
        onSettingChange(key as keyof ModelSettings, value);
      } catch (error) {
        console.error(`保存设置失败 (${key}):`, error);
      }
    },
    [aiSettings, onSettingChange]
  );

  // 创建兼容的设置变更处理函数
  const handleCompatibleSettingChange = useCallback(
    (key: string | number | symbol, value: any) => {
      onSettingChange(key as keyof ModelSettings, value);
    },
    [onSettingChange]
  );

  return (
    <div
      className={styles.contentSection}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "12px",
        overflow: "hidden",
      }}
    >
      {/* 新的模型设置容器组件 */}
      <ModelSettingsContainer
        onSettingChange={handleCompatibleSettingChange}
        temperature={aiSettings.temperature}
        maxTokens={aiSettings.maxTokens}
        onParameterChange={handleParameterChange}
      />
    </div>
  );
};

export default ModelSettingsTab;
