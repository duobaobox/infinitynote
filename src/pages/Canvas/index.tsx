// 画布视图页面

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { VirtualizedNoteContainer } from "../../components/VirtualizedNoteContainer";
import { ZoomIndicator } from "../../components/ZoomIndicator";
import { SlotContainer } from "../../components/SlotContainer";
import { LeaderLineVisualizer } from "../../components/LeaderLineVisualizer";
import { TestPanel } from "../../components/TestPanel";
import { useNoteStore } from "../../store/noteStore";
import { useCanvasStore } from "../../store/canvasStore";
import { useConnectionStore } from "../../store/connectionStore";
import { useTestPanelStore } from "../../store/testPanelStore";
import { useTheme, canvasGridThemes } from "../../theme";
import { loadSettingsFromStorage } from "../../components/SettingsModal/utils";
import { iconRegistry } from "../../utils/iconRegistry";
import { useOptimizedCanvasPan } from "../../utils/dragOptimization";
import type { IconType } from "../../utils/iconRegistry";
import type { Position, Note } from "../../types";
import { NOTE_DEFAULT_SIZE } from "../../types/constants";
import { Alert } from "antd";
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-expect-error - iconRegistry包含多种类型，需要忽略类型检查
  return IconComponent ? <IconComponent /> : null;
};

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

const DEBUG_MARKERS_ENABLED = false;

const formatNumber = (value: number, fractionDigits = 1) =>
  Number.isFinite(value) ? value.toFixed(fractionDigits) : "NaN";

interface CanvasProps {
  isDragMode?: boolean;
}

/**
 * 画布组件
 */
export const Canvas: React.FC<CanvasProps> = ({ isDragMode = false }) => {
  // 监听ESC键退出拖动模式
  useEffect(() => {
    const handleEscToExitDragMode = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDragMode) {
        e.preventDefault();
        // 通知主页面退出拖动模式
        window.dispatchEvent(
          new CustomEvent("toggleDragMode", { detail: { enabled: false } })
        );
      }
    };
    document.addEventListener("keydown", handleEscToExitDragMode);
    return () => {
      document.removeEventListener("keydown", handleEscToExitDragMode);
    };
  }, [isDragMode]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
    null
  );

  // 主题状态
  const { isDark } = useTheme();
  const gridTheme = isDark ? canvasGridThemes.dark : canvasGridThemes.light;

  // 显示设置
  const [displaySettings, setDisplaySettings] = useState(() => {
    const settings = loadSettingsFromStorage();
    return settings.display;
  });

  const [showDebugMarkers, setShowDebugMarkers] = useState(() => {
    if (!DEBUG_MARKERS_ENABLED || typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem("canvasDebugMarkers") === "true";
  });

  const [debugInfo, setDebugInfo] = useState<{
    containerCenter: Position;
    canvasOrigin: Position;
    delta: Position;
    distance: number;
    scale: number;
    timestamp: number;
  } | null>(null);

  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const lastLoggedDeltaRef = useRef<Position | null>(null);
  const lastLoggedScaleRef = useRef<number | null>(null);

  // 监听设置变化
  useEffect(() => {
    const handleStorageChange = () => {
      const settings = loadSettingsFromStorage();
      console.log("Canvas: 设置变化检测到", settings.display);
      setDisplaySettings(settings.display);
    };

    // 监听自定义事件（当设置页面更新设置时触发）
    window.addEventListener("settingsChanged", handleStorageChange);

    return () => {
      window.removeEventListener("settingsChanged", handleStorageChange);
    };
  }, []);

  // 调试：监听displaySettings变化
  useEffect(() => {
    console.log("Canvas: displaySettings 更新", {
      canvasColor: displaySettings.canvasColor,
      showGrid: displaySettings.showGrid,
      smoothZoom: displaySettings.smoothZoom,
    });
  }, [displaySettings]);

  useEffect(() => {
    if (!DEBUG_MARKERS_ENABLED || typeof window === "undefined") return;
    localStorage.setItem("canvasDebugMarkers", String(showDebugMarkers));
  }, [showDebugMarkers]);

  // 监听便签编辑连接断开事件
  useEffect(() => {
    const handleEditConnectionBreak = (event: CustomEvent) => {
      const { noteId, noteTitle } = event.detail;
      setEditAlert({
        show: true,
        noteTitle,
        noteId,
      });

      // 6秒后自动隐藏
      setTimeout(() => {
        setEditAlert((prev) =>
          prev.noteId === noteId
            ? {
                show: false,
                noteTitle: "",
                noteId: "",
              }
            : prev
        );
      }, 6000);
    };

    window.addEventListener(
      "noteEditConnectionBreak",
      handleEditConnectionBreak as EventListener
    );

    return () => {
      window.removeEventListener(
        "noteEditConnectionBreak",
        handleEditConnectionBreak as EventListener
      );
    };
  }, []);

  // 状态管理
  const {
    notes, // 直接订阅 notes 数组
    selectedNoteIds,
    createNote,
    moveNote,
    selectNote,
    clearSelection,
    startDrag,
    endDrag,
  } = useNoteStore();

  // 测试面板状态
  const { isVisible: isTestPanelVisible, toggleVisibility: toggleTestPanel } =
    useTestPanelStore();

  const {
    activeCanvasId,
    viewport,
    resetViewport,
    zoomIn,
    zoomOut,
    zoomToPoint,
    panCanvas,
    setOffset,
    setViewportSize,
    setScale,
    lastViewportResetAt,
  } = useCanvasStore();

  // 切换画布时清空连接状态
  useEffect(() => {
    const { clearAllConnections } = useConnectionStore.getState();
    clearAllConnections();
  }, [activeCanvasId]);

  // 连接状态管理
  const {
    connectedNotes,
    connectionMode,
    setConnectionMode,
    removeConnection,
    clearAllConnections,
  } = useConnectionStore();

  // 编辑状态全局提醒
  const [editAlert, setEditAlert] = useState<{
    show: boolean;
    noteTitle: string;
    noteId: string;
  }>({
    show: false,
    noteTitle: "",
    noteId: "",
  });

  // 使用 useRef 来避免频繁的状态更新
  const panningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCanvasSizeRef = useRef<{ width: number; height: number } | null>(
    null
  );
  const hasUserPannedRef = useRef(false);
  const autoCenterScheduledRef = useRef(false);

  // 使用优化的画布平移Hook
  const { localOffset, startPan, updatePan, endPan } =
    useOptimizedCanvasPan(panCanvas);

  const handleResetViewport = useCallback(() => {
    hasUserPannedRef.current = false;
    autoCenterScheduledRef.current = false;
    resetViewport();
  }, [resetViewport]);

  const toggleDebugMarkers = useCallback(() => {
    if (!DEBUG_MARKERS_ENABLED) {
      return;
    }
    setShowDebugMarkers((prev) => !prev);
  }, []);

  // 监听画布容器尺寸变化，保持画布中心与可视区域中心对齐
  useEffect(() => {
    const element = canvasRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const prevSize = lastCanvasSizeRef.current;

      if (!prevSize) {
        lastCanvasSizeRef.current = { width, height };
        setContainerSize({ width, height });
        setViewportSize({ width, height });
        autoCenterScheduledRef.current = true;
        hasUserPannedRef.current = false;
        return;
      }

      const deltaWidth = width - prevSize.width;
      const deltaHeight = height - prevSize.height;
      const needUpdate =
        Math.abs(deltaWidth) > 0.5 || Math.abs(deltaHeight) > 0.5;

      if (needUpdate) {
        lastCanvasSizeRef.current = { width, height };
        setContainerSize({ width, height });
        setViewportSize({ width, height });
        autoCenterScheduledRef.current = true;
        hasUserPannedRef.current = false;

        // 强制重新渲染以解决 CSS zoom 在 resize 后的模糊问题
        // 方法：临时重置 zoom 为 1，然后恢复，强制浏览器完全重绘
        const currentScale = viewport.scale;
        const canvasContentEl = element.querySelector(
          ".canvasContent"
        ) as HTMLElement;
        const gridEl = element.querySelector(".grid") as HTMLElement;

        if (canvasContentEl || gridEl) {
          // 方案1: 临时重置 zoom 触发重绘
          setScale(1);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setScale(currentScale);
            });
          });
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [setViewportSize, viewport.scale, setScale]);

  // 获取当前画布的便签（响应式计算）- 优化版本
  const canvasNotes = useMemo(() => {
    if (!activeCanvasId) return [];
    const filteredNotes = notes.filter(
      (note) => note.canvasId === activeCanvasId
    );
    return filteredNotes;
  }, [notes, activeCanvasId]);

  // 详细的调试信息但去重
  useEffect(() => {
    if (activeCanvasId && canvasNotes.length > 0) {
      logWithDedup(
        `📝 画布 ${activeCanvasId.slice(-8)}: ${canvasNotes.length} 个便签`,
        canvasNotes.map((note) => ({
          id: note.id.slice(-8),
          title: note.title,
          position: note.position,
        }))
      );
    }
  }, [activeCanvasId, canvasNotes]);

  // 创建新便签
  const handleCreateNote = useCallback(
    async (position?: Position) => {
      if (!activeCanvasId) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      try {
        let canvasPosition: Position;

        if (position) {
          // 如果指定了位置，直接使用
          canvasPosition = position;
        } else {
          // 使用智能位置计算，避免重叠
          const { generateSmartPosition } = await import(
            "../../utils/notePositioning"
          );

          canvasPosition = generateSmartPosition(
            viewport,
            { width: canvasRect.width, height: canvasRect.height },
            NOTE_DEFAULT_SIZE, // 使用配置的默认便签尺寸 (270x240像素)
            canvasNotes
          );
        }

        await createNote(activeCanvasId, canvasPosition);
        console.log("✅ 画布便签创建成功");
      } catch (error) {
        console.error("❌ 画布便签创建失败:", error);
      }
    },
    [activeCanvasId, viewport, createNote, canvasNotes]
  );

  // 处理画布双击创建便签
  const handleCanvasDoubleClick = useCallback(
    async (e: React.MouseEvent) => {
      // 检查是否点击在空白区域（网格背景或画布本身）
      const target = e.target as Element;
      if (
        target === canvasRef.current ||
        target.classList.contains("grid") ||
        target.closest(`.${styles.canvasContent}`)
      ) {
        const canvasRect = canvasRef.current!.getBoundingClientRect();
        const baseClickPosition = {
          x:
            (e.clientX - canvasRect.left - viewport.offset.x) / viewport.scale -
            NOTE_DEFAULT_SIZE.width / 2, // 使用默认宽度的一半 (135像素) 进行居中定位
          y:
            (e.clientY - canvasRect.top - viewport.offset.y) / viewport.scale -
            NOTE_DEFAULT_SIZE.height / 2, // 使用默认高度的一半 (120像素) 进行居中定位
        };

        // 使用智能位置避免重叠
        const { getNonOverlappingPosition } = await import(
          "../../utils/notePositioning"
        );
        const clickPosition = getNonOverlappingPosition(
          baseClickPosition,
          NOTE_DEFAULT_SIZE, // 使用配置的默认便签尺寸 (270x240像素)
          canvasNotes
        );

        handleCreateNote(clickPosition);
      }
    },
    [handleCreateNote, viewport, canvasNotes]
  );

  // 处理画布点击清空选择
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // 只有在点击空白区域时才清空选择
      const target = e.target as Element;
      if (
        target === canvasRef.current ||
        target.classList.contains("grid") ||
        (target.closest(`.${styles.canvasContent}`) &&
          !target.closest("[data-note-card]"))
      ) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // 拖拽事件处理
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const note = active.data.current?.note as Note;

      if (note) {
        startDrag(note.id, note.position);
      }
    },
    [startDrag]
  );

  const handleDragMove = useCallback(() => {
    // 拖拽过程中不需要额外处理，transform由dnd-kit自动处理
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const note = active.data.current?.note as Note;

      if (note && delta) {
        // dnd-kit 的 delta 是屏幕像素偏移，需要转换为 canvas 坐标
        // 因为 canvasContent 有 scale transform，所以需要除以 scale
        const newPosition = {
          x: note.position.x + delta.x / viewport.scale,
          y: note.position.y + delta.y / viewport.scale,
        };

        moveNote(note.id, newPosition);
      }

      endDrag();
    },
    [moveNote, endDrag, viewport.scale]
  );

  // 鼠标滚轮缩放（围绕鼠标位置缩放）
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // 获取鼠标在屏幕上的位置
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // 获取当前缩放级别和档位
        const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const currentScale = viewport.scale;

        // 找到最接近的档位
        let nearestIndex = 0;
        let minDiff = Math.abs(currentScale - ZOOM_LEVELS[0]);
        for (let i = 1; i < ZOOM_LEVELS.length; i++) {
          const diff = Math.abs(currentScale - ZOOM_LEVELS[i]);
          if (diff < minDiff) {
            minDiff = diff;
            nearestIndex = i;
          }
        }

        // 计算新的缩放级别
        let newScale: number;
        if (e.deltaY > 0) {
          // 缩小：向下一档
          newScale = ZOOM_LEVELS[Math.max(nearestIndex - 1, 0)];
        } else {
          // 放大：向上一档
          newScale =
            ZOOM_LEVELS[Math.min(nearestIndex + 1, ZOOM_LEVELS.length - 1)];
        }

        // 围绕鼠标位置缩放
        zoomToPoint(newScale, mouseX, mouseY);
      }
    },
    [viewport.scale, zoomToPoint]
  );

  // 鼠标拖拽平移
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === canvasRef.current ||
        (e.target as Element).closest(".canvasContent")
      ) {
        // 在拖动模式下，左键也可以拖动画布
        if (
          e.button === 1 ||
          (e.button === 0 && e.ctrlKey) ||
          (e.button === 0 && e.altKey) ||
          (e.button === 0 && isDragMode) // 拖动模式下左键拖动
        ) {
          // 中键或Ctrl+左键或Alt+左键或拖动模式下的左键
          e.preventDefault();
          e.stopPropagation();
          panningRef.current = true;
          panStartRef.current = { x: e.clientX, y: e.clientY };
          hasUserPannedRef.current = true;
          setIsPanning(true); // 仅用于UI状态显示
          startPan(); // 开始优化的拖拽
        }
      }
    },
    [isDragMode, startPan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (panningRef.current && panStartRef.current) {
        e.preventDefault();
        // CSS zoom 会放大 transform 效果，需要除以 scale 来补偿
        // 这样：鼠标移动 100px → offset 增加 50px → 被 zoom:2 放大 → 实际移动 100px
        const deltaX = (e.clientX - panStartRef.current.x) / viewport.scale;
        const deltaY = (e.clientY - panStartRef.current.y) / viewport.scale;

        // 取消之前的动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // 使用优化的画布平移
        animationFrameRef.current = requestAnimationFrame(() => {
          updatePan({ x: deltaX, y: deltaY });
          panStartRef.current = { x: e.clientX, y: e.clientY };
        });
      }
    },
    [updatePan, viewport.scale]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (panningRef.current) {
        e.preventDefault();
        panningRef.current = false;
        panStartRef.current = null;
        setIsPanning(false);

        // 清理动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // 使用优化的结束拖拽
        endPan();
      }
    },
    [endPan]
  );

  // 添加全局鼠标事件处理
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (panningRef.current && panStartRef.current) {
        e.preventDefault();
        // CSS zoom 会放大 transform 效果，需要除以 scale 来补偿
        // 这样：鼠标移动 100px → offset 增加 50px → 被 zoom:2 放大 → 实际移动 100px
        const deltaX = (e.clientX - panStartRef.current.x) / viewport.scale;
        const deltaY = (e.clientY - panStartRef.current.y) / viewport.scale;

        // 取消之前的动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // 使用 requestAnimationFrame 和节流优化性能
        animationFrameRef.current = requestAnimationFrame(() => {
          updatePan({ x: deltaX, y: deltaY });
          panStartRef.current = { x: e.clientX, y: e.clientY };
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (panningRef.current) {
        panningRef.current = false;
        panStartRef.current = null;
        setIsPanning(false);

        // 清理动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // 结束优化拖拽
        endPan();
      }
    };

    if (isPanning) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isPanning, updatePan, endPan, viewport.scale]);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastTouchDistance(distance);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance) {
        e.preventDefault();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        // 严格档位：基于距离变化阈值进行一档一档跳转
        const ratio = distance / lastTouchDistance;
        const THRESHOLD = 1.05; // 5% 阈值，避免抖动
        if (ratio > THRESHOLD) {
          zoomIn();
          setLastTouchDistance(distance);
        } else if (ratio < 1 / THRESHOLD) {
          zoomOut();
          setLastTouchDistance(distance);
        }
      }
    },
    [lastTouchDistance, zoomIn, zoomOut]
  );

  const handleTouchEnd = useCallback(() => {
    setLastTouchDistance(null);
  }, []);

  // 键盘快捷键 - 使用新的统一键盘事件管理器
  useEffect(() => {
    const keyboardManager = (window as any).globalKeyboardManager;

    if (!keyboardManager) {
      console.warn("全局键盘事件管理器未初始化，使用旧版本处理");

      // 保留原有逻辑作为后备
      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;

        // 排除所有输入相关的元素：INPUT、TEXTAREA、contentEditable元素
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.contentEditable === "true" ||
            target.isContentEditable ||
            target.closest("[contenteditable='true']") ||
            target.closest(".tiptap") || // 排除Tiptap编辑器
            target.closest(".tiptap-editor-content")) // 排除Tiptap编辑器内容区域
        ) {
          return; // 在编辑元素中时，不处理任何快捷键
        }

        // 现在处理快捷键
        switch (e.key) {
          case "+":
          case "=":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              zoomIn();
            }
            break;
          case "-":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              zoomOut();
            }
            break;
          case "0":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleResetViewport();
            }
            break;
          case "n":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleCreateNote();
            }
            break;
          case "Escape":
            clearSelection();
            break;
          case " ":
            // 空格键在非编辑状态下才处理（已经在上面检查过了）
            if (!isPanning) {
              e.preventDefault();
              // 这里可以添加空格键拖拽的逻辑
            }
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }

    // 使用新的键盘事件管理器
    const handlers = [
      {
        key: "canvas-zoom-in",
        priority: 80,
        handler: (e: KeyboardEvent) => {
          if ((e.key === "+" || e.key === "=") && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            zoomIn();
            return true;
          }
          return false;
        },
        context: "canvas" as const,
      },
      {
        key: "canvas-zoom-out",
        priority: 80,
        handler: (e: KeyboardEvent) => {
          if (e.key === "-" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            zoomOut();
            return true;
          }
          return false;
        },
        context: "canvas" as const,
      },
      {
        key: "canvas-zoom-reset",
        priority: 80,
        handler: (e: KeyboardEvent) => {
          if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleResetViewport();
            return true;
          }
          return false;
        },
        context: "canvas" as const,
      },
      {
        key: "canvas-new-note",
        priority: 80,
        handler: (e: KeyboardEvent) => {
          if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleCreateNote();
            return true;
          }
          return false;
        },
        context: "canvas" as const,
      },
      {
        key: "canvas-clear-selection",
        priority: 80,
        handler: (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            clearSelection();
            return true;
          }
          return false;
        },
        context: "canvas" as const,
      },
      {
        key: "canvas-space-pan",
        priority: 70, // 比编辑器优先级低
        handler: (e: KeyboardEvent) => {
          if (e.key === " " && !isPanning) {
            e.preventDefault();
            // 这里可以添加空格键拖拽的逻辑
            return true;
          }
          return false;
        },
        context: "canvas" as const,
      },
    ];

    // 注册所有处理器
    handlers.forEach((handler) => {
      keyboardManager.registerHandler(handler.key, handler);
    });

    // 清理函数
    return () => {
      handlers.forEach((handler) => {
        keyboardManager.unregisterHandler(handler.key);
      });
    };
  }, [
    zoomIn,
    zoomOut,
    handleResetViewport,
    handleCreateNote,
    clearSelection,
    isPanning,
  ]);
  // 计算最终的画布偏移量：结合全局offset和本地优化offset
  const finalOffset = useMemo(() => {
    return {
      x: viewport.offset.x + (localOffset?.x || 0),
      y: viewport.offset.y + (localOffset?.y || 0),
    };
  }, [viewport.offset.x, viewport.offset.y, localOffset]);

  useEffect(() => {
    if (!containerSize) {
      return;
    }

    if (!autoCenterScheduledRef.current) {
      return;
    }

    if (hasUserPannedRef.current) {
      return;
    }

    const containerCenter = {
      x: containerSize.width / 2,
      y: containerSize.height / 2,
    };

    const desiredOffset = {
      x: containerCenter.x - (localOffset?.x || 0),
      y: containerCenter.y - (localOffset?.y || 0),
    };

    autoCenterScheduledRef.current = false;

    const hasChanged =
      Math.abs(viewport.offset.x - desiredOffset.x) > 0.5 ||
      Math.abs(viewport.offset.y - desiredOffset.y) > 0.5;

    if (hasChanged) {
      setOffset(desiredOffset);
    }
  }, [
    containerSize,
    localOffset?.x,
    localOffset?.y,
    viewport.offset.x,
    viewport.offset.y,
    setOffset,
  ]);

  useEffect(() => {
    if (!lastViewportResetAt) {
      return;
    }

    hasUserPannedRef.current = false;
    autoCenterScheduledRef.current = false;
  }, [lastViewportResetAt]);

  useEffect(() => {
    if (!DEBUG_MARKERS_ENABLED || !showDebugMarkers) {
      setDebugInfo(null);
      lastLoggedDeltaRef.current = null;
      lastLoggedScaleRef.current = null;
      return;
    }

    if (!containerSize) {
      return;
    }

    const containerCenter: Position = {
      x: containerSize.width / 2,
      y: containerSize.height / 2,
    };

    const canvasOrigin: Position = {
      x: finalOffset.x,
      y: finalOffset.y,
    };

    const delta: Position = {
      x: canvasOrigin.x - containerCenter.x,
      y: canvasOrigin.y - containerCenter.y,
    };

    const distance = Math.hypot(delta.x, delta.y);
    const nextInfo = {
      containerCenter,
      canvasOrigin,
      delta,
      distance,
      scale: viewport.scale,
      timestamp: Date.now(),
    };

    setDebugInfo(nextInfo);

    const lastDelta = lastLoggedDeltaRef.current;
    const lastScale = lastLoggedScaleRef.current;
    const deltaChanged =
      !lastDelta ||
      Math.abs(lastDelta.x - delta.x) > 0.5 ||
      Math.abs(lastDelta.y - delta.y) > 0.5;
    const scaleChanged =
      lastScale === null || Math.abs(lastScale - viewport.scale) > 0.01;

    if (deltaChanged || scaleChanged) {
      console.groupCollapsed("📐 Canvas Offset Debug");
      console.log("Container center", {
        x: containerCenter.x,
        y: containerCenter.y,
      });
      console.log("Canvas origin", {
        x: canvasOrigin.x,
        y: canvasOrigin.y,
      });
      console.log("Delta", {
        x: delta.x,
        y: delta.y,
        distance,
      });
      console.log("Scale", viewport.scale);
      console.groupEnd();

      lastLoggedDeltaRef.current = delta;
      lastLoggedScaleRef.current = viewport.scale;
    }
  }, [
    containerSize,
    finalOffset.x,
    finalOffset.y,
    viewport.scale,
    showDebugMarkers,
  ]);

  return (
    <div
      className={`${styles.canvasContainer} ${
        isDark ? styles.darkTheme : styles.lightTheme
      }`}
      style={{
        backgroundColor: isDark
          ? "#1a1a1a"
          : displaySettings.canvasColor || "#FFFFFF",
      }}
    >
      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className={styles.canvas}
        data-panning={isPanning}
        onDoubleClick={handleCanvasDoubleClick}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isPanning ? "grabbing" : isDragMode ? "grab" : "default",
          backgroundColor: isDark
            ? "#1a1a1a"
            : displaySettings.canvasColor || "#f0f2f5",
        }}
      >
        {DEBUG_MARKERS_ENABLED && showDebugMarkers && (
          <>
            <div className={styles.debugContainerCenter} title="画布容器中心" />
            <div
              className={styles.debugCanvasOrigin}
              style={{
                left: `${finalOffset.x}px`,
                top: `${finalOffset.y}px`,
              }}
              title="画布坐标原点 (0,0)"
            />
          </>
        )}

        {DEBUG_MARKERS_ENABLED && (import.meta.env.DEV || showDebugMarkers) && (
          <button
            type="button"
            className={styles.debugToggleButton}
            onClick={toggleDebugMarkers}
          >
            {showDebugMarkers ? "隐藏坐标标记" : "显示坐标标记"}
          </button>
        )}

        {DEBUG_MARKERS_ENABLED && showDebugMarkers && debugInfo && (
          <div className={styles.debugInfoPanel}>
            <div className={styles.debugInfoTitle}>Canvas Offset Debug</div>
            <div className={styles.debugInfoRow}>
              <span>Container</span>
              <span>
                ({formatNumber(debugInfo.containerCenter.x)},{" "}
                {formatNumber(debugInfo.containerCenter.y)})
              </span>
            </div>
            <div className={styles.debugInfoRow}>
              <span>Canvas</span>
              <span>
                ({formatNumber(debugInfo.canvasOrigin.x)},{" "}
                {formatNumber(debugInfo.canvasOrigin.y)})
              </span>
            </div>
            <div className={styles.debugInfoRow}>
              <span>Δ Offset</span>
              <span>
                ({formatNumber(debugInfo.delta.x)},{" "}
                {formatNumber(debugInfo.delta.y)})
              </span>
            </div>
            <div className={styles.debugInfoRow}>
              <span>Distance</span>
              <span>{formatNumber(debugInfo.distance, 2)}</span>
            </div>
            <div className={styles.debugInfoRow}>
              <span>Scale</span>
              <span>{formatNumber(debugInfo.scale, 3)}</span>
            </div>
            <div className={styles.debugInfoHint}>
              更新时间 {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* 网格背景层 - 独立渲染，不受内容影响 */}
        {displaySettings.showGrid && (
          <div
            className={`${styles.grid} grid`}
            style={
              {
                "--grid-color": gridTheme.gridColor,
                "--grid-size": `${gridTheme.gridSize}px`,
                "--grid-opacity": gridTheme.gridOpacity,
                // 应用主题颜色
                backgroundImage: `radial-gradient(circle, ${gridTheme.gridColor} 1px, transparent 1px)`,
                opacity: gridTheme.gridOpacity,
                // 使用 position + zoom 实现偏移和缩放（避免 transform 混用）
                position: "absolute" as const,
                left: 0,
                top: 0,
                zoom: viewport.scale,
                backgroundSize: `${gridTheme.gridSize}px ${gridTheme.gridSize}px`,
                // 关键修复：使用 backgroundPosition 来补偿 offset，确保网格在整个画布上对齐
                backgroundPosition: `${finalOffset.x}px ${finalOffset.y}px`,
                // 渲染优化
                willChange: "zoom, background-position",
                backfaceVisibility: "hidden" as const,
              } as React.CSSProperties
            }
          />
        )}

        <DndContext
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* 画布内容容器 */}
          <div
            className={`${styles.canvasContent} canvasContent`}
            style={{
              // 使用 position + zoom 实现偏移和缩放（避免 transform 混用）
              position: "absolute" as const,
              left: `${finalOffset.x}px`,
              top: `${finalOffset.y}px`,
              zoom: viewport.scale,
              // 渲染优化
              willChange: isPanning ? "zoom, left, top" : "auto",
              backfaceVisibility: "hidden" as const,
              imageRendering: "crisp-edges" as const,
            }}
            data-smooth-zoom={displaySettings.smoothZoom}
            data-dragging={isPanning}
          >
            {/* 便签列表 */}

            {/* 便签列表 */}
            <VirtualizedNoteContainer
              notes={canvasNotes}
              selectedNoteIds={selectedNoteIds}
              scale={viewport.scale}
              viewport={{
                x: -finalOffset.x,
                y: -finalOffset.y,
                width: window.innerWidth,
                height: window.innerHeight,
              }}
              onNoteClick={(e, note) =>
                selectNote(note.id, e.ctrlKey || e.metaKey)
              }
              onNoteResize={() => {
                // 缩放回调已经在NoteCard内部通过resizeNote处理了
                // 这里可以添加额外的逻辑，比如记录操作日志
              }}
            />
          </div>
        </DndContext>
      </div>

      {/* 独立的缩放指示器 */}
      <ZoomIndicator
        isDragMode={isDragMode}
        onToggleDragMode={(enabled) => {
          // 通过 Canvas props 传递给父组件
          if (enabled !== isDragMode) {
            // 触发自定义事件通知父组件
            window.dispatchEvent(
              new CustomEvent("toggleDragMode", { detail: { enabled } })
            );
          }
        }}
      />

      {/* 全局编辑状态提醒 */}
      {editAlert.show && (
        <div className={styles.globalEditAlert}>
          <Alert
            message={`「${editAlert.noteTitle}」编辑中，连接已断开`}
            type="info"
            showIcon
            closable
            onClose={() =>
              setEditAlert({ show: false, noteTitle: "", noteId: "" })
            }
          />
        </div>
      )}

      {/* 插槽容器 - 固定在画布底部 */}
      <SlotContainer
        connectedNotes={connectedNotes}
        connectionMode={connectionMode}
        onModeChange={setConnectionMode}
        onRemoveConnection={removeConnection}
        onClearAllConnections={clearAllConnections}
      />

      {/* 连接线可视化 */}
      <LeaderLineVisualizer containerRef={canvasRef} />

      {/* 拖动模式提示 */}
      {isDragMode && (
        <div className={styles.dragModeIndicator}>
          <DynamicIcon type="DragOutlined" />
          <span>画布移动模式</span>
          <span className={styles.dragModeHint}>按 ESC 退出</span>
        </div>
      )}

      {/* 测试面板 */}
      <TestPanel visible={isTestPanelVisible} onClose={toggleTestPanel} />
    </div>
  );
};

export default Canvas;
