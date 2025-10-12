// 工具栏操作类型
export type ToolbarAction =
  | "color"
  | "duplicate"
  | "pin"
  | "delete"
  | "focus-mode"
  | "floating"; // 新增悬浮操作

// 工具栏事件数据
export interface ToolbarActionData {
  noteId: string;
  color?: string;
}

// 工具栏组件属性
export interface NoteToolbarProps {
  noteId: string;
  visible: boolean;
  color: string; // 当前便签颜色
  onAction?: (action: ToolbarAction, data?: any) => void;
  onClose?: () => void;
}
export interface ToolbarButton {
  id: ToolbarAction;
  label: string;
  icon: string;
  tooltip: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

export interface ColorOption {
  name: string;
  value: string;
  label: string;
}
