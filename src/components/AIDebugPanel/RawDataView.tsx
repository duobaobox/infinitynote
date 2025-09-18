/**
 * AI调试面板 - 原始数据视图组件
 */

import React from "react";
import { CopyOutlined } from "@ant-design/icons";
import { Button, Empty, Typography } from "antd";
import styles from "./RawDataView.module.css";

interface RawDataViewProps {
  session: any;
}

export const RawDataView: React.FC<RawDataViewProps> = ({ session }) => {
  // 获取原始响应数据
  const rawData = session?.response?.raw;

  const handleCopyToClipboard = () => {
    if (rawData) {
      navigator.clipboard.writeText(JSON.stringify(rawData, null, 2));
    }
  };

  if (!rawData) {
    return (
      <div className={styles.noData}>
        <Empty description="暂无原始数据" />
      </div>
    );
  }

  return (
    <div className={styles.rawDataContainer}>
      <div className={styles.toolbar}>
        <Typography.Text type="secondary">原始返回数据</Typography.Text>
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopyToClipboard}
        >
          复制
        </Button>
      </div>
      <pre className={styles.codeBlock}>
        {JSON.stringify(rawData, null, 2)}
      </pre>
    </div>
  );
};

export default RawDataView;