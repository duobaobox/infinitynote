import React, { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  BgColorsOutlined,
  CopyOutlined,
  PushpinOutlined,
  DeleteOutlined,
  RobotOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { NoteToolbarProps, ToolbarAction } from "./types";
import { TOOLBAR_BUTTONS, COLOR_OPTIONS } from "./constants";
import { AIGenerationControl } from "../AIGenerationControl";
import styles from "./index.module.css";

// 图标映射组件
const IconMap: Record<string, React.ComponentType<any>> = {
  BgColorsOutlined,
  CopyOutlined,
  PushpinOutlined,
  DeleteOutlined,
  RobotOutlined,
  SettingOutlined,
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
  ({ noteId, visible, onAction, onClose, color }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showAIGeneration, setShowAIGeneration] = useState(false);
    const [currentNoteColor, setCurrentNoteColor] = useState(color); // 用 props.color 初始化
    const toolbarRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null); // 处理按钮点击
    const handleButtonClick = useCallback(
      (action: ToolbarAction) => {
        if (action === "color") {
          setShowColorPicker(!showColorPicker);
          return;
        }

        if (action === "ai-generate") {
          setShowAIGeneration(true);
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
        {TOOLBAR_BUTTONS.map((button, index) => (
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

        {/* AI生成控制模态框 */}
        <AIGenerationControl
          noteId={noteId}
          visible={showAIGeneration}
          onClose={() => setShowAIGeneration(false)}
          onComplete={(content, aiData) => {
            // 通知父组件更新便签内容
            onAction?.("ai-content-generated", {
              noteId,
              content,
              aiData,
            });
            setShowAIGeneration(false);
          }}
          onError={(error) => {
            console.error("AI生成失败:", error);
            // 可以在这里添加更多错误处理逻辑
          }}
        />
      </div>
    );
  }
);

NoteToolbar.displayName = "NoteToolbar";
