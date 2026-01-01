/**
 * 自定义提供商配置表单组件
 * 用于添加/编辑 OpenAI 兼容的第三方 AI 提供商
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  App,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../theme";
import type { CustomProviderConfig } from "../../../services/ai/CustomProvider";
import { aiService } from "../../../services/aiService";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export interface CustomProviderFormProps {
  /** 是否打开模态框 */
  open: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 保存成功回调 */
  onSaved?: () => void;
  /** 编辑模式：传入现有配置 */
  editConfig?: CustomProviderConfig;
}

/**
 * 自定义提供商配置表单
 */
export const CustomProviderForm: React.FC<CustomProviderFormProps> = ({
  open,
  onClose,
  onSaved,
  editConfig,
}) => {
  const { message } = App.useApp();
  const { isDark } = useTheme();
  const [form] = Form.useForm();

  // 状态
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const isEditMode = !!editConfig;

  // 初始化表单
  useEffect(() => {
    if (open) {
      if (editConfig) {
        form.setFieldsValue({
          name: editConfig.name,
          baseUrl: editConfig.baseUrl,
          apiKey: editConfig.apiKey || "",
          models: editConfig.models.join("\n"),
          defaultModel: editConfig.defaultModel,
        });
      } else {
        form.resetFields();
      }
      setTestStatus("idle");
    }
  }, [open, editConfig, form]);

  // 生成唯一 ID
  const generateId = useCallback(() => {
    return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 解析模型列表
  const parseModels = (modelsText: string): string[] => {
    return modelsText
      .split(/[\n,]/)
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
  };

  // 测试连接
  const handleTest = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setIsTesting(true);
      setTestStatus("idle");

      const baseUrl = values.baseUrl.trim().replace(/\/+$/, "");
      const apiKey = values.apiKey?.trim() || "";
      const models = parseModels(values.models);
      const model = values.defaultModel?.trim() || models[0] || "gpt-3.5-turbo";

      // 构建测试请求 - 智能拼接 URL
      let testEndpoint = baseUrl;
      
      // 如果已经包含 /chat/completions，不做处理
      if (!testEndpoint.includes("/chat/completions")) {
        // 检查是否已有版本路径（如 /v1, /v4 等）
        if (/\/v\d+$/.test(testEndpoint)) {
          // 已有版本路径，只添加 /chat/completions
          testEndpoint += "/chat/completions";
        } else {
          // 没有版本路径，添加完整的 /v1/chat/completions
          testEndpoint += "/v1/chat/completions";
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(testEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 10,
          stream: false,
        }),
      });

      if (response.ok) {
        setTestStatus("success");
        message.success("🎉 连接测试成功！");
      } else {
        const errorText = await response.text();
        setTestStatus("error");
        message.error(`❌ 连接失败: ${response.status} ${errorText.slice(0, 100)}`);
      }
    } catch (error) {
      setTestStatus("error");
      message.error(
        `❌ 连接失败: ${error instanceof Error ? error.message : "网络错误"}`
      );
    } finally {
      setIsTesting(false);
    }
  }, [form, message]);

  // 保存配置
  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      const models = parseModels(values.models);

      const config: CustomProviderConfig = {
        id: editConfig?.id || generateId(),
        name: values.name.trim(),
        baseUrl: values.baseUrl.trim().replace(/\/+$/, ""),
        apiKey: values.apiKey?.trim() || undefined,
        models,
        defaultModel: values.defaultModel?.trim() || models[0] || "",
        createdAt: editConfig?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await aiService.saveCustomProvider(config);

      message.success(isEditMode ? "✅ 配置已更新" : "✅ 自定义提供商已添加");
      onSaved?.();
      onClose();
    } catch (error) {
      message.error(
        `❌ 保存失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsSaving(false);
    }
  }, [form, editConfig, generateId, isEditMode, message, onSaved, onClose]);

  // 删除配置
  const handleDelete = useCallback(async () => {
    if (!editConfig) return;

    try {
      await aiService.deleteCustomProvider(editConfig.id);
      message.success("✅ 自定义提供商已删除");
      onSaved?.();
      onClose();
    } catch (error) {
      message.error(
        `❌ 删除失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }, [editConfig, message, onSaved, onClose]);

  return (
    <Modal
      title={isEditMode ? "编辑自定义供应商" : "添加自定义供应商"}
      open={open}
      onCancel={onClose}
      width={680}
      centered
      styles={{
        body: {
          maxHeight: "60vh",
          overflowY: "auto",
        },
      }}
      footer={
        <Space style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {isEditMode && (
              <Popconfirm
                title="确定要删除此供应商吗？"
                description="删除后无法恢复"
                onConfirm={handleDelete}
                okText="确定删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button onClick={handleTest} loading={isTesting}>
              测试连接
            </Button>
            <Button type="primary" onClick={handleSave} loading={isSaving}>
              {isEditMode ? "保存更改" : "添加供应商"}
            </Button>
          </Space>
        </Space>
      }
    >
      <Paragraph
        type="secondary"
        style={{ marginBottom: 12, fontSize: "13px" }}
      >
        添加支持 OpenAI 兼容 API 的第三方服务（如 LMStudio、Ollama、自建服务等）
      </Paragraph>

      <div
        style={{
          padding: "10px 12px",
          marginBottom: 16,
          background: isDark ? "#2a2a1a" : "#fffbe6",
          border: `1px solid ${isDark ? "#5a5a3a" : "#ffe58f"}`,
          borderRadius: "6px",
          fontSize: "12px",
        }}
      >
        <Space align="start">
          <ExclamationCircleOutlined style={{ color: "#faad14", marginTop: 2 }} />
          <div>
            <Text strong style={{ color: isDark ? "#fadb14" : "#d48806" }}>
              兼容性说明
            </Text>
            <div style={{ color: isDark ? "#d9d9d9" : "#666", marginTop: 4, lineHeight: 1.6 }}>
              自定义供应商仅支持 <b>OpenAI 兼容格式</b>。由于各厂商 API 差异较大，部分功能可能受限：
              <ul style={{ margin: "4px 0 0 0", paddingLeft: 16 }}>
                <li>思维链功能可能不可用</li>
                <li>需手动输入模型名称</li>
                <li>错误提示可能不够友好</li>
              </ul>
            </div>
          </div>
        </Space>
      </div>

      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="name"
          label="供应商名称"
          rules={[{ required: true, message: "请输入名称" }]}
        >
          <Input placeholder="例如：本地 LMStudio" />
        </Form.Item>

        <Form.Item
          name="baseUrl"
          label="API 地址"
          rules={[
            { required: true, message: "请输入 API 地址" },
            {
              type: "url",
              message: "请输入有效的 URL",
            },
          ]}
          extra="例如：http://localhost:1234 或 https://api.example.com"
        >
          <Input
            placeholder="http://localhost:1234"
            suffix={
              testStatus === "success" ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              ) : testStatus === "error" ? (
                <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              ) : isTesting ? (
                <LoadingOutlined />
              ) : null
            }
          />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label="API 密钥"
          extra="部分本地服务（如 LMStudio）可能不需要密钥"
        >
          <Input.Password placeholder="可选，留空则不发送 Authorization 头" />
        </Form.Item>

        <Divider style={{ margin: "16px 0" }} />

        <Form.Item
          name="models"
          label="支持的模型"
          rules={[{ required: true, message: "请输入至少一个模型名称" }]}
          extra="每行一个模型名称，或用逗号分隔"
        >
          <TextArea
            rows={3}
            placeholder={`gpt-3.5-turbo\ngpt-4\nllama-3.2`}
          />
        </Form.Item>

        <Form.Item
          name="defaultModel"
          label="默认模型"
          extra="留空则使用模型列表中的第一个"
        >
          <Input placeholder="可选，例如：gpt-3.5-turbo" />
        </Form.Item>
      </Form>

      {testStatus === "success" && (
        <div
          style={{
            padding: "8px 12px",
            background: isDark ? "#162312" : "#f6ffed",
            borderRadius: "4px",
            marginTop: "8px",
          }}
        >
          <Text style={{ color: "#52c41a" }}>
            <CheckCircleOutlined /> 连接测试成功，可以保存配置
          </Text>
        </div>
      )}
    </Modal>
  );
};

/**
 * 添加自定义供应商按钮（用于集成到提供商列表）
 */
export const AddCustomProviderButton: React.FC<{
  onAdded?: () => void;
}> = ({ onAdded }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <div
        style={{
          padding: "10px 12px",
          cursor: "pointer",
          borderRadius: "4px",
          marginBottom: "6px",
          border: "1px dashed #8c8c8c",
          textAlign: "center",
        }}
        onClick={() => setIsFormOpen(true)}
      >
        <Space>
          <PlusOutlined />
          <Text type="secondary">添加自定义供应商</Text>
        </Space>
      </div>

      <CustomProviderForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={onAdded}
      />
    </>
  );
};

export default CustomProviderForm;
