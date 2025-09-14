/**
 * Tiptap 工具栏配置和组件
 */

import React, { memo } from "react";
import type { Editor } from "@tiptap/core";
import type { ToolbarButton } from "../types";

// 工具栏按钮配置
export const DEFAULT_TOOLBAR_BUTTONS: ToolbarButton[] = [
  // 文本格式
  {
    id: "bold",
    icon: <strong>B</strong>,
    title: "加粗 (Ctrl+B)",
    group: "text-format",
    isActive: (editor) => editor.isActive("bold"),
    onClick: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    icon: <em>I</em>,
    title: "斜体 (Ctrl+I)",
    group: "text-format",
    isActive: (editor) => editor.isActive("italic"),
    onClick: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "strike",
    icon: <s>S</s>,
    title: "删除线",
    group: "text-format",
    isActive: (editor) => editor.isActive("strike"),
    onClick: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  // 标题
  {
    id: "heading1",
    icon: "H1",
    title: "标题 1",
    group: "headings",
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    onClick: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    icon: "H2",
    title: "标题 2",
    group: "headings",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    onClick: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    icon: "H3",
    title: "标题 3",
    group: "headings",
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    onClick: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  // 列表
  {
    id: "bulletList",
    icon: "•",
    title: "无序列表",
    group: "lists",
    isActive: (editor) => editor.isActive("bulletList"),
    onClick: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    icon: "1.",
    title: "有序列表",
    group: "lists",
    isActive: (editor) => editor.isActive("orderedList"),
    onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  // 其他格式
  {
    id: "blockquote",
    icon: "❝",
    title: "引用",
    group: "blocks",
    isActive: (editor) => editor.isActive("blockquote"),
    onClick: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    icon: "</>",
    title: "代码块",
    group: "blocks",
    isActive: (editor) => editor.isActive("codeBlock"),
    onClick: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "horizontalRule",
    icon: "—",
    title: "分割线",
    group: "blocks",
    onClick: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  // 历史操作
  {
    id: "undo",
    icon: "↶",
    title: "撤销 (Ctrl+Z)",
    group: "history",
    disabled: (editor) => !editor.can().chain().focus().undo().run(),
    onClick: (editor) => editor.chain().focus().undo().run(),
  },
  {
    id: "redo",
    icon: "↷",
    title: "重做 (Ctrl+Y)",
    group: "history",
    disabled: (editor) => !editor.can().chain().focus().redo().run(),
    onClick: (editor) => editor.chain().focus().redo().run(),
  },
];

// 工具栏分组配置
export const TOOLBAR_GROUPS = {
  "text-format": { label: "文本格式", order: 1 },
  headings: { label: "标题", order: 2 },
  lists: { label: "列表", order: 3 },
  blocks: { label: "块级元素", order: 4 },
  history: { label: "历史操作", order: 5 },
};

// 工具栏配置接口
export interface ToolbarConfig {
  /** 是否显示工具栏 */
  show: boolean;
  /** 启用的按钮ID列表 */
  buttons?: string[];
  /** 自定义按钮 */
  customButtons?: ToolbarButton[];
  /** 是否显示分组分割线 */
  showGroupDividers?: boolean;
  /** 工具栏位置 */
  position?: "top" | "bottom";
  /** 是否紧凑模式 */
  compact?: boolean;
}

// 默认工具栏配置
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  show: true,
  buttons: [
    "bold",
    "italic",
    "strike",
    "heading1",
    "heading2",
    "bulletList",
    "orderedList",
    "undo",
    "redo",
  ],
  showGroupDividers: true,
  position: "top",
  compact: false,
};

// 工具栏组件属性
interface ToolbarProps {
  editor: Editor;
  config: ToolbarConfig;
  className?: string;
}

/**
 * 工具栏按钮组件 - 完全遵循Tiptap官方标准
 */
const ToolbarButton = memo<{
  button: ToolbarButton;
  editor: Editor;
  compact?: boolean;
}>(({ button, editor, compact }) => {
  const isActive = button.isActive?.(editor) || false;

  // 检测按钮是否可用 - 遵循官方标准
  const isDisabled = button.disabled?.(editor) || false;

  const handleClick = () => {
    if (!isDisabled) {
      button.onClick(editor);
      // 确保在命令执行后立即更新按钮状态
      // 使用微任务来确保编辑器状态已经更新
      queueMicrotask(() => {
        // 触发选择更新事件，强制重新渲染工具栏
        editor.emit("selectionUpdate", {
          editor,
          transaction: editor.state.tr,
        });
      });
    }
  };

  // 阻止mousedown事件，防止编辑器失去焦点 - 这是Tiptap官方的标准做法
  const handleMouseDown = (event: React.MouseEvent) => {
    // 阻止默认行为，防止编辑器失去焦点
    event.preventDefault();
    // 阻止事件冒泡，确保不会触发父级的焦点处理
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      className={`tiptap-toolbar-button ${isActive ? "is-active" : ""} ${
        compact ? "compact" : ""
      }`}
      title={button.title}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      // Accessibility 属性 - 遵循官方标准
      aria-pressed={isActive}
      aria-label={button.title.split(" (")[0]} // 移除快捷键部分，只保留按钮名称
      tabIndex={-1} // 允许键盘导航但不作为默认焦点
      data-testid={`toolbar-${button.id}`}
    >
      {button.icon}
    </button>
  );
});

ToolbarButton.displayName = "ToolbarButton";

/**
 * 工具栏分割线组件
 */
const ToolbarDivider = memo(() => (
  <div className="toolbar-divider" role="separator" />
));

ToolbarDivider.displayName = "ToolbarDivider";

/**
 * 工具栏主组件
 */
export const Toolbar = memo<ToolbarProps>(
  ({ editor, config, className = "" }) => {
    if (!config.show || !editor) {
      return null;
    }

    // 获取所有可用按钮
    const allButtons = [
      ...DEFAULT_TOOLBAR_BUTTONS,
      ...(config.customButtons || []),
    ];

    // 筛选启用的按钮
    const enabledButtons = config.buttons
      ? allButtons.filter((button) => config.buttons!.includes(button.id))
      : allButtons;

    // 按组分组
    const buttonGroups = enabledButtons.reduce((groups, button) => {
      const group = button.group || "default";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(button);
      return groups;
    }, {} as Record<string, ToolbarButton[]>);

    // 按顺序排列组
    const sortedGroups = Object.entries(buttonGroups).sort(([a], [b]) => {
      const orderA =
        TOOLBAR_GROUPS[a as keyof typeof TOOLBAR_GROUPS]?.order || 999;
      const orderB =
        TOOLBAR_GROUPS[b as keyof typeof TOOLBAR_GROUPS]?.order || 999;
      return orderA - orderB;
    });

    return (
      <div
        className={`tiptap-toolbar ${className} ${
          config.compact ? "compact" : ""
        } ${config.position || "top"}`}
        role="toolbar"
        aria-label="文本编辑工具栏"
        onMouseDown={(e) => {
          // 防止整个工具栏的mousedown事件导致编辑器失焦
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {sortedGroups.map(([groupName, buttons], groupIndex) => (
          <React.Fragment key={groupName}>
            {groupIndex > 0 && config.showGroupDividers && <ToolbarDivider />}
            {buttons.map((button) => (
              <ToolbarButton
                key={button.id}
                button={button}
                editor={editor}
                compact={config.compact}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

Toolbar.displayName = "Toolbar";

// 导出工具栏相关组件
export { ToolbarDivider };

// 导出 ToolbarButton 组件 (避免类型导出问题)
export const ToolbarButtonComponent = ToolbarButton;
