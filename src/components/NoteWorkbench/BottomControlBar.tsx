import React from "react";
import { Button, Space } from "antd";
import { BranchesOutlined } from "@ant-design/icons";
import styles from "./BottomControlBar.module.css";

interface BottomControlBarProps {
  className?: string;
}

/**
 * 底部控制栏组件
 * 显示在输入框上方，包含连接操作等功能
 */
export const BottomControlBar: React.FC<BottomControlBarProps> = ({
  className = "",
}) => {
  return (
    <div className={`${styles.controlBar} ${className}`}>
      <Space size={12}>
        {/* 连接操作按钮 */}
        <Button
          type="text"
          icon={<BranchesOutlined />}
          size="small"
          className={styles.actionButton}
        >
          连接操作
        </Button>
      </Space>
    </div>
  );
};

export default BottomControlBar;
