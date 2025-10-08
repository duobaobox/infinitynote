import React from "react";
import { Empty } from "antd";
import styles from "./index.module.css";

/**
 * 工作台页面组件
 * 用于替代画布的新视图模式，目前显示占位内容
 */
const Workspace: React.FC = () => {
  return (
    <div className={styles.workspaceContainer}>
      <Empty
        description={
          <div className={styles.emptyDescription}>
            <div className={styles.emptyTitle}>工作台功能</div>
            <div className={styles.emptySubtitle}>敬请期待，即将上线</div>
          </div>
        }
        imageStyle={{
          height: 160,
        }}
      />
    </div>
  );
};

export default Workspace;
