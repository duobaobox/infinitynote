// canvasStore.ts
// 用于管理画布数据的 Zustand store

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Canvas, Position, CanvasViewport } from "../types";
import { dbOperations } from "../utils/db";
import { canvasStoreEvents } from "./storeEvents";

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
  /** 画布容器的可视尺寸 */
  viewportSize: { width: number; height: number } | null;
  /** 最近一次调用 resetViewport 的时间戳 */
  lastViewportResetAt: number | null;
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
  /** 设置画布容器尺寸 */
  setViewportSize: (size: { width: number; height: number }) => void;
  /** 重置画布视图 */
  resetViewport: () => void;
  /** 缩放到适合 */
  zoomToFit: () => void;
  /** 放大 */
  zoomIn: () => void;
  /** 缩小 */
  zoomOut: () => void;
  /** 围绕指定点缩放 */
  zoomToPoint: (newScale: number, mouseX: number, mouseY: number) => void;
  /** 平移画布 */
  panCanvas: (delta: Position) => void;
  /** 聚焦到指定便签 */
  focusToNote: (
    notePosition: Position,
    noteSize?: { width: number; height: number }
  ) => void;
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
 * 获取屏幕中心偏移量
 * 用于将屏幕中心对齐到画布坐标 (0, 0)
 */
const getDefaultOffset = (
  size?: { width: number; height: number } | null
): { x: number; y: number } => {
  if (size) {
    return {
      x: size.width / 2,
      y: size.height / 2,
    };
  }

  if (typeof window === "undefined") {
    // 服务端渲染或初始化时的默认值
    return { x: 960, y: 540 };
  }
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
};

/**
 * 默认视口配置
 * 初始位置：屏幕中心对齐画布中心 (0, 0)
 * 这样用户可以向四面八方自由扩展，符合"无限画布"的理念
 */
const DEFAULT_VIEWPORT: CanvasViewport = {
  scale: 1,
  offset: getDefaultOffset(), // 屏幕中心对齐画布 (0, 0)
  minScale: 0.25,
  maxScale: 2,
};

// 固定缩放档位（严格模式）
const ZOOM_LEVELS: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const clampToRange = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const getNearestZoomLevel = (scale: number): number => {
  const clamped = clampToRange(
    scale,
    DEFAULT_VIEWPORT.minScale,
    DEFAULT_VIEWPORT.maxScale
  );
  let nearest = ZOOM_LEVELS[0];
  let minDiff = Math.abs(clamped - nearest);
  for (const lvl of ZOOM_LEVELS) {
    const diff = Math.abs(clamped - lvl);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = lvl;
    }
  }
  return nearest;
};

const getNextZoomLevel = (scale: number): number => {
  const nearest = getNearestZoomLevel(scale);
  const idx = ZOOM_LEVELS.indexOf(nearest);
  return ZOOM_LEVELS[Math.min(idx + 1, ZOOM_LEVELS.length - 1)];
};

const getPrevZoomLevel = (scale: number): number => {
  const nearest = getNearestZoomLevel(scale);
  const idx = ZOOM_LEVELS.indexOf(nearest);
  return ZOOM_LEVELS[Math.max(idx - 1, 0)];
};

/**
 * 画布状态持久化工具
 */
const CANVAS_STORAGE_KEY = "infinitynote_active_canvas";

// 防抖保存画布状态的超时引用
let saveCanvasTimeout: number | null = null;

const saveActiveCanvasId = (canvasId: string | null) => {
  try {
    if (canvasId) {
      localStorage.setItem(CANVAS_STORAGE_KEY, canvasId);
    } else {
      localStorage.removeItem(CANVAS_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("⚠️ 保存活跃画布ID失败:", error);
  }
};

/**
 * 防抖保存画布状态到数据库
 * @param canvasId 画布ID
 * @param updates 要更新的画布数据
 * @param delay 防抖延迟时间（毫秒）
 */
const debouncedSaveCanvas = (
  canvasId: string,
  updates: Partial<Omit<Canvas, "id" | "createdAt">>,
  delay = 500
) => {
  // 清除之前的定时器
  if (saveCanvasTimeout) {
    clearTimeout(saveCanvasTimeout);
  }

  // 设置新的定时器
  saveCanvasTimeout = window.setTimeout(async () => {
    try {
      const updatesWithTime = { ...updates, updatedAt: new Date() };
      await dbOperations.updateCanvas(canvasId, updatesWithTime);
      // 只在成功保存后输出日志，避免频繁打印
      logWithDedup(`✅ 画布状态已保存，ID: ${canvasId}`);
    } catch (error) {
      console.error("❌ 防抖保存画布状态失败:", error);
    }
    saveCanvasTimeout = null;
  }, delay);
};

const loadActiveCanvasId = (): string | null => {
  try {
    return localStorage.getItem(CANVAS_STORAGE_KEY);
  } catch (error) {
    console.warn("⚠️ 加载活跃画布ID失败:", error);
    return null;
  }
};

const clearActiveCanvasId = () => {
  try {
    localStorage.removeItem(CANVAS_STORAGE_KEY);
  } catch (error) {
    console.warn("⚠️ 清理活跃画布ID失败:", error);
  }
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
      viewportSize:
        typeof window === "undefined"
          ? null
          : { width: window.innerWidth, height: window.innerHeight },
      lastViewportResetAt: null,

      // 创建画布
      createCanvas: async (name: string, isDefault = false) => {
        // 如果是默认画布，使用固定ID；否则生成随机ID
        const id = isDefault ? DEFAULT_CANVAS_ID : generateId();
        const now = new Date();

        // 如果是默认画布，先检查内存和数据库中是否已存在（防止重复创建）
        if (isDefault) {
          // 1. 检查内存中是否已存在
          const existingCanvasInMemory = get().canvases.find(
            (c) => c.id === DEFAULT_CANVAS_ID
          );
          if (existingCanvasInMemory) {
            logWithDedup(`🎨 默认画布已存在于内存中，ID: ${DEFAULT_CANVAS_ID}`);
            return DEFAULT_CANVAS_ID;
          }

          // 2. 检查数据库中是否已存在（优先检查固定ID）
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

              set((state) => {
                // 检查是否已存在相同ID的画布，避免重复添加
                const existingCanvas = state.canvases.find(
                  (c) => c.id === formattedCanvas.id
                );
                if (existingCanvas) {
                  logWithDedup(
                    `🎨 画布 ${formattedCanvas.id} 已存在于内存中，跳过重复添加`
                  );
                  return {
                    canvases: state.canvases,
                    activeCanvasId: state.activeCanvasId || DEFAULT_CANVAS_ID,
                  };
                }

                return {
                  canvases: [...state.canvases, formattedCanvas],
                  activeCanvasId: state.activeCanvasId || DEFAULT_CANVAS_ID,
                };
              });

              return DEFAULT_CANVAS_ID;
            }
          } catch (dbError) {
            // 数据库查询失败，继续创建流程
            console.warn("⚠️ 检查数据库中的默认画布时出错，继续创建:", dbError);
          }

          // 3. 额外安全检查：确保不会重复创建默认画布
          try {
            const allCanvases = await dbOperations.getAllCanvases();
            const existingDefaults = allCanvases.filter((c) => c.isDefault);

            if (existingDefaults.length > 0) {
              // 如果已经有默认画布，加载第一个并跳过创建
              const firstDefault = existingDefaults[0];
              logWithDedup(
                `🎨 发现现有默认画布，加载: ${firstDefault.id.slice(-8)}`
              );

              const formattedCanvas: Canvas = {
                id: firstDefault.id,
                name: firstDefault.name,
                scale: firstDefault.scale,
                offset: firstDefault.offset,
                backgroundColor: firstDefault.backgroundColor,
                createdAt: firstDefault.createdAt,
                updatedAt: firstDefault.updatedAt,
                isDefault: firstDefault.isDefault || false,
              };

              set((state) => {
                // 检查是否已存在相同ID的画布，避免重复添加
                const existingCanvas = state.canvases.find(
                  (c) => c.id === formattedCanvas.id
                );
                if (existingCanvas) {
                  logWithDedup(
                    `🎨 画布 ${formattedCanvas.id} 已存在于内存中，跳过重复添加`
                  );
                  return {
                    canvases: state.canvases,
                    activeCanvasId: state.activeCanvasId || firstDefault.id,
                  };
                }

                return {
                  canvases: [...state.canvases, formattedCanvas],
                  activeCanvasId: state.activeCanvasId || firstDefault.id,
                };
              });

              return firstDefault.id;
            }
          } catch (checkError) {
            console.warn("⚠️ 检查现有默认画布时出错:", checkError);
          }
        }

        // 创建新画布对象
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
          // 4. 尝试添加到数据库
          await dbOperations.addCanvas(newCanvas);

          // 5. 数据库操作成功后，更新内存状态
          set((state) => {
            // 检查是否已存在相同ID的画布，避免重复添加
            const existingCanvas = state.canvases.find(
              (c) => c.id === newCanvas.id
            );
            if (existingCanvas) {
              logWithDedup(
                `🎨 画布 ${newCanvas.id} 已存在于内存中，跳过重复添加`
              );
              return {
                canvases: state.canvases,
                activeCanvasId: state.activeCanvasId || id,
              };
            }

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

          logWithDedup(`✅ 画布创建成功，ID: ${id.slice(-8)}, 名称: ${name}`);

          // 发送画布创建事件
          canvasStoreEvents.notifyCanvasCreated(id);

          return id;
        } catch (error) {
          console.error("❌ 创建画布失败:", error);

          // 6. 错误处理：如果是因为键已存在，且是默认画布，则加载现有的
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
                  `🎨 键冲突，加载现有默认画布: ${DEFAULT_CANVAS_ID}`
                );

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

                set((state) => {
                  // 检查是否已存在相同ID的画布，避免重复添加
                  const existingMemoryCanvas = state.canvases.find(
                    (c) => c.id === formattedCanvas.id
                  );
                  if (existingMemoryCanvas) {
                    logWithDedup(
                      `🎨 画布 ${formattedCanvas.id} 已存在于内存中，跳过重复添加`
                    );
                    return {
                      canvases: state.canvases,
                      activeCanvasId: state.activeCanvasId || DEFAULT_CANVAS_ID,
                    };
                  }

                  return {
                    canvases: [...state.canvases, formattedCanvas],
                    activeCanvasId: state.activeCanvasId || DEFAULT_CANVAS_ID,
                  };
                });

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

          // 去掉频繁的日志输出，避免控制台污染
          // console.log(`✅ 画布更新成功，ID: ${id}`);
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
          const newActiveCanvasId =
            activeCanvasId === id
              ? filteredCanvases.length > 0
                ? filteredCanvases[0].id
                : null
              : activeCanvasId;

          set({
            canvases: filteredCanvases,
            activeCanvasId: newActiveCanvasId,
          });

          // 如果删除的是当前激活画布，更新持久化存储
          if (activeCanvasId === id) {
            saveActiveCanvasId(newActiveCanvasId);
          }

          // 同步到数据库
          await dbOperations.deleteCanvas(id);

          logWithDedup(
            `✅ 画布删除成功，ID: ${id}，同时删除了 ${notesToDelete.length} 个便签`
          );

          // 发送画布删除事件，通知其他Store清理相关数据
          canvasStoreEvents.notifyCanvasDeleted(id);
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
        const { activeCanvasId: currentActiveCanvasId } = get();
        const canvas = get().canvases.find((c) => c.id === id);
        if (canvas) {
          // 切换画布时，将缩放值吸附到最近的固定档位，保持行为一致
          const snappedScale = getNearestZoomLevel(canvas.scale);
          set({
            activeCanvasId: id,
            viewport: {
              ...get().viewport,
              scale: snappedScale,
              offset: canvas.offset,
            },
          });

          // 持久化保存活跃画布ID
          saveActiveCanvasId(id);

          // 发送画布切换事件
          canvasStoreEvents.notifyCanvasSwitched(currentActiveCanvasId, id);
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

          // 同时更新 canvases 数组中当前画布的 scale（用于切换画布时恢复）
          const updatedCanvases = state.canvases.map((canvas) =>
            canvas.id === state.activeCanvasId
              ? { ...canvas, scale: clampedScale }
              : canvas
          );

          // 使用防抖保存，避免缩放时频繁更新数据库
          if (state.activeCanvasId) {
            debouncedSaveCanvas(state.activeCanvasId, { scale: clampedScale });
          }

          return { viewport: newViewport, canvases: updatedCanvases };
        });
      },

      // 设置画布偏移
      setOffset: (offset: Position) => {
        set((state) => {
          const newViewport = { ...state.viewport, offset };

          // 同时更新 canvases 数组中当前画布的 offset（用于切换画布时恢复）
          const updatedCanvases = state.canvases.map((canvas) =>
            canvas.id === state.activeCanvasId
              ? { ...canvas, offset }
              : canvas
          );

          // 使用防抖保存，避免拖动时频繁更新数据库
          if (state.activeCanvasId) {
            debouncedSaveCanvas(state.activeCanvasId, { offset });
          }

          return { viewport: newViewport, canvases: updatedCanvases };
        });
      },

      setViewportSize: (size: { width: number; height: number }) => {
        set((state) => {
          const prev = state.viewportSize;
          if (
            prev &&
            Math.abs(prev.width - size.width) < 0.5 &&
            Math.abs(prev.height - size.height) < 0.5
          ) {
            return {};
          }
          return { viewportSize: size };
        });
      },

      // 重置画布视图
      resetViewport: () => {
        // 重新计算默认偏移量，确保使用当前窗口尺寸
        const currentViewportSize = get().viewportSize;
        const resetViewport: CanvasViewport = {
          scale: 1,
          offset: getDefaultOffset(currentViewportSize), // 动态计算，确保容器中心对齐画布中心
          minScale: 0.25,
          maxScale: 2,
        };

        set((state) => {
          // 重置视图时立即保存，因为这是用户主动操作
          if (state.activeCanvasId) {
            // 清除防抖定时器，立即保存
            if (saveCanvasTimeout) {
              clearTimeout(saveCanvasTimeout);
              saveCanvasTimeout = null;
            }
            get().updateCanvas(state.activeCanvasId, {
              scale: resetViewport.scale,
              offset: resetViewport.offset,
            });
          }

          return {
            viewport: resetViewport,
            lastViewportResetAt: Date.now(),
          };
        });
      },

      // 缩放到适合
      zoomToFit: () => {
        // TODO: 根据便签分布计算合适的缩放比例和偏移
        get().setScale(1);
        get().setOffset(getDefaultOffset()); // 重置到中心位置
      },

      // 放大（严格档位）
      zoomIn: () => {
        const { viewport } = get();
        const newScale = getNextZoomLevel(viewport.scale);
        get().setScale(newScale);
      },

      // 缩小（严格档位）
      zoomOut: () => {
        const { viewport } = get();
        const newScale = getPrevZoomLevel(viewport.scale);
        get().setScale(newScale);
      },

      // 围绕指定点缩放
      zoomToPoint: (newScale: number, mouseX: number, mouseY: number) => {
        const { viewport } = get();
        const oldScale = viewport.scale;

        // 限制缩放范围
        const clampedScale = Math.max(
          viewport.minScale,
          Math.min(viewport.maxScale, newScale)
        );

        // 参考 Excalidraw 的实现
        // 将鼠标位置转换为相对于画布偏移的位置
        const appLayerX = mouseX;
        const appLayerY = mouseY;

        // 计算基准滚动位置（去除当前缩放的影响）
        const baseScrollX =
          viewport.offset.x + (appLayerX - appLayerX / oldScale);
        const baseScrollY =
          viewport.offset.y + (appLayerY - appLayerY / oldScale);

        // 计算新缩放级别下的滚动偏移
        const zoomOffsetScrollX = -(appLayerX - appLayerX / clampedScale);
        const zoomOffsetScrollY = -(appLayerY - appLayerY / clampedScale);

        // 计算新的偏移量
        const newOffset = {
          x: baseScrollX + zoomOffsetScrollX,
          y: baseScrollY + zoomOffsetScrollY,
        };

        // 同时更新缩放和偏移
        set((state) => {
          const newViewport = {
            ...state.viewport,
            scale: clampedScale,
            offset: newOffset,
          };

          // 使用防抖保存到数据库
          if (state.activeCanvasId) {
            debouncedSaveCanvas(state.activeCanvasId, {
              scale: clampedScale,
              offset: newOffset,
            });
          }

          return { viewport: newViewport };
        });
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

      // 聚焦到指定便签
      focusToNote: (
        notePosition: Position,
        noteSize = { width: 200, height: 150 }
      ) => {
        // 获取当前视口信息
        const { viewport } = get();

        // 计算画布中心点（屏幕中心）
        const canvasCenter = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };

        // 计算便签中心点
        const noteCenterX = notePosition.x + noteSize.width / 2;
        const noteCenterY = notePosition.y + noteSize.height / 2;

        // 计算需要的偏移量，使便签中心对齐到画布中心
        // offset 是画布相对于屏幕的偏移，所以需要反向计算
        const newOffset = {
          x: canvasCenter.x - noteCenterX * viewport.scale,
          y: canvasCenter.y - noteCenterY * viewport.scale,
        };

        // 应用新的偏移量
        get().setOffset(newOffset);

        console.log(
          `✅ 聚焦到便签位置: (${notePosition.x}, ${notePosition.y})`
        );
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

          // 智能选择活跃画布：优先恢复用户上下文
          let activeCanvasId: string | null = null;

          // 1. 尝试恢复用户刷新前的画布
          const savedCanvasId = loadActiveCanvasId();
          if (
            savedCanvasId &&
            formattedCanvases.find((c) => c.id === savedCanvasId)
          ) {
            activeCanvasId = savedCanvasId;
            console.log(
              `🎨 恢复用户上下文，切换到画布: ${savedCanvasId.slice(-8)}`
            );
          } else {
            // 2. 降级处理：选择默认画布或第一个画布
            const defaultCanvas = formattedCanvases.find((c) => c.isDefault);
            activeCanvasId =
              defaultCanvas?.id ||
              (formattedCanvases.length > 0 ? formattedCanvases[0].id : null);

            if (
              savedCanvasId &&
              !formattedCanvases.find((c) => c.id === savedCanvasId)
            ) {
              console.warn(
                `⚠️ 保存的画布 ${savedCanvasId.slice(
                  -8
                )} 不存在，回退到默认画布`
              );
            }
          }

          // 使用去重逻辑确保不会有重复的画布
          set((state) => {
            // 如果当前内存中已有画布，进行去重合并
            const currentCanvases = state.canvases;
            const mergedCanvases: Canvas[] = [];
            const seenIds = new Set<string>();

            // 首先添加数据库中的画布（优先级较高）
            for (const dbCanvas of formattedCanvases) {
              if (!seenIds.has(dbCanvas.id)) {
                mergedCanvases.push(dbCanvas);
                seenIds.add(dbCanvas.id);
              }
            }

            // 然后添加内存中可能存在的其他画布（不在数据库中的）
            for (const memCanvas of currentCanvases) {
              if (!seenIds.has(memCanvas.id)) {
                mergedCanvases.push(memCanvas);
                seenIds.add(memCanvas.id);
              }
            }

            logWithDedup(
              `🎨 画布去重合并完成，共 ${mergedCanvases.length} 个画布`
            );

            // 恢复活跃画布的视口状态（位置记忆功能）
            const activeCanvas = mergedCanvases.find(c => c.id === activeCanvasId);
            const restoredViewport = activeCanvas ? {
              ...state.viewport,
              scale: getNearestZoomLevel(activeCanvas.scale),
              offset: activeCanvas.offset,
            } : state.viewport;

            return {
              canvases: mergedCanvases,
              activeCanvasId,
              viewport: restoredViewport,
            };
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
          console.log("🎨 开始初始化画布数据...");

          // 检查是否正在进行数据清除操作
          const isDataClearing = sessionStorage.getItem("isDataClearing");
          if (isDataClearing) {
            // 如果正在清除数据，清除标记并确保创建全新的默认画布
            sessionStorage.removeItem("isDataClearing");
            // 清理持久化的画布状态
            clearActiveCanvasId();
            console.log("🎨 检测到数据清除操作，执行全新初始化");
          }

          // 1. 重置内存状态，确保从干净状态开始
          set({
            canvases: [],
            activeCanvasId: null,
            viewport: { ...DEFAULT_VIEWPORT },
          });

          // 2. 检查数据库健康状态
          const isHealthy = await dbOperations.healthCheck();
          if (!isHealthy) {
            throw new Error("数据库连接失败");
          }

          // 3. 清理重复的默认画布（在加载前清理）
          await dbOperations.cleanupDefaultCanvases();

          // 4. 加载所有画布
          await get().loadCanvasesFromDB();

          // 5. 检查是否需要创建默认画布（通过固定ID检查）
          const { canvases } = get();
          console.log(`🎨 当前加载的画布数量: ${canvases.length}`);
          console.log(
            `🎨 画布详情:`,
            canvases.map((c) => ({
              id: c.id.slice(-8),
              name: c.name,
              isDefault: c.isDefault,
            }))
          );

          const defaultCanvas = canvases.find(
            (canvas) => canvas.id === DEFAULT_CANVAS_ID
          );

          if (!defaultCanvas) {
            console.log("🎨 默认画布不存在，创建默认画布");
            const createdCanvasId = await get().createCanvas("默认画布", true);
            console.log(`🎨 创建默认画布完成，ID: ${createdCanvasId}`);
          } else {
            console.log(`🎨 默认画布已存在，ID: ${DEFAULT_CANVAS_ID}`);
            // 确保默认画布被设为活动画布（如果没有其他活跃画布）
            if (!get().activeCanvasId) {
              set({ activeCanvasId: DEFAULT_CANVAS_ID });
              saveActiveCanvasId(DEFAULT_CANVAS_ID);
              console.log(`🎨 设置默认画布为活动画布: ${DEFAULT_CANVAS_ID}`);
            }
          }

          // 确保当前活跃画布ID已持久化
          const currentActiveCanvasId = get().activeCanvasId;
          if (currentActiveCanvasId) {
            saveActiveCanvasId(currentActiveCanvasId);
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
            const defaultCanvasObj: Canvas = {
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
              canvases: [defaultCanvasObj],
              activeCanvasId: DEFAULT_CANVAS_ID,
            });

            // 保存到持久化存储
            saveActiveCanvasId(DEFAULT_CANVAS_ID);

            console.log(
              `🎨 内存模式创建默认画布完成，ID: ${DEFAULT_CANVAS_ID}`
            );
          }

          // 6. 最终安全检查：确保画布列表中没有重复项
          const finalState = get();
          const uniqueCanvases = finalState.canvases.filter(
            (canvas, index, arr) =>
              arr.findIndex((c) => c.id === canvas.id) === index
          );

          if (uniqueCanvases.length !== finalState.canvases.length) {
            console.warn(
              `⚠️ 发现重复画布，执行去重: ${finalState.canvases.length} -> ${uniqueCanvases.length}`
            );
            set({ canvases: uniqueCanvases });
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

// 开发环境下暴露到 window（便于调试）
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).useCanvasStore = useCanvasStore;
}
