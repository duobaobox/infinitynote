/**
 * AI调试面板状态管理
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  AIDebugPanelState,
  AIDebugSession,
  AIDebugEvent,
  AIDebugComparison,
} from "../types/debug";
import { aiDebugCollector } from "../utils/aiDebugCollector";

interface AIDebugStore extends AIDebugPanelState {
  // 数据
  sessions: AIDebugSession[];
  currentComparison: AIDebugComparison | null;

  // 操作
  toggleVisible: () => void;
  toggleMinimized: () => void;
  setActiveTab: (tab: AIDebugPanelState["activeTab"]) => void;
  setSelectedSession: (sessionId: string | undefined) => void;
  setFilters: (filters: Partial<AIDebugPanelState["filters"]>) => void;
  toggleRealTimeMode: () => void;

  // 数据操作
  refreshSessions: () => void;
  clearAllData: () => void;
  exportData: () => string;
  generateComparison: (sessionId: string, displayedContent: string) => void;

  // 辅助方法
  getFilteredSessions: (sessions: AIDebugSession[]) => AIDebugSession[];
  getCurrentSession: () => AIDebugSession | undefined;
  getSessionStats: () => {
    total: number;
    completed: number;
    error: number;
    streaming: number;
    cancelled: number;
    avgResponseTime: number;
  };
  getActiveProviders: () => string[];

  // 初始化
  initialize: () => void;
}

export const useAIDebugStore = create<AIDebugStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    visible: false,
    minimized: false,
    activeTab: "overview",
    selectedSessionId: undefined,
    filters: {},
    realTimeMode: true,
    sessions: [],
    currentComparison: null,

    // 面板控制
    toggleVisible: () => {
      const newVisible = !get().visible;
      set({ visible: newVisible });

      if (newVisible) {
        get().refreshSessions();
      }

      console.log("🐛 调试面板可见性:", newVisible);
    },

    toggleMinimized: () => {
      set({ minimized: !get().minimized });
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab });

      // 切换到comparison tab时，如果有选中的会话，自动生成对比
      if (tab === "comparison" && get().selectedSessionId) {
        get().generateComparison(get().selectedSessionId!, "");
      }
    },

    setSelectedSession: (sessionId) => {
      set({ selectedSessionId: sessionId });
    },

    setFilters: (filters) => {
      set({ filters: { ...get().filters, ...filters } });
    },

    toggleRealTimeMode: () => {
      const newMode = !get().realTimeMode;
      set({ realTimeMode: newMode });
      console.log("🐛 实时模式:", newMode);
    },

    // 数据操作
    refreshSessions: () => {
      const sessions = aiDebugCollector.getAllSessions();
      const state = get();
      const filtered = state.getFilteredSessions(sessions);
      set({ sessions: filtered });
    },

    clearAllData: () => {
      aiDebugCollector.clearAllData();
      set({
        sessions: [],
        selectedSessionId: undefined,
        currentComparison: null,
      });
    },

    exportData: () => {
      return aiDebugCollector.exportData();
    },

    generateComparison: (sessionId, displayedContent) => {
      const comparison = aiDebugCollector.generateComparison(
        sessionId,
        displayedContent
      );
      set({ currentComparison: comparison });
    },

    // 辅助方法实现
    getFilteredSessions: (sessions: AIDebugSession[]) => {
      const { filters } = get();

      return sessions.filter((session) => {
        if (filters.provider && session.request.provider !== filters.provider) {
          return false;
        }

        if (filters.status && session.status !== filters.status) {
          return false;
        }

        if (filters.timeRange) {
          if (
            session.startTime < filters.timeRange.start ||
            session.startTime > filters.timeRange.end
          ) {
            return false;
          }
        }

        return true;
      });
    },

    getCurrentSession: () => {
      const { sessions, selectedSessionId } = get();
      return sessions.find(
        (session) => session.sessionId === selectedSessionId
      );
    },

    getSessionStats: () => {
      const sessions = get().sessions;

      const completed = sessions.filter((s) => s.status === "completed");
      const totalTime = completed.reduce(
        (sum, s) => sum + (s.performance.totalTime || 0),
        0
      );

      return {
        total: sessions.length,
        completed: completed.length,
        error: sessions.filter((s) => s.status === "error").length,
        streaming: sessions.filter((s) => s.status === "streaming").length,
        cancelled: sessions.filter((s) => s.status === "cancelled").length,
        avgResponseTime:
          completed.length > 0 ? totalTime / completed.length : 0,
      };
    },

    getActiveProviders: () => {
      const sessions = get().sessions;
      return [...new Set(sessions.map((s) => s.request.provider))].filter(
        Boolean
      );
    },

    // 初始化
    initialize: () => {
      console.log("🐛 初始化AI调试面板状态管理");

      // 监听调试事件
      const unsubscribe = aiDebugCollector.addEventListener(
        (event: AIDebugEvent) => {
          const state = get();

          // 实时模式下自动更新数据
          if (state.realTimeMode && state.visible) {
            state.refreshSessions();

            // 如果是新会话开始，自动选中
            if (event.type === "session-start") {
              set({ selectedSessionId: event.data.sessionId });
            }
          }
        }
      );

      // 存储取消订阅函数（在实际应用中可能需要在组件卸载时调用）
      (window as any).__aiDebugUnsubscribe = unsubscribe;

      // 配置调试收集器
      aiDebugCollector.configure({
        enabled: true,
        maxSessions: 100,
        collectRawData: true,
        collectThinking: true,
        collectPerformance: true,
      });

      // 初始加载数据
      get().refreshSessions();
    },
  }))
);

// 在开发环境下暴露到全局，便于调试
if (typeof window !== "undefined") {
  (window as any).aiDebugStore = useAIDebugStore;

  // 自动初始化调试系统
  setTimeout(() => {
    const state = useAIDebugStore.getState();
    if (state.initialize) {
      console.log("🐛 自动初始化AI调试系统...");
      state.initialize();
    }
  }, 1000);
}
