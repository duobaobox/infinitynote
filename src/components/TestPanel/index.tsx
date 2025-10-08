/**
 * 测试面板组件
 * 用于监控AI生成过程的调试工具
 */

import React, { useState } from "react";
import { Card, Tabs, Button, Typography, List, Badge, Space, App } from "antd";
import {
  BugOutlined,
  CloseOutlined,
  ClearOutlined,
  DownloadOutlined,
  CopyOutlined,
  ApiOutlined,
  MessageOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTestPanelStore } from "../../store/testPanelStore";
import styles from "./index.module.css";

const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface TestPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const TestPanel: React.FC<TestPanelProps> = ({ visible, onClose }) => {
  const { requests, responses, generations, clearData, exportData, copyData } =
    useTestPanelStore();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [copyLoading, setCopyLoading] = useState(false);

  // 获取App Context中的message实例
  const { message: messageApi } = App.useApp();

  // 处理复制数据
  const handleCopyData = async () => {
    setCopyLoading(true);
    try {
      const success = await copyData();
      if (success) {
        // 显示成功消息
        messageApi.success("调试数据已复制到剪贴板");
      } else {
        messageApi.error("复制失败，请重试");
      }
    } catch (error) {
      console.error("复制失败:", error);
      messageApi.error("复制失败，请重试");
    } finally {
      setCopyLoading(false);
    }
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  // 格式化JSON显示
  const formatJSON = (obj: any, maxLength = 200) => {
    const jsonStr = JSON.stringify(obj, null, 2);
    if (jsonStr.length <= maxLength) {
      return jsonStr;
    }
    return jsonStr.substring(0, maxLength) + "...";
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 概览面板
  const renderOverview = () => {
    const latestGeneration = generations[0];
    const latestRequest = requests[0];
    const latestResponse = responses[0];

    if (!latestGeneration && !latestRequest) {
      return (
        <div className={styles.emptyState}>
          <Text type="secondary">暂无AI生成记录</Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              开始AI生成便签内容后，这里将显示最新一次的详细信息
            </Text>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: "16px 0" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* 生成状态 */}
          <Card size="small" title="生成状态">
            <Space>
              {latestGeneration ? (
                <>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  <Text strong style={{ color: "#52c41a" }}>
                    生成完成
                  </Text>
                </>
              ) : (
                <>
                  <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                  <Text strong style={{ color: "#faad14" }}>
                    生成中或异常
                  </Text>
                </>
              )}
              {latestRequest && (
                <Text type="secondary">
                  {formatTimestamp(latestRequest.timestamp)}
                </Text>
              )}
            </Space>
          </Card>

          {/* 生成摘要 */}
          {latestGeneration && (
            <Card size="small" title="生成摘要">
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>总耗时:</Text>
                  <Text strong>{latestGeneration.totalGenerationTime}ms</Text>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>内容长度:</Text>
                  <Text strong>{latestGeneration.contentLength}字符</Text>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>单词数:</Text>
                  <Text strong>{latestGeneration.wordCount}词</Text>
                </div>
                {latestGeneration.performance && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>首字节时间:</Text>
                      <Text strong>{latestGeneration.performance.ttfb}ms</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>生成速度:</Text>
                      <Text strong>
                        {latestGeneration.performance.streamingRate}字符/秒
                      </Text>
                    </div>
                  </>
                )}
                {latestGeneration.hasThinkingChain && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>思维链步骤:</Text>
                    <Text strong>
                      {latestGeneration.thinkingChain?.totalSteps}步
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {/* API信息 */}
          {latestRequest && (
            <Card size="small" title="API信息">
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>提供商:</Text>
                  <Text strong>{latestRequest.provider}</Text>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>模型:</Text>
                  <Text strong>{latestRequest.model}</Text>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>请求大小:</Text>
                  <Text strong>
                    {formatFileSize(latestRequest.requestSize)}
                  </Text>
                </div>
                {latestResponse && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>响应状态:</Text>
                      <Text
                        strong
                        style={{
                          color: latestResponse.success ? "#52c41a" : "#ff4d4f",
                        }}
                      >
                        {latestResponse.status} {latestResponse.statusText}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>响应大小:</Text>
                      <Text strong>
                        {formatFileSize(latestResponse.responseSize)}
                      </Text>
                    </div>
                    {latestResponse.totalTokens && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>Token使用:</Text>
                        <Text strong>{latestResponse.totalTokens}个</Text>
                      </div>
                    )}
                  </>
                )}
              </Space>
            </Card>
          )}
        </Space>
      </div>
    );
  };

  // 请求列表
  const renderRequestList = () => (
    <List
      size="small"
      dataSource={[...requests].reverse()} // 最新的在前面
      renderItem={(request) => (
        <List.Item key={request.id}>
          <Card size="small" className={styles.logCard}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <div className={styles.logHeader}>
                <Space>
                  <Badge color="blue" />
                  <Text strong>{request.provider}</Text>
                  <Text type="secondary">{request.model}</Text>
                  <Text type="secondary">
                    {formatTimestamp(request.timestamp)}
                  </Text>
                </Space>
              </div>

              <div>
                <Text strong>请求地址: </Text>
                <Text code>{request.endpoint}</Text>
              </div>

              <div>
                <Text strong>便签ID: </Text>
                <Text code>{request.noteId.slice(-8)}</Text>
              </div>

              <div>
                <Text strong>会话ID: </Text>
                <Text code style={{ fontSize: 11 }}>
                  {request.sessionId}
                </Text>
              </div>

              <div>
                <Text strong>请求大小: </Text>
                <Text>{formatFileSize(request.requestSize)}</Text>
              </div>

              <div>
                <Text strong>提示词: </Text>
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true }}
                  copyable={{ text: request.prompt }}
                >
                  {request.prompt}
                </Paragraph>
              </div>

              <div>
                <Text strong>请求体: </Text>
                <Paragraph
                  ellipsis={{ rows: 3, expandable: true }}
                  copyable={{ text: request.body }}
                >
                  <pre>{formatJSON(JSON.parse(request.body), 300)}</pre>
                </Paragraph>
              </div>
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );

  // 响应列表
  const renderResponseList = () => (
    <List
      size="small"
      dataSource={[...responses].reverse()} // 最新的在前面
      renderItem={(response) => (
        <List.Item key={response.id}>
          <Card size="small" className={styles.logCard}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <div className={styles.logHeader}>
                <Space>
                  <Badge color={response.success ? "green" : "red"} />
                  <Text strong>
                    状态: {response.status} {response.statusText}
                  </Text>
                  <Text type="secondary">
                    {formatTimestamp(response.timestamp)}
                  </Text>
                  <Text type="secondary">耗时: {response.duration}ms</Text>
                </Space>
              </div>

              <div>
                <Text strong>请求ID: </Text>
                <Text code>{response.requestId}</Text>
              </div>

              <div>
                <Text strong>响应大小: </Text>
                <Text>{formatFileSize(response.responseSize)}</Text>
              </div>

              {response.totalTokens && (
                <div>
                  <Text strong>Token使用: </Text>
                  <Text>
                    总计{response.totalTokens} (提示{response.promptTokens} +
                    生成{response.completionTokens})
                  </Text>
                </div>
              )}

              {response.firstByteTime && (
                <div>
                  <Text strong>首字节时间: </Text>
                  <Text>{response.firstByteTime}ms</Text>
                </div>
              )}

              {response.error && (
                <div>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    错误:{" "}
                  </Text>
                  <Text type="danger">{response.error}</Text>
                </div>
              )}

              <div>
                <Text strong>响应体: </Text>
                <Paragraph
                  ellipsis={{ rows: 5, expandable: true }}
                  copyable={{ text: response.body }}
                >
                  <pre>{formatJSON(response.body, 500)}</pre>
                </Paragraph>
              </div>
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );

  // 生成结果列表
  const renderGenerationList = () => (
    <List
      size="small"
      dataSource={[...generations].reverse()} // 最新的在前面
      renderItem={(generation) => (
        <List.Item key={generation.id}>
          <Card size="small" className={styles.logCard}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <div className={styles.logHeader}>
                <Space>
                  <Badge color="purple" />
                  <Text strong>{generation.aiData.provider}</Text>
                  <Text type="secondary">{generation.aiData.model}</Text>
                  <Text type="secondary">
                    {formatTimestamp(generation.timestamp)}
                  </Text>
                  {generation.hasThinkingChain && (
                    <Badge
                      count="思维链"
                      style={{ backgroundColor: "#52c41a" }}
                    />
                  )}
                </Space>
              </div>

              <div>
                <Text strong>便签ID: </Text>
                <Text code>{generation.noteId.slice(-8)}</Text>
              </div>

              <div>
                <Text strong>请求ID: </Text>
                <Text code>{generation.requestId}</Text>
              </div>

              <div>
                <Text strong>生成性能: </Text>
                <Text>
                  耗时{generation.totalGenerationTime}ms,
                  {generation.performance &&
                    ` 速度${generation.performance.streamingRate}字符/秒`}
                  ,
                  {generation.streamingSteps &&
                    ` ${generation.streamingSteps}步`}
                  {generation.errorCount &&
                    generation.errorCount > 0 &&
                    `, ${generation.errorCount}个错误`}
                </Text>
              </div>

              <div>
                <Text strong>内容统计: </Text>
                <Text>
                  {generation.contentLength}字符, {generation.wordCount}词
                </Text>
              </div>

              <div>
                <Text strong>提示词: </Text>
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true }}
                  copyable={{ text: generation.aiData.prompt }}
                >
                  {generation.aiData.prompt}
                </Paragraph>
              </div>

              {generation.hasThinkingChain && generation.thinkingChain && (
                <div>
                  <Text strong>思维链步骤: </Text>
                  <Text>{generation.thinkingChain.totalSteps}步</Text>
                  <Paragraph
                    ellipsis={{ rows: 3, expandable: true }}
                    copyable={{
                      text: JSON.stringify(generation.thinkingChain, null, 2),
                    }}
                  >
                    <pre>{formatJSON(generation.thinkingChain, 300)}</pre>
                  </Paragraph>
                </div>
              )}

              <div>
                <Text strong>最终HTML: </Text>
                <Paragraph
                  ellipsis={{ rows: 3, expandable: true }}
                  copyable={{ text: generation.finalContent }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generation.finalContent,
                    }}
                  />
                </Paragraph>
              </div>
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.testPanel}>
      <Card
        title={
          <Space>
            <BugOutlined />
            <span>AI调试面板</span>
            <Badge
              count={requests.length + responses.length + generations.length}
            />
          </Space>
        }
        extra={
          <Space>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyData}
              loading={copyLoading}
            >
              复制数据
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={exportData}
            >
              导出数据
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={clearData}>
              清空
            </Button>
            <Button size="small" icon={<CloseOutlined />} onClick={onClose}>
              关闭
            </Button>
          </Space>
        }
        className={styles.panelCard}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
          <TabPane
            tab={
              <Space>
                <BugOutlined />
                <span>概览</span>
              </Space>
            }
            key="overview"
          >
            <div className={styles.tabContent}>{renderOverview()}</div>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <ApiOutlined />
                <span>API请求</span>
                <Badge count={requests.length} size="small" />
              </Space>
            }
            key="requests"
          >
            <div className={styles.tabContent}>
              {requests.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text type="secondary">暂无API请求记录</Text>
                </div>
              ) : (
                renderRequestList()
              )}
            </div>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <MessageOutlined />
                <span>API响应</span>
                <Badge count={responses.length} size="small" />
              </Space>
            }
            key="responses"
          >
            <div className={styles.tabContent}>
              {responses.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text type="secondary">暂无API响应记录</Text>
                </div>
              ) : (
                renderResponseList()
              )}
            </div>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <FileTextOutlined />
                <span>生成结果</span>
                <Badge count={generations.length} size="small" />
              </Space>
            }
            key="generations"
          >
            <div className={styles.tabContent}>
              {generations.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text type="secondary">暂无生成结果记录</Text>
                </div>
              ) : (
                renderGenerationList()
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};
