/**
 * AI调试面板 - 高级控制组件
 */

import React, { useState } from "react";
import {
  SettingOutlined,
  SearchOutlined,
  MonitorOutlined,
} from "@ant-design/icons";
import {
  Input,
  Select,
  DatePicker,
  Switch,
  Collapse,
  Space,
  Button,
  Divider,
} from "antd";
import { useAIDebugStore } from "../../store/aiDebugStore";
import { aiDebugCollector } from "../../utils/aiDebugCollector";
import styles from "./AdvancedControls.module.css";

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

export const AdvancedControls: React.FC = () => {
  const {
    filters,
    realTimeMode,
    sessions,
    setFilters,
    toggleRealTimeMode,
    refreshSessions,
    getActiveProviders,
  } = useAIDebugStore();

  const [debugConfig, setDebugConfig] = useState({
    collectRawData: true,
    collectThinking: true,
    collectPerformance: true,
    maxSessions: 100,
  });

  const activeProviders = getActiveProviders();

  const handleSearch = (value: string) => {
    // TODO: 实现搜索逻辑
    console.log("搜索:", value);
  };

  const handleProviderFilter = (provider: string | undefined) => {
    setFilters({ provider });
  };

  const handleStatusFilter = (status: any) => {
    setFilters({ status });
  };

  const handleTimeRangeFilter = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters({
        timeRange: {
          start: dates[0].valueOf(),
          end: dates[1].valueOf(),
        },
      });
    } else {
      setFilters({ timeRange: undefined });
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...debugConfig, [key]: value };
    setDebugConfig(newConfig);

    // 更新收集器配置
    aiDebugCollector.configure({
      enabled: true,
      ...newConfig,
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log("导入的调试数据:", data);
        // TODO: 实现数据导入逻辑
      } catch (error) {
        console.error("导入数据格式错误:", error);
      }
    };
    reader.readAsText(file);
  };

  const statusOptions = [
    { label: "全部", value: undefined },
    { label: "进行中", value: "streaming" },
    { label: "已完成", value: "completed" },
    { label: "错误", value: "error" },
    { label: "已取消", value: "cancelled" },
  ];

  return (
    <div className={styles.advancedControls}>
      <Collapse size="small" ghost>
        {/* 搜索和过滤 */}
        <Panel
          header={
            <Space>
              <SearchOutlined />
              <span>搜索和过滤</span>
            </Space>
          }
          key="search"
        >
          <div className={styles.controlSection}>
            <Search
              placeholder="搜索会话内容..."
              allowClear
              size="small"
              onSearch={handleSearch}
              className={styles.searchInput}
            />

            <Space wrap size="small">
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>提供商:</span>
                <Select
                  size="small"
                  placeholder="选择提供商"
                  allowClear
                  value={filters.provider}
                  onChange={handleProviderFilter}
                  options={[
                    { label: "全部", value: undefined },
                    ...activeProviders.map((p) => ({ label: p, value: p })),
                  ]}
                />
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>状态:</span>
                <Select
                  size="small"
                  placeholder="选择状态"
                  value={filters.status}
                  onChange={handleStatusFilter}
                  options={statusOptions}
                />
              </div>
            </Space>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>时间范围:</span>
              <RangePicker
                size="small"
                showTime
                onChange={handleTimeRangeFilter}
              />
            </div>
          </div>
        </Panel>

        {/* 实时监控设置 */}
        <Panel
          header={
            <Space>
              <MonitorOutlined />
              <span>实时监控</span>
            </Space>
          }
          key="monitoring"
        >
          <div className={styles.controlSection}>
            <div className={styles.switchGroup}>
              <span>实时更新</span>
              <Switch
                size="small"
                checked={realTimeMode}
                onChange={toggleRealTimeMode}
              />
            </div>

            <div className={styles.switchGroup}>
              <span>收集原始数据</span>
              <Switch
                size="small"
                checked={debugConfig.collectRawData}
                onChange={(checked) =>
                  handleConfigChange("collectRawData", checked)
                }
              />
            </div>

            <div className={styles.switchGroup}>
              <span>收集思维链</span>
              <Switch
                size="small"
                checked={debugConfig.collectThinking}
                onChange={(checked) =>
                  handleConfigChange("collectThinking", checked)
                }
              />
            </div>

            <div className={styles.switchGroup}>
              <span>性能监控</span>
              <Switch
                size="small"
                checked={debugConfig.collectPerformance}
                onChange={(checked) =>
                  handleConfigChange("collectPerformance", checked)
                }
              />
            </div>
          </div>
        </Panel>

        {/* 系统设置 */}
        <Panel
          header={
            <Space>
              <SettingOutlined />
              <span>系统设置</span>
            </Space>
          }
          key="settings"
        >
          <div className={styles.controlSection}>
            <div className={styles.settingGroup}>
              <span>最大会话数:</span>
              <Input
                type="number"
                size="small"
                value={debugConfig.maxSessions}
                onChange={(e) =>
                  handleConfigChange(
                    "maxSessions",
                    parseInt(e.target.value) || 100
                  )
                }
                style={{ width: 80 }}
              />
            </div>

            <Divider />

            <Space size="small">
              <Button size="small" onClick={refreshSessions}>
                刷新数据
              </Button>

              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                style={{ display: "none" }}
                id="import-debug-data"
              />
              <Button
                size="small"
                onClick={() =>
                  document.getElementById("import-debug-data")?.click()
                }
              >
                导入数据
              </Button>

              <Button
                size="small"
                onClick={() => {
                  const logs = sessions.map((s) => ({
                    sessionId: s.sessionId,
                    noteId: s.noteId,
                    provider: s.request.provider,
                    status: s.status,
                    startTime: new Date(s.startTime).toISOString(),
                    prompt: s.request.prompt.substring(0, 100) + "...",
                  }));

                  console.table(logs);
                  console.log("完整会话数据:", sessions);
                }}
              >
                控制台输出
              </Button>
            </Space>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default AdvancedControls;
