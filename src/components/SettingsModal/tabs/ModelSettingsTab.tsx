import React, { useState, useCallback, useEffect } from "react";
import {
  Space,
  Typography,
  Card,
  Form,
  Slider,
  Switch,
  InputNumber,
  Divider,
} from "antd";
import { useTheme } from "../../../theme";
import type { ModelSettings } from "../types";
import { aiService } from "../../../services/aiService";
import { ModelSettingsContainer } from "../components/ModelSettingsContainer";
import styles from "../index.module.css";

const { Text } = Typography;

export interface ModelSettingsTabProps {
  settings: ModelSettings;
  onSettingChange: (key: keyof ModelSettings, value: any) => void;
}

const ModelSettingsTab: React.FC<ModelSettingsTabProps> = ({
  settings,
  onSettingChange,
}) => {
  const { isDark } = useTheme();
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
        <ModelSettingsContainer onSettingChange={onSettingChange} />
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
                    handleParameterChange("maxTokens", value || 1000)
                  }
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text>自动保存</Text>
              <Switch
                checked={aiSettings.autoSave}
                onChange={(value) => handleParameterChange("autoSave", value)}
              />
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ModelSettingsTab;
