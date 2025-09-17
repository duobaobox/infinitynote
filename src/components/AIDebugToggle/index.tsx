/**
 * AI调试面板快捷开关组件
 * 提供快速开启调试面板的按钮
 */

import React from "react";
import { BugFilled } from "@ant-design/icons";
import { FloatButton, Badge } from "antd";
import { useAIDebugStore } from "../../store/aiDebugStore";

export const AIDebugToggle: React.FC = () => {
  const { visible, toggleVisible, sessions } = useAIDebugStore();

  // 计算活跃会话数
  const activeSessionsCount = sessions.filter(
    (s) => s.status === "streaming"
  ).length;
  const errorSessionsCount = sessions.filter(
    (s) => s.status === "error"
  ).length;

  return (
    <Badge
      count={activeSessionsCount + errorSessionsCount}
      size="small"
      offset={[-8, 8]}
    >
      <FloatButton
        icon={<BugFilled />}
        type={visible ? "primary" : "default"}
        onClick={toggleVisible}
        tooltip="AI调试面板 (Ctrl+Shift+D)"
        style={{
          bottom: 80,
          right: 24,
          width: 40,
          height: 40,
        }}
      />
    </Badge>
  );
};

export default AIDebugToggle;
