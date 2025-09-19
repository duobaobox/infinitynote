/**
 * DisplaySettingsTab - 显示设置选项卡组件
 *
 * 功能说明：
 * 提供应用程序的界面显示配置，包括主题切换、视觉效果等
 * 个性化设置。与主题系统深度集成，支持实时预览效果。
 *
 * 主要功能：
 *
 * 🎨 主题与外观：
 * - 🌓 主题模式：浅色/深色/跟随系统，支持实时切换
 * - 📐 显示网格：在画布上显示辅助网格线
 * - 🔄 平滑缩放：启用画布平滑缩放动画效果
 *
 * 技术特性：
 * - 🔄 实时生效：设置修改后立即应用到界面
 * - 🎯 主题集成：与 ThemeProvider 深度集成
 * - 💾 状态同步：自动同步主题状态到设置存储
 * - 🎪 视觉反馈：提供设置变更的视觉反馈
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-14
 */

import React, { useEffect, useState } from "react";
import { Switch, Select, Typography, Card, Row, Col, ColorPicker } from "antd";
import { useTheme } from "../../../theme";
import type { DisplaySettings } from "../types";
import { THEME_OPTIONS, CANVAS_COLOR_PRESETS } from "../constants";
import styles from "../index.module.css";

const { Text } = Typography;

export interface DisplaySettingsTabProps {
  settings: DisplaySettings;
  onSettingChange: (
    key: keyof DisplaySettings,
    value: string | boolean
  ) => void;
}

const DisplaySettingsTab: React.FC<DisplaySettingsTabProps> = ({
  settings,
  onSettingChange,
}) => {
  // 使用主题 hook 来直接控制应用主题
  const { theme: currentTheme, setTheme, isDark } = useTheme();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // 处理主题切换逻辑
  const handleThemeChange = (value: string) => {
    // 更新设置存储
    onSettingChange("theme", value);

    // 直接设置主题，ThemeProvider 会处理 auto 模式的逻辑
    if (value === "light" || value === "dark" || value === "auto") {
      setTheme(value as "light" | "dark" | "auto");
    }
  };

  // 处理画布颜色变化
  const handleCanvasColorChange = (color: string) => {
    onSettingChange("canvasColor", color);
    // 检查是否匹配预设颜色
    const matchedPreset = CANVAS_COLOR_PRESETS.find(
      (preset) => preset.value === color
    );
    setSelectedPreset(matchedPreset ? matchedPreset.value : null);
  };

  // 处理预设颜色选择
  const handlePresetSelect = (presetValue: string) => {
    setSelectedPreset(presetValue);
    onSettingChange("canvasColor", presetValue);
  };

  // 当设置页面打开时，同步当前主题状态
  useEffect(() => {
    // 如果设置中的主题与当前应用主题不一致，需要同步
    if (settings.theme !== currentTheme) {
      setTheme(settings.theme as "light" | "dark" | "auto");
    }

    // 初始化时检查当前颜色是否匹配预设
    const matchedPreset = CANVAS_COLOR_PRESETS.find(
      (preset) => preset.value === settings.canvasColor
    );
    setSelectedPreset(matchedPreset ? matchedPreset.value : null);
  }, [settings.theme, settings.canvasColor, currentTheme, setTheme]);

  return (
    <div className={styles.contentSection}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 主题与外观 */}
        <Card size="small" title="主题与外观" style={{ flex: "0 0 auto" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>主题模式</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  选择浅色、深色或跟随系统
                </div>
              </div>
              <Select
                style={{ width: 160 }}
                value={settings.theme}
                onChange={handleThemeChange}
                options={[...THEME_OPTIONS]}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>显示网格</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  在画布上显示网格线
                </div>
              </div>
              <Switch
                checked={settings.showGrid}
                onChange={(checked) => onSettingChange("showGrid", checked)}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>平滑缩放</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  启用画布平滑缩放动画
                </div>
              </div>
              <Switch
                checked={settings.smoothZoom}
                onChange={(checked) => onSettingChange("smoothZoom", checked)}
              />
            </div>
          </div>
        </Card>

        {/* 画布设置 */}
        <Card size="small" title="画布设置" style={{ flex: 1 }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>画布背景颜色</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  自定义画布的背景颜色
                </div>
              </div>
              <ColorPicker
                value={settings.canvasColor}
                onChange={(color) =>
                  handleCanvasColorChange(color.toHexString())
                }
                showText
                size="large"
                style={{ width: 120 }}
              />
            </div>

            <div>
              <Text strong style={{ marginBottom: "12px", display: "block" }}>
                颜色预设
              </Text>
              <Text
                type="secondary"
                style={{
                  fontSize: "12px",
                  marginBottom: "12px",
                  display: "block",
                }}
              >
                选择精心搭配的预设颜色
              </Text>
              <Row gutter={[12, 12]} style={{ width: "100%" }}>
                {CANVAS_COLOR_PRESETS.map((preset) => (
                  <Col key={preset.value} xs={12} sm={8} md={6}>
                    <Card
                      hoverable
                      size="small"
                      style={{
                        borderColor:
                          selectedPreset === preset.value
                            ? 'var(--color-primary)'
                            : 'var(--color-border)',
                        borderWidth: selectedPreset === preset.value ? 2 : 1,
                        cursor: "pointer",
                      }}
                      onClick={() => handlePresetSelect(preset.value)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: "60px",
                            height: "40px",
                            backgroundColor: preset.value,
                            border: "1px solid #e0e0e0",
                            borderRadius: "6px",
                            margin: "0 auto 8px auto",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        />
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          {preset.name}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#666",
                            lineHeight: "1.2",
                          }}
                        >
                          {preset.description}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DisplaySettingsTab;
