// canvasStore.ts
// 用于管理画布数据的 Zustand store

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Canvas, Position, CanvasViewport } from "../types";

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
  createCanvas: (name: string, isDefault?: boolean) => string;
  /** 更新画布 */
  updateCanvas: (
    id: string,
    updates: Partial<Omit<Canvas, "id" | "createdAt">>
  ) => void;
  /** 删除画布 */
  deleteCanvas: (id: string) => void;
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
      createCanvas: (name: string, isDefault = false) => {
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

        return id;
      },

      // 更新画布
      updateCanvas: (
        id: string,
        updates: Partial<Omit<Canvas, "id" | "createdAt">>
      ) => {
        set((state) => ({
          canvases: state.canvases.map((canvas) =>
            canvas.id === id
              ? { ...canvas, ...updates, updatedAt: new Date() }
              : canvas
          ),
        }));
      },

      // 删除画布
      deleteCanvas: (id: string) => {
        set((state) => {
          const filteredCanvases = state.canvases.filter(
            (canvas) => canvas.id !== id
          );
          return {
            canvases: filteredCanvases,
            // 如果删除的是当前激活画布，则切换到第一个画布
            activeCanvasId:
              state.activeCanvasId === id
                ? filteredCanvases.length > 0
                  ? filteredCanvases[0].id
                  : null
                : state.activeCanvasId,
          };
        });
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
    }),
    {
      name: "canvas-store",
    }
  )
);

// 初始化默认画布
export const initializeDefaultCanvas = () => {
  const store = useCanvasStore.getState();
  if (store.canvases.length === 0) {
    store.createCanvas("默认画布", true);
  }
};
