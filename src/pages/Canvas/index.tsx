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
import { NoteColor } from "../../types";
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

interface CanvasProps {
  isDragMode?: boolean;
}

/**
 * 画布组件
 */
export const Canvas: React.FC<CanvasProps> = ({ isDragMode = false }) => {
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
  const { isVisible: isTestPanelVisible, toggleVisibility: toggleTestPanel } = useTestPanelStore();

  const {
    activeCanvasId,
    viewport,
    setScale,
    resetViewport,
    zoomIn,
    zoomOut,
    panCanvas,
  } = useCanvasStore();

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

  // 使用优化的画布平移Hook
  const { localOffset, startPan, updatePan, endPan } =
    useOptimizedCanvasPan(panCanvas);

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

  // 鼠标滚轮缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(
          viewport.minScale,
          Math.min(viewport.maxScale, viewport.scale * scaleFactor)
        );

        setScale(newScale);
      }
    },
    [viewport, setScale]
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
        const deltaX = e.clientX - panStartRef.current.x;
        const deltaY = e.clientY - panStartRef.current.y;

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
    [updatePan]
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
        const deltaX = e.clientX - panStartRef.current.x;
        const deltaY = e.clientY - panStartRef.current.y;

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
  }, [isPanning, updatePan, endPan]);

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

        const scaleFactor = distance / lastTouchDistance;
        const newScale = Math.max(
          viewport.minScale,
          Math.min(viewport.maxScale, viewport.scale * scaleFactor)
        );

        setScale(newScale);
        setLastTouchDistance(distance);
      }
    },
    [lastTouchDistance, viewport, setScale]
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
              resetViewport();
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
            resetViewport();
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
    resetViewport,
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

  return (
    <div
      className={`${styles.canvasContainer} ${
        isDark ? styles.darkTheme : styles.lightTheme
      }`}
      style={{
        backgroundColor: isDark
          ? "#1a1a1a"
          : displaySettings.canvasColor || "#f0f2f5",
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
        <DndContext
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* 画布内容容器 */}
          <div
            className={`${styles.canvasContent} canvasContent`}
            style={{
              transform: `translate3d(${finalOffset.x}px, ${finalOffset.y}px, 0) scale(${viewport.scale})`,
              transformOrigin: "0 0",
            }}
            data-smooth-zoom={displaySettings.smoothZoom}
            data-dragging={isPanning}
          >
            {/* 网格背景 - 根据设置控制显示 */}
            {displaySettings.showGrid && (
              <div
                className={`${styles.grid} grid`}
                style={
                  {
                    "--grid-color": gridTheme.gridColor,
                    "--grid-size": `${gridTheme.gridSize}px`,
                    "--grid-opacity": gridTheme.gridOpacity,
                    // 应用主题颜色，覆盖原有的固定颜色
                    backgroundImage: `radial-gradient(circle, ${gridTheme.gridColor} 1px, transparent 1px)`,
                    opacity: gridTheme.gridOpacity,
                  } as React.CSSProperties
                }
              />
            )}

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
      <ZoomIndicator />

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
      <TestPanel
        visible={isTestPanelVisible}
        onClose={toggleTestPanel}
      />
    </div>
  );
};

export default Canvas;
