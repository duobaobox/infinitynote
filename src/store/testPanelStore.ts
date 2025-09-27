/**
 * 测试面板状态管理
 * 用于监控AI生成过程的调试数据
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  TestPanelStore,
  APIRequest,
  APIResponse,
  NoteGeneration,
} from "../types/testPanel";

const useTestPanelStore = create<TestPanelStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      requests: [],
      responses: [],
      generations: [],
      isVisible: false,
      maxEntries: 1, // 只保存最新一次生成的数据

      // 添加API请求记录 - 只保留最新一次生成相关的请求
      addRequest: (request: APIRequest) => {
        set((state) => {
          // 如果是新的便签生成，清空之前的记录
          const isNewGeneration = !state.requests.some(req => req.noteId === request.noteId);
          if (isNewGeneration && state.requests.length > 0) {
            // 新的便签开始生成，清空所有记录
            return {
              requests: [request],
              responses: [],
              generations: []
            };
          }
          // 同一个便签的生成过程，添加请求记录
          return { requests: [...state.requests, request] };
        });
      },

      // 添加API响应记录 - 关联到当前生成会话
      addResponse: (response: APIResponse) => {
        set((state) => {
          // 查找对应的请求
          const relatedRequest = state.requests.find(req => req.id === response.requestId);
          if (relatedRequest) {
            return { responses: [...state.responses, response] };
          }
          // 如果找不到对应请求，可能是新的会话，重置
          return { responses: [response] };
        });
      },

      // 添加便签生成记录 - 标记当前会话完成
      addGeneration: (generation: NoteGeneration) => {
        set((state) => {
          // 生成完成，保存最终结果
          return { generations: [generation] }; // 只保留最新一次
        });
      },

      // 清空所有数据
      clearData: () => {
        set({
          requests: [],
          responses: [],
          generations: [],
        });
      },

      // 切换面板显示状态
      toggleVisibility: () => {
        set((state) => ({ isVisible: !state.isVisible }));
      },

      // 设置最大记录数量
      setMaxEntries: (count: number) => {
        set((state) => {
          const newState = { maxEntries: count };

          // 如果新的限制更小，需要截断现有数据
          if (count < state.maxEntries) {
            const { requests, responses, generations } = state;

            if (requests.length > count) {
              (newState as any).requests = requests.slice(-count);
            }
            if (responses.length > count) {
              (newState as any).responses = responses.slice(-count);
            }
            if (generations.length > count) {
              (newState as any).generations = generations.slice(-count);
            }
          }

          return newState;
        });
      },

      // 导出调试数据
      exportData: () => {
        const { requests, responses, generations } = get();
        const data = {
          timestamp: new Date().toISOString(),
          session_summary: {
            total_requests: requests.length,
            total_responses: responses.length,
            total_generations: generations.length,
            session_status: generations.length > 0 ? "completed" : "in_progress",
          },
          requests,
          responses,
          generations,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ai-debug-data-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("🗂️ AI调试数据已导出");
      },

      // 复制调试数据到剪贴板
      copyData: async () => {
        const { requests, responses, generations } = get();
        const data = {
          timestamp: new Date().toISOString(),
          session_summary: {
            total_requests: requests.length,
            total_responses: responses.length,
            total_generations: generations.length,
            session_status: generations.length > 0 ? "completed" : "in_progress",
          },
          requests,
          responses,
          generations,
        };

        try {
          await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          console.log("📋 AI调试数据已复制到剪贴板");
          return true;
        } catch (error) {
          console.error("复制数据失败:", error);
          // 降级方案：使用旧的复制方法
          const textArea = document.createElement("textarea");
          textArea.value = JSON.stringify(data, null, 2);
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand("copy");
            document.body.removeChild(textArea);
            console.log("📋 AI调试数据已复制到剪贴板（降级方案）");
            return true;
          } catch (fallbackError) {
            document.body.removeChild(textArea);
            console.error("复制数据失败（降级方案也失败）:", fallbackError);
            return false;
          }
        }
      },
    }),
    {
      name: "test-panel-store",
      // 在开发环境下启用详细的devtools调试
      enabled: import.meta.env.DEV,
    }
  )
);

export { useTestPanelStore };