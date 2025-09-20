import React, { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  BgColorsOutlined,
  CopyOutlined,
  PushpinOutlined,
  DeleteOutlined,
  RobotOutlined,
  SettingOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { NoteToolbarProps, ToolbarAction } from "./types";
import {
  BASE_TOOLBAR_BUTTONS,
  AI_TOOLBAR_BUTTONS,
  COLOR_OPTIONS,
} from "./constants";
// import { AIGenerationControl } from "../AIGenerationControl";
import styles from "./index.module.css";

// 图标映射组件
const IconMap: Record<string, React.ComponentType<any>> = {
  BgColorsOutlined,
  CopyOutlined,
  PushpinOutlined,
  DeleteOutlined,
  RobotOutlined,
  SettingOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckOutlined,
};

const renderIcon = (iconName: string) => {
  const IconComponent = IconMap[iconName];
  return IconComponent ? <IconComponent /> : <span>{iconName}</span>;
};

/**
 * 便签工具栏组件 - 纯CSS定位版本
 *
 * 功能特性：
 * - 浮动在便签右侧8px位置
 * - 垂直排列的功能按钮
 * - 支持颜色选择器
 * - 响应式设计和暗黑模式适配
 * - 动画效果和交互反馈
 */
export const NoteToolbar = memo<NoteToolbarProps>(
  ({
    noteId,
    visible,
    onAction,
    onClose,
    color,
    hasAIContent = false,
    isAIGenerating = false,
    isEditingAIContent = false,
  }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    // const [showAIGeneration, setShowAIGeneration] = useState(false);
    const [currentNoteColor, setCurrentNoteColor] = useState(color); // 用 props.color 初始化
    const toolbarRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    // 动态生成按钮列表
    const getVisibleButtons = useCallback(() => {
      const buttons = [];

      // AI相关按钮
      if (isAIGenerating) {
        // 正在生成时，只显示AI设置
        buttons.push(AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-config")!);
      } else if (hasAIContent) {
        if (isEditingAIContent) {
          // 正在编辑AI内容时
          buttons.push(
            AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-finish-editing")!
          );
          buttons.push(
            AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-regenerate")!
          );
        } else {
          // 有AI内容但未编辑时
          buttons.push(
            AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-edit-content")!
          );
          buttons.push(
            AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-regenerate")!
          );
        }
        buttons.push(AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-config")!);
      } else {
        // 没有AI内容时
        buttons.push(
          AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-generate")!
        );
        buttons.push(AI_TOOLBAR_BUTTONS.find((btn) => btn.id === "ai-config")!);
      }

      // 基础功能按钮
      buttons.push(...BASE_TOOLBAR_BUTTONS);

      return buttons.filter(Boolean);
    }, [hasAIContent, isAIGenerating, isEditingAIContent]); // 处理按钮点击
    const handleButtonClick = useCallback(
      (action: ToolbarAction) => {
        if (action === "color") {
          setShowColorPicker(!showColorPicker);
          return;
        }

        if (action === "ai-config") {
          // 触发AI配置，这里可以打开设置模态框的AI标签页
          onAction?.("ai-config", { noteId });
          return;
        }

        onAction?.(action, { noteId });

        // 某些操作后自动关闭工具栏
        if (["delete", "archive", "duplicate", "export"].includes(action)) {
          onClose?.();
        }
      },
      [showColorPicker, onAction, onClose, noteId]
    );

    // 同步 props.color 到 currentNoteColor
    useEffect(() => {
      setCurrentNoteColor(color);
    }, [color]);

    // 处理颜色选择
    const handleColorSelect = useCallback(
      (colorValue: string) => {
        setCurrentNoteColor(colorValue);
        onAction?.("color", { noteId, color: colorValue });
        setShowColorPicker(false);
      },
      [onAction, noteId]
    );

    // 点击外部关闭颜色选择器
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (
          showColorPicker &&
          colorPickerRef.current &&
          !colorPickerRef.current.contains(target) &&
          !target.closest("[data-color-trigger]")
        ) {
          setShowColorPicker(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showColorPicker]);

    // ESC键关闭
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          if (showColorPicker) {
            setShowColorPicker(false);
          } else {
            onClose?.();
          }
        }
      };

      if (visible) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [visible, showColorPicker, onClose]);

    if (!visible) return null;

    // 纯CSS定位，不再需要JavaScript计算位置
    return (
      <div
        ref={toolbarRef}
        className={styles.noteToolbar}
        onClick={(e) => e.stopPropagation()}
        data-note-toolbar
      >
        {getVisibleButtons().map((button, index) => (
          <React.Fragment key={button.id}>
            {button.separator && index > 0 && (
              <div className={styles.separator} />
            )}
            <button
              className={`${styles.toolbarButton} ${
                button.danger ? styles.danger : ""
              }`}
              onClick={() => handleButtonClick(button.id)}
              disabled={button.disabled}
              data-color-trigger={button.id === "color" ? "true" : undefined}
              title={button.tooltip}
            >
              {renderIcon(button.icon)}
              <div className={styles.tooltip}>{button.tooltip}</div>
            </button>
          </React.Fragment>
        ))}

        {/* 颜色选择器 */}
        {showColorPicker && (
          <div
            ref={colorPickerRef}
            className={styles.colorPicker}
            onClick={(e) => e.stopPropagation()}
          >
            {COLOR_OPTIONS.map((color) => (
              <div
                key={color.value}
                className={`${styles.colorOption} ${
                  currentNoteColor === color.value ? styles.active : ""
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.value)}
                title={color.label}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

NoteToolbar.displayName = "NoteToolbar";
