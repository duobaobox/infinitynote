/**
 * AI调试相关类型定义
 */

/**
 * AI调试会话数据
 */
export interface AIDebugSession {
  /** 会话ID */
  sessionId: string;
  /** 便签ID */
  noteId: string;
  /** 开始时间戳 */
  startTime: number;
  /** 结束时间戳 */
  endTime?: number;
  /** 会话状态 */
  status: "pending" | "streaming" | "completed" | "error" | "cancelled";

  /** 请求数据 */
  request: {
    provider: string;
    model: string;
    prompt: string;
    options: Record<string, any>;
    timestamp: number;
  };

  /** 响应数据 */
  response?: {
    /** 完整的原始响应 */
    raw: any;
    /** 最终处理后的内容 */
    finalContent: string;
    /** AI元数据 */
    aiData: Record<string, any>;
    timestamp: number;
  };

  /** 流式数据收集 */
  streaming: {
    /** 所有流式块 */
    chunks: Array<{
      id: string;
      timestamp: number;
      raw: any;
      parsedContent: string;
      thinking?: string;
      error?: string;
    }>;
    /** 当前累计内容 */
    currentContent: string;
    /** 当前累计思维链 */
    currentThinking: Array<{
      id: string;
      content: string;
      timestamp: number;
    }>;
  };

  /** 思维链数据 */
  thinkingChain?: {
    steps: Array<{
      id: string;
      content: string;
      timestamp: number;
    }>;
    summary: string;
    totalSteps: number;
  };

  /** 错误信息 */
  error?: {
    message: string;
    stack?: string;
    timestamp: number;
    context: Record<string, any>;
  };

  /** 性能指标 */
  performance: {
    /** 首次响应时间 */
    timeToFirstByte?: number;
    /** 总响应时间 */
    totalTime?: number;
    /** Token统计 */
    tokens?: {
      input: number;
      output: number;
      total: number;
    };
    /** 流式块数量 */
    chunkCount: number;
  };
}

/**
 * 调试面板状态
 */
export interface AIDebugPanelState {
  /** 面板是否可见 */
  visible: boolean;
  /** 面板是否最小化 */
  minimized: boolean;
  /** 当前选中的tab */
  activeTab:
    | "overview"
    | "request"
    | "streaming"
    | "thinking"
    | "comparison"
    | "performance"
    | "errors"
    | "controls";
  /** 当前选中的会话ID */
  selectedSessionId?: string;
  /** 过滤器 */
  filters: {
    provider?: string;
    status?: AIDebugSession["status"];
    timeRange?: {
      start: number;
      end: number;
    };
  };
  /** 实时模式开关 */
  realTimeMode: boolean;
}

/**
 * 调试数据收集器配置
 */
export interface AIDebugCollectorConfig {
  /** 是否启用调试收集 */
  enabled: boolean;
  /** 最大保存的会话数量 */
  maxSessions: number;
  /** 是否收集原始响应数据 */
  collectRawData: boolean;
  /** 是否收集思维链 */
  collectThinking: boolean;
  /** 是否收集性能指标 */
  collectPerformance: boolean;
}

/**
 * 调试事件类型
 */
export type AIDebugEvent =
  | {
      type: "session-start";
      data: Pick<AIDebugSession, "sessionId" | "noteId" | "request">;
    }
  | {
      type: "stream-chunk";
      data: {
        sessionId: string;
        chunk: AIDebugSession["streaming"]["chunks"][0];
      };
    }
  | {
      type: "thinking-step";
      data: {
        sessionId: string;
        step: { id: string; content: string; timestamp: number };
      };
    }
  | {
      type: "session-complete";
      data: {
        sessionId: string;
        response: AIDebugSession["response"];
        performance: AIDebugSession["performance"];
      };
    }
  | {
      type: "session-error";
      data: { sessionId: string; error: AIDebugSession["error"] };
    }
  | { type: "session-cancelled"; data: { sessionId: string } };

/**
 * 调试数据对比结果
 */
export interface AIDebugComparison {
  /** 原始Markdown */
  originalMarkdown: string;
  /** 处理后HTML */
  processedHTML: string;
  /** 用户看到的内容 */
  displayedContent: string;
  /** 差异分析 */
  differences: Array<{
    type: "addition" | "deletion" | "modification";
    location: string;
    original: string;
    processed: string;
    description: string;
  }>;
}
