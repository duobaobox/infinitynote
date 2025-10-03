import React, { useState, useCallback, useEffect } from "react";
import { Input, Button, Space, Tooltip } from "antd";
import {
  PlusOutlined,
  RobotOutlined,
  MergeOutlined,
  LoadingOutlined,
  CloseOutlined,
  DragOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { NoteWorkbenchProps, WorkbenchStatus } from "./types";
import styles from "./index.module.css";

/**
 * 便签工作台组件
 *
 * 功能特性：
 * - 提供AI生成便签的提示词输入框
 * - 支持创建空白便签
 * - AI生成时支持停止并删除正在生成的便签
 * - 使用Ant Design标准按钮样式
 * - 响应式布局适配不同屏幕尺寸
 * - 与现有主题系统兼容
 * - 支持快捷键操作
 * - 状态反馈和加载指示
 *
 * 使用场景：
 * - 用户输入提示词，AI生成便签内容
 * - 留空输入框，创建空白便签
 * - AI生成过程中可停止并删除便签
 */
export const NoteWorkbench: React.FC<NoteWorkbenchProps> = ({
  value = "",
  onChange,
  onAddNote,
  onStopAI,
  disabled = false,
  loading = false,
  placeholder = "输入文本AI生成便签，留空创建空白便签...",
  aiGenerating = {},
  connectedNotes = [],
  isDragMode = false,
  onToggleDragMode,
  onOrganizeNotes,
}) => {
  // 内部状态管理
  const [inputValue, setInputValue] = useState(value);
  const [status, setStatus] = useState<WorkbenchStatus>("idle");
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  // AI状态计算
  const isAnyAIGenerating = Object.values(aiGenerating).some(Boolean);

  // 检测是否为连接模式
  const isConnectedMode = connectedNotes && connectedNotes.length > 0;

  /**
   * 处理输入框值变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };
  /**
   * 处理添加便签按钮点击
   */
  const handleAddNote = useCallback(async () => {
    if (disabled || loading || isAnyAIGenerating) return;

    const prompt = inputValue.trim();
    setStatus("loading");

    try {
      await onAddNote?.(prompt || undefined, isConnectedMode);

      // AI生成成功后清空输入框
      if (prompt) {
        setInputValue("");
        onChange?.("");
      }

      // 直接重置到idle状态
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      console.error("添加便签失败:", error);

      // 短暂显示错误状态后重置
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [
    inputValue,
    disabled,
    loading,
    isAnyAIGenerating,
    onAddNote,
    onChange,
    isConnectedMode,
  ]);

  /**
   * 处理停止AI生成（仅在悬浮时显示）
   */
  const handleStopAI = useCallback(() => {
    onStopAI?.();
    // 清空输入框
    setInputValue("");
    onChange?.("");
    setStatus("idle");
  }, [onStopAI, onChange]);

  /**
   * 处理回车键提交
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  // 同步外部value变化
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 检测是否有输入内容来决定按钮状态
  const hasPrompt = inputValue.trim().length > 0;

  // 计算按钮状态
  const isButtonDisabled =
    disabled || ((loading || status === "loading") && !isAnyAIGenerating);

  // 动态占位符 - 连接模式下显示特殊提示
  const dynamicPlaceholder = isAnyAIGenerating
    ? "AI正在生成便签..."
    : isConnectedMode
    ? "请输入指令处理便签（如:汇总、分析、整理等）"
    : placeholder;

  // 按钮点击处理
  const handleButtonClick = () => {
    if (isAnyAIGenerating) {
      handleStopAI();
    } else {
      handleAddNote();
    }
  };

  // 按钮类型和图标 - 连接模式下使用不同的样式
  const buttonType = isAnyAIGenerating
    ? "default"
    : isConnectedMode
    ? "default"
    : "primary";
  const buttonIcon = isAnyAIGenerating ? (
    isButtonHovered ? (
      <CloseOutlined />
    ) : (
      <LoadingOutlined spin={true} />
    ) // 生成中：悬停时显示停止图标，正常时显示加载图标
  ) : isConnectedMode ? (
    <MergeOutlined /> // 连接模式下使用合并图标
  ) : hasPrompt ? (
    <RobotOutlined />
  ) : (
    <PlusOutlined />
  );

  // 按钮样式 - 在生成状态或连接模式下使用不同颜色
  const buttonStyle = isAnyAIGenerating
    ? { backgroundColor: "#ff4d4f", borderColor: "#ff4d4f", color: "white" } // 红色表示停止状态
    : isConnectedMode
    ? { backgroundColor: "#52c41a", borderColor: "#52c41a", color: "white" } // 绿色表示连接模式
    : {};

  // 工具提示文本
  const getTooltipText = () => {
    if (isAnyAIGenerating) {
      return "停止生成并删除便签";
    }

    if (isConnectedMode) {
      return "汇总连接的便签内容";
    }

    if (hasPrompt) {
      return "AI生成便签";
    }

    return "创建空白便签";
  };

  return (
    <div
      className={styles.consoleContainer}
      data-loading={loading || status === "loading"}
      data-connected={isConnectedMode}
    >
      {/* 第一行：输入框和添加按钮 */}
      <div className={styles.consoleMainRow}>
        {/* 输入框容器 */}
        <div className={styles.consoleInputContainer}>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={dynamicPlaceholder}
            disabled={disabled || isAnyAIGenerating}
            className={styles.consoleInput}
            autoComplete="off"
            size="small"
          />
        </div>

        {/* 按钮容器 */}
        <div className={styles.consoleExternalButtons}>
          <Button
            type={buttonType}
            shape="circle"
            size="small"
            icon={buttonIcon}
            style={buttonStyle}
            loading={false} // 不使用loading状态，以便按钮可以被点击停止
            onClick={handleButtonClick}
            disabled={isButtonDisabled}
            title={getTooltipText()}
            className={styles.addExternalButton}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
          />
        </div>
      </div>

      {/* 第二行：画布工具栏 */}
      <div className={styles.canvasToolbarRow}>
        <Space size={8} style={{ justifyContent: "flex-start", width: "100%" }}>
          <Tooltip
            title={isDragMode ? "关闭拖动模式" : "开启拖动模式（空格）"}
            placement="top"
          >
            <Button
              type={isDragMode ? "primary" : "default"}
              size="small"
              icon={<DragOutlined />}
              onClick={() => onToggleDragMode?.(!isDragMode)}
              className={styles.toolbarButton}
            />
          </Tooltip>

          <Tooltip title="一键整理便签" placement="top">
            <Button
              type="default"
              size="small"
              icon={<AppstoreOutlined />}
              onClick={onOrganizeNotes}
              className={styles.toolbarButton}
            />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
};

export default NoteWorkbench;
