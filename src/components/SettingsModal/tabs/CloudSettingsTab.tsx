/**
 * 云同步设置选项卡
 */

import React from "react";
import { Divider, Typography } from "antd";
import { CloudOutlined } from "@ant-design/icons";
import type { CloudSettings } from "../types";
import styles from "../index.module.css";

const { Title, Text, Paragraph } = Typography;

export interface CloudSettingsTabProps {
  settings: CloudSettings;
}

const CloudSettingsTab: React.FC<CloudSettingsTabProps> = () => {
  return (
    <div className={styles.contentSection}>
      <Title level={3}>
        <CloudOutlined /> 云同步
      </Title>
      <Divider />

      <div className={styles.settingGroup}>
        <Title level={4}>同步状态</Title>
        <div className={styles.syncStatus}>
          <Text type="secondary">云同步功能即将推出</Text>
          <Paragraph type="secondary">
            我们正在开发云同步功能，让您可以在多个设备之间同步笔记。
            敬请期待后续版本的更新。
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default CloudSettingsTab;
