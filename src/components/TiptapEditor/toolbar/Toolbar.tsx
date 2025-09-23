/**
 * Tiptap 工具栏配置和组件 - 标准化实现
 */

import React, { memo } from "react";
import 'remixicon/fonts/remixicon.css';

// 图标组件
const Icon = ({ name }: { name: string }) => (
  <i className={`ri-${name}`}></i>
);
import type { Editor } from "@tiptap/core";
import type { ToolbarButton } from "../types/index";

// 简化的工具栏按钮配置 - 更接近Tiptap官方示例
export const DEFAULT_TOOLBAR_BUTTONS: ToolbarButton[] = [
  // 基础文本格式 - 核心功能
  {
    id: "bold",
    icon: <Icon name="bold" />,
    title: "加粗 (Ctrl+B)",
    group: "format",
  isActive: (editor) => editor.isActive("bold"),
    onClick: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    icon: <Icon name="italic" />,
    title: "斜体 (Ctrl+I)",
    group: "format",
  isActive: (editor) => editor.isActive("italic"),
    onClick: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "strike",
    icon: <Icon name="strikethrough" />,
    title: "删除线 (Ctrl+Shift+X)",
    group: "format",
  isActive: (editor) => editor.isActive("strike"),
    onClick: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "code",
    icon: <Icon name="code-view" />,
    title: "行内代码 (Ctrl+E)",
    group: "format",
  isActive: (editor) => editor.isActive("code"),
    onClick: (editor) => editor.chain().focus().toggleCode().run(),
  },

  // 列表 - 核心功能
  {
    id: "bulletList",
    icon: <Icon name="list-unordered" />,
    title: "无序列表 (Ctrl+Shift+8)",
    group: "lists",
  isActive: (editor) => editor.isActive("bulletList"),
    onClick: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    icon: <Icon name="list-ordered" />,
    title: "有序列表 (Ctrl+Shift+7)",
    group: "lists",
  isActive: (editor) => editor.isActive("orderedList"),
    onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "taskList",
    icon: <Icon name="checkbox-multiple-line" />,
    title: "任务列表 (无快捷键)",
    group: "lists",
  isActive: (editor) => editor.isActive("taskList"),
    onClick: (editor) => editor.chain().focus().toggleTaskList().run(),
  },

  // 其他实用功能
  {
    id: "blockquote",
    icon: <Icon name="double-quotes-l" />,
    title: "引用 (Ctrl+Shift+B)",
    group: "blocks",
  isActive: (editor) => editor.isActive("blockquote"),
    onClick: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    icon: <Icon name="code-box-line" />,
    title: "代码块 (Ctrl+Alt+C)",
    group: "blocks",
  isActive: (editor) => editor.isActive("codeBlock"),
    onClick: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },

  // 表格功能
  {
    id: "insertTable",
    icon: <Icon name="table-2" />,
    title: "插入表格 (无快捷键)",
    group: "table",
    onClick: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    id: "addColumnAfter",
    icon: <Icon name="insert-column-right" />,
    title: "向右增加列 (无快捷键)",
    group: "table",
  disabled: (editor) => !editor.can().addColumnAfter(),
    onClick: (editor) => {
      editor.chain().focus().addColumnAfter().run();
    },
  },
  {
    id: "deleteColumn",
    icon: <Icon name="delete-column" />,
    title: "删除列 (无快捷键)",
    group: "table",
  disabled: (editor) => !editor.can().deleteColumn(),
    onClick: (editor) => {
      editor.chain().focus().deleteColumn().run();
    },
  },
  {
    id: "addRowAfter",
    icon: <Icon name="insert-row-bottom" />,
    title: "向下增加行 (无快捷键)",
    group: "table",
  disabled: (editor) => !editor.can().addRowAfter(),
    onClick: (editor) => {
      editor.chain().focus().addRowAfter().run();
    },
  },
  {
    id: "deleteRow",
    icon: <Icon name="delete-row" />,
    title: "删除行 (无快捷键)",
    group: "table",
  disabled: (editor) => !editor.can().deleteRow(),
    onClick: (editor) => {
      editor.chain().focus().deleteRow().run();
    },
  },
  {
    id: "deleteTable",
    icon: <Icon name="delete-bin-2-line" />,
    title: "删除表格 (无快捷键)",
    group: "table",
  disabled: (editor) => !editor.can().deleteTable(),
    onClick: (editor) => {
      editor.chain().focus().deleteTable().run();
    },
  },
  // 图片功能
  {
    id: "insertImage",
    icon: <Icon name="image-add-line" />,
    title: "插入图片 (无快捷键)",
    group: "media",
    onClick: (editor) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            editor.chain().focus().setImage({ src: result }).run();
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
  },

  // 历史操作
  {
    id: "undo",
    icon: <Icon name="arrow-go-back-line" />,
    title: "撤销 (Ctrl+Z)",
    group: "history",
    disabled: (editor) => !editor.can().undo(),
    onClick: (editor) => editor.chain().focus().undo().run(),
  },
  {
    id: "redo",
    icon: <Icon name="arrow-go-forward-line" />,
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

// 默认工具栏配置 - 简化版
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  show: true,
  buttons: [
    // 核心格式化功能
    "bold",
    "italic",
    "strike",
    "code",
    // 列表功能
    "bulletList",
    "orderedList",
    "taskList", // 添加任务列表
    // 块级元素
    "blockquote",
    // 表格功能
    "insertTable",
    "addColumnAfter",
    "deleteColumn",
    "addRowAfter",
    "deleteRow",
    "deleteTable",
    // 图片功能
    "insertImage",
    // 历史操作
    "undo",
    "redo",
  ],
  showGroupDividers: true,
  position: "bottom",
  compact: false,
};

// 工具栏组件属性
interface ToolbarProps {
  editor: Editor;
  config: ToolbarConfig;
  className?: string;
  updateKey?: number;
}

/**
 * 工具栏按钮组件 - 简化版
 */
const ToolbarButtonComponent = memo<{
  button: ToolbarButton;
  editor: Editor;
  compact?: boolean;
  updateKey?: number;
}>(({ button, editor, compact, updateKey }) => {
  const isActive = button.isActive?.(editor) || false;
  const isDisabled = button.disabled?.(editor) || false;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
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
      aria-label={button.title}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      tabIndex={-1}
      data-testid={`toolbar-${button.id}`}
      data-update-key={updateKey}
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
 * 工具栏主组件 - 简化版
 */
export const Toolbar = memo<ToolbarProps>(
  ({ editor, config, className = "", updateKey }) => {
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
        } ${config.position || "bottom"}`}
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
                updateKey={updateKey}
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
export { ToolbarButtonComponent, ToolbarDivider };
