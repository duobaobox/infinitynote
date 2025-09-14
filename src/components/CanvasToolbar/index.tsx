import React, { useState } from "react";
import { Button, Space } from "antd";
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
  isDragMode?: boolean;
  onToggleDragMode?: (enabled: boolean) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
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

        {/* 分隔线 */}
        <div className={styles.divider} />

        {/* 放大按钮 */}
        <Button
          type="text"
          shape="circle"
          icon={<DynamicIcon type="ZoomInOutlined" />}
          onClick={zoomIn}
          className={styles.toolbarButton}
          style={buttonStyle}
        />

        {/* 缩小按钮 */}
        <Button
          type="text"
          shape="circle"
          icon={<DynamicIcon type="ZoomOutOutlined" />}
          onClick={zoomOut}
          className={styles.toolbarButton}
          style={buttonStyle}
        />

        {/* 重置视图按钮 */}
        <Button
          type="text"
          shape="circle"
          icon={<DynamicIcon type="RedoOutlined" />}
          onClick={resetViewport}
          className={styles.toolbarButton}
          style={buttonStyle}
        />
      </Space>
    </div>
  );
};
