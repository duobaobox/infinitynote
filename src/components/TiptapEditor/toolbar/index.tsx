/**
 * Tiptap 工具栏配置和组件
 */

import React, { memo } from 'react';
import type { Editor } from '@tiptap/core';
import type { ToolbarButton } from '../types';

// 工具栏按钮配置
export const DEFAULT_TOOLBAR_BUTTONS: ToolbarButton[] = [
  // 文本格式
  {
    id: 'bold',
    icon: <strong>B</strong>,
    title: '加粗 (Ctrl+B)',
    group: 'text-format',
    isActive: (editor) => editor.isActive('bold'),
    onClick: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: 'italic',
    icon: <em>I</em>,
    title: '斜体 (Ctrl+I)',
    group: 'text-format',
    isActive: (editor) => editor.isActive('italic'),
    onClick: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: 'strike',
    icon: <s>S</s>,
    title: '删除线',
    group: 'text-format',
    isActive: (editor) => editor.isActive('strike'),
    onClick: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  // 标题
  {
    id: 'heading1',
    icon: 'H1',
    title: '标题 1',
    group: 'headings',
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
    onClick: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'heading2',
    icon: 'H2',
    title: '标题 2',
    group: 'headings',
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    onClick: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'heading3',
    icon: 'H3',
    title: '标题 3',
    group: 'headings',
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
    onClick: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  // 列表
  {
    id: 'bulletList',
    icon: '•',
    title: '无序列表',
    group: 'lists',
    isActive: (editor) => editor.isActive('bulletList'),
    onClick: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'orderedList',
    icon: '1.',
    title: '有序列表',
    group: 'lists',
    isActive: (editor) => editor.isActive('orderedList'),
    onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  // 其他格式
  {
    id: 'blockquote',
    icon: '❝',
    title: '引用',
    group: 'blocks',
    isActive: (editor) => editor.isActive('blockquote'),
    onClick: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'codeBlock',
    icon: '</>',
    title: '代码块',
    group: 'blocks',
    isActive: (editor) => editor.isActive('codeBlock'),
    onClick: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'horizontalRule',
    icon: '—',
    title: '分割线',
    group: 'blocks',
    onClick: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  // 历史操作
  {
    id: 'undo',
    icon: '↶',
    title: '撤销 (Ctrl+Z)',
    group: 'history',
    disabled: (editor) => !editor.can().undo(),
    onClick: (editor) => editor.chain().focus().undo().run(),
  },
  {
    id: 'redo',
    icon: '↷',
    title: '重做 (Ctrl+Y)',
    group: 'history',
    disabled: (editor) => !editor.can().redo(),
    onClick: (editor) => editor.chain().focus().redo().run(),
  },
];

// 工具栏分组配置
export const TOOLBAR_GROUPS = {
  'text-format': { label: '文本格式', order: 1 },
  'headings': { label: '标题', order: 2 },
  'lists': { label: '列表', order: 3 },
  'blocks': { label: '块级元素', order: 4 },
  'history': { label: '历史操作', order: 5 },
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
  position?: 'top' | 'bottom';
  /** 是否紧凑模式 */
  compact?: boolean;
}

// 默认工具栏配置
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  show: true,
  buttons: ['bold', 'italic', 'strike', 'heading1', 'heading2', 'bulletList', 'orderedList', 'undo', 'redo'],
  showGroupDividers: true,
  position: 'top',
  compact: false,
};

// 工具栏组件属性
interface ToolbarProps {
  editor: Editor;
  config: ToolbarConfig;
  className?: string;
}\n\n/**\n * 工具栏按钮组件\n */\nconst ToolbarButton = memo<{\n  button: ToolbarButton;\n  editor: Editor;\n  compact?: boolean;\n}>(({ button, editor, compact }) => {\n  const isActive = button.isActive?.(editor) || false;\n  const isDisabled = button.disabled?.(editor) || false;\n\n  const handleClick = () => {\n    if (!isDisabled) {\n      button.onClick(editor);\n    }\n  };\n\n  return (\n    <button\n      type=\"button\"\n      className={`tiptap-toolbar-button ${\n        isActive ? 'is-active' : ''\n      } ${compact ? 'compact' : ''}`}\n      title={button.title}\n      disabled={isDisabled}\n      onClick={handleClick}\n      data-testid={`toolbar-${button.id}`}\n    >\n      {button.icon}\n    </button>\n  );\n});\n\nToolbarButton.displayName = 'ToolbarButton';\n\n/**\n * 工具栏分割线组件\n */\nconst ToolbarDivider = memo(() => (\n  <div className=\"toolbar-divider\" role=\"separator\" />\n));\n\nToolbarDivider.displayName = 'ToolbarDivider';\n\n/**\n * 工具栏主组件\n */\nexport const Toolbar = memo<ToolbarProps>(({ editor, config, className = '' }) => {\n  if (!config.show || !editor) {\n    return null;\n  }\n\n  // 获取所有可用按钮\n  const allButtons = [...DEFAULT_TOOLBAR_BUTTONS, ...(config.customButtons || [])];\n  \n  // 筛选启用的按钮\n  const enabledButtons = config.buttons\n    ? allButtons.filter(button => config.buttons!.includes(button.id))\n    : allButtons;\n\n  // 按组分组\n  const buttonGroups = enabledButtons.reduce((groups, button) => {\n    const group = button.group || 'default';\n    if (!groups[group]) {\n      groups[group] = [];\n    }\n    groups[group].push(button);\n    return groups;\n  }, {} as Record<string, ToolbarButton[]>);\n\n  // 按顺序排列组\n  const sortedGroups = Object.entries(buttonGroups).sort(([a], [b]) => {\n    const orderA = TOOLBAR_GROUPS[a as keyof typeof TOOLBAR_GROUPS]?.order || 999;\n    const orderB = TOOLBAR_GROUPS[b as keyof typeof TOOLBAR_GROUPS]?.order || 999;\n    return orderA - orderB;\n  });\n\n  return (\n    <div \n      className={`tiptap-toolbar ${className} ${\n        config.compact ? 'compact' : ''\n      } ${config.position || 'top'}`}\n      role=\"toolbar\"\n      aria-label=\"文本编辑工具栏\"\n    >\n      {sortedGroups.map(([groupName, buttons], groupIndex) => (\n        <React.Fragment key={groupName}>\n          {groupIndex > 0 && config.showGroupDividers && <ToolbarDivider />}\n          {buttons.map((button) => (\n            <ToolbarButton\n              key={button.id}\n              button={button}\n              editor={editor}\n              compact={config.compact}\n            />\n          ))}\n        </React.Fragment>\n      ))}\n    </div>\n  );\n});\n\nToolbar.displayName = 'Toolbar';\n\n// 导出工具栏相关组件和配置\nexport { ToolbarButton as ToolbarButtonComponent, ToolbarDivider };\nexport type { ToolbarConfig };