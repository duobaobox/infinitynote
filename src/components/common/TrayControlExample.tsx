/**
 * 系统托盘控制示例组件
 * 演示如何在 React 组件中使用系统托盘功能
 */

import React, { useState, useEffect } from "react";
import { Button, Space, Input, Card, Typography, message } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  InfoCircleOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import {
  showWindow,
  hideToTray,
  updateTrayTooltip,
  isElectron,
  getAppVersion,
  getPlatform,
} from "../../utils/trayUtils";

const { Title, Text, Paragraph } = Typography;

const TrayControlExample: React.FC = () => {
  const [isElectronEnv, setIsElectronEnv] = useState(false);
  const [tooltipText, setTooltipText] = useState("无限便签");
  const [appInfo, setAppInfo] = useState({ version: "", platform: "" });

  useEffect(() => {
    const checkEnvironment = async () => {
      const electronEnv = isElectron();
      setIsElectronEnv(electronEnv);

      if (electronEnv) {
        const version = await getAppVersion();
        const platform = await getPlatform();
        setAppInfo({ version, platform });
      }
    };

    checkEnvironment();
  }, []);

  const handleShowWindow = async () => {
    try {
      await showWindow();
      message.success("窗口已显示");
    } catch (error) {
      message.error("显示窗口失败");
      console.error(error);
    }
  };

  const handleHideToTray = async () => {
    try {
      await hideToTray();
      message.info("已最小化到系统托盘");
    } catch (error) {
      message.error("隐藏窗口失败");
      console.error(error);
    }
  };

  const handleUpdateTooltip = async () => {
    try {
      await updateTrayTooltip(tooltipText);
      message.success("托盘提示已更新");
    } catch (error) {
      message.error("更新托盘提示失败");
      console.error(error);
    }
  };

  if (!isElectronEnv) {
    return (
      <Card>
        <Paragraph type="warning">
          ⚠️ 系统托盘功能仅在 Electron 桌面应用中可用。
          <br />
          请使用 <code>npm run electron:dev</code> 启动桌面应用查看此功能。
        </Paragraph>
      </Card>
    );
  }

  return (
    <Card
      title="系统托盘控制"
      extra={
        <Space>
          <InfoCircleOutlined />
          <Text type="secondary">
            版本: {appInfo.version} | 平台: {appInfo.platform}
          </Text>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* 窗口控制 */}
        <div>
          <Title level={5}>窗口控制</Title>
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handleShowWindow}
            >
              显示窗口
            </Button>
            <Button icon={<EyeInvisibleOutlined />} onClick={handleHideToTray}>
              隐藏到托盘
            </Button>
          </Space>
          <Paragraph type="secondary" style={{ marginTop: 8 }}>
            点击"隐藏到托盘"将窗口最小化到系统托盘。
            双击托盘图标或使用托盘菜单可以重新显示窗口。
          </Paragraph>
        </div>

        {/* 托盘提示 */}
        <div>
          <Title level={5}>托盘提示文字</Title>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={tooltipText}
              onChange={(e) => setTooltipText(e.target.value)}
              placeholder="输入托盘提示文字"
              onPressEnter={handleUpdateTooltip}
            />
            <Button type="primary" onClick={handleUpdateTooltip}>
              更新提示
            </Button>
          </Space.Compact>
          <Paragraph type="secondary" style={{ marginTop: 8 }}>
            鼠标悬停在系统托盘图标上时会显示此提示文字。
          </Paragraph>
        </div>

        {/* 使用说明 */}
        <div>
          <Title level={5}>功能说明</Title>
          <ul style={{ paddingLeft: 20 }}>
            <li>
              <Text strong>托盘图标：</Text>
              应用启动后会在系统托盘显示图标
            </li>
            <li>
              <Text strong>右键菜单：</Text>
              右键点击托盘图标查看更多选项
            </li>
            <li>
              <Text strong>关闭窗口：</Text>
              点击窗口关闭按钮会最小化到托盘，不会退出应用
            </li>
            <li>
              <Text strong>完全退出：</Text>
              使用托盘菜单中的"退出"选项完全关闭应用
            </li>
            <li>
              <Text strong>快速显示：</Text>
              {appInfo.platform === "darwin"
                ? "单击托盘图标显示窗口"
                : "双击托盘图标显示窗口"}
            </li>
          </ul>
        </div>

        {/* 开发者信息 */}
        <Card size="small" type="inner" title="开发者信息">
          <Paragraph>
            <Text code>window.electronAPI.tray.show()</Text> - 显示窗口
            <br />
            <Text code>window.electronAPI.tray.hide()</Text> - 隐藏窗口
            <br />
            <Text code>window.electronAPI.tray.updateTooltip(text)</Text> -
            更新提示
          </Paragraph>
          <Button
            type="link"
            icon={<ExportOutlined />}
            href="docs/SYSTEM_TRAY_GUIDE.md"
            target="_blank"
          >
            查看完整文档
          </Button>
        </Card>
      </Space>
    </Card>
  );
};

export default TrayControlExample;
