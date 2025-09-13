import React, { useState, useEffect } from "react";
import { Modal, Input, Button, List, Tag, Popconfirm, message } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import styles from "./index.module.css";

interface TagItem {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface TagManagerProps {
  visible: boolean;
  onClose: () => void;
  onTagSelect?: (tag: TagItem) => void;
}

const TAG_COLORS = [
  "#f50",
  "#2db7f5",
  "#87d068",
  "#108ee9",
  "#f5222d",
  "#fa541c",
  "#faad14",
  "#fadb14",
  "#a0d911",
  "#52c41a",
  "#13c2c2",
  "#1890ff",
  "#2f54eb",
  "#722ed1",
  "#eb2f96",
  "#fa8c16",
];

export const TagManager: React.FC<TagManagerProps> = ({
  visible,
  onClose,
  onTagSelect,
}) => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editingName, setEditingName] = useState("");

  // 模拟从本地存储加载标签
  useEffect(() => {
    const savedTags = localStorage.getItem("infinitynote-tags");
    if (savedTags) {
      try {
        const parsedTags = JSON.parse(savedTags);
        setTags(
          parsedTags.map((tag: any) => ({
            ...tag,
            createdAt: new Date(tag.createdAt),
          }))
        );
      } catch (error) {
        console.error("加载标签失败:", error);
      }
    }
  }, [visible]);

  // 保存标签到本地存储
  const saveTags = (updatedTags: TagItem[]) => {
    localStorage.setItem("infinitynote-tags", JSON.stringify(updatedTags));
    setTags(updatedTags);
  };

  // 添加新标签
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      message.warning("请输入标签名称");
      return;
    }

    if (tags.some((tag) => tag.name === newTagName.trim())) {
      message.warning("标签名称已存在");
      return;
    }

    const newTag: TagItem = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
      createdAt: new Date(),
    };

    const updatedTags = [...tags, newTag];
    saveTags(updatedTags);
    setNewTagName("");
    message.success("标签添加成功");
  };

  // 删除标签
  const handleDeleteTag = (tagId: string) => {
    const updatedTags = tags.filter((tag) => tag.id !== tagId);
    saveTags(updatedTags);
    message.success("标签删除成功");
  };

  // 开始编辑标签
  const handleStartEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setEditingName(tag.name);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingName.trim()) {
      message.warning("请输入标签名称");
      return;
    }

    if (
      tags.some(
        (tag) => tag.id !== editingTag?.id && tag.name === editingName.trim()
      )
    ) {
      message.warning("标签名称已存在");
      return;
    }

    const updatedTags = tags.map((tag) =>
      tag.id === editingTag?.id ? { ...tag, name: editingName.trim() } : tag
    );
    saveTags(updatedTags);
    setEditingTag(null);
    setEditingName("");
    message.success("标签更新成功");
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingName("");
  };

  return (
    <Modal
      title="标签管理"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      className={styles.tagManager}
    >
      {/* 添加新标签 */}
      <div className={styles.addSection}>
        <Input
          placeholder="输入新标签名称"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onPressEnter={handleAddTag}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>
          添加
        </Button>
      </div>

      {/* 标签列表 */}
      <List
        className={styles.tagList}
        dataSource={tags}
        renderItem={(tag) => (
          <List.Item
            className={styles.tagItem}
            actions={[
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleStartEdit(tag)}
              />,
              <Popconfirm
                title="确定要删除这个标签吗？"
                onConfirm={() => handleDeleteTag(tag.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>,
            ]}
          >
            <div className={styles.tagContent}>
              {editingTag?.id === tag.id ? (
                <div className={styles.editingContainer}>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onPressEnter={handleSaveEdit}
                    size="small"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button size="small" type="primary" onClick={handleSaveEdit}>
                    保存
                  </Button>
                  <Button size="small" onClick={handleCancelEdit}>
                    取消
                  </Button>
                </div>
              ) : (
                <Tag
                  color={tag.color}
                  className={styles.tag}
                  onClick={() => onTagSelect?.(tag)}
                >
                  {tag.name}
                </Tag>
              )}
            </div>
          </List.Item>
        )}
        locale={{ emptyText: "暂无标签" }}
      />
    </Modal>
  );
};

export default TagManager;
