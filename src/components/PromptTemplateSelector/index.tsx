import React, { useState, useCallback, useMemo } from "react";
import {
  Modal,
  Input,
  Tabs,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  StarOutlined,
  EditOutlined,
  BarChartOutlined,
  BulbOutlined,
  BookOutlined,
  BankOutlined,
  HomeOutlined,
  FileTextOutlined,
  MailOutlined,
  TeamOutlined,
  CompressOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  ScheduleOutlined,
  HeartOutlined,
  CarOutlined,
} from "@ant-design/icons";
import {
  PROMPT_TEMPLATES,
  PROMPT_CATEGORIES,
  getTemplatesByCategory,
  searchTemplates,
  getPopularTemplates,
  type PromptTemplate,
} from "../../config/promptTemplates";
import styles from "./index.module.css";

const { Search } = Input;
const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 图标映射
const IconMap: Record<string, React.ComponentType<any>> = {
  EditOutlined,
  BarChartOutlined,
  BulbOutlined,
  BookOutlined,
  BankOutlined,
  HomeOutlined,
  FileTextOutlined,
  MailOutlined,
  TeamOutlined,
  CompressOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  ScheduleOutlined,
  HeartOutlined,
  CarOutlined,
  StarOutlined,
};

const renderIcon = (iconName: string) => {
  const IconComponent = IconMap[iconName];
  return IconComponent ? <IconComponent /> : <EditOutlined />;
};

interface PromptTemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: PromptTemplate) => void;
}

/**
 * 提示词模板选择器组件
 *
 * 功能特性：
 * - 分类浏览模板
 * - 搜索模板功能
 * - 热门模板推荐
 * - 模板预览和选择
 * - 自定义提示词输入
 */
export const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("popular");
  const [customPrompt, setCustomPrompt] = useState("");

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTemplates(searchQuery);
  }, [searchQuery]);

  // 热门模板
  const popularTemplates = useMemo(() => getPopularTemplates(), []);

  // 处理模板选择
  const handleTemplateSelect = useCallback(
    (template: PromptTemplate) => {
      onSelect(template);
      onClose();
    },
    [onSelect, onClose]
  );

  // 处理自定义提示词
  const handleCustomPrompt = useCallback(() => {
    if (!customPrompt.trim()) return;

    const customTemplate: PromptTemplate = {
      id: "custom",
      name: "自定义提示词",
      description: "用户自定义的提示词",
      category: "custom",
      prompt: customPrompt.trim(),
      icon: "EditOutlined",
      tags: ["自定义"],
    };

    onSelect(customTemplate);
    onClose();
    setCustomPrompt("");
  }, [customPrompt, onSelect, onClose]);

  // 渲染模板卡片
  const renderTemplateCard = useCallback(
    (template: PromptTemplate) => (
      <Card
        key={template.id}
        className={styles.templateCard}
        hoverable
        onClick={() => handleTemplateSelect(template)}
        actions={[
          <Button
            type="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleTemplateSelect(template);
            }}
          >
            使用模板
          </Button>,
        ]}
      >
        <Card.Meta
          avatar={renderIcon(template.icon)}
          title={
            <Space>
              <Text strong>{template.name}</Text>
              {template.tags.slice(0, 2).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          }
          description={
            <div>
              <Paragraph ellipsis={{ rows: 2 }} className={styles.description}>
                {template.description}
              </Paragraph>
              {template.example && (
                <Text type="secondary" className={styles.example}>
                  示例：{template.example}
                </Text>
              )}
            </div>
          }
        />
      </Card>
    ),
    [handleTemplateSelect]
  );

  return (
    <Modal
      title="选择提示词模板"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className={styles.templateModal}
    >
      <div className={styles.modalContent}>
        {/* 搜索框 */}
        <div className={styles.searchSection}>
          <Search
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            size="large"
          />
        </div>

        {/* 搜索结果 */}
        {searchQuery && (
          <div className={styles.searchResults}>
            <Text strong>搜索结果 ({searchResults.length})</Text>
            {searchResults.length > 0 ? (
              <div className={styles.templateGrid}>
                {searchResults.map(renderTemplateCard)}
              </div>
            ) : (
              <Empty description="未找到相关模板" />
            )}
          </div>
        )}

        {/* 模板分类 */}
        {!searchQuery && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className={styles.templateTabs}
          >
            {/* 热门模板 */}
            <TabPane
              tab={
                <Space>
                  <StarOutlined />
                  热门推荐
                </Space>
              }
              key="popular"
            >
              <div className={styles.templateGrid}>
                {popularTemplates.map(renderTemplateCard)}
              </div>
            </TabPane>

            {/* 分类模板 */}
            {PROMPT_CATEGORIES.map((category) => (
              <TabPane
                tab={
                  <Space>
                    {renderIcon(category.icon)}
                    {category.name}
                  </Space>
                }
                key={category.id}
              >
                <div className={styles.categoryDescription}>
                  <Text type="secondary">{category.description}</Text>
                </div>
                <div className={styles.templateGrid}>
                  {getTemplatesByCategory(category.id).map(renderTemplateCard)}
                </div>
              </TabPane>
            ))}

            {/* 自定义提示词 */}
            <TabPane
              tab={
                <Space>
                  <EditOutlined />
                  自定义
                </Space>
              }
              key="custom"
            >
              <div className={styles.customSection}>
                <Text strong>输入自定义提示词：</Text>
                <Input.TextArea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="请输入您的提示词内容..."
                  rows={6}
                  className={styles.customInput}
                />
                <div className={styles.customActions}>
                  <Button
                    type="primary"
                    onClick={handleCustomPrompt}
                    disabled={!customPrompt.trim()}
                  >
                    使用自定义提示词
                  </Button>
                </div>
              </div>
            </TabPane>
          </Tabs>
        )}
      </div>
    </Modal>
  );
};

export default PromptTemplateSelector;
