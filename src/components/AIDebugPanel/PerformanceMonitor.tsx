/**
 * AI调试面板 - 性能监控子组件
 */

import React from "react";
import type { AIDebugSession } from "../../types/debug";
import styles from "./PerformanceMonitor.module.css";

interface PerformanceMonitorProps {
  session: AIDebugSession;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  session,
}) => {
  const { performance } = session;

  // 计算性能指标
  const metrics = {
    totalTime: performance.totalTime ? `${performance.totalTime}ms` : "未完成",
    firstByteTime: performance.timeToFirstByte
      ? `${performance.timeToFirstByte}ms`
      : "未记录",
    chunkCount: performance.chunkCount,
    avgChunkTime:
      performance.totalTime && performance.chunkCount > 0
        ? `${Math.round(performance.totalTime / performance.chunkCount)}ms`
        : "N/A",
    tokensPerSecond:
      performance.totalTime && performance.tokens?.total
        ? Math.round((performance.tokens.total * 1000) / performance.totalTime)
        : "N/A",
  };

  return (
    <div className={styles.performanceMonitor}>
      <h4 className={styles.sectionTitle}>性能指标</h4>

      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>总时间</span>
          <span className={styles.metricValue}>{metrics.totalTime}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>首字节时间</span>
          <span className={styles.metricValue}>{metrics.firstByteTime}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>数据块数量</span>
          <span className={styles.metricValue}>{metrics.chunkCount}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>平均块时间</span>
          <span className={styles.metricValue}>{metrics.avgChunkTime}</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Token/秒</span>
          <span className={styles.metricValue}>{metrics.tokensPerSecond}</span>
        </div>
      </div>

      {performance.tokens && (
        <div className={styles.tokenStats}>
          <h5 className={styles.subTitle}>Token统计</h5>
          <div className={styles.tokenGrid}>
            <div className={styles.tokenItem}>
              <span>输入: {performance.tokens.input}</span>
            </div>
            <div className={styles.tokenItem}>
              <span>输出: {performance.tokens.output}</span>
            </div>
            <div className={styles.tokenItem}>
              <span>总计: {performance.tokens.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* 实时性能图表（简化版） */}
      <div className={styles.performanceChart}>
        <h5 className={styles.subTitle}>流式性能</h5>
        <div className={styles.chartContainer}>
          {session.streaming.chunks.map((chunk, index) => {
            const height = Math.min(chunk.parsedContent.length / 10, 40);
            return (
              <div
                key={chunk.id}
                className={styles.chartBar}
                style={{ height: `${height}px` }}
                title={`块 ${index + 1}: ${chunk.parsedContent.length} 字符`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
