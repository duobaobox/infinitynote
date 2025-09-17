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
import { Button, Switch, Typography, Card } from "antd";
import {
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

const { Text } = Typography;

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
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 应用信息 */}
        <Card size="small" title="应用信息" style={{ flex: "0 0 auto" }}>
          <div className={styles.aboutSection}>
            <div className={styles.appInfo}>
              <div className={styles.appLogo}>
                <AppstoreOutlined style={{ fontSize: 48, color: "#1890ff" }} />
              </div>
              <div className={styles.appDetails}>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  {appInfo.name}
                </div>
                <Text type="secondary">版本 {appInfo.version}</Text>
                <Text style={{ display: "block", marginTop: 8 }}>
                  {appInfo.description}
                </Text>
              </div>
            </div>
          </div>
        </Card>

        {/* 功能特色 */}
        <Card size="small" title="功能特色" style={{ flex: "0 0 auto" }}>
          <div className={styles.featureList}>
            {featureItems.map((item, index) => (
              <div key={index} className={styles.featureItem}>
                {item.icon} {item.label}
              </div>
            ))}
          </div>
        </Card>

        {/* 更新检查 */}
        <Card size="small" title="更新检查" style={{ flex: "0 0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div>
              <Text strong>检查更新</Text>
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
              >
                手动检查应用更新
              </div>
            </div>
            <Button type="primary" onClick={onCheckUpdate}>
              检查更新
            </Button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
            }}
          >
            <div>
              <Text strong>自动更新</Text>
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
              >
                启用后自动检查并安装更新
              </div>
            </div>
            <Switch />
          </div>
        </Card>

        {/* 测试面板 */}
        <Card size="small" title="测试面板" style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text strong>开发者测试工具</Text>
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
              >
                用于开发和调试功能的测试界面
              </div>
            </div>
            <Button type="default" onClick={onOpenTestPanel}>
              打开测试面板
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AboutSettingsTab;
