// 画布视图页面

import React, { useCallback, useEffect, useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { VirtualizedNoteContainer } from "../../components/VirtualizedNoteContainer";
import { ZoomIndicator } from "../../components/ZoomIndicator";
import { useNoteStore } from "../../store/noteStore";
import { useCanvasStore } from "../../store/canvasStore";
import { useTheme, canvasGridThemes } from "../../theme";
import { loadSettingsFromStorage } from "../../components/SettingsModal/utils";
import type { Position, Note } from "../../types";
import { NoteColor } from "../../types";
import styles from "./index.module.css";

/**
 * 画布组件
 */
export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position | null>(null);
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
      setDisplaySettings(settings.display);
    };

    // 监听自定义事件（当设置页面更新设置时触发）
    window.addEventListener("settingsChanged", handleStorageChange);

    return () => {
      window.removeEventListener("settingsChanged", handleStorageChange);
    };
  }, []);

  // 状态管理
  const {
    selectedNoteIds,
    createNote,
    moveNote,
    selectNote,
    clearSelection,
    getNotesByCanvas,
    startDrag,
    endDrag,
  } = useNoteStore();

  const {
    activeCanvasId,
    viewport,
    setScale,
    resetViewport,
    zoomIn,
    zoomOut,
    panCanvas,
  } = useCanvasStore();

  // 获取当前画布的便签
  const canvasNotes = activeCanvasId ? getNotesByCanvas(activeCanvasId) : [];

  // 创建新便签
  const handleCreateNote = useCallback(
    (position?: Position) => {
      if (!activeCanvasId) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      // 计算在画布坐标系中的位置
      const canvasPosition = position || {
        x: (canvasRect.width / 2 - viewport.offset.x) / viewport.scale - 100,
        y: (canvasRect.height / 2 - viewport.offset.y) / viewport.scale - 75,
      };

      createNote(activeCanvasId, canvasPosition, NoteColor.YELLOW);
    },
    [activeCanvasId, viewport, createNote]
  );

  // 处理画布双击创建便签
  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // 检查是否点击在空白区域（网格背景或画布本身）
      const target = e.target as Element;
      if (
        target === canvasRef.current ||
        target.classList.contains("grid") ||
        target.closest(`.${styles.canvasContent}`)
      ) {
        const canvasRect = canvasRef.current!.getBoundingClientRect();
        const clickPosition = {
          x:
            (e.clientX - canvasRect.left - viewport.offset.x) / viewport.scale -
            100,
          y:
            (e.clientY - canvasRect.top - viewport.offset.y) / viewport.scale -
            75,
        };

        handleCreateNote(clickPosition);
      }
    },
    [handleCreateNote, viewport]
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
    // 可以在这里添加拖拽过程中的逻辑
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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (
      e.target === canvasRef.current ||
      (e.target as Element).closest(".canvasContent")
    ) {
      if (
        e.button === 1 ||
        (e.button === 0 && e.ctrlKey) ||
        (e.button === 0 && e.altKey)
      ) {
        // 中键或Ctrl+左键或Alt+左键
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && panStart) {
        e.preventDefault();
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        panCanvas({ x: deltaX, y: deltaY });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, panStart, panCanvas]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        e.preventDefault();
        setIsPanning(false);
        setPanStart(null);
      }
    },
    [isPanning]
  );

  // 添加全局鼠标事件处理
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart) {
        e.preventDefault();
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        panCanvas({ x: deltaX, y: deltaY });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        setPanStart(null);
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
  }, [isPanning, panStart, panCanvas]);

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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target &&
        (e.target as HTMLElement).tagName !== "INPUT" &&
        (e.target as HTMLElement).tagName !== "TEXTAREA"
      ) {
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
            // 空格键临时切换到拖拽模式
            if (!isPanning) {
              e.preventDefault();
              // 这里可以添加空格键拖拽的逻辑
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut, resetViewport, handleCreateNote, clearSelection]);

  return (
    <div
      className={`${styles.canvasContainer} ${
        isDark ? styles.darkTheme : styles.lightTheme
      }`}
    >
      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className={styles.canvas}
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
          cursor: isPanning ? "grabbing" : "grab",
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
              transform: `translate(${viewport.offset.x}px, ${viewport.offset.y}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
              // 根据设置控制平滑缩放动画
              transition: displaySettings.smoothZoom
                ? "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
            }}
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
                x: -viewport.offset.x,
                y: -viewport.offset.y,
                width: window.innerWidth,
                height: window.innerHeight,
              }}
              onNoteClick={(e, note) =>
                selectNote(note.id, e.ctrlKey || e.metaKey)
              }
            />
          </div>
        </DndContext>
      </div>

      {/* 独立的缩放指示器 */}
      <ZoomIndicator />
    </div>
  );
};

export default Canvas;
