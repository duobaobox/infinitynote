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
import { Switch, Select, Typography, Card } from "antd";
import type { GeneralSettings } from "../types";
import { LANGUAGE_OPTIONS } from "../constants";
import styles from "../index.module.css";

const { Text } = Typography;

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
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 应用行为 */}
        <Card size="small" title="应用行为" style={{ flex: "0 0 auto" }}>
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
                <Text strong>自动保存</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  自动保存笔记内容，避免数据丢失
                </div>
              </div>
              <Switch
                checked={settings.autoSave}
                onChange={(checked) => onSettingChange("autoSave", checked)}
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
                <Text strong>恢复会话</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  启动时恢复上次的笔记状态
                </div>
              </div>
              <Switch
                checked={settings.restoreSession}
                onChange={(checked) =>
                  onSettingChange("restoreSession", checked)
                }
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
                <Text strong>系统通知</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  接收系统提醒和通知
                </div>
              </div>
              <Switch
                checked={settings.systemNotifications}
                onChange={(checked) =>
                  onSettingChange("systemNotifications", checked)
                }
              />
            </div>
          </div>
        </Card>

        {/* 语言与地区 */}
        <Card size="small" title="语言与地区" style={{ flex: "0 0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text strong>界面语言</Text>
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
              >
                选择应用界面显示语言
              </div>
            </div>
            <Select
              style={{ width: 180 }}
              value={settings.language}
              onChange={(value) => onSettingChange("language", value)}
              options={[...LANGUAGE_OPTIONS]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;
