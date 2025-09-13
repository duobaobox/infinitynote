// canvasStore.ts
// 用于管理画布数据的 Zustand store

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Canvas, Position, CanvasViewport } from "../types";
import { dbOperations } from "../utils/db";

// 日志去重机制
const loggedMessages = new Set<string>();
const logWithDedup = (message: string, ...args: any[]) => {
  const key = `${message}_${JSON.stringify(args)}`;
  if (!loggedMessages.has(key)) {
    loggedMessages.add(key);
    console.log(message, ...args);
    // 5秒后清除记录，允许重新打印
    setTimeout(() => loggedMessages.delete(key), 5000);
  }
};

// 默认背景色
const DEFAULT_BG_COLOR = "#f5f5f5";

/**
 * 画布状态接口
 */
interface CanvasState {
  /** 画布列表 */
  canvases: Canvas[];
  /** 当前激活的画布ID */
  activeCanvasId: string | null;
  /** 画布视口状态 */
  viewport: CanvasViewport;
}

/**
 * 画布操作接口
 */
interface CanvasActions {
  /** 创建画布 */
  createCanvas: (name: string, isDefault?: boolean) => Promise<string>;
  /** 更新画布 */
  updateCanvas: (
    id: string,
    updates: Partial<Omit<Canvas, "id" | "createdAt">>
  ) => Promise<void>;
  /** 删除画布 */
  deleteCanvas: (id: string) => Promise<void>;
  /** 设置激活画布 */
  setActiveCanvas: (id: string) => void;
  /** 获取当前激活画布 */
  getActiveCanvas: () => Canvas | null;
  /** 设置画布缩放 */
  setScale: (scale: number) => void;
  /** 设置画布偏移 */
  setOffset: (offset: Position) => void;
  /** 重置画布视图 */
  resetViewport: () => void;
  /** 缩放到适合 */
  zoomToFit: () => void;
  /** 放大 */
  zoomIn: () => void;
  /** 缩小 */
  zoomOut: () => void;
  /** 平移画布 */
  panCanvas: (delta: Position) => void;
  /** 从数据库加载画布 */
  loadCanvasesFromDB: () => Promise<void>;
  /** 初始化画布数据 */
  initialize: () => Promise<void>;
}

type CanvasStore = CanvasState & CanvasActions;

/**
 * 生成UUID
 */
const generateId = (): string => {
  return (
    "canvas_" + Date.now().toString(36) + Math.random().toString(36).substr(2)
  );
};

/**
 * 默认视口配置
 */
const DEFAULT_VIEWPORT: CanvasViewport = {
  scale: 1,
  offset: { x: 0, y: 0 },
  minScale: 0.1,
  maxScale: 5,
};

/**
 * 画布状态管理
 */
export const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      canvases: [],
      activeCanvasId: null,
      viewport: { ...DEFAULT_VIEWPORT },

      // 创建画布
      createCanvas: async (name: string, isDefault = false) => {
        const id = generateId();
        const now = new Date();

        const newCanvas: Canvas = {
          id,
          name,
          scale: 1,
          offset: { x: 0, y: 0 },
          backgroundColor: DEFAULT_BG_COLOR,
          createdAt: now,
          updatedAt: now,
          isDefault,
        };

        try {
          // 先更新内存状态，提供即时反馈
          set((state) => {
            const updatedCanvases = [...state.canvases, newCanvas];
            return {
              canvases: updatedCanvases,
              // 如果是第一个画布或者是默认画布，则设为激活状态
              activeCanvasId:
                state.canvases.length === 0 || isDefault
                  ? id
                  : state.activeCanvasId,
            };
          });

          // 同步到数据库
          await dbOperations.addCanvas(newCanvas);

          console.log(`✅ 画布创建成功，ID: ${id}`);
          return id;
        } catch (error) {
          // 如果数据库操作失败，回滚内存状态
          set((state) => ({
            canvases: state.canvases.filter((canvas) => canvas.id !== id),
          }));

          console.error("❌ 创建画布失败:", error);
          throw new Error(
            `创建画布失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 更新画布
      updateCanvas: async (
        id: string,
        updates: Partial<Omit<Canvas, "id" | "createdAt">>
      ) => {
        const updatesWithTime = { ...updates, updatedAt: new Date() };

        try {
          // 先更新内存状态
          set((state) => ({
            canvases: state.canvases.map((canvas) =>
              canvas.id === id ? { ...canvas, ...updatesWithTime } : canvas
            ),
          }));

          // 同步到数据库
          await dbOperations.updateCanvas(id, updatesWithTime);

          console.log(`✅ 画布更新成功，ID: ${id}`);
        } catch (error) {
          // 如果数据库操作失败，重新加载数据
          console.error("❌ 更新画布失败:", error);
          await get().loadCanvasesFromDB();
          throw new Error(
            `更新画布失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 删除画布
      deleteCanvas: async (id: string) => {
        const { canvases, activeCanvasId } = get();
        const canvasToDelete = canvases.find((c) => c.id === id);

        if (!canvasToDelete) {
          throw new Error(`画布 ${id} 不存在`);
        }

        try {
          // 先更新内存状态
          const filteredCanvases = canvases.filter(
            (canvas) => canvas.id !== id
          );
          set({
            canvases: filteredCanvases,
            // 如果删除的是当前激活画布，则切换到第一个画布
            activeCanvasId:
              activeCanvasId === id
                ? filteredCanvases.length > 0
                  ? filteredCanvases[0].id
                  : null
                : activeCanvasId,
          });

          // 同步到数据库
          await dbOperations.deleteCanvas(id);

          console.log(`✅ 画布删除成功，ID: ${id}`);
        } catch (error) {
          // 如果数据库操作失败，恢复内存状态
          set({ canvases, activeCanvasId });

          console.error("❌ 删除画布失败:", error);
          throw new Error(
            `删除画布失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 设置激活画布
      setActiveCanvas: (id: string) => {
        const canvas = get().canvases.find((c) => c.id === id);
        if (canvas) {
          set({
            activeCanvasId: id,
            viewport: {
              ...get().viewport,
              scale: canvas.scale,
              offset: canvas.offset,
            },
          });
        }
      },

      // 获取当前激活画布
      getActiveCanvas: () => {
        const { canvases, activeCanvasId } = get();
        return canvases.find((canvas) => canvas.id === activeCanvasId) || null;
      },

      // 设置画布缩放
      setScale: (scale: number) => {
        const { viewport } = get();
        const clampedScale = Math.max(
          viewport.minScale,
          Math.min(viewport.maxScale, scale)
        );

        set((state) => {
          const newViewport = { ...state.viewport, scale: clampedScale };

          // 同时更新当前激活画布的缩放
          if (state.activeCanvasId) {
            get().updateCanvas(state.activeCanvasId, { scale: clampedScale });
          }

          return { viewport: newViewport };
        });
      },

      // 设置画布偏移
      setOffset: (offset: Position) => {
        set((state) => {
          const newViewport = { ...state.viewport, offset };

          // 同时更新当前激活画布的偏移
          if (state.activeCanvasId) {
            get().updateCanvas(state.activeCanvasId, { offset });
          }

          return { viewport: newViewport };
        });
      },

      // 重置画布视图
      resetViewport: () => {
        const resetViewport = { ...DEFAULT_VIEWPORT };

        set((state) => {
          // 同时重置当前激活画布的视图状态
          if (state.activeCanvasId) {
            get().updateCanvas(state.activeCanvasId, {
              scale: resetViewport.scale,
              offset: resetViewport.offset,
            });
          }

          return { viewport: resetViewport };
        });
      },

      // 缩放到适合
      zoomToFit: () => {
        // TODO: 根据便签分布计算合适的缩放比例和偏移
        get().setScale(1);
        get().setOffset({ x: 0, y: 0 });
      },

      // 放大
      zoomIn: () => {
        const { viewport } = get();
        const newScale = Math.min(viewport.maxScale, viewport.scale * 1.2);
        get().setScale(newScale);
      },

      // 缩小
      zoomOut: () => {
        const { viewport } = get();
        const newScale = Math.max(viewport.minScale, viewport.scale / 1.2);
        get().setScale(newScale);
      },

      // 平移画布
      panCanvas: (delta: Position) => {
        const { viewport } = get();
        const newOffset = {
          x: viewport.offset.x + delta.x,
          y: viewport.offset.y + delta.y,
        };
        get().setOffset(newOffset);
      },

      // 从数据库加载画布
      loadCanvasesFromDB: async () => {
        try {
          const dbCanvases = await dbOperations.getAllCanvases();

          const formattedCanvases: Canvas[] = dbCanvases.map((canvas) => ({
            id: canvas.id,
            name: canvas.name,
            scale: canvas.scale,
            offset: canvas.offset,
            backgroundColor: canvas.backgroundColor,
            createdAt: canvas.createdAt,
            updatedAt: canvas.updatedAt,
            isDefault: canvas.isDefault || false,
          }));

          // 找到默认画布或第一个画布作为激活画布
          const defaultCanvas = formattedCanvases.find((c) => c.isDefault);
          const activeCanvasId =
            defaultCanvas?.id ||
            (formattedCanvases.length > 0 ? formattedCanvases[0].id : null);

          set({
            canvases: formattedCanvases,
            activeCanvasId,
          });

          // 输出详细信息但去重
          if (formattedCanvases.length > 0) {
            logWithDedup(
              `🎨 激活画布: ${activeCanvasId?.slice(-8) || "none"} (共${
                formattedCanvases.length
              }个)`,
              formattedCanvases.map((canvas) => ({
                id: canvas.id.slice(-8),
                name: canvas.name,
                isDefault: canvas.isDefault,
              }))
            );
          }
        } catch (error) {
          console.error("❌ 从数据库加载画布失败:", error);
          throw new Error(
            `加载画布失败: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        }
      },

      // 初始化画布数据
      initialize: async () => {
        try {
          // 检查数据库健康状态
          const isHealthy = await dbOperations.healthCheck();
          if (!isHealthy) {
            throw new Error("数据库连接失败");
          }

          // 加载所有画布
          await get().loadCanvasesFromDB();

          // 如果没有画布，创建默认画布
          const { canvases } = get();
          if (canvases.length === 0) {
            console.log("🎨 创建默认画布");
            await get().createCanvas("默认画布", true);
          }
        } catch (error) {
          console.error("❌ 画布初始化失败:", error);
          // 初始化失败时创建默认画布，但不抛出错误，让应用继续运行
          try {
            await get().createCanvas("默认画布", true);
            console.log("🎨 使用备用方案创建默认画布");
          } catch (fallbackError) {
            console.error("❌ 创建默认画布也失败了:", fallbackError);
            // 最后的备用方案：在内存中创建画布
            const id = generateId();
            const now = new Date();
            const defaultCanvas: Canvas = {
              id,
              name: "默认画布",
              scale: 1,
              offset: { x: 0, y: 0 },
              backgroundColor: DEFAULT_BG_COLOR,
              createdAt: now,
              updatedAt: now,
              isDefault: true,
            };
            set({
              canvases: [defaultCanvas],
              activeCanvasId: id,
            });
            console.log("🎨 内存模式创建默认画布");
          }
        }
      },
    }),
    {
      name: "canvas-store",
    }
  )
);

// 初始化默认画布 - 使用数据库持久化
export const initializeDefaultCanvas = async () => {
  const store = useCanvasStore.getState();

  try {
    await store.initialize();
  } catch (error) {
    console.error("❌ 画布初始化失败:", error);
    // 即使失败也不阻止应用启动
  }
};
