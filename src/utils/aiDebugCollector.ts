/**
 * AI调试数据收集器
 * 负责收集、存储和管理所有AI生成过程中的调试数据
 */

import type {
  AIDebugSession,
  AIDebugEvent,
  AIDebugCollectorConfig,
  AIDebugComparison,
} from "../types/debug";
import type { AIGenerationOptions, AICustomProperties } from "../types/ai";

/**
 * AI调试数据收集器单例
 */
export class AIDebugCollector {
  private static instance: AIDebugCollector;
  private sessions: Map<string, AIDebugSession> = new Map();
  private eventListeners: ((event: AIDebugEvent) => void)[] = [];
  private config: AIDebugCollectorConfig = {
    enabled: true,
    maxSessions: 50,
    collectRawData: true,
    collectThinking: true,
    collectPerformance: true,
  };

  private constructor() {}

  static getInstance(): AIDebugCollector {
    if (!AIDebugCollector.instance) {
      AIDebugCollector.instance = new AIDebugCollector();
    }
    return AIDebugCollector.instance;
  }

  /**
   * 配置收集器
   */
  configure(config: Partial<AIDebugCollectorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("🐛 AI调试收集器配置更新:", this.config);
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: (event: AIDebugEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * 触发调试事件
   */
  private emitEvent(event: AIDebugEvent): void {
    if (!this.config.enabled) return;

    console.log(`🐛 [${event.type}]`, event.data);
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("调试事件监听器错误:", error);
      }
    });
  }

  /**
   * 开始新的AI生成会话
   */
  startSession(options: AIGenerationOptions): string {
    if (!this.config.enabled) return "";

    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const modelName = options.model || "unknown";
    console.log(
      `🐛 [DEBUG] 开始AI会话: ${sessionId}, 模型: ${modelName}, 提示: ${options.prompt.slice(
        0,
        30
      )}...`
    );

    const session: AIDebugSession = {
      sessionId,
      noteId: options.noteId,
      startTime: Date.now(),
      status: "pending",
      request: {
        provider: "unknown", // 将通过updateSessionProvider更新
        model: modelName,
        prompt: options.prompt,
        options: {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        },
        timestamp: Date.now(),
      },
      streaming: {
        chunks: [],
        currentContent: "",
        currentThinking: [],
      },
      performance: {
        chunkCount: 0,
      },
    };

    this.sessions.set(sessionId, session);

    // 清理旧会话（保持最大数量限制）
    this.cleanupOldSessions();

    this.emitEvent({
      type: "session-start",
      data: {
        sessionId: session.sessionId,
        noteId: session.noteId,
        request: session.request,
      },
    });

    return sessionId;
  }

  /**
   * 更新会话的provider信息
   */
  updateSessionProvider(sessionId: string, provider: string): void {
    if (!this.config.enabled || !sessionId) return;

    const session = this.sessions.get(sessionId);
    if (session) {
      session.request.provider = provider;
      session.status = "streaming";
      console.log(
        `🐛 [DEBUG] 更新会话提供商: ${sessionId} -> ${provider}, 模型: ${session.request.model}`
      );
    } else {
      console.warn(`🐛 [DEBUG] 未找到会话: ${sessionId}`);
    }
  }

  /**
   * 记录流式数据块
   */
  recordStreamChunk(
    sessionId: string,
    rawChunk: any,
    parsedContent: string,
    thinking?: string
  ): void {
    if (!this.config.enabled || !sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const chunk = {
      id: `chunk_${session.streaming.chunks.length + 1}`,
      timestamp: Date.now(),
      raw: this.config.collectRawData
        ? rawChunk
        : { type: "raw_data_disabled" },
      parsedContent,
      thinking,
    };

    session.streaming.chunks.push(chunk);
    session.streaming.currentContent += parsedContent;
    session.performance.chunkCount += 1;

    // 记录首次响应时间
    if (
      !session.performance.timeToFirstByte &&
      session.streaming.chunks.length === 1
    ) {
      session.performance.timeToFirstByte = Date.now() - session.startTime;
    }

    // 处理思维链
    if (thinking && this.config.collectThinking) {
      const thinkingStep = {
        id: `thinking_${session.streaming.currentThinking.length + 1}`,
        content: thinking,
        timestamp: Date.now(),
      };
      session.streaming.currentThinking.push(thinkingStep);

      this.emitEvent({
        type: "thinking-step",
        data: {
          sessionId,
          step: thinkingStep,
        },
      });
    }

    this.emitEvent({
      type: "stream-chunk",
      data: {
        sessionId,
        chunk,
      },
    });
  }

  /**
   * 完成会话
   */
  completeSession(
    sessionId: string,
    finalContent: string,
    aiData: AICustomProperties["ai"]
  ): void {
    if (!this.config.enabled || !sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const now = Date.now();
    session.status = "completed";
    session.endTime = now;

    session.response = {
      raw: this.config.collectRawData ? aiData : { type: "raw_data_disabled" },
      finalContent,
      aiData: aiData || {},
      timestamp: now,
    };

    // 整合思维链数据
    if (aiData?.thinkingChain && this.config.collectThinking) {
      session.thinkingChain = aiData.thinkingChain;
    } else if (session.streaming.currentThinking.length > 0) {
      session.thinkingChain = {
        steps: session.streaming.currentThinking,
        summary: `通过${session.streaming.currentThinking.length}步推理完成`,
        totalSteps: session.streaming.currentThinking.length,
      };
    }

    // 计算性能指标
    if (this.config.collectPerformance) {
      session.performance.totalTime = now - session.startTime;

      // 尝试解析token信息
      if (aiData?.cost) {
        session.performance.tokens = {
          input: aiData.cost.inputTokens || 0,
          output: aiData.cost.outputTokens || 0,
          total:
            (aiData.cost.inputTokens || 0) + (aiData.cost.outputTokens || 0),
        };
      }
    }

    this.emitEvent({
      type: "session-complete",
      data: {
        sessionId,
        response: session.response,
        performance: session.performance,
      },
    });
  }

  /**
   * 记录会话错误
   */
  recordError(
    sessionId: string,
    error: Error,
    context: Record<string, any> = {}
  ): void {
    if (!this.config.enabled || !sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = "error";
    session.endTime = Date.now();
    session.error = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
    };

    if (this.config.collectPerformance) {
      session.performance.totalTime = Date.now() - session.startTime;
    }

    this.emitEvent({
      type: "session-error",
      data: {
        sessionId,
        error: session.error,
      },
    });
  }

  /**
   * 取消会话
   */
  cancelSession(sessionId: string): void {
    if (!this.config.enabled || !sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = "cancelled";
    session.endTime = Date.now();

    if (this.config.collectPerformance) {
      session.performance.totalTime = Date.now() - session.startTime;
    }

    this.emitEvent({
      type: "session-cancelled",
      data: { sessionId },
    });
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): AIDebugSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.startTime - a.startTime
    );
  }

  /**
   * 获取特定会话
   */
  getSession(sessionId: string): AIDebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 生成内容对比分析
   */
  generateComparison(
    sessionId: string,
    displayedContent: string
  ): AIDebugComparison | null {
    const session = this.sessions.get(sessionId);
    if (!session?.response) return null;

    const originalMarkdown = session.response.aiData.originalMarkdown || "";
    const processedHTML = session.response.finalContent;

    // 简单的差异分析（可以后续扩展为更复杂的diff算法）
    const differences: AIDebugComparison["differences"] = [];

    if (originalMarkdown !== processedHTML) {
      differences.push({
        type: "modification",
        location: "content",
        original:
          originalMarkdown.substring(0, 100) +
          (originalMarkdown.length > 100 ? "..." : ""),
        processed:
          processedHTML.substring(0, 100) +
          (processedHTML.length > 100 ? "..." : ""),
        description: "Markdown到HTML的转换处理",
      });
    }

    if (processedHTML !== displayedContent) {
      differences.push({
        type: "modification",
        location: "display",
        original:
          processedHTML.substring(0, 100) +
          (processedHTML.length > 100 ? "..." : ""),
        processed:
          displayedContent.substring(0, 100) +
          (displayedContent.length > 100 ? "..." : ""),
        description: "最终显示内容与处理后内容的差异",
      });
    }

    return {
      originalMarkdown,
      processedHTML,
      displayedContent,
      differences,
    };
  }

  /**
   * 清空所有调试数据
   */
  clearAllData(): void {
    this.sessions.clear();
    console.log("🐛 所有AI调试数据已清空");
  }

  /**
   * 导出调试数据
   */
  exportData(): string {
    const data = {
      exportTime: new Date().toISOString(),
      config: this.config,
      sessions: this.getAllSessions(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 清理旧会话
   */
  private cleanupOldSessions(): void {
    const sessions = Array.from(this.sessions.entries()).sort(
      ([, a], [, b]) => b.startTime - a.startTime
    );

    if (sessions.length > this.config.maxSessions) {
      const toRemove = sessions.slice(this.config.maxSessions);
      toRemove.forEach(([sessionId]) => {
        this.sessions.delete(sessionId);
      });

      console.log(`🐛 清理了 ${toRemove.length} 个旧的调试会话`);
    }
  }
}

// 导出单例实例
export const aiDebugCollector = AIDebugCollector.getInstance();

// 在开发环境下暴露到全局，便于调试
if (typeof window !== "undefined") {
  (window as any).aiDebugCollector = aiDebugCollector;
  console.log("🐛 AI调试收集器已暴露到全局");
}
