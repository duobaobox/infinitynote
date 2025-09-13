/**
 * GeneralSettingsTab - 常规设置选项卡组件
 *
 * 功能说明：
 * 提供应用程序的基础行为配置，包括自动保存、会话恢复、通知设置
 * 和界面语言选择等常用功能的开关和配置。
 *
 * 主要功能：
 *
 * 📱 应用行为：
 * - 🔄 自动保存：自动保存笔记内容，避免数据丢失
 * - 🔁 会话恢复：启动时恢复上次的笔记状态和工作环境
 * - 🔔 系统通知：接收应用相关的系统提醒和通知
 *
 * 🌐 语言与地区：
 * - 🗣️ 界面语言：支持简体中文、英文、日文等多语言
 * - 📍 地区设置：影响日期格式、数字格式等本地化显示
 *
 * 用户体验：
 * - 实时生效：设置修改后立即应用，无需重启
 * - 智能默认：提供合理的默认配置，适合大多数用户
 * - 清晰说明：每个设置项都有详细的功能说明
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
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
  onSettingChange: (
    key: keyof GeneralSettings,
    value: boolean | string
  ) => void;
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
