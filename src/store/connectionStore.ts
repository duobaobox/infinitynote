import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Note } from "../types";
import {
  ConnectionMode,
  type ConnectionModeType,
} from "../components/SlotContainer";

// 扩展便签接口用于连接功能
export interface ConnectedNote extends Note {
  isConnected?: boolean;
  connectionIndex?: number;
}

// 连接状态接口
export interface ConnectionState {
  // 连接数据
  connectedNotes: ConnectedNote[]; // 已连接的便签列表
  connectionMode: ConnectionModeType; // 连接模式
  maxConnections: number; // 最大连接数量

  // 状态标识
  isVisible: boolean; // 插槽容器是否可见
}

// 连接操作接口
export interface ConnectionActions {
  // 连接操作
  addConnection: (note: Note) => boolean;
  removeConnection: (noteId: string) => void;
  clearAllConnections: () => void;

  // 模式管理
  setConnectionMode: (mode: ConnectionModeType) => void;

  // 可见性管理
  setVisible: (visible: boolean) => void;

  // 工具方法
  isNoteConnected: (noteId: string) => boolean;
  getConnectionIndex: (noteId: string) => number;
  canAddConnection: () => boolean;

  // 连接线管理
  updateConnectionLines: () => void;
}

// 创建连接Store
export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  devtools(
    (set, get) => ({
      // 初始状态
      connectedNotes: [],
      connectionMode: ConnectionMode.SUMMARY, // 默认汇总模式
      maxConnections: 10, // 最大连接10个便签
      isVisible: false,

      // 添加连接
      addConnection: (note: Note) => {
        const state = get();

        // 检查是否已连接
        if (state.isNoteConnected(note.id)) {
          console.log("⚠️ 便签已连接，跳过:", note.title || note.id);
          return false;
        }

        // 检查是否超过最大连接数
        if (!state.canAddConnection()) {
          console.log("⚠️ 已达到最大连接数:", state.maxConnections);
          return false;
        }

        // 计算新的连接索引
        const newIndex = state.connectedNotes.length + 1;

        // 添加连接
        const updatedNote = {
          ...note,
          isConnected: true,
          connectionIndex: newIndex,
        };

        console.log("✅ 添加便签连接:", {
          title: note.title || "无标题",
          id: note.id,
          index: newIndex,
          totalConnections: newIndex,
        });

        set({
          connectedNotes: [...state.connectedNotes, updatedNote],
          isVisible: true, // 有连接时显示插槽容器
        });

        return true;
      },

      removeConnection: (noteId: string) => {
        const state = get();

        const removedNote = state.connectedNotes.find((n) => n.id === noteId);
        console.log("🗑️ 移除便签连接:", {
          title: removedNote?.title || "无标题",
          id: noteId,
        });

        const updatedNotes = state.connectedNotes.filter(
          (note) => note.id !== noteId
        );

        // 重新分配连接索引
        const reindexedNotes = updatedNotes.map((note, index) => ({
          ...note,
          connectionIndex: index + 1,
        }));

        console.log("  📊 剩余连接数:", reindexedNotes.length);

        set({
          connectedNotes: reindexedNotes,
          isVisible: reindexedNotes.length > 0, // 没有连接时隐藏插槽容器
        });
      },

      clearAllConnections: () => {
        const state = get();
        console.log("🧹 清空所有连接，共", state.connectedNotes.length, "个");

        set({
          connectedNotes: [],
          isVisible: false,
        });
      },

      // 模式管理
      setConnectionMode: (mode: ConnectionModeType) => {
        console.log(
          "🔄 切换连接模式:",
          mode === ConnectionMode.SUMMARY ? "汇总模式" : "替换模式"
        );
        set({ connectionMode: mode });
      },

      // 可见性管理
      setVisible: (visible: boolean) => {
        set({ isVisible: visible });
      },

      // 工具方法
      isNoteConnected: (noteId: string) => {
        const state = get();
        return state.connectedNotes.some((note) => note.id === noteId);
      },

      getConnectionIndex: (noteId: string) => {
        const state = get();
        const note = state.connectedNotes.find((note) => note.id === noteId);
        return note?.connectionIndex || -1;
      },

      canAddConnection: () => {
        const state = get();
        return state.connectedNotes.length < state.maxConnections;
      },

      // 连接线管理（占位符）
      updateConnectionLines: () => {
        // TODO: 实现连接线管理逻辑
      },
    }),
    {
      name: "connection-store", // DevTools中的名称
    }
  )
);

// 工具函数：获取便签显示内容
export const connectionUtils = {
  getDisplayedNoteContent: (note: Note): string => {
    if (!note.content) return "无内容";
    // 简单的文本提取，移除HTML标签
    const textContent = note.content.replace(/<[^>]*>/g, "").trim();
    return textContent || "无内容";
  },

  generateAIPromptWithConnections: (
    prompt: string,
    connectedNotes: Note[]
  ): { prompt: string } => {
    if (connectedNotes.length === 0) {
      return { prompt };
    }

    // 构建包含连接便签内容的提示
    const notesContent = connectedNotes
      .map((note, index) => {
        const content = connectionUtils.getDisplayedNoteContent(note);
        return `便签${index + 1}（${note.title || "无标题"}）：\n${content}`;
      })
      .join("\n\n");

    const finalPrompt = `基于以下便签内容：\n\n${notesContent}\n\n${prompt}`;
    return { prompt: finalPrompt };
  },
};
