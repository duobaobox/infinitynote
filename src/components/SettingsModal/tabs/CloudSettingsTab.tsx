import React, { useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
  Divider,
  Alert,
} from "antd";
import type { CloudSettings } from "../types";
import styles from "../index.module.css";
import { WebDavSyncService } from "../../../services/sync";
import { CloudSyncStatus } from "../components/CloudSyncStatus";

const { Text } = Typography;

export interface CloudSettingsTabProps {
  settings: CloudSettings;
}

// 本地存储键
const STORAGE_KEY = "infinitynote-webdav-config";

type WebDavForm = {
  baseUrl: string;
  username: string;
  password: string;
  remoteDir: string;
  filename?: string;
};

const loadConfig = (): Partial<WebDavForm> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveConfig = (cfg: WebDavForm) => {
  try {
    // 提示：生产中应对敏感信息加密存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
};

const CloudSettingsTab: React.FC<CloudSettingsTabProps> = () => {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<WebDavForm>();
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [lastResult, setLastResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const isElectron =
    typeof window !== "undefined" && (window as any).isElectron === true;

  // 初始化表单
  const initial = useMemo<Partial<WebDavForm>>(() => loadConfig(), []);

  const buildService = () => {
    const cfg = form.getFieldsValue();
    return new WebDavSyncService({
      baseUrl: cfg.baseUrl?.trim() || "",
      username: cfg.username?.trim() || "",
      password: cfg.password || "",
      remoteDir: cfg.remoteDir?.trim() || "/InfinityNote",
      filename: (cfg.filename || "infinitynote-full.json").trim(),
    });
  };

  const onTest = async () => {
    try {
      await form.validateFields();
      setTesting(true);
      const svc = buildService();
      const r = await svc.testConnection();
      if (r.success) {
        setLastResult({ type: "success", text: "连接成功，目录可用" });
        message.success("连接成功");
        // 广播并持久化状态
        const payload = {
          state: "connected" as const,
          message: r.message || "连接成功",
        };
        try {
          localStorage.setItem(
            "infinitynote-webdav-last-status",
            JSON.stringify(payload)
          );
        } catch {}
        window.dispatchEvent(
          new CustomEvent("cloudSyncStatus", { detail: payload })
        );
      } else {
        setLastResult({ type: "error", text: r.message || "连接失败" });
        message.error(r.message || "连接失败");
        const payload = {
          state: "disconnected" as const,
          message: r.message || "连接失败",
        };
        try {
          localStorage.setItem(
            "infinitynote-webdav-last-status",
            JSON.stringify(payload)
          );
        } catch {}
        window.dispatchEvent(
          new CustomEvent("cloudSyncStatus", { detail: payload })
        );
      }
    } catch (e: any) {
      setLastResult({ type: "error", text: e?.message || String(e) });
      message.error(e?.message || "连接测试异常");
      const payload = {
        state: "disconnected" as const,
        message: e?.message || "连接测试异常",
      };
      try {
        localStorage.setItem(
          "infinitynote-webdav-last-status",
          JSON.stringify(payload)
        );
      } catch {}
      window.dispatchEvent(
        new CustomEvent("cloudSyncStatus", { detail: payload })
      );
    } finally {
      setTesting(false);
    }
  };

  const onPush = async () => {
    try {
      await form.validateFields();
      setPushing(true);
      const svc = buildService();
      const r = await svc.pushFull();
      if (r.success) {
        setLastResult({ type: "success", text: "上传成功" });
        message.success("上传成功");
        // 记录并广播最近一次备份时间
        const at = new Date().toISOString();
        try {
          localStorage.setItem("infinitynote-webdav-last-backup-time", at);
        } catch {}
        window.dispatchEvent(
          new CustomEvent("cloudSyncBackup", { detail: { at } })
        );
      } else {
        setLastResult({ type: "error", text: r.message || "上传失败" });
        message.error(r.message || "上传失败");
      }
    } catch (e: any) {
      setLastResult({ type: "error", text: e?.message || String(e) });
      message.error(e?.message || "上传异常");
    } finally {
      setPushing(false);
    }
  };

  const onPull = async () => {
    await form.validateFields();
    modal.confirm({
      title: "确认从云端恢复？",
      content: "此操作将覆盖本地所有数据，请确保已备份。",
      okText: "确定恢复",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          setPulling(true);
          const svc = buildService();
          const r = await svc.pullFull();
          if (r.success) {
            setLastResult({
              type: "success",
              text: "下载并导入成功，将刷新页面",
            });
            message.success("导入成功，页面即将刷新");
            setTimeout(() => window.location.reload(), 800);
          } else {
            setLastResult({ type: "error", text: r.message || "导入失败" });
            message.error(r.message || "导入失败");
          }
        } catch (e: any) {
          setLastResult({ type: "error", text: e?.message || String(e) });
          message.error(e?.message || "导入异常");
        } finally {
          setPulling(false);
        }
      },
    });
  };

  const onSave = async () => {
    const values = await form.validateFields();
    saveConfig(values);
    message.success("配置已保存");
  };

  return (
    <div className={styles.contentSection}>
      {!isElectron && (
        <div style={{ marginBottom: 12 }}>
          <Alert
            type="warning"
            showIcon
            message="当前在浏览器预览环境，无法使用 WebDAV"
            description="请在客户端使用！"
          />
        </div>
      )}
      <CloudSyncStatus />
      <Card size="small" title="WebDAV 云同步设置">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            baseUrl: initial.baseUrl || "",
            username: initial.username || "",
            password: initial.password || "",
            remoteDir: initial.remoteDir || "/InfinityNote",
            filename: initial.filename || "infinitynote-full.json",
          }}
          onValuesChange={(_, all) => {
            // 自动保存（非敏感场景可考虑关闭自动）
            try {
              saveConfig(all as WebDavForm);
            } catch {}
          }}
        >
          <Form.Item
            label="WebDAV 基础地址"
            name="baseUrl"
            rules={[{ required: true, message: "请输入 WebDAV 基础地址" }]}
            extra="例如：https://dav.example.com/remote.php/dav/files/youruser"
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码/令牌"
            name="password"
            rules={[{ required: true, message: "请输入密码或访问令牌" }]}
          >
            <Input.Password
              placeholder="密码或应用令牌"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item
            label="远端目录"
            name="remoteDir"
            extra="默认 /InfinityNote，将自动创建"
          >
            <Input placeholder="/InfinityNote" />
          </Form.Item>
          <Form.Item label="文件名" name="filename" extra="单文件全量备份名">
            <Input placeholder="infinitynote-full.json" />
          </Form.Item>

          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Text type="secondary">上次备份时间：</Text>
                <Text>
                  {(() => {
                    try {
                      const last = localStorage.getItem(
                        "infinitynote-webdav-last-backup-time"
                      );
                      if (!last) return "无";
                      const d = new Date(last);
                      if (Number.isNaN(d.getTime())) return "无";
                      return d.toLocaleString("zh-CN", { hour12: false });
                    } catch {
                      return "无";
                    }
                  })()}
                </Text>
              </div>
            </div>
            <Space wrap>
              <Button onClick={onSave}>保存配置</Button>
              <Button
                type="primary"
                loading={testing}
                onClick={onTest}
                disabled={!isElectron}
              >
                测试连接
              </Button>
              <Divider type="vertical" />
              <Button loading={pushing} onClick={onPush} disabled={!isElectron}>
                上传全量备份
              </Button>
              <Button
                danger
                loading={pulling}
                onClick={onPull}
                disabled={!isElectron}
              >
                从云端恢复
              </Button>
            </Space>
          </Space>
        </Form>
        {lastResult && (
          <div style={{ marginTop: 12 }}>
            {lastResult.type === "success" ? (
              <Alert type="success" message={lastResult.text} showIcon />
            ) : (
              <Alert type="error" message={lastResult.text} showIcon />
            )}
          </div>
        )}
        <Divider />
        <Text type="secondary">
          提示：当前webdav同步功能为
          最小可用版（手动全量备份/恢复）。后续将支持增量双向同步与冲突合并。
        </Text>
      </Card>
    </div>
  );
};

export default CloudSettingsTab;
