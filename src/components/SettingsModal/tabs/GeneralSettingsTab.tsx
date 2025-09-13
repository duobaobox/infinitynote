/**
 * 常规设置选项卡
 */

import React from "react";
import { Divider, Switch, Select, Space, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import type { GeneralSettings } from "../types";
import { LANGUAGE_OPTIONS } from "../constants";
import styles from "../index.module.css";

const { Title, Text } = Typography;

export interface GeneralSettingsTabProps {
  settings: GeneralSettings;
  onSettingChange: (key: keyof GeneralSettings, value: any) => void;
}

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <div className={styles.contentSection}>
      <Title level={3}>
        <SettingOutlined /> 常规设置
      </Title>
      <Divider />

      <div className={styles.settingGroup}>
        <Title level={4}>应用行为</Title>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div className={styles.settingItem}>
            <div className={styles.settingLabel}>
              <Text strong>自动保存</Text>
              <Text type="secondary">自动保存笔记内容</Text>
            </div>
            <Switch
              checked={settings.autoSave}
              onChange={(checked) => onSettingChange("autoSave", checked)}
            />
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingLabel}>
              <Text strong>启动时恢复上次会话</Text>
              <Text type="secondary">启动应用时恢复上次的笔记状态</Text>
            </div>
            <Switch
              checked={settings.restoreSession}
              onChange={(checked) => onSettingChange("restoreSession", checked)}
            />
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingLabel}>
              <Text strong>系统通知</Text>
              <Text type="secondary">接收系统提醒和通知</Text>
            </div>
            <Switch
              checked={settings.systemNotifications}
              onChange={(checked) =>
                onSettingChange("systemNotifications", checked)
              }
            />
          </div>
        </Space>
      </div>

      <div className={styles.settingGroup}>
        <Title level={4}>语言与地区</Title>
        <div className={styles.settingItem}>
          <Text strong>界面语言</Text>
          <Select
            style={{ width: 200, marginTop: 8 }}
            value={settings.language}
            onChange={(value) => onSettingChange("language", value)}
            options={[...LANGUAGE_OPTIONS]}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;
