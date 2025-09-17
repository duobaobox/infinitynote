import React, { useState, useCallback, useEffect } from "react";
import { Input, Button } from "antd";
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
import type { NoteWorkbenchProps, WorkbenchStatus } from "./types";
import styles from "./index.module.css";

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-expect-error - iconRegistry包含多种类型，需要忽略类型检查
  return IconComponent ? <IconComponent /> : null;
};

/**
 * 便签工作台组件
 *
 * 功能特性：
 * - 提供AI生成便签的提示词输入框
 * - 支持创建空白便签
 * - 响应式布局适配不同屏幕尺寸
 * - 与现有主题系统兼容
 * - 支持快捷键操作
 * - 状态反馈和加载指示
 *
 * 使用场景：
 * - 用户输入提示词，AI生成便签内容
 * - 留空输入框，创建空白便签
 */
export const NoteWorkbench: React.FC<NoteWorkbenchProps> = ({
  value = "",
  onChange,
  onAddNote,
  disabled = false,
  loading = false,
  placeholder = "输入文本AI生成便签，留空创建空白便签...",
  aiGenerating = {},
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

      // 只有在没有AI生成时才清空输入框（AI生成时在上层组件处理）
      if (!isAnyAIGenerating && !prompt) {
        setInputValue("");
        onChange?.("");
      }

      // 直接重置到idle状态，不显示绿色成功状态
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      console.error("添加便签失败:", error);

      // 短暂显示错误状态后重置
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [inputValue, disabled, loading, isAnyAIGenerating, onAddNote, onChange]);

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

  // 计算按钮状态
  const isButtonDisabled =
    disabled || loading || status === "loading" || isAnyAIGenerating;
  const isLoading = loading || status === "loading" || isAnyAIGenerating;

  // 动态占位符
  const dynamicPlaceholder = isAnyAIGenerating
    ? "AI正在生成便签..."
    : placeholder;

  // 检测是否有输入内容来决定按钮状态
  const hasPrompt = inputValue.trim().length > 0;

  // 动态按钮配置
  const buttonConfig = {
    icon: hasPrompt ? "RobotOutlined" : "PlusOutlined",
    tooltip: hasPrompt ? "AI生成便签" : "创建空白便签",
    type: hasPrompt ? ("default" as const) : ("primary" as const),
    className: hasPrompt
      ? `${styles.addExternalButton} ${styles.aiButton}`
      : styles.addExternalButton,
  };

  return (
    <div className={styles.consoleContainer} data-loading={isLoading}>
      {/* 主输入区域 */}
      <div className={styles.consoleInputArea}>
        {/* 输入框容器 */}
        <div className={styles.consoleInputContainer}>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={dynamicPlaceholder}
            disabled={disabled}
            className={styles.consoleInput}
            autoComplete="off"
          />
        </div>

        {/* 外部按钮容器 */}
        <div className={styles.consoleExternalButtons}>
          <Button
            type={buttonConfig.type}
            shape="circle"
            icon={<DynamicIcon type={buttonConfig.icon as IconType} />}
            onClick={handleAddNote}
            disabled={isButtonDisabled}
            loading={isLoading}
            className={buttonConfig.className}
            title={buttonConfig.tooltip}
            data-success={status === "success"}
            data-error={status === "error"}
            data-has-prompt={hasPrompt}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteWorkbench;
