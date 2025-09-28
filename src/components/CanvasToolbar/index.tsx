import React, { useState } from "react";
import { Button, Space, message } from "antd";
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

interface CanvasToolbarProps {
  isDragMode?: boolean;
  onToggleDragMode?: (enabled: boolean) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  isDragMode = false,
  onToggleDragMode,
}) => {
  const { zoomIn, zoomOut, resetViewport, activeCanvasId } = useCanvasStore();
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
      message.error(`整理失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsOrganizing(false);
    }
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

        {/* 分隔线 */}
        <div className={styles.divider} />

        {/* 整理便签按钮 */}
        <Button
          type="text"
          shape="circle"
          icon={<DynamicIcon type="AppstoreOutlined" />}
          onClick={handleOrganizeNotes}
          loading={isOrganizing}
          disabled={!activeCanvasId || isOrganizing}
          className={styles.toolbarButton}
          style={buttonStyle}
          title="一键整理便签"
        />
      </Space>
    </div>
  );
};
