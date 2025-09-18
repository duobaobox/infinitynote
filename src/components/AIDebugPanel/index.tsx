/**
 * AI调试面板组件
 * 位于右下角固定位置的开发者调试工具
 */

import React, { useEffect, useMemo } from "react";
import {
  BugFilled,
  MinusOutlined,
  CloseOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
  ClearOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useAIDebugStore } from "../../store/aiDebugStore";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { DataComparison } from "./DataComparison";
import { AdvancedControls } from "./AdvancedControls";
import { RawDataView } from "./RawDataView";
import styles from "./index.module.css";

/**
 * 调试面板主组件
 */
export const AIDebugPanel: React.FC = () => {
  const {
    visible,
    minimized,
    activeTab,
    selectedSessionId,
    sessions,
    realTimeMode,
    currentComparison,
    toggleVisible,
    toggleMinimized,
    setActiveTab,
    setSelectedSession,
    toggleRealTimeMode,
    refreshSessions,
    clearAllData,
    exportData,
    getSessionStats,
    getCurrentSession,
    initialize,
  } = useAIDebugStore();

  // 初始化
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 计算统计数据
  const stats = useMemo(() => getSessionStats(), [sessions]);
  const currentSession = useMemo(
    () => getCurrentSession(),
    [selectedSessionId, sessions]
  );

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D 切换面板可见性
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
        e.preventDefault();
        toggleVisible();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleVisible]);

  if (!visible) {
    return null;
  }

  const tabs = [
    { key: "overview", label: "概览", count: stats.total },
    { key: "request", label: "请求", disabled: !currentSession },
    {
      key: "streaming",
      label: "流式",
      count: currentSession?.streaming.chunks.length || 0,
    },
    {
      key: "thinking",
      label: "思维链",
      count: currentSession?.thinkingChain?.totalSteps || 0,
    },
    { key: "comparison", label: "对比", disabled: !currentSession },
    { key: "performance", label: "性能", disabled: !currentSession },
    { key: "rawData", label: "原始数据", disabled: !currentSession },
    { key: "errors", label: "错误", count: stats.error },
    { key: "controls", label: "控制" },
  ];

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-debug-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`${styles.debugPanel} ${minimized ? styles.minimized : ""}`}
    >
      {/* 头部 */}
      <div className={styles.debugHeader}>
        <h3 className={styles.debugTitle}>
          <BugFilled className={styles.icon} />
          AI调试面板
        </h3>

        <div className={styles.statusIndicator}>
          <div
            className={`${styles.statusDot} ${
              sessions.some((s) => s.status === "streaming")
                ? styles.active
                : sessions.some((s) => s.status === "error")
                ? styles.error
                : ""
            }`}
          />
          <span>{stats.total} 会话</span>
        </div>

        <div className={styles.debugControls}>
          <button
            className={`${styles.controlButton} ${
              realTimeMode ? styles.active : ""
            }`}
            onClick={toggleRealTimeMode}
            title="实时模式"
          >
            {realTimeMode ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </button>

          <button
            className={styles.controlButton}
            onClick={refreshSessions}
            title="刷新数据"
          >
            <ReloadOutlined />
          </button>

          <button
            className={styles.controlButton}
            onClick={clearAllData}
            title="清空数据"
          >
            <ClearOutlined />
          </button>

          <button
            className={styles.controlButton}
            onClick={handleExport}
            title="导出数据"
          >
            <DownloadOutlined />
          </button>

          <button
            className={styles.controlButton}
            onClick={toggleMinimized}
            title="最小化"
          >
            <MinusOutlined />
          </button>

          <button
            className={styles.controlButton}
            onClick={toggleVisible}
            title="关闭"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      {!minimized && (
        <div className={styles.debugContent}>
          {/* Tab导航 */}
          <div className={styles.tabNav}>
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={`${styles.tabItem} ${
                  activeTab === tab.key ? styles.active : ""
                } ${tab.disabled ? styles.disabled : ""}`}
                onClick={() => !tab.disabled && setActiveTab(tab.key as any)}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={styles.tabCount}>({tab.count})</span>
                )}
              </div>
            ))}
          </div>

          {/* Tab内容 */}
          <div className={styles.tabContent}>
            {activeTab === "overview" && (
              <OverviewTab
                sessions={sessions}
                stats={stats}
                onSelectSession={setSelectedSession}
              />
            )}
            {activeTab === "request" && currentSession && (
              <RequestTab session={currentSession} />
            )}
            {activeTab === "streaming" && currentSession && (
              <StreamingTab session={currentSession} />
            )}
            {activeTab === "thinking" && currentSession && (
              <ThinkingTab session={currentSession} />
            )}
            {activeTab === "comparison" && currentSession && (
              <ComparisonTab
                session={currentSession}
                comparison={currentComparison}
              />
            )}
            {activeTab === "performance" && currentSession && (
              <PerformanceTab session={currentSession} />
            )}
            {activeTab === "rawData" && currentSession && (
              <RawDataView session={currentSession} />
            )}
            {activeTab === "errors" && (
              <ErrorsTab
                sessions={sessions.filter((s) => s.status === "error")}
              />
            )}
            {activeTab === "controls" && <ControlsTab />}
          </div>
        </div>
      )}
    </div>
  );
};

// Tab组件定义
const OverviewTab: React.FC<{
  sessions: any[];
  stats: any;
  onSelectSession: (id: string) => void;
}> = ({ sessions, stats, onSelectSession }) => (
  <div className={styles.overview}>
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.number}>{stats.completed}</div>
        <div className={styles.label}>已完成</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.number}>{stats.streaming}</div>
        <div className={styles.label}>进行中</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.number}>{stats.error}</div>
        <div className={styles.label}>错误</div>
      </div>
    </div>

    <div className={styles.sessionList}>
      {sessions.map((session) => (
        <div
          key={session.sessionId}
          className={`${styles.sessionItem}`}
          onClick={() => onSelectSession(session.sessionId)}
        >
          <div className={styles.sessionInfo}>
            <div className={styles.sessionId}>
              {session.sessionId.slice(-12)}
            </div>
            <div className={styles.sessionProvider}>
              {session.request.provider} • {session.request.model}
            </div>
          </div>
          <div className={`${styles.sessionStatus} ${styles[session.status]}`}>
            {session.status}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RequestTab: React.FC<{ session: any }> = ({ session }) => (
  <div className={styles.jsonViewer}>
    <pre>{JSON.stringify(session.request, null, 2)}</pre>
  </div>
);

const StreamingTab: React.FC<{ session: any }> = ({ session }) => (
  <div className={styles.streamingData}>
    {session.streaming.chunks.map((chunk: any, index: number) => (
      <div key={chunk.id} className={styles.streamChunk}>
        <div className={styles.chunkHeader}>
          <span>#{index + 1}</span>
          <span>{new Date(chunk.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className={styles.chunkContent}>
          {chunk.parsedContent || "(空内容)"}
        </div>
      </div>
    ))}
  </div>
);

const ThinkingTab: React.FC<{ session: any }> = ({ session }) => (
  <div className={styles.thinkingChain}>
    {session.thinkingChain?.steps?.map((step: any, index: number) => (
      <div key={step.id} className={styles.thinkingStep}>
        <div className={styles.stepHeader}>
          <span>步骤 {index + 1}</span>
          <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className={styles.stepContent}>{step.content}</div>
      </div>
    )) || <div>无思维链数据</div>}
  </div>
);

const ComparisonTab: React.FC<{ session: any; comparison: any }> = ({
  session,
  comparison,
}) => <DataComparison session={session} comparison={comparison} />;

const PerformanceTab: React.FC<{ session: any }> = ({ session }) => (
  <PerformanceMonitor session={session} />
);

const ControlsTab: React.FC = () => <AdvancedControls />;

const ErrorsTab: React.FC<{ sessions: any[] }> = ({ sessions }) => (
  <div>
    {sessions.map((session) => (
      <div key={session.sessionId} className={styles.errorDisplay}>
        <div className={styles.errorMessage}>{session.error?.message}</div>
        {session.error?.stack && (
          <div className={styles.errorStack}>{session.error.stack}</div>
        )}
      </div>
    ))}
  </div>
);

export default AIDebugPanel;
