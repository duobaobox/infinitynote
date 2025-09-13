/**
 * 独立的缩放指示器组件
 * 可以根据设置显示在画布的不同位置
 */

import React, { useState, useEffect } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { loadSettingsFromStorage } from "../SettingsModal/utils";
import styles from "./index.module.css";

export const ZoomIndicator: React.FC = () => {
  const { viewport } = useCanvasStore();

  // 缩放控制位置设置
  const [zoomPosition, setZoomPosition] = useState(() => {
    const settings = loadSettingsFromStorage();
    return settings.display.zoomControlPosition;
  });

  // 监听设置变化
  useEffect(() => {
    const handleSettingsChange = () => {
      const settings = loadSettingsFromStorage();
      setZoomPosition(settings.display.zoomControlPosition);
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange);
    };
  }, []);

  // 根据位置计算样式
  const getIndicatorStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: '6px',
      padding: '8px 12px',
      boxShadow: 'var(--box-shadow-secondary)',
      zIndex: 999,
      fontSize: '12px',
      fontWeight: 600,
      color: 'var(--color-text-secondary)',
      userSelect: 'none' as const,
      pointerEvents: 'none' as const,
    };

    switch (zoomPosition) {
      case 'bottom-right':
        return {
          ...baseStyle,
          bottom: '20px',
          right: '20px',
        };
      case 'bottom-left':
        return {
          ...baseStyle,
          bottom: '20px',
          left: '20px',
        };
      case 'top-right':
        return {
          ...baseStyle,
          top: '20px',
          right: '20px',
        };
      case 'top-left':
        return {
          ...baseStyle,
          top: '20px',
          left: '20px',
        };
      default:
        return {
          ...baseStyle,
          bottom: '20px',
          right: '20px',
        };
    }
  };

  return (
    <div style={getIndicatorStyle()} className={styles.zoomIndicator}>
      {Math.round(viewport.scale * 100)}%
    </div>
  );
};

export default ZoomIndicator;
