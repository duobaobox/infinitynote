import React from "react";
import { Tooltip, Segmented, Button } from "antd";
import { CloseOutlined, ClearOutlined } from "@ant-design/icons";
import type { Note } from "../../types";
import type { ConnectedNote } from "../../store/connectionStore";
import styles from "./index.module.css";

// 连接模式枚举
export const ConnectionMode = {
  SUMMARY: "summary", // 汇总模式：保留原始便签，并自动将它们连接到新便签
  REPLACE: "replace", // 替换模式：删除原始便签，只保留新生成的便签
} as const;

export type ConnectionModeType =
  (typeof ConnectionMode)[keyof typeof ConnectionMode];

// 插槽组件属性接口
interface SlotContainerProps {
  connectedNotes: ConnectedNote[];
  connectionMode: ConnectionModeType;
  onModeChange: (mode: ConnectionModeType) => void;
  onRemoveConnection: (noteId: string) => void;
  onClearAllConnections: () => void;
  className?: string;
}

/**
 * 插槽容器组件
 * 用于显示已连接的便签，支持汇总和替换两种模式
 */
export const SlotContainer: React.FC<SlotContainerProps> = ({
  connectedNotes,
  connectionMode,
  onModeChange,
  onRemoveConnection,
  onClearAllConnections,
}) => {
  // 获取模式提示信息
  const getModeTooltip = () => {
    const summaryTooltip = `<div style="text-align: left;">
      <strong>汇总模式</strong><br/>
      • 保留原始便签<br/>
      • 生成新的汇总便签<br/>
    </div>`;

    const replaceTooltip = `<div style="text-align: left;">
      <strong>替换模式</strong><br/>
      • 删除原始便签<br/>
      • 只保留生成的便签<br/>
    </div>`;

    return connectionMode === ConnectionMode.SUMMARY
      ? summaryTooltip
      : replaceTooltip;
  };

  // 获取便签显示内容
  const getDisplayedNoteContent = (note: Note): string => {
    if (!note.content) return "无内容";
    // 简单的文本提取，移除HTML标签
    const textContent = note.content.replace(/<[^>]*>/g, "").trim();
    return textContent || "无内容";
  };

  // 如果没有连接的便签，不渲染插槽容器
  if (connectedNotes.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.slotContainer}`} data-slot-container>
      {/* 插槽列表 */}
      <div className={styles.slotsList} id="slots-list">
        {connectedNotes.map((note, index) => (
          <div
            key={note.id}
            className={`${styles.noteSlot} ${styles.connected}`}
            data-note-id={note.id}
            data-index={index + 1}
            title={(() => {
              const displayedContent = getDisplayedNoteContent(note);
              return `${
                note.title || "无标题便签"
              }: ${displayedContent.substring(0, 50)}${
                displayedContent.length > 50 ? "..." : ""
              }`;
            })()}
            onClick={() => onRemoveConnection(note.id)}
          >
            <div
              className={styles.slotCircle + " " + styles.slotCircleDeletable}
            >
              <span className={styles.slotIndex}>{index + 1}</span>
              <span className={styles.slotDeleteIcon}>
                <CloseOutlined />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 连接模式切换器 - 使用Ant Design Segmented组件 */}
      <Tooltip
        title={<div dangerouslySetInnerHTML={{ __html: getModeTooltip() }} />}
        placement="top"
        arrow={false}
        mouseEnterDelay={0.5}
      >
        <Segmented
          size="small"
          value={connectionMode}
          onChange={(value) => onModeChange(value as ConnectionModeType)}
          options={[
            {
              label: "汇总",
              value: ConnectionMode.SUMMARY,
            },
            {
              label: "替换",
              value: ConnectionMode.REPLACE,
            },
          ]}
          style={{
            fontSize: "12px",
            height: "24px",
            minWidth: "80px",
          }}
        />
      </Tooltip>

      {/* 清空连接按钮 - 使用Ant Design Button */}
      <Button
        size="small"
        type="text"
        danger
        icon={<ClearOutlined />}
        onClick={onClearAllConnections}
        style={{
          fontSize: "12px",
          height: "24px",
          padding: "0 8px",
          borderRadius: "6px",
        }}
        aria-label="删除全部连接"
      />
    </div>
  );
};

export default SlotContainer;
