import React, { useState } from "react";
import { Button, Space, Tooltip } from "antd";
import { useCanvasStore } from "../../store/canvasStore";
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
import type { Position } from "../../types";
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-expect-error - iconRegistry包含多种类型，需要忽略类型检查
  return IconComponent ? <IconComponent /> : null;
};

interface CanvasToolbarProps {
  onCreateNote: (position?: Position) => void;
  isDragMode?: boolean;
  onToggleDragMode?: (enabled: boolean) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onCreateNote,
  isDragMode = false,
  onToggleDragMode,
}) => {
  const { zoomIn, zoomOut, resetViewport } = useCanvasStore();

  // 处理拖动模式切换
  const handleToggleDragMode = () => {
    const newDragMode = !isDragMode;
    onToggleDragMode?.(newDragMode);
  };

  // 通用按钮样式
  const buttonStyle = {
    width: 32,
    height: 32,
    minWidth: 32,
    minHeight: 32,
    padding: 0,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <div className={styles.canvasToolbar}>
      <Space direction="vertical" align="center" size={4}>
        {/* 拖动画布按钮 */}
        <Tooltip
          title={isDragMode ? "退出拖动模式 (ESC)" : "拖动画布模式 (D)"}
          placement="left"
        >
          <Button
            type={isDragMode ? "primary" : "text"}
            shape="circle"
            icon={<DynamicIcon type="DragOutlined" />}
            onClick={handleToggleDragMode}
            className={`${styles.toolbarButton} ${
              isDragMode ? styles.activeButton : ""
            }`}
            style={buttonStyle}
          />
        </Tooltip>

        {/* 分隔线 */}
        <div className={styles.divider} />

        {/* 添加便签按钮 */}
        <Tooltip title="添加便签 (Ctrl/Cmd + N)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="PlusOutlined" />}
            onClick={() => onCreateNote()}
            className={styles.toolbarButton}
            style={buttonStyle}
          />
        </Tooltip>

        {/* 放大按钮 */}
        <Tooltip title="放大 (Ctrl/Cmd + +)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="ZoomInOutlined" />}
            onClick={zoomIn}
            className={styles.toolbarButton}
            style={buttonStyle}
          />
        </Tooltip>

        {/* 缩小按钮 */}
        <Tooltip title="缩小 (Ctrl/Cmd + -)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="ZoomOutOutlined" />}
            onClick={zoomOut}
            className={styles.toolbarButton}
            style={buttonStyle}
          />
        </Tooltip>

        {/* 重置视图按钮 */}
        <Tooltip title="重置视图 (Ctrl/Cmd + 0)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="RedoOutlined" />}
            onClick={resetViewport}
            className={styles.toolbarButton}
            style={buttonStyle}
          />
        </Tooltip>
      </Space>
    </div>
  );
};
