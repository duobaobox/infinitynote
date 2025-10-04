/**
 * 独立的缩放指示器组件
 * 固定显示在画布右下角，包含缩放控制按钮、拖动模式、一键整理等功能
 */

import React, { useState } from "react";
import { Button, Space, Tooltip, message, Divider } from "antd";
import { useCanvasStore } from "../../store/canvasStore";
import { useNoteStore } from "../../store/noteStore";
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-expect-error - iconRegistry包含多种类型，需要忽略类型检查
  return IconComponent ? <IconComponent /> : null;
};

interface ZoomIndicatorProps {
  isDragMode?: boolean;
  onToggleDragMode?: (enabled: boolean) => void;
}

export const ZoomIndicator: React.FC<ZoomIndicatorProps> = ({
  isDragMode = false,
  onToggleDragMode,
}) => {
  const { viewport, zoomIn, zoomOut, resetViewport, activeCanvasId } =
    useCanvasStore();
  const { organizeCurrentCanvasNotes, getNotesByCanvas } = useNoteStore();
  const [isOrganizing, setIsOrganizing] = useState(false);

  // 处理拖动模式切换
  const handleToggleDragMode = () => {
    const newDragMode = !isDragMode;
    onToggleDragMode?.(newDragMode);
  };

  // 处理便签整理
  const handleOrganizeNotes = async () => {
    if (!activeCanvasId) {
      message.warning("没有活动画布");
      return;
    }

    const canvasNotes = getNotesByCanvas(activeCanvasId);

    if (canvasNotes.length === 0) {
      message.info("当前画布没有便签");
      return;
    }

    if (canvasNotes.length === 1) {
      message.info("只有一个便签，无需整理");
      return;
    }

    try {
      setIsOrganizing(true);

      // 显示开始整理的提示
      const hideLoading = message.loading("正在整理便签...", 0);

      await organizeCurrentCanvasNotes(activeCanvasId);

      hideLoading();
      message.success(`✅ 已整理 ${canvasNotes.length} 个便签`);
    } catch (error) {
      console.error("整理便签失败:", error);
      message.error(
        `整理失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsOrganizing(false);
    }
  };

  return (
    <div className={styles.zoomIndicator}>
      <Space
        direction="vertical"
        size={6}
        align="center"
        split={
          <Divider type="horizontal" style={{ margin: 0, width: "100%" }} />
        }
      >
        {/* 画布操作区 */}
        <Space direction="vertical" size={4} align="center">
          {/* 拖动画布按钮 */}
          <Tooltip
            title={isDragMode ? "关闭拖动模式" : "开启拖动模式（快捷键：空格）"}
            placement="left"
          >
            <Button
              type={isDragMode ? "primary" : "text"}
              size="small"
              icon={<DynamicIcon type="DragOutlined" />}
              onClick={handleToggleDragMode}
              className={`${styles.zoomButton} ${
                isDragMode ? styles.activeButton : ""
              }`}
            />
          </Tooltip>

          {/* 整理便签按钮 */}
          <Tooltip title="一键整理便签" placement="left">
            <Button
              type="text"
              size="small"
              icon={<DynamicIcon type="AppstoreOutlined" />}
              onClick={handleOrganizeNotes}
              loading={isOrganizing}
              disabled={!activeCanvasId || isOrganizing}
              className={styles.zoomButton}
            />
          </Tooltip>
        </Space>

        {/* 缩放控制区 */}
        <Space direction="vertical" size={4} align="center">
          {/* 缩小按钮 */}
          <Tooltip title="缩小画布" placement="left">
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
            <div className={styles.zoomNumber}>
              {Math.round(viewport.scale * 100)}
            </div>
            <div className={styles.zoomPercent}>%</div>
          </div>

          {/* 放大按钮 */}
          <Tooltip title="放大画布" placement="left">
            <Button
              type="text"
              size="small"
              icon={<DynamicIcon type="ZoomInOutlined" />}
              onClick={zoomIn}
              className={styles.zoomButton}
            />
          </Tooltip>

          {/* 重置按钮 */}
          <Tooltip title="重置视图" placement="left">
            <Button
              type="text"
              size="small"
              icon={<DynamicIcon type="RedoOutlined" />}
              onClick={resetViewport}
              className={styles.zoomButton}
            />
          </Tooltip>
        </Space>
      </Space>
    </div>
  );
};

export default ZoomIndicator;
