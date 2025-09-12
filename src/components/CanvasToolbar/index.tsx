import React from "react";
import { Button, Space, Tooltip } from "antd";
import { useCanvasStore } from "../../store/tagStore";
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
import type { Position } from "../../types";
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-ignore - 忽略类型检查，因为iconRegistry包含多种类型
  return IconComponent ? <IconComponent /> : null;
};

interface CanvasToolbarProps {
  onCreateNote: (position?: Position) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onCreateNote,
}) => {
  const { viewport, zoomIn, zoomOut, resetViewport } = useCanvasStore();

  return (
    <div className={styles.canvasToolbar}>
      <Space direction="vertical" align="center" size={8}>
        <Tooltip title="添加便签 (Ctrl/Cmd + N)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="PlusOutlined" />}
            onClick={() => onCreateNote()}
            className={styles.toolbarButton}
          />
        </Tooltip>

        <Tooltip title="放大 (Ctrl/Cmd + +)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="ZoomInOutlined" />}
            onClick={zoomIn}
            className={styles.toolbarButton}
          />
        </Tooltip>

        <Tooltip title="缩小 (Ctrl/Cmd + -)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="ZoomOutOutlined" />}
            onClick={zoomOut}
            className={styles.toolbarButton}
          />
        </Tooltip>

        <Tooltip title="重置视图 (Ctrl/Cmd + 0)" placement="left">
          <Button
            type="text"
            shape="circle"
            icon={<DynamicIcon type="RedoOutlined" />}
            onClick={resetViewport}
            className={styles.toolbarButton}
          />
        </Tooltip>

        <Tooltip
          title={
            <div>
              <div>当前缩放: {Math.round(viewport.scale * 100)}%</div>
              <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>
                拖拽画布: 中键/Ctrl+左键/Alt+左键
              </div>
            </div>
          }
          placement="left"
        >
          <div className={styles.zoomIndicator}>
            <div className={styles.zoomValue}>
              {Math.round(viewport.scale * 100)}
            </div>
            <div className={styles.zoomUnit}>%</div>
          </div>
        </Tooltip>
      </Space>
    </div>
  );
};
