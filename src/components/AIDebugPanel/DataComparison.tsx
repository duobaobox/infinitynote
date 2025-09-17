/**
 * AI调试面板 - 数据对比子组件
 */

import React, { useState } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import type { AIDebugSession, AIDebugComparison } from "../../types/debug";
import styles from "./DataComparison.module.css";

interface DataComparisonProps {
  session: AIDebugSession;
  comparison?: AIDebugComparison | null;
}

export const DataComparison: React.FC<DataComparisonProps> = ({
  session,
  comparison,
}) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">(
    "side-by-side"
  );
  const [showRaw, setShowRaw] = useState(false);

  const data = {
    originalMarkdown: session.response?.aiData?.originalMarkdown || "",
    finalHTML: session.response?.finalContent || "",
    streamingContent: session.streaming.currentContent,
    thinkingContent:
      session.thinkingChain?.steps.map((s) => s.content).join("\n\n") || "",
  };

  const formatContent = (content: string, maxLength: number = 500) => {
    if (!content) return "(无内容)";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const calculateContentDiff = (content1: string, content2: string) => {
    const words1 = content1.split(/\s+/);
    const words2 = content2.split(/\s+/);

    return {
      added: Math.max(0, words2.length - words1.length),
      removed: Math.max(0, words1.length - words2.length),
      similarity:
        words1.length === 0
          ? 0
          : Math.round(
              (Math.min(words1.length, words2.length) /
                Math.max(words1.length, words2.length)) *
                100
            ),
    };
  };

  const markdownToHTMLDiff = calculateContentDiff(
    data.originalMarkdown,
    data.finalHTML
  );
  const streamingToFinalDiff = calculateContentDiff(
    data.streamingContent,
    data.finalHTML
  );

  return (
    <div className={styles.dataComparison}>
      {/* 控制栏 */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>视图:</span>
          <button
            className={`${styles.controlButton} ${
              viewMode === "side-by-side" ? styles.active : ""
            }`}
            onClick={() => setViewMode("side-by-side")}
          >
            并排
          </button>
          <button
            className={`${styles.controlButton} ${
              viewMode === "unified" ? styles.active : ""
            }`}
            onClick={() => setViewMode("unified")}
          >
            统一
          </button>
        </div>

        <div className={styles.controlGroup}>
          <button
            className={`${styles.controlButton} ${
              showRaw ? styles.active : ""
            }`}
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            原始数据
          </button>
        </div>
      </div>

      {/* 差异统计 */}
      <div className={styles.diffStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Markdown → HTML</span>
          <span className={styles.statValue}>
            相似度: {markdownToHTMLDiff.similarity}%
            {markdownToHTMLDiff.added > 0 && (
              <span className={styles.added}> +{markdownToHTMLDiff.added}</span>
            )}
            {markdownToHTMLDiff.removed > 0 && (
              <span className={styles.removed}>
                {" "}
                -{markdownToHTMLDiff.removed}
              </span>
            )}
          </span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>流式 → 最终</span>
          <span className={styles.statValue}>
            相似度: {streamingToFinalDiff.similarity}%
            {streamingToFinalDiff.added > 0 && (
              <span className={styles.added}>
                {" "}
                +{streamingToFinalDiff.added}
              </span>
            )}
            {streamingToFinalDiff.removed > 0 && (
              <span className={styles.removed}>
                {" "}
                -{streamingToFinalDiff.removed}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 数据对比内容 */}
      <div className={`${styles.comparisonContent} ${styles[viewMode]}`}>
        {/* 原始Markdown */}
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>原始Markdown</span>
            <span className={styles.contentLength}>
              ({data.originalMarkdown.length} 字符)
            </span>
          </div>
          <div className={styles.contentBox}>
            <pre className={styles.contentText}>
              {formatContent(data.originalMarkdown)}
            </pre>
          </div>
        </div>

        {/* 最终HTML */}
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>最终HTML</span>
            <span className={styles.contentLength}>
              ({data.finalHTML.length} 字符)
            </span>
          </div>
          <div className={styles.contentBox}>
            {showRaw ? (
              <pre className={styles.contentText}>
                {formatContent(data.finalHTML)}
              </pre>
            ) : (
              <div
                className={styles.htmlPreview}
                dangerouslySetInnerHTML={{
                  __html: data.finalHTML.substring(0, 1000),
                }}
              />
            )}
          </div>
        </div>

        {/* 流式内容 */}
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>流式累计内容</span>
            <span className={styles.contentLength}>
              ({data.streamingContent.length} 字符)
            </span>
          </div>
          <div className={styles.contentBox}>
            <pre className={styles.contentText}>
              {formatContent(data.streamingContent)}
            </pre>
          </div>
        </div>

        {/* 思维链内容 */}
        {data.thinkingContent && (
          <div className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>思维链内容</span>
              <span className={styles.contentLength}>
                ({data.thinkingContent.length} 字符)
              </span>
            </div>
            <div className={styles.contentBox}>
              <pre className={styles.contentText}>
                {formatContent(data.thinkingContent)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 差异详情 */}
      {comparison?.differences && comparison.differences.length > 0 && (
        <div className={styles.diffDetails}>
          <h5 className={styles.diffTitle}>详细差异分析</h5>
          {comparison.differences.map((diff, index) => (
            <div
              key={index}
              className={`${styles.diffItem} ${styles[diff.type]}`}
            >
              <div className={styles.diffType}>{diff.type}</div>
              <div className={styles.diffLocation}>{diff.location}</div>
              <div className={styles.diffDescription}>{diff.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* 流式进度可视化 */}
      <div className={styles.streamingProgress}>
        <h5 className={styles.progressTitle}>流式生成进度</h5>
        <div className={styles.progressBar}>
          {session.streaming.chunks.map((chunk, index) => {
            const progress =
              (chunk.parsedContent.length / data.streamingContent.length) * 100;
            return (
              <div
                key={chunk.id}
                className={styles.progressSegment}
                style={{
                  width: `${Math.max(progress, 2)}%`,
                  backgroundColor: `hsl(${200 + index * 10}, 70%, 50%)`,
                }}
                title={`块 ${index + 1}: ${chunk.parsedContent.length} 字符`}
              />
            );
          })}
        </div>
        <div className={styles.progressLabels}>
          <span>开始</span>
          <span>{session.streaming.chunks.length} 个数据块</span>
          <span>完成</span>
        </div>
      </div>
    </div>
  );
};

export default DataComparison;
