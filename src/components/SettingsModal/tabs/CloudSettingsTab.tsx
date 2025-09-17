/**
 * CloudSettingsTab - 云同步设置选项卡组件
 *
 * 功能说明：
 * 云同步功能的配置界面，目前处于开发阶段，主要展示功能预告和开发进度。
 * 未来将提供完整的云端数据同步功能，支持多设备间的数据同步。
 *
 * 当前状态：
 * - 🚧 开发中：云同步功能正在开发，暂时只有占位界面
 * - 📋 功能预告：展示即将推出的云同步功能说明
 * - ⏳ 敬请期待：提示用户关注后续版本更新
 *
 * 规划功能：
 *
 * ☁️ 云端同步：
 * - 📱 多设备同步：在手机、平板、电脑间同步笔记数据
 * - 🔄 实时同步：数据变更后自动同步到云端
 * - 📤 增量同步：只同步变更的数据，节省带宽
 * - 🔒 数据加密：云端数据采用端到端加密保护
 *
 * 🌐 云服务提供商：
 * - GitHub：基于 GitHub Gist 的同步方案
 * - Dropbox：文件同步服务集成
 * - OneDrive：微软云存储集成
 * - 自定义：支持自建云存储服务
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import React from "react";
import { Typography, Card } from "antd";
import type { CloudSettings } from "../types";
import styles from "../index.module.css";

const { Text, Paragraph } = Typography;

export interface CloudSettingsTabProps {
  settings: CloudSettings;
}

const CloudSettingsTab: React.FC<CloudSettingsTabProps> = () => {
  return (
    <div className={styles.contentSection}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 同步状态 */}
        <Card size="small" title="同步状态" style={{ flex: 1 }}>
          <div className={styles.syncStatus}>
            <Text type="secondary" strong>
              云同步功能即将推出
            </Text>
            <Paragraph
              type="secondary"
              style={{ marginTop: "8px", marginBottom: 0 }}
            >
              我们正在开发云同步功能，让您可以在多个设备之间同步笔记。
              敬请期待后续版本的更新。
            </Paragraph>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CloudSettingsTab;
