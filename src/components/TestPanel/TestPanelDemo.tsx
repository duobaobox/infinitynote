/**
 * 测试面板演示组件
 * 用于测试测试面板的功能
 */

import React from "react";
import { Button, Space, message } from "antd";
import { useTestPanelStore } from "../../store/testPanelStore";

export const TestPanelDemo: React.FC = () => {
  const { addRequest, addResponse, addGeneration, toggleVisibility } =
    useTestPanelStore();

  const handleTestRequest = () => {
    const mockRequest = {
      id: `req_${Date.now()}`,
      timestamp: Date.now(),
      provider: "zhipu",
      model: "glm-4",
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer ***",
      },
      body: JSON.stringify(
        {
          model: "glm-4",
          messages: [{ role: "user", content: "写一首关于春天的诗" }],
          stream: true,
        },
        null,
        2
      ),
      prompt: "写一首关于春天的诗",
      noteId: "test_note_12345678",
      requestSize: 256,
      userAgent: navigator.userAgent,
      sessionId: `session_test_${Date.now()}`,
    };

    addRequest(mockRequest);

    // 模拟响应
    setTimeout(() => {
      const mockResponse = {
        id: `res_${Date.now()}`,
        requestId: mockRequest.id,
        timestamp: Date.now(),
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/event-stream" },
        body: 'data: {"choices":[{"delta":{"content":"春风轻拂"}}]}\n\ndata: [DONE]',
        duration: 1250,
        success: true,
        responseSize: 1024,
        firstByteTime: 180,
        totalTokens: 45,
        promptTokens: 12,
        completionTokens: 33,
      };

      addResponse(mockResponse);

      // 模拟生成完成
      setTimeout(() => {
        const mockGeneration = {
          id: `gen_${Date.now()}`,
          requestId: mockRequest.id,
          noteId: mockRequest.noteId,
          timestamp: Date.now(),
          finalContent:
            "<p>春风轻拂柳絮飞，<br>桃花满树笑微微。<br>鸟儿枝头唱新曲，<br>万物复苏展生机。</p>",
          hasThinkingChain: false,
          aiData: {
            provider: "zhipu",
            model: "glm-4",
            generated: true,
            generatedAt: new Date().toISOString(),
            prompt: "写一首关于春天的诗",
          },
          totalGenerationTime: 1500,
          contentLength: 31,
          wordCount: 16,
          streamingSteps: 8,
          errorCount: 0,
          retryCount: 0,
          performance: {
            ttfb: 180,
            streamingRate: 20.67,
            avgChunkSize: 128,
          },
        };

        addGeneration(mockGeneration);
        message.success("模拟AI生成完成");
      }, 800);
    }, 400);

    message.info("开始模拟AI生成");
  };

  return (
    <div style={{ padding: 16 }}>
      <Space>
        <Button type="primary" onClick={toggleVisibility}>
          打开/关闭测试面板
        </Button>
        <Button onClick={handleTestRequest}>模拟AI生成</Button>
      </Space>
    </div>
  );
};
