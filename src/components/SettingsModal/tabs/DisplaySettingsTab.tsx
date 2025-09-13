/**
 * 显示设置选项卡
 */

import React from "react";
import { Divider, Switch, Select, Space, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { DisplaySettings } from "../types";
import {
  THEME_OPTIONS,
  TOOLBAR_POSITION_OPTIONS,
  ZOOM_POSITION_OPTIONS,
} from "../constants";
import styles from "../index.module.css";

const { Title, Text } = Typography;

export interface DisplaySettingsTabProps {
  settings: DisplaySettings;
  onSettingChange: (key: keyof DisplaySettings, value: any) => void;
}

const DisplaySettingsTab: React.FC<DisplaySettingsTabProps> = ({
  settings,
  onSettingChange,
}) => {
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
              onChange={(value) => onSettingChange("theme", value)}
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

      <div className={styles.settingGroup}>
        <Title level={4}>界面布局</Title>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div className={styles.settingItem}>
            <Text strong>工具栏位置</Text>
            <Select
              style={{ width: 200, marginTop: 8 }}
              value={settings.toolbarPosition}
              onChange={(value) => onSettingChange("toolbarPosition", value)}
              options={[...TOOLBAR_POSITION_OPTIONS]}
            />
          </div>

          <div className={styles.settingItem}>
            <Text strong>缩放显示位置</Text>
            <Select
              style={{ width: 200, marginTop: 8 }}
              value={settings.zoomControlPosition}
              onChange={(value) =>
                onSettingChange("zoomControlPosition", value)
              }
              options={[...ZOOM_POSITION_OPTIONS]}
            />
          </div>
        </Space>
      </div>
    </div>
  );
};

export default DisplaySettingsTab;
