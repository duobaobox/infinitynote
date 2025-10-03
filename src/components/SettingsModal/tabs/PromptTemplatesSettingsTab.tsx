/**
 * PromptTemplatesSettingsTab - AI提示词模板管理设置页面
 *
 * 功能说明：
 * 提供AI提示词模板的管理界面，允许用户查看、编辑、添加和删除提示词模板。
 * 用户可以自定义自己的提示词模板，也可以使用系统预设的模板。
 *
 * 核心功能：
 * - 📝 查看所有提示词模板（系统预设 + 用户自定义）
 * - ✏️ 编辑现有模板
 * - ➕ 添加新模板
 * - 🗑️ 删除自定义模板（系统模板不可删除）
 * - 🔍 搜索和筛选模板
 * - 📁 按分类浏览模板
 *
 * @author InfinityNote Team
 * @since v2.0.0
 * @lastModified 2025-01-03
 */

import React, { useState, useMemo } from "react";
import {
  Card,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  message,
  Tabs,
  Empty,
  Typography,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  StarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BulbOutlined,
  BookOutlined,
  BankOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import {
  PROMPT_CATEGORIES,
  PROMPT_TEMPLATES,
  type PromptTemplate,
} from "../../../config/promptTemplates";

const { Search } = Input;
const { TextArea } = Input;
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
  StarOutlined,
};

const renderIcon = (iconName: string) => {
  const IconComponent = IconMap[iconName];
  return IconComponent ? <IconComponent /> : <EditOutlined />;
};

interface PromptTemplatesSettingsTabProps {
  // 可以添加一些属性，比如自定义模板的保存/加载
}

/**
 * 提示词模板设置标签页组件
 */
export const PromptTemplatesSettingsTab: React.FC<
  PromptTemplatesSettingsTabProps
> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(
    null
  );
  const [form] = Form.useForm();

  // 这里应该从 localStorage 或其他持久化存储中加载用户自定义的模板
  const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>([]);

  // 所有模板 = 系统模板 + 自定义模板
  const allTemplates = useMemo(() => {
    return [...PROMPT_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // 搜索和筛选
  const filteredTemplates = useMemo(() => {
    let templates = allTemplates;

    // 按分类筛选
    if (activeTab !== "all") {
      templates = templates.filter((t) => t.category === activeTab);
    }

    // 搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [allTemplates, activeTab, searchQuery]);

  // 打开编辑/新建模板对话框
  const handleOpenModal = (template?: PromptTemplate) => {
    if (template) {
      setEditingTemplate(template);
      form.setFieldsValue(template);
    } else {
      setEditingTemplate(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // 关闭对话框
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingTemplate(null);
    form.resetFields();
  };

  // 保存模板
  const handleSaveTemplate = async () => {
    try {
      const values = await form.validateFields();

      if (editingTemplate) {
        // 编辑现有模板
        const isSystemTemplate = PROMPT_TEMPLATES.find(
          (t) => t.id === editingTemplate.id
        );
        if (isSystemTemplate) {
          message.warning("系统模板不可编辑，将创建为新的自定义模板");
          // 创建新的自定义模板
          const newTemplate: PromptTemplate = {
            ...values,
            id: `custom_${Date.now()}`,
          };
          setCustomTemplates([...customTemplates, newTemplate]);
        } else {
          // 更新自定义模板
          setCustomTemplates(
            customTemplates.map((t) =>
              t.id === editingTemplate.id ? { ...t, ...values } : t
            )
          );
        }
        message.success("模板已更新");
      } else {
        // 新建模板
        const newTemplate: PromptTemplate = {
          ...values,
          id: `custom_${Date.now()}`,
        };
        setCustomTemplates([...customTemplates, newTemplate]);
        message.success("模板已添加");
      }

      handleCloseModal();
    } catch (error) {
      console.error("保存模板失败:", error);
    }
  };

  // 删除模板
  const handleDeleteTemplate = (template: PromptTemplate) => {
    const isSystemTemplate = PROMPT_TEMPLATES.find((t) => t.id === template.id);
    if (isSystemTemplate) {
      message.error("系统模板不可删除");
      return;
    }

    setCustomTemplates(customTemplates.filter((t) => t.id !== template.id));
    message.success("模板已删除");
  };

  // 渲染模板卡片
  const renderTemplateCard = (template: PromptTemplate) => {
    const isSystemTemplate = PROMPT_TEMPLATES.find((t) => t.id === template.id);

    return (
      <Card
        key={template.id}
        style={{ marginBottom: 16 }}
        size="small"
        actions={[
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(template)}
            />
          </Tooltip>,
          <Popconfirm
            title="确定要删除此模板吗？"
            onConfirm={() => handleDeleteTemplate(template)}
            okText="确定"
            cancelText="取消"
            disabled={!!isSystemTemplate}
          >
            <Tooltip title={isSystemTemplate ? "系统模板不可删除" : "删除"}>
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                disabled={!!isSystemTemplate}
              />
            </Tooltip>
          </Popconfirm>,
        ]}
      >
        <Card.Meta
          avatar={renderIcon(template.icon)}
          title={
            <Space>
              <Text strong>{template.name}</Text>
              {isSystemTemplate && <Tag color="blue">系统</Tag>}
              {template.tags.slice(0, 2).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          }
          description={
            <div>
              <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                {template.description}
              </Paragraph>
              <Paragraph
                ellipsis={{ rows: 3 }}
                type="secondary"
                style={{ fontSize: 12, marginBottom: 0 }}
              >
                {template.prompt}
              </Paragraph>
            </div>
          }
        />
      </Card>
    );
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 头部：搜索和新建按钮 - 固定不滚动 */}
      <div style={{ padding: "0 24px 16px", flexShrink: 0 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text strong style={{ fontSize: 16 }}>
              提示词模板管理（开发中）
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              新建模板
            </Button>
          </div>
          <Search
            placeholder="搜索模板名称、描述或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Text type="secondary">
            共 {allTemplates.length} 个模板（系统: {PROMPT_TEMPLATES.length}
            ，自定义: {customTemplates.length}）
          </Text>
        </Space>
      </div>

      {/* 分类标签页 - 可滚动区域 */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "0 24px",
        }}
      >
        <style>
          {`
            .prompt-templates-tabs {
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .prompt-templates-tabs > .ant-tabs-nav {
              flex-shrink: 0;
              margin-bottom: 16px;
            }
            .prompt-templates-tabs > .ant-tabs-content-holder {
              flex: 1;
              overflow: hidden;
            }
            .prompt-templates-tabs .ant-tabs-content {
              height: 100%;
            }
            .prompt-templates-tabs .ant-tabs-tabpane {
              height: 100%;
              overflow-y: auto;
              padding-right: 8px;
            }
            .prompt-templates-tabs .ant-tabs-tabpane::-webkit-scrollbar {
              width: 6px;
            }
            .prompt-templates-tabs .ant-tabs-tabpane::-webkit-scrollbar-track {
              background: transparent;
            }
            .prompt-templates-tabs .ant-tabs-tabpane::-webkit-scrollbar-thumb {
              background: #d9d9d9;
              border-radius: 3px;
            }
            .prompt-templates-tabs .ant-tabs-tabpane::-webkit-scrollbar-thumb:hover {
              background: #bfbfbf;
            }
          `}
        </style>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="prompt-templates-tabs"
        >
          <TabPane tab="全部" key="all">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(renderTemplateCard)
            ) : (
              <Empty description="未找到匹配的模板" />
            )}
          </TabPane>

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
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map(renderTemplateCard)
              ) : (
                <Empty description="此分类暂无模板" />
              )}
            </TabPane>
          ))}
        </Tabs>
      </div>

      {/* 编辑/新建模板对话框 */}
      <Modal
        title={editingTemplate ? "编辑模板" : "新建模板"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={handleSaveTemplate}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: "请输入模板名称" }]}
          >
            <Input placeholder="例如：文章大纲" />
          </Form.Item>

          <Form.Item
            name="description"
            label="模板描述"
            rules={[{ required: true, message: "请输入模板描述" }]}
          >
            <Input placeholder="简要描述此模板的用途" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: "请选择分类" }]}
          >
            <Select placeholder="选择模板分类">
              {PROMPT_CATEGORIES.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="prompt"
            label="提示词内容"
            rules={[{ required: true, message: "请输入提示词内容" }]}
          >
            <TextArea
              rows={6}
              placeholder="输入提示词模板内容，可以使用 {{变量}} 作为占位符"
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
            rules={[{ required: true, message: "请输入至少一个标签" }]}
          >
            <Select
              mode="tags"
              placeholder="输入标签后按回车添加"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item name="icon" label="图标" initialValue="EditOutlined">
            <Select placeholder="选择图标">
              <Select.Option value="EditOutlined">编辑</Select.Option>
              <Select.Option value="FileTextOutlined">文档</Select.Option>
              <Select.Option value="BarChartOutlined">图表</Select.Option>
              <Select.Option value="BulbOutlined">灯泡</Select.Option>
              <Select.Option value="BookOutlined">书本</Select.Option>
              <Select.Option value="BankOutlined">银行</Select.Option>
              <Select.Option value="HomeOutlined">首页</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="example" label="示例（可选）">
            <Input placeholder="例如：为'人工智能的发展趋势'生成文章大纲" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromptTemplatesSettingsTab;
