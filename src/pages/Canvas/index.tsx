// 画布视图页面

import React, { useCallback, useEffect, useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
} from "@dnd-kit/core";
import { Button, FloatButton } from "antd";
import { VirtualizedNoteContainer } from "../../components/VirtualizedNoteContainer";
import { useNoteStore } from "../../store/noteStore";
import { useCanvasStore, initializeDefaultCanvas } from "../../store/tagStore";
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
import type { Position, Note } from "../../types";
import { NoteColor } from "../../types";
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-ignore - 忽略类型检查，因为iconRegistry包含多种类型
  return IconComponent ? <IconComponent /> : null;
};

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

  // 初始化默认画布
  useEffect(() => {
    initializeDefaultCanvas();
  }, []);

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
      if (e.target === canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
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
      if (e.target === canvasRef.current) {
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

  const handleDragMove = useCallback((_event: DragMoveEvent) => {
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
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // 中键或Ctrl+左键
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && panStart) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        panCanvas({ x: deltaX, y: deltaY });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, panStart, panCanvas]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

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
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut, resetViewport, handleCreateNote, clearSelection]);

  return (
    <div className={styles.canvasContainer}>
      {/* 画布工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Button
            type="text"
            icon={<DynamicIcon type="PlusOutlined" />}
            onClick={() => handleCreateNote()}
          >
            新建便签
          </Button>
          <div className={styles.divider} />
          <Button
            type="text"
            icon={<DynamicIcon type="ZoomInOutlined" />}
            onClick={zoomIn}
            title="放大 (Ctrl/Cmd + +)"
          />
          <Button
            type="text"
            icon={<DynamicIcon type="ZoomOutOutlined" />}
            onClick={zoomOut}
            title="缩小 (Ctrl/Cmd + -)"
          />
          <Button
            type="text"
            icon={<DynamicIcon type="BorderOutlined" />}
            onClick={resetViewport}
            title="重置视图 (Ctrl/Cmd + 0)"
          />
        </div>

        <div className={styles.toolbarRight}>
          <span className={styles.scaleInfo}>
            {Math.round(viewport.scale * 100)}%
          </span>
        </div>
      </div>

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
            className={styles.canvasContent}
            style={{
              transform: `translate(${viewport.offset.x}px, ${viewport.offset.y}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {/* 网格背景 */}
            <div className={styles.grid} />

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

      {/* 浮动按钮 */}
      <FloatButton.Group>
        <FloatButton
          icon={<DynamicIcon type="PlusOutlined" />}
          tooltip="新建便签 (Ctrl/Cmd + N)"
          onClick={() => handleCreateNote()}
        />
        <FloatButton
          icon={<DynamicIcon type="BorderOutlined" />}
          tooltip="重置视图 (Ctrl/Cmd + 0)"
          onClick={resetViewport}
        />
      </FloatButton.Group>
    </div>
  );
};

export default Canvas;
