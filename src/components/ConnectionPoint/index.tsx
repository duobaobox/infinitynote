import React from "react";
import styles from "./index.module.css";

export interface ConnectionPointProps {
  /** 便签ID */
  noteId: string;
  /** 是否已连接 */
  isConnected?: boolean;
  /** 是否作为源便签被连接 */
  isSourceConnected?: boolean;
  /** 连接点击处理 */
  onConnect?: (noteId: string) => void;
  /** 是否在编辑状态下隐藏 */
  isEditingHidden?: boolean;
  /** 是否显示源连接状态 */
  sourceConnectionsVisible?: boolean;
  /** 是否正在被作为源连接 */
  isBeingSourceConnected?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 父便签是否被悬停 */
  isNoteHovered?: boolean;
}

/**
 * 便签连接点组件
 * 用于在便签左下角显示连接点，允许用户点击连接到插槽
 */
export const ConnectionPoint: React.FC<ConnectionPointProps> = ({
  noteId,
  isConnected = false,
  isSourceConnected = false,
  onConnect,
  isEditingHidden = false,
  sourceConnectionsVisible = false,
  isBeingSourceConnected = false,
  className = "",
  style,
  isNoteHovered = false,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到便签
    e.preventDefault(); // 阻止默认行为

    if (isEditingHidden) {
      return;
    }
    onConnect?.(noteId);
  };

  const getTitle = () => {
    if (isEditingHidden) return "";
    if (isConnected) return "已连接到插槽";
    if (isSourceConnected) return "作为源便签被其他便签引用";
    return "点击连接到插槽";
  };

  const getClassNames = () => {
    const classNames = [
      styles.connectionPoint,
      isConnected ? styles.connected : "",
      isSourceConnected ? styles.hasSource : "",
      sourceConnectionsVisible ? styles.sourceActive : "",
      isSourceConnected ? styles.sourceConnected : "",
      isBeingSourceConnected ? styles.beingSourceConnected : "",
      isEditingHidden ? styles.editingHidden : "",
      isNoteHovered ? styles.noteHovered : "", // 新增：便签悬停状态
      className,
    ];

    return classNames.filter(Boolean).join(" ");
  };

  return (
    <div
      className={getClassNames()}
      onMouseDown={handleClick} // 改用 onMouseDown 确保优先级
      title={getTitle()}
      style={{
        pointerEvents: isEditingHidden ? "none" : "auto",
        ...style,
      }}
      data-note-connection-point={noteId}
      data-is-hovered={isNoteHovered} // 调试信息
      data-is-connected={isConnected} // 调试信息
    >
      <div className={styles.connectionDot}></div>
    </div>
  );
};

export default ConnectionPoint;
