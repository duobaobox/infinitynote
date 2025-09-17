/**
 * DataSettingsTab - 数据管理设置选项卡组件
 *
 * 功能说明：
 * 提供应用程序的数据管理功能，包括数据导入导出、存储统计、
 * 数据清理等核心数据操作。确保用户数据的安全性和可控性。
 *
 * 主要功能：
 *
 * 📁 数据管理：
 * - 📤 导出所有数据：将笔记和设置导出为 JSON 备份文件
 * - 📥 导入数据：从备份文件恢复笔记和设置数据
 * - 🗑️ 清除所有数据：安全清理本地存储的所有数据
 *
 * 📊 存储信息：
 * - 💾 已用存储：显示当前本地存储使用情况
 * - 📝 笔记数量：统计当前保存的笔记总数
 * - 📈 存储趋势：存储使用情况的变化趋势
 *
 * 安全特性：
 * - ⚠️ 危险操作确认：删除数据前需要用户确认
 * - 🔒 数据完整性：导入时验证数据格式和完整性
 * - 📋 操作日志：记录重要的数据操作历史
 * - 🛡️ 错误处理：完善的异常处理和用户提示
 *
 * 文件格式：
 * - 导出格式：JSON 格式，包含版本信息和时间戳
 * - 兼容性：支持不同版本间的数据迁移
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import React from "react";
import { Button, Typography, Row, Col, Card } from "antd";
import {
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { DataSettings } from "../types";
import styles from "../index.module.css";

const { Text } = Typography;

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
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 数据管理 */}
        <Card size="small" title="数据管理" style={{ flex: "0 0 auto" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>导出所有数据</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  将所有笔记和设置导出为备份文件
                </div>
              </div>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={onExportData}
              >
                导出数据
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>导入数据</Text>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
                >
                  从备份文件恢复笔记和设置
                </div>
              </div>
              <Button icon={<ImportOutlined />} onClick={onImportData}>
                导入数据
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>清除所有数据</Text>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#d32f2f",
                    marginTop: "2px",
                  }}
                >
                  警告：此操作将删除所有本地数据且不可恢复
                </div>
              </div>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  console.log("🔧 清除数据按钮被点击");
                  console.log("🔧 onClearData 函数:", onClearData);
                  if (onClearData) {
                    onClearData();
                  } else {
                    console.error("❌ onClearData 函数未定义");
                  }
                }}
              >
                清除数据
              </Button>
            </div>
          </div>
        </Card>

        {/* 存储信息 */}
        <Card size="small" title="存储信息" style={{ flex: 1 }}>
          <div className={styles.storageInfo}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div className={styles.infoCard}>
                  <Text strong>已用存储</Text>
                  <div className={styles.storageValue}>
                    {settings.storageUsed}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.infoCard}>
                  <Text strong>笔记数量</Text>
                  <div className={styles.storageValue}>
                    {settings.noteCount}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.infoCard}>
                  <Text strong>画布数量</Text>
                  <div className={styles.storageValue}>
                    {settings.canvasCount || 0}
                  </div>
                </div>
              </Col>
            </Row>
            {settings.lastBackupTime && (
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <div className={styles.infoCard}>
                    <Text strong>最后修改时间</Text>
                    <div className={styles.storageValue}>
                      {new Date(settings.lastBackupTime).toLocaleString()}
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DataSettingsTab;
