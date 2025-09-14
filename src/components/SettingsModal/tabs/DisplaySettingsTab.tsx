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

import React, { useEffect } from "react";
import { Divider, Switch, Select, Space, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useTheme } from "../../../theme";
import type { DisplaySettings } from "../types";
import { THEME_OPTIONS } from "../constants";
import styles from "../index.module.css";

const { Title, Text } = Typography;

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
  const { theme: currentTheme, setTheme } = useTheme();

  // 处理主题切换逻辑
  const handleThemeChange = (value: string) => {
    // 更新设置存储
    onSettingChange("theme", value);

    // 直接设置主题，ThemeProvider 会处理 auto 模式的逻辑
    if (value === "light" || value === "dark" || value === "auto") {
      setTheme(value as "light" | "dark" | "auto");
    }
  };

  // 当设置页面打开时，同步当前主题状态
  useEffect(() => {
    // 如果设置中的主题与当前应用主题不一致，需要同步
    if (settings.theme !== currentTheme) {
      setTheme(settings.theme as "light" | "dark" | "auto");
    }
  }, [settings.theme, currentTheme, setTheme]);

  return (
    <div className={styles.contentSection}>
      <Title level={3}>
        <EyeOutlined /> 显示设置
      </Title>
      <Divider />

      <div className={styles.settingGroup}>
        <Title level={4}>主题与外观</Title>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div className={styles.settingItem}>
            <Text strong>主题模式</Text>
            <Select
              style={{ width: 200, marginTop: 8 }}
              value={settings.theme}
              onChange={handleThemeChange}
              options={[...THEME_OPTIONS]}
            />
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingLabel}>
              <Text strong>显示网格</Text>
              <Text type="secondary">在画布上显示网格线</Text>
            </div>
            <Switch
              checked={settings.showGrid}
              onChange={(checked) => onSettingChange("showGrid", checked)}
            />
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingLabel}>
              <Text strong>平滑缩放</Text>
              <Text type="secondary">启用画布平滑缩放动画</Text>
            </div>
            <Switch
              checked={settings.smoothZoom}
              onChange={(checked) => onSettingChange("smoothZoom", checked)}
            />
          </div>
        </Space>
      </div>
    </div>
  );
};

export default DisplaySettingsTab;
