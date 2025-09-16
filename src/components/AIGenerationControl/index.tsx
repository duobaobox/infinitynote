/**
 * AI 生成控制组件
 * 用于触发AI内容生成、配置生成参数和处理生成流程
 */

import { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  Modal,
  Input,
  Slider,
  Switch,
  Button,
  Space,
  Form,
  App,
  Divider,
  Typography,
  Tooltip,
  Card,
} from "antd";
import {
  RobotOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  StopOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { aiService, securityManager } from "../../services/aiService";
import type { AIGenerationOptions } from "../../types/ai";
import { AIGenerationStatus } from "../AIGenerationStatus/index.tsx";
import styles from "./index.module.css";

const { TextArea } = Input;
const { Text } = Typography;

export interface AIGenerationControlProps {
  /** 目标便签ID */
  noteId: string;
  /** 是否显示模态框 */
  visible: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 生成完成回调 */
  onComplete?: (content: string, aiData: any) => void;
  /** 生成错误回调 */
  onError?: (error: Error) => void;
}

interface GenerationState {
  status: "idle" | "generating" | "completed" | "error" | "paused";
  content: string;
  progress: number;
  error: string | null;
  thinkingSteps: Array<{
    id: string;
    content: string;
    timestamp: number;
  }>;
  startTime: number | null;
}

/**
 * AI 生成控制组件
 */
export const AIGenerationControl = memo<AIGenerationControlProps>(
  ({ noteId, visible, onClose, onComplete, onError }) => {
    const { message, modal } = App.useApp();
    const [form] = Form.useForm();
    const abortControllerRef = useRef<AbortController | null>(null);

    // 获取AI设置
    const aiSettings = aiService.getSettings();

    // 生成状态
    const [generationState, setGenerationState] = useState<GenerationState>({
      status: "idle",
      content: "",
      progress: 0,
      error: null,
      thinkingSteps: [],
      startTime: null,
    });

    // 生成参数
    const [generationParams, setGenerationParams] = useState({
      prompt: "",
      model: aiSettings.defaultModel,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      showThinking: aiSettings.showThinking,
    });

    // 预设提示词
    const promptTemplates = [
      {
        key: "summary",
        label: "📄 内容总结",
        prompt: "请帮我总结这个主题的关键要点，要求条理清晰、重点突出。",
      },
      {
        key: "expand",
        label: "🔍 深度展开",
        prompt: "请围绕这个话题进行深入分析和展开，提供详细的观点和例子。",
      },
      {
        key: "creative",
        label: "💡 创意思考",
        prompt: "请用创意的角度来思考这个主题，提供新颖独特的见解和想法。",
      },
      {
        key: "steps",
        label: "📋 行动清单",
        prompt: "请帮我制定关于这个主题的具体行动步骤和实施计划。",
      },
      {
        key: "qa",
        label: "❓ 问答形式",
        prompt: "请用问答的形式来整理这个主题的核心信息和常见疑问。",
      },
    ];

    // 组件卸载时清理
    useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      };
    }, []);

    // 重置生成状态
    const resetGenerationState = useCallback(() => {
      setGenerationState({
        status: "idle",
        content: "",
        progress: 0,
        error: null,
        thinkingSteps: [],
        startTime: null,
      });
    }, []);

    // 开始生成
    const startGeneration = useCallback(async () => {
      if (!generationParams.prompt.trim()) {
        message.warning("请输入提示词");
        return;
      }

      // 检查API密钥是否已配置（使用securityManager检查实际存储）
      const apiKey = securityManager.getAPIKey(aiSettings.provider);
      if (!apiKey) {
        message.error("请先配置AI服务的API密钥");
        return;
      }

      // 创建取消控制器
      abortControllerRef.current = new AbortController();

      setGenerationState((prev) => ({
        ...prev,
        status: "generating",
        content: "",
        progress: 0,
        error: null,
        startTime: Date.now(),
        thinkingSteps: [],
      }));

      try {
        const options: AIGenerationOptions = {
          noteId,
          prompt: generationParams.prompt,
          model: generationParams.model,
          temperature: generationParams.temperature,
          maxTokens: generationParams.maxTokens,

          // 流式更新回调
          onStream: (content: string) => {
            setGenerationState((prev) => ({
              ...prev,
              content,
              progress: Math.min(90, prev.progress + 5), // 渐进式增长到90%
            }));
          },

          // 完成回调
          onComplete: (finalContent: string, aiData: any) => {
            setGenerationState((prev) => ({
              ...prev,
              status: "completed",
              content: finalContent,
              progress: 100,
            }));

            onComplete?.(finalContent, aiData);
            message.success("AI内容生成完成！");
          },

          // 错误回调
          onError: (error: Error) => {
            setGenerationState((prev) => ({
              ...prev,
              status: "error",
              error: error.message,
              progress: 0,
            }));

            onError?.(error);
            message.error("AI生成失败：" + error.message);
          },
        };

        await aiService.generateNote(options);
      } catch (error) {
        console.error("AI生成失败:", error);
        setGenerationState((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "未知错误",
          progress: 0,
        }));
      }
    }, [generationParams, aiSettings, noteId, onComplete, onError]);

    // 停止生成
    const stopGeneration = useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setGenerationState((prev) => ({
        ...prev,
        status: "idle",
        progress: 0,
      }));

      message.info("AI生成已停止");
    }, []);

    // 重试生成
    const retryGeneration = useCallback(() => {
      resetGenerationState();
      setTimeout(startGeneration, 100);
    }, [resetGenerationState, startGeneration]);

    // 应用模板
    const applyTemplate = useCallback(
      (template: (typeof promptTemplates)[0]) => {
        setGenerationParams((prev) => ({
          ...prev,
          prompt: template.prompt,
        }));
        form.setFieldValue("prompt", template.prompt);
      },
      [form]
    );

    // 处理模态框关闭
    const handleClose = useCallback(() => {
      if (generationState.status === "generating") {
        modal.confirm({
          title: "确认关闭",
          content: "AI正在生成内容，关闭将停止生成。确定要关闭吗？",
          onOk: () => {
            stopGeneration();
            resetGenerationState();
            onClose();
          },
        });
      } else {
        resetGenerationState();
        onClose();
      }
    }, [
      generationState.status,
      stopGeneration,
      resetGenerationState,
      onClose,
      modal,
    ]);

    return (
      <Modal
        title={
          <Space>
            <RobotOutlined />
            <span>AI 内容生成</span>
            <Text type="secondary">
              ({aiSettings.provider} / {generationParams.model})
            </Text>
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={800}
        destroyOnClose
      >
        <div>
          {/* AI生成状态显示 */}
          <AIGenerationStatus
            status={generationState.status}
            content={generationState.content}
            progress={generationState.progress}
            error={generationState.error || undefined}
            showThinking={generationParams.showThinking}
            thinkingSteps={generationState.thinkingSteps}
            model={generationParams.model}
            provider={aiSettings.provider}
            startTime={generationState.startTime || undefined}
            onStop={stopGeneration}
            onRetry={retryGeneration}
            onClose={resetGenerationState}
          />

          {/* 配置表单 */}
          <Card
            title={
              <>
                <SettingOutlined /> 生成配置
              </>
            }
            size="small"
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={generationParams}
              onValuesChange={(changedValues) => {
                setGenerationParams((prev) => ({
                  ...prev,
                  ...changedValues,
                }));
              }}
            >
              {/* 提示词输入 */}
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined />
                    提示词
                    <Tooltip title="告诉AI你想要生成什么样的内容">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="prompt"
                rules={[{ required: true, message: "请输入提示词" }]}
              >
                <TextArea
                  rows={3}
                  placeholder="请输入你想要AI生成的内容描述..."
                  disabled={generationState.status === "generating"}
                />
              </Form.Item>

              {/* 快速模板 */}
              <Form.Item
                label={
                  <>
                    <BulbOutlined /> 快速模板
                  </>
                }
              >
                <div className={styles.templateGrid}>
                  {promptTemplates.map((template) => (
                    <Button
                      key={template.key}
                      size="small"
                      onClick={() => applyTemplate(template)}
                      className={styles.templateButton}
                      disabled={generationState.status === "generating"}
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </Form.Item>

              <Divider />

              {/* 高级参数 */}
              <div className={styles.advancedParams}>
                <Form.Item
                  label={
                    <Space>
                      <ThunderboltOutlined />
                      温度参数
                      <Tooltip title="控制生成内容的创意性，值越高越有创意">
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  name="temperature"
                >
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    marks={{
                      0: "精确",
                      0.5: "平衡",
                      1: "创意",
                    }}
                    disabled={generationState.status === "generating"}
                  />
                </Form.Item>

                <Form.Item label="最大生成长度" name="maxTokens">
                  <Slider
                    min={500}
                    max={8000}
                    step={500}
                    marks={{
                      500: "简短",
                      2000: "中等",
                      4000: "详细",
                      8000: "完整",
                    }}
                    disabled={generationState.status === "generating"}
                  />
                </Form.Item>

                <Form.Item name="showThinking" valuePropName="checked">
                  <div className={styles.switchItem}>
                    <Switch
                      disabled={generationState.status === "generating"}
                    />
                    <span>显示AI思维过程</span>
                  </div>
                </Form.Item>
              </div>

              {/* 操作按钮 */}
              <Form.Item>
                <Space className={styles.actionButtons}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={startGeneration}
                    disabled={generationState.status === "generating"}
                    loading={generationState.status === "generating"}
                  >
                    {generationState.status === "generating"
                      ? "生成中..."
                      : "开始生成"}
                  </Button>

                  {generationState.status === "generating" && (
                    <Button
                      danger
                      size="large"
                      icon={<StopOutlined />}
                      onClick={stopGeneration}
                    >
                      停止生成
                    </Button>
                  )}

                  <Button size="large" onClick={handleClose}>
                    关闭
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Modal>
    );
  }
);

AIGenerationControl.displayName = "AIGenerationControl";

export default AIGenerationControl;
