/**
 * 测试面板相关类型定义
 * 用于监控AI生成过程的调试工具
 */

export interface APIRequest {
  id: string;
  timestamp: number;
  provider: string;
  model: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  prompt: string;
  noteId: string;
  // 增强字段
  requestSize: number; // 请求体大小（字节）
  userAgent: string;
  sessionId: string; // 生成会话ID
}

export interface APIResponse {
  id: string;
  requestId: string;
  timestamp: number;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  success: boolean;
  error?: string;
  // 增强字段
  responseSize: number; // 响应体大小（字节）
  streamingChunks?: number; // 流式响应块数量
  firstByteTime?: number; // 首字节响应时间
  totalTokens?: number; // 总token数（如果API返回）
  promptTokens?: number; // 提示词token数
  completionTokens?: number; // 生成内容token数
}

export interface NoteGeneration {
  id: string;
  requestId: string;
  noteId: string;
  timestamp: number;
  finalContent: string;
  originalMarkdown: string;
  hasThinkingChain: boolean;
  thinkingChain?: {
    steps: Array<{
      id: string;
      content: string;
      timestamp: number;
    }>;
    summary: string;
    totalSteps: number;
  };
  aiData: {
    provider: string;
    model: string;
    generated: boolean;
    generatedAt: string;
    prompt: string;
  };
  // 增强字段
  totalGenerationTime: number; // 总生成时间（ms）
  contentLength: number; // 最终内容长度（字符数）
  wordCount: number; // 单词数量
  streamingSteps?: number; // 流式更新步骤数
  errorCount?: number; // 生成过程中的错误次数
  retryCount?: number; // 重试次数
  performance?: {
    ttfb: number; // Time to First Byte
    streamingRate: number; // 字符/秒
    avgChunkSize: number; // 平均块大小
  };
}

export interface TestPanelData {
  requests: APIRequest[];
  responses: APIResponse[];
  generations: NoteGeneration[];
  isVisible: boolean;
  maxEntries: number;
}

export interface TestPanelActions {
  addRequest: (request: APIRequest) => void;
  addResponse: (response: APIResponse) => void;
  addGeneration: (generation: NoteGeneration) => void;
  clearData: () => void;
  toggleVisibility: () => void;
  setMaxEntries: (count: number) => void;
  exportData: () => void;
  copyData: () => Promise<boolean>;
}

export interface TestPanelStore extends TestPanelData, TestPanelActions {}