/**
 * 独立的缩放指示器组件
 * 固定显示在画布右下角，包含缩放控制按钮
 */

import React from "react";
import { Button, Space, Tooltip } from "antd";
import { useCanvasStore } from "../../store/canvasStore";
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-expect-error - iconRegistry包含多种类型，需要忽略类型检查
  return IconComponent ? <IconComponent /> : null;
};

export const ZoomIndicator: React.FC = () => {
  const { viewport, zoomIn, zoomOut, resetViewport } = useCanvasStore();

  return (
    <div className={styles.zoomIndicator}>
      <Space size={8} align="center">
        {/* 缩小按钮 */}
        <Tooltip title="缩小画布" placement="top">
          <Button
            type="text"
            size="small"
            icon={<DynamicIcon type="ZoomOutOutlined" />}
            onClick={zoomOut}
            className={styles.zoomButton}
          />
        </Tooltip>

        {/* 百分比显示 */}
        <div className={styles.zoomPercentage}>
          {Math.round(viewport.scale * 100)}%
        </div>

        {/* 放大按钮 */}
        <Tooltip title="放大画布" placement="top">
          <Button
            type="text"
            size="small"
            icon={<DynamicIcon type="ZoomInOutlined" />}
            onClick={zoomIn}
            className={styles.zoomButton}
          />
        </Tooltip>

        {/* 重置按钮 */}
        <Tooltip title="重置视图" placement="top">
          <Button
            type="text"
            size="small"
            icon={<DynamicIcon type="RedoOutlined" />}
            onClick={resetViewport}
            className={styles.zoomButton}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export default ZoomIndicator;
