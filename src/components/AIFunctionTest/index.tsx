/**
 * AI功能测试组件
 * 用于测试AI生成、流式处理和错误处理功能
 */

import { useState, useCallback } from "react";
import { Button, Card, Space, message, Input, Typography } from "antd";
import {
  RobotOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { aiService } from "../../services/aiService";
import { AIGenerationStatus } from "../AIGenerationStatus";
import type { AIGenerationOptions } from "../../types/ai";
import styles from "./index.module.css";

const { TextArea } = Input;
const { Title } = Typography;

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

export const AIFunctionTest = () => {
  const [prompt, setPrompt] = useState("请写一篇关于春天的小诗");
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
    content: "",
    progress: 0,
    error: null,
    thinkingSteps: [],
    startTime: null,
  });

  const startGeneration = useCallback(async () => {
    if (!prompt.trim()) {
      message.warning("请输入提示词");
      return;
    }

    const settings = aiService.getSettingsSync();
    if (!settings.apiKeys?.[settings.provider]) {
      message.error("请先配置AI服务的API密钥");
      return;
    }

    setGenerationState((prev) => ({
      ...prev,
      status: "generating",
      content: "",
      progress: 0,
      error: null,
      startTime: Date.now(),
      thinkingSteps: [],
    }));

    const options: AIGenerationOptions = {
      noteId: "test-note",
      prompt,
      model: settings.defaultModel,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,

      onStream: (content: string) => {
        setGenerationState((prev) => ({
          ...prev,
          content,
          progress: Math.min(90, prev.progress + 5),
        }));
      },

      onComplete: (finalContent: string, aiData: any) => {
        setGenerationState((prev) => ({
          ...prev,
          status: "completed",
          content: finalContent,
          progress: 100,
        }));

        message.success("AI内容生成完成！");
        console.log("生成完成，AI数据:", aiData);
      },

      onError: (error: Error) => {
        setGenerationState((prev) => ({
          ...prev,
          status: "error",
          error: error.message,
          progress: 0,
        }));

        message.error("AI生成失败：" + error.message);
      },
    };

    try {
      await aiService.generateNote(options);
    } catch (error) {
      console.error("AI生成调用失败:", error);
    }
  }, [prompt]);

  const stopGeneration = useCallback(() => {
    setGenerationState((prev) => ({
      ...prev,
      status: "idle",
      progress: 0,
    }));
    message.info("AI生成已停止");
  }, []);

  const resetTest = useCallback(() => {
    setGenerationState({
      status: "idle",
      content: "",
      progress: 0,
      error: null,
      thinkingSteps: [],
      startTime: null,
    });
  }, []);

  return (
    <div className={styles.testContainer}>
      <Card
        title={
          <Space>
            <RobotOutlined />
            <Title level={4} style={{ margin: 0 }}>
              AI功能测试
            </Title>
          </Space>
        }
        className={styles.testCard}
      >
        {/* AI生成状态显示 */}
        <AIGenerationStatus
          status={generationState.status}
          content={generationState.content}
          progress={generationState.progress}
          error={generationState.error || undefined}
          showThinking={true}
          thinkingSteps={generationState.thinkingSteps}
          model={aiService.getSettingsSync().defaultModel}
          provider={aiService.getSettingsSync().provider}
          startTime={generationState.startTime || undefined}
          onStop={stopGeneration}
          onRetry={startGeneration}
          onClose={resetTest}
        />

        {/* 输入区域 */}
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <label>提示词：</label>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="输入你想要AI生成的内容..."
              disabled={generationState.status === "generating"}
            />
          </div>

          {/* 控制按钮 */}
          <Space>
            <Button
              type="primary"
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
              <Button danger icon={<StopOutlined />} onClick={stopGeneration}>
                停止生成
              </Button>
            )}

            <Button onClick={resetTest}>重置测试</Button>
          </Space>

          {/* 结果显示 */}
          {generationState.content && (
            <Card title="生成结果" size="small">
              <div
                dangerouslySetInnerHTML={{ __html: generationState.content }}
                style={{
                  maxHeight: "300px",
                  overflow: "auto",
                  padding: "12px",
                  background: "#f9f9f9",
                  borderRadius: "6px",
                  lineHeight: "1.6",
                }}
              />
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default AIFunctionTest;
