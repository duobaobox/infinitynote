import React from "react";
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
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onCreateNote,
}) => {
  const { zoomIn, zoomOut, resetViewport } = useCanvasStore();

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
      </Space>
    </div>
  );
};
