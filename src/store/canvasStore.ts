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

// 默认画布的固定ID
const DEFAULT_CANVAS_ID = "canvas_default";

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
    "canvas_" +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
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
        // 如果是默认画布，使用固定ID；否则生成随机ID
        const id = isDefault ? DEFAULT_CANVAS_ID : generateId();
        const now = new Date();

        // 如果是默认画布，先检查内存和数据库中是否已存在
        if (isDefault) {
          // 检查内存中是否已存在
          const existingCanvasInMemory = get().canvases.find(
            (c) => c.id === DEFAULT_CANVAS_ID
          );
          if (existingCanvasInMemory) {
            logWithDedup(`🎨 默认画布已存在于内存中，ID: ${DEFAULT_CANVAS_ID}`);
            return DEFAULT_CANVAS_ID;
          }

          // 检查数据库中是否已存在
          try {
            const existingCanvasInDB = await dbOperations.getCanvasById(
              DEFAULT_CANVAS_ID
            );
            if (existingCanvasInDB) {
              logWithDedup(
                `🎨 默认画布已存在于数据库中，ID: ${DEFAULT_CANVAS_ID}`
              );
              // 将数据库中的画布加载到内存
              const formattedCanvas: Canvas = {
                id: existingCanvasInDB.id,
                name: existingCanvasInDB.name,
                scale: existingCanvasInDB.scale,
                offset: existingCanvasInDB.offset,
                backgroundColor: existingCanvasInDB.backgroundColor,
                createdAt: existingCanvasInDB.createdAt,
                updatedAt: existingCanvasInDB.updatedAt,
                isDefault: existingCanvasInDB.isDefault || false,
              };

              set((state) => ({
                canvases: [...state.canvases, formattedCanvas],
                activeCanvasId: state.activeCanvasId || DEFAULT_CANVAS_ID,
              }));

              return DEFAULT_CANVAS_ID;
            }
          } catch (dbError) {
            // 数据库查询失败，继续创建流程
            console.warn("⚠️ 检查数据库中的默认画布时出错，继续创建:", dbError);
          }
        }

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
          // 先尝试添加到数据库，避免重复创建
          await dbOperations.addCanvas(newCanvas);

          // 数据库操作成功后，更新内存状态
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

          console.log(`✅ 画布创建成功，ID: ${id}`);
          return id;
        } catch (error) {
          console.error("❌ 创建画布失败:", error);

          // 如果是因为键已存在的错误，且是默认画布，则尝试加载现有的
          if (
            isDefault &&
            error instanceof Error &&
            error.message.includes("Key already exists")
          ) {
            try {
              const existingCanvas = await dbOperations.getCanvasById(
                DEFAULT_CANVAS_ID
              );
              if (existingCanvas) {
                logWithDedup(
                  `🎨 默认画布已存在，加载现有画布: ${DEFAULT_CANVAS_ID}`
                );
                // 加载到内存
                const formattedCanvas: Canvas = {
                  id: existingCanvas.id,
                  name: existingCanvas.name,
                  scale: existingCanvas.scale,
                  offset: existingCanvas.offset,
                  backgroundColor: existingCanvas.backgroundColor,
                  createdAt: existingCanvas.createdAt,
                  updatedAt: existingCanvas.updatedAt,
                  isDefault: existingCanvas.isDefault || false,
                };

                set((state) => ({
                  canvases: [...state.canvases, formattedCanvas],
                  activeCanvasId: state.activeCanvasId || DEFAULT_CANVAS_ID,
                }));

                return DEFAULT_CANVAS_ID;
              }
            } catch (loadError) {
              console.error("❌ 加载现有默认画布失败:", loadError);
            }
          }

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

        // 防止删除默认画布（双重检查：isDefault标记和固定ID）
        if (
          canvasToDelete.isDefault ||
          canvasToDelete.id === DEFAULT_CANVAS_ID
        ) {
          throw new Error("默认画布不能删除");
        }

        try {
          // 先删除该画布上的所有便签
          const canvasNotes = await dbOperations.getAllNotes();
          const notesToDelete = canvasNotes.filter(
            (note) => note.canvasId === id
          );

          // 批量删除便签
          for (const note of notesToDelete) {
            await dbOperations.deleteNote(note.id);
          }

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

          logWithDedup(
            `✅ 画布删除成功，ID: ${id}，同时删除了 ${notesToDelete.length} 个便签`
          );

          // 通知便签Store重新加载数据（删除便签后需要同步状态）
          // 这里我们通过重新加载来确保数据一致性
          if (
            typeof window !== "undefined" &&
            (window as any).noteStoreReload
          ) {
            (window as any).noteStoreReload();
          }
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

          // 清理重复的默认画布（在加载前清理）
          await dbOperations.cleanupDefaultCanvases();

          // 加载所有画布
          await get().loadCanvasesFromDB();

          // 检查是否需要创建默认画布（通过固定ID检查）
          const { canvases } = get();
          const defaultCanvas = canvases.find(
            (canvas) => canvas.id === DEFAULT_CANVAS_ID
          );

          if (!defaultCanvas) {
            console.log("🎨 默认画布不存在，创建默认画布");
            await get().createCanvas("默认画布", true);
          } else {
            console.log(`🎨 默认画布已存在，ID: ${DEFAULT_CANVAS_ID}`);
          }
        } catch (error) {
          console.error("❌ 画布初始化失败:", error);

          // 简化的错误处理：直接创建内存画布作为备用方案
          const { canvases } = get();
          const hasDefaultCanvas = canvases.some(
            (canvas) => canvas.id === DEFAULT_CANVAS_ID
          );

          if (!hasDefaultCanvas) {
            console.log("🎨 使用内存模式创建默认画布");
            const now = new Date();
            const defaultCanvas: Canvas = {
              id: DEFAULT_CANVAS_ID,
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
              activeCanvasId: DEFAULT_CANVAS_ID,
            });

            console.log(
              `🎨 内存模式创建默认画布完成，ID: ${DEFAULT_CANVAS_ID}`
            );
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
