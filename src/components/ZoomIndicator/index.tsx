/**
 * 独立的缩放指示器组件
 * 固定显示在画布右下角
 */

import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import styles from "./index.module.css";

export const ZoomIndicator: React.FC = () => {
  const { viewport } = useCanvasStore();

  // 固定样式 - 右下角位置
  const indicatorStyle = {
    position: "fixed" as const,
    zIndex: 999,
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    userSelect: "none" as const,
    pointerEvents: "none" as const,
    bottom: "20px",
    right: "20px",
  };

  return (
    <div style={indicatorStyle} className={styles.zoomIndicator}>
      {Math.round(viewport.scale * 100)}%
    </div>
  );
};

export default ZoomIndicator;
