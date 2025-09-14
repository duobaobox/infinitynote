/**
 * Tiptap 工具栏配置和组件
 */

import React, { memo } from "react";
import type { Editor } from "@tiptap/core";
import type { ToolbarButton } from "../types/index";

// 工具栏按钮配置
export const DEFAULT_TOOLBAR_BUTTONS: ToolbarButton[] = [
  // 基础文本格式
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
    id: "underline",
    icon: <u>U</u>,
    title: "下划线 (Ctrl+U)",
    group: "text-format",
    isActive: (editor) => editor.isActive("underline"),
    onClick: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    id: "strike",
    icon: <s>S</s>,
    title: "删除线",
    group: "text-format",
    isActive: (editor) => editor.isActive("strike"),
    onClick: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "code",
    icon: <code>{`</>`}</code>,
    title: "行内代码",
    group: "text-format",
    isActive: (editor) => editor.isActive("code"),
    onClick: (editor) => editor.chain().focus().toggleCode().run(),
  },

  // 标题组
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

  // 段落和块元素
  {
    id: "paragraph",
    icon: "P",
    title: "正文段落",
    group: "blocks",
    isActive: (editor) => editor.isActive("paragraph"),
    onClick: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "blockquote",
    icon: `"`,
    title: "引用块",
    group: "blocks",
    isActive: (editor) => editor.isActive("blockquote"),
    onClick: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    icon: "{ }",
    title: "代码块",
    group: "blocks",
    isActive: (editor) => editor.isActive("codeBlock"),
    onClick: (editor) => editor.chain().focus().toggleCodeBlock().run(),
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

  // 对齐方式
  {
    id: "alignLeft",
    icon: "⫸",
    title: "左对齐",
    group: "alignment",
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
    onClick: (editor) => editor.chain().focus().setTextAlign("left").run(),
  },
  {
    id: "alignCenter",
    icon: "⫯",
    title: "居中对齐",
    group: "alignment",
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
    onClick: (editor) => editor.chain().focus().setTextAlign("center").run(),
  },
  {
    id: "alignRight",
    icon: "⫷",
    title: "右对齐",
    group: "alignment",
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
    onClick: (editor) => editor.chain().focus().setTextAlign("right").run(),
  },
  {
    id: "alignJustify",
    icon: "⫫",
    title: "两端对齐",
    group: "alignment",
    isActive: (editor) => editor.isActive({ textAlign: "justify" }),
    onClick: (editor) => editor.chain().focus().setTextAlign("justify").run(),
  },

  // 颜色工具
  {
    id: "textColor",
    icon: "A",
    title: "文字颜色",
    group: "color",
    onClick: (editor) => {
      // 简单的颜色切换，你可以后续扩展为颜色选择器
      const currentColor = editor.getAttributes("textStyle").color;
      const newColor = currentColor === "#ff0000" ? "#000000" : "#ff0000";
      editor.chain().focus().setColor(newColor).run();
    },
  },

  // 其他工具
  {
    id: "horizontalRule",
    icon: "─",
    title: "水平分割线",
    group: "tools",
    onClick: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "hardBreak",
    icon: "↵",
    title: "硬换行",
    group: "tools",
    onClick: (editor) => editor.chain().focus().setHardBreak().run(),
  },

  // 历史操作
  {
    id: "undo",
    icon: "↶",
    title: "撤销 (Ctrl+Z)",
    group: "history",
    disabled: (editor) => !editor.can().undo(),
    onClick: (editor) => editor.chain().focus().undo().run(),
  },
  {
    id: "redo",
    icon: "↷",
    title: "重做 (Ctrl+Y)",
    group: "history",
    disabled: (editor) => !editor.can().redo(),
    onClick: (editor) => editor.chain().focus().redo().run(),
  },
];

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

// 精简工具栏配置 - 只保留最常用的格式化功能
const MINIMAL_TOOLBAR_CONFIG: ToolbarConfig = {
  show: true,
  buttons: [
    // 核心文本格式
    "bold",
    "italic",
    "underline",
    "strike",
    "code",
    // 列表功能
    "bulletList",
    "orderedList",
  ],
  showGroupDividers: true,
  position: "bottom",
  compact: false,
};

// 完整工具栏配置 - 包含所有功能（可选）
const FULL_TOOLBAR_CONFIG: ToolbarConfig = {
  show: true,
  buttons: [
    // 文本格式
    "bold",
    "italic",
    "underline",
    "strike",
    "code",
    // 标题
    "heading1",
    "heading2",
    "heading3",
    // 段落类型
    "paragraph",
    "blockquote",
    "codeBlock",
    // 列表
    "bulletList",
    "orderedList",
    // 对齐
    "alignLeft",
    "alignCenter",
    "alignRight",
    // 颜色
    "textColor",
    // 工具
    "horizontalRule",
    // 历史
    "undo",
    "redo",
  ],
  showGroupDividers: true,
  position: "bottom",
  compact: false,
};

// 默认使用精简配置
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = MINIMAL_TOOLBAR_CONFIG;

// 工具栏组件属性
interface ToolbarProps {
  editor: Editor;
  config: ToolbarConfig;
  className?: string;
}

/**
 * 工具栏按钮组件
 */
const ToolbarButtonComponent = memo<{
  button: ToolbarButton;
  editor: Editor;
  compact?: boolean;
}>(({ button, editor, compact }) => {
  const isActive = button.isActive?.(editor) || false;
  const isDisabled = button.disabled?.(editor) || false;

  const handleClick = () => {
    if (!isDisabled) {
      button.onClick(editor);
    }
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
      data-testid={`toolbar-${button.id}`}
    >
      {button.icon}
    </button>
  );
});

ToolbarButtonComponent.displayName = "ToolbarButton";

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

    return (
      <div
        className={`tiptap-toolbar ${className} ${
          config.compact ? "compact" : ""
        } ${config.position || "top"}`}
        role="toolbar"
        aria-label="文本编辑工具栏"
      >
        {enabledButtons.map((button, index) => {
          const prevButton = enabledButtons[index - 1];
          const showDivider =
            config.showGroupDividers &&
            index > 0 &&
            prevButton &&
            button.group !== prevButton.group;

          return (
            <React.Fragment key={button.id}>
              {showDivider && <ToolbarDivider />}
              <ToolbarButtonComponent
                button={button}
                editor={editor}
                compact={config.compact}
              />
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

Toolbar.displayName = "Toolbar";

// 导出工具栏相关组件和配置
export {
  ToolbarButtonComponent,
  ToolbarDivider,
  MINIMAL_TOOLBAR_CONFIG,
  FULL_TOOLBAR_CONFIG,
};
