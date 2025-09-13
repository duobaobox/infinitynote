/**
 * AboutSettingsTab - 关于我们设置选项卡组件
 *
 * 功能说明：
 * 展示应用程序的基本信息、功能特色、更新检查和开发者工具。
 * 提供用户了解应用、获取帮助和反馈问题的入口。
 *
 * 主要功能：
 *
 * ℹ️ 应用信息：
 * - 📱 应用名称和版本号：显示当前应用版本信息
 * - 📝 应用描述：简要介绍应用的核心功能和定位
 * - 🎨 应用图标：展示应用的视觉标识
 *
 * ⭐ 功能特色：
 * - 🤔 智能问答：AI 助手功能介绍
 * - 🌐 官方网站：跳转到官方网站获取更多信息
 * - 📋 更新日志：查看版本更新历史和新功能
 * - 📧 邮件联系：联系开发团队的邮箱地址
 * - 🐛 意见反馈：提交 Bug 报告和功能建议
 * - 💻 开源地址：查看项目的开源代码仓库
 *
 * 🔄 更新检查：
 * - ✅ 手动检查更新：点击按钮检查最新版本
 * - 🔄 自动更新开关：设置是否自动检查和安装更新
 *
 * 🛠️ 开发者工具：
 * - 🧪 测试面板：开发和调试功能的测试界面
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
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
