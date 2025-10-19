import React, { useEffect, useState } from "react";
import { Typography, Tooltip } from "antd";
import { useTheme } from "../../../theme";

export type CloudConnectionState = "connected" | "disconnected" | "unknown";

/**
 * 云同步连接状态条（紧凑）
 * 与模型状态条视觉风格一致，显示 WebDAV 测试连接结果。
 */
const { Text } = Typography;

export const CloudSyncStatus: React.FC = () => {
  const { isDark } = useTheme();
  const [state, setState] = useState<CloudConnectionState>("unknown");
  const [message, setMessage] = useState<string>("未检测");

  // 从本地持久化结果恢复最近一次测试结果（由 CloudSettingsTab 写入）
  useEffect(() => {
    try {
      const raw = localStorage.getItem("infinitynote-webdav-last-status");
      if (raw) {
        const obj = JSON.parse(raw) as {
          state: CloudConnectionState;
          message?: string;
        };
        setState(obj.state || "unknown");
        setMessage(
          obj.message || (obj.state === "connected" ? "连接正常" : "未连接")
        );
      }
    } catch {}

    // 监听事件以实时更新状态（由 CloudSettingsTab 派发）
    const onStatus = (e: Event) => {
      const { state, message } = (e as CustomEvent).detail as {
        state: CloudConnectionState;
        message?: string;
      };
      setState(state);
      setMessage(
        message ||
          (state === "connected"
            ? "连接正常"
            : state === "disconnected"
            ? "未连接"
            : "未检测")
      );
    };
    window.addEventListener("cloudSyncStatus", onStatus as EventListener);
    return () =>
      window.removeEventListener("cloudSyncStatus", onStatus as EventListener);
  }, []);

  const getStatusInfo = () => {
    switch (state) {
      case "connected":
        return { text: "✅ 已连接", color: "#52c41a" };
      case "disconnected":
        return { text: "❌ 未连接", color: "#ff4d4f" };
      default:
        return { text: "⚠️ 未检测", color: isDark ? "#8c8c8c" : "#bfbfbf" };
    }
  };
  const statusInfo = getStatusInfo();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: 6,
        border: `1px solid ${isDark ? "#303030" : "#f0f0f0"}`,
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: isDark ? "#ddd" : "#333",
          fontWeight: 600,
        }}
      >
        云同步（WebDAV）
      </div>
      <Tooltip title={message} placement="left">
        <Text style={{ fontSize: 12, color: statusInfo.color }}>
          {statusInfo.text}
        </Text>
      </Tooltip>
    </div>
  );
};

export default CloudSyncStatus;
