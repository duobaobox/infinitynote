import React, { useState, useCallback, useEffect } from "react";
import { Card, Form, Slider, InputNumber } from "antd";
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
        gap: "12px",
        padding: "12px",
      }}
    >
      {/* 新的模型设置容器组件 */}
      <div style={{ marginBottom: "16px" }}>
        <ModelSettingsContainer
          onSettingChange={handleCompatibleSettingChange}
        />
      </div>

      {/* 生成参数设置 */}
      <Card size="small" title="生成参数">
        <Form layout="vertical" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="温度">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={aiSettings.temperature}
                  onChange={(value) =>
                    handleParameterChange("temperature", value)
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
                    handleParameterChange("maxTokens", value || 3500)
                  }
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ModelSettingsTab;
