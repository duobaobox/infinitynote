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
import { message, Button, Switch, Typography, Card } from "antd";
import logo from "../../../assets/logo.png";

import {
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
  onOpenTestPanel,
}) => {
  const manualUrl = "https://www.kdocs.cn/l/cj6sWRtZJqcl";
  const changelogUrl = "https://www.kdocs.cn/l/coD3PhBb3dOO";
  const feedbackUrl = "https://www.kdocs.cn/l/ciBC3O9EMswq";
  const [messageApi, contextHolder] = message.useMessage();
  const repoUrl = "https://github.com/duobaobox/infinitynote2";
  const bilibiliUrl =
    "https://space.bilibili.com/254954861?spm_id_from=333.788.0.0";
  const featureItems = [
    {
      icon: <QuestionCircleOutlined />,
      label: "用户手册",
      onClick: () => {
        navigator.clipboard.writeText(manualUrl);
        window.open(manualUrl, "_blank");
      },
    },
    { icon: <GlobalOutlined />, label: "官方网站" },
    {
      icon: <BellOutlined />,
      label: "更新日志",
      onClick: () => {
        navigator.clipboard.writeText(changelogUrl);
        window.open(changelogUrl, "_blank");
      },
    },
    {
      icon: <MailOutlined />,
      label: "邮件联系",
      onClick: () => {
        navigator.clipboard.writeText("2385561331@qq.com");
        messageApi.success("已复制开发者邮箱地址：2385561331@qq.com");
      },
    },
    {
      icon: <BugOutlined />,
      label: "意见反馈",
      onClick: () => {
        navigator.clipboard.writeText(feedbackUrl);
        window.open(feedbackUrl, "_blank");
      },
    },
    {
      icon: <GithubOutlined />,
      label: "开源地址",
      onClick: () => {
        navigator.clipboard.writeText(repoUrl);
        window.open(repoUrl, "_blank");
        messageApi.success("已复制开源仓库地址");
      },
    },
    {
      icon: <GlobalOutlined />,
      label: "开发者的哔哩哔哩主页",
      onClick: () => {
        navigator.clipboard.writeText(bilibiliUrl);
        window.open(bilibiliUrl, "_blank");
        messageApi.success("已复制哔哩哔哩主页地址");
      },
    },
  ];

  return (
    <React.Fragment>
      {contextHolder}
      <div className={styles.contentSection}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 应用信息 */}
          <Card size="small" title="应用信息" style={{ flex: "0 0 auto" }}>
            <div className={styles.aboutSection}>
              <div className={styles.appInfo}>
                <div className={styles.appLogo}>
                  <img
                    src={logo}
                    alt="logo"
                    style={{ width: 48, height: 48, borderRadius: 8 }}
                  />
                </div>
                <div className={styles.appDetails}>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    无限便签 InfinityNote
                  </div>
                  <Text type="secondary">版本 2.0.0</Text>
                  <Text style={{ display: "block", marginTop: 8 }}>
                    一款支持无限画布、AI智能、便签链接与多种整理方式的现代化便签应用。
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* 快捷入口 */}
          <Card size="small" title="快捷入口" style={{ flex: "0 0 auto" }}>
            <div className={styles.featureList}>
              {featureItems.map((item, idx) => (
                <div
                  key={idx}
                  className={styles.featureItem}
                  onClick={
                    typeof item.onClick === "function"
                      ? item.onClick
                      : undefined
                  }
                  style={
                    typeof item.onClick === "function"
                      ? { cursor: "pointer" }
                      : {}
                  }
                >
                  <span className={styles.featureIcon}>{item.icon}</span>
                  <span>{item.label}</span>
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
              <Button
                type="primary"
                onClick={() => messageApi.info("该功能即将上线")}
              >
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
              <Switch onClick={() => messageApi.info("该功能即将上线")} />
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
    </React.Fragment>
  );
};

export default AboutSettingsTab;
