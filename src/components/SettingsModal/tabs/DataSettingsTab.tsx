/**
 * 数据设置选项卡
 */

import React from "react";
import { Divider, Button, Space, Typography, Row, Col } from "antd";
import {
  DatabaseOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { DataSettings } from "../types";
import styles from "../index.module.css";

const { Title, Text } = Typography;

export interface DataSettingsTabProps {
  settings: DataSettings;
  onExportData: () => void;
  onImportData: () => void;
  onClearData: () => void;
}

const DataSettingsTab: React.FC<DataSettingsTabProps> = ({
  settings,
  onExportData,
  onImportData,
  onClearData,
}) => {
  return (
    <div className={styles.contentSection}>
      <Title level={3}>
        <DatabaseOutlined /> 数据设置
      </Title>
      <Divider />

      <div className={styles.settingGroup}>
        <Title level={4}>数据管理</Title>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div className={styles.settingItem}>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={onExportData}
            >
              导出所有数据
            </Button>
            <Text type="secondary" style={{ marginLeft: 12 }}>
              将所有笔记和设置导出为备份文件
            </Text>
          </div>

          <div className={styles.settingItem}>
            <Button icon={<ImportOutlined />} onClick={onImportData}>
              导入数据
            </Button>
            <Text type="secondary" style={{ marginLeft: 12 }}>
              从备份文件恢复笔记和设置
            </Text>
          </div>

          <div className={styles.settingItem}>
            <Button danger icon={<DeleteOutlined />} onClick={onClearData}>
              清除所有数据
            </Button>
            <Text type="secondary" style={{ marginLeft: 12 }}>
              警告：此操作将删除所有本地数据且不可恢复
            </Text>
          </div>
        </Space>
      </div>

      <div className={styles.settingGroup}>
        <Title level={4}>存储信息</Title>
        <div className={styles.storageInfo}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className={styles.infoCard}>
                <Text strong>已用存储</Text>
                <div className={styles.storageValue}>
                  {settings.storageUsed}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.infoCard}>
                <Text strong>笔记数量</Text>
                <div className={styles.storageValue}>{settings.noteCount}</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default DataSettingsTab;
