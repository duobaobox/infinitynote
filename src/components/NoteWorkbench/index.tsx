import React, { useState, useCallback, useEffect } from "react";
import { Input, Button } from "antd";
import { PlusOutlined, RobotOutlined } from "@ant-design/icons";
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
  currentGeneratingNoteId,
}) => {
  // 内部状态管理
  const [inputValue, setInputValue] = useState(value);
  const [status, setStatus] = useState<WorkbenchStatus>("idle");

  // AI状态计算
  const isAnyAIGenerating = Object.values(aiGenerating).some(Boolean);

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
      await onAddNote?.(prompt || undefined);

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
  }, [inputValue, disabled, loading, isAnyAIGenerating, onAddNote, onChange]);

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

  // 动态占位符
  const dynamicPlaceholder = isAnyAIGenerating
    ? "AI正在生成便签..."
    : placeholder;

  // 按钮点击处理
  const handleButtonClick = () => {
    if (isAnyAIGenerating) {
      handleStopAI();
    } else {
      handleAddNote();
    }
  };

  // 工具提示文本
  const getTooltipText = () => {
    if (isAnyAIGenerating) {
      return "停止生成并删除便签";
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
    >
      {/* 主输入区域 */}
      <div className={styles.consoleInputArea}>
        {/* 输入框容器 */}
        <div className={styles.consoleInputContainer}>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={dynamicPlaceholder}
            disabled={disabled || isAnyAIGenerating} // AI生成时禁用输入框
            className={styles.consoleInput}
            autoComplete="off"
          />
        </div>

        {/* 外部按钮容器 */}
        <div className={styles.consoleExternalButtons}>
          <Button
            type="primary"
            shape="circle"
            icon={hasPrompt ? <RobotOutlined /> : <PlusOutlined />}
            loading={isAnyAIGenerating}
            onClick={handleButtonClick}
            disabled={isButtonDisabled}
            title={getTooltipText()}
            className={
              isAnyAIGenerating ? styles.aiGeneratingButton : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

export default NoteWorkbench;
