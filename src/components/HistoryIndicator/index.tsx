/**
 * 撤销/重做指示器组件
 * 显示当前可撤销/重做状态，提供按钮操作
 */

import React from "react";
import { Tooltip } from "antd";
import { UndoOutlined, RedoOutlined, HistoryOutlined } from "@ant-design/icons";
import { useHistoryStore } from "../../store/historyStore";
import { HistoryHelper } from "../../utils/historyHelper";
import styles from "./index.module.css";

interface HistoryIndicatorProps {
  /** 是否显示历史记录列表 */
  showHistory?: boolean;
  /** 位置 */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/**
 * 撤销/重做指示器组件
 */
export const HistoryIndicator: React.FC<HistoryIndicatorProps> = ({
  showHistory = false,
  position = "bottom-right",
}) => {
  const { canUndo, canRedo, getUndoList } = useHistoryStore();
  const [showList, setShowList] = React.useState(false);

  const handleUndo = () => {
    HistoryHelper.undo().catch((error) => {
      console.error("撤销失败:", error);
    });
  };

  const handleRedo = () => {
    HistoryHelper.redo().catch((error) => {
      console.error("重做失败:", error);
    });
  };

  const toggleHistoryList = () => {
    setShowList(!showList);
  };

  // 获取快捷键提示文本（根据系统）
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const undoShortcut = isMac ? "⌘Z" : "Ctrl+Z";
  const redoShortcut = isMac ? "⌘⇧Z" : "Ctrl+Y";

  return (
    <div className={`${styles.historyIndicator} ${styles[position]}`}>
      {/* 撤销按钮 */}
      <Tooltip title={`撤销 (${undoShortcut})`} placement="top">
        <button
          className={styles.historyButton}
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="撤销"
        >
          <UndoOutlined />
        </button>
      </Tooltip>

      {/* 重做按钮 */}
      <Tooltip title={`重做 (${redoShortcut})`} placement="top">
        <button
          className={styles.historyButton}
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="重做"
        >
          <RedoOutlined />
        </button>
      </Tooltip>

      {/* 历史记录列表按钮（可选） */}
      {showHistory && (
        <>
          <Tooltip title="历史记录" placement="top">
            <button
              className={styles.historyButton}
              onClick={toggleHistoryList}
              aria-label="历史记录"
            >
              <HistoryOutlined />
            </button>
          </Tooltip>

          {/* 历史记录列表 */}
          {showList && (
            <div className={styles.historyList}>
              <div className={styles.historyListHeader}>
                <span>历史记录</span>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowList(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.historyListContent}>
                {getUndoList().length === 0 ? (
                  <div className={styles.emptyState}>暂无历史记录</div>
                ) : (
                  <ul className={styles.historyItems}>
                    {getUndoList().map((command, index) => (
                      <li key={index} className={styles.historyItem}>
                        <span className={styles.historyItemIcon}>
                          {command.type}
                        </span>
                        <span className={styles.historyItemDescription}>
                          {command.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
