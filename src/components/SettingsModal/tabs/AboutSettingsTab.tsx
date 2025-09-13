/**
 * 关于我们设置选项卡
 */

import React from "react";
import { Divider, Button, Space, Switch, Typography } from "antd";
import {
  InfoCircleOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  BellOutlined,
  MailOutlined,
  BugOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import type { AppInfo } from "../types";
import styles from "../index.module.css";

const { Title, Text } = Typography;

export interface AboutSettingsTabProps {
  appInfo: AppInfo;
  onCheckUpdate: () => void;
  onOpenTestPanel: () => void;
}

const AboutSettingsTab: React.FC<AboutSettingsTabProps> = ({
  appInfo,
  onCheckUpdate,
  onOpenTestPanel,
}) => {
  const featureItems = [
    { icon: <QuestionCircleOutlined />, label: "智能问答" },
    { icon: <GlobalOutlined />, label: "官方网站" },
    { icon: <BellOutlined />, label: "更新日志" },
    { icon: <MailOutlined />, label: "邮件联系" },
    { icon: <BugOutlined />, label: "意见反馈" },
    { icon: <GithubOutlined />, label: "开源地址" },
  ];

  return (
    <div className={styles.contentSection}>
      <Title level={3}>
        <InfoCircleOutlined /> 关于我们
      </Title>
      <Divider />

      <div className={styles.settingGroup}>
        <div className={styles.aboutSection}>
          <div className={styles.appInfo}>
            <div className={styles.appLogo}>
              <AppstoreOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            </div>
            <div className={styles.appDetails}>
              <Title level={2}>{appInfo.name}</Title>
              <Text type="secondary">版本 {appInfo.version}</Text>
              <Text style={{ display: "block", marginTop: 8 }}>
                {appInfo.description}
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.settingGroup}>
        <Title level={4}>功能特色</Title>
        <div className={styles.featureList}>
          {featureItems.map((item, index) => (
            <div key={index} className={styles.featureItem}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingGroup}>
        <Title level={4}>更新检查</Title>
        <Space>
          <Button type="primary" onClick={onCheckUpdate}>
            检查更新
          </Button>
          <div className={styles.settingItem}>
            <Switch />
            <Text style={{ marginLeft: 8 }}>自动更新</Text>
          </div>
        </Space>
      </div>

      <div className={styles.settingGroup}>
        <Title level={4}>测试面板</Title>
        <Button type="default" onClick={onOpenTestPanel}>
          打开
        </Button>
      </div>
    </div>
  );
};

export default AboutSettingsTab;
