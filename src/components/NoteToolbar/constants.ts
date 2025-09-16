import type { ToolbarButton, ColorOption } from "./types";

// 工具栏按钮配置 - 添加AI功能
export const TOOLBAR_BUTTONS: ToolbarButton[] = [
  {
    id: "ai-generate",
    label: "AI生成",
    icon: "RobotOutlined",
    tooltip: "使用AI生成内容",
  },
  {
    id: "ai-config",
    label: "AI设置",
    icon: "SettingOutlined",
    tooltip: "AI功能设置",
    separator: true, // 在AI功能前添加分隔符
  },
  {
    id: "color",
    label: "更改颜色",
    icon: "BgColorsOutlined",
    tooltip: "更改便签颜色",
    separator: true, // 在颜色功能前添加分隔符
  },
  {
    id: "duplicate",
    label: "复制便签",
    icon: "CopyOutlined",
    tooltip: "复制这个便签",
  },
  {
    id: "pin",
    label: "置顶",
    icon: "PushpinOutlined",
    tooltip: "置顶便签",
  },
  {
    id: "delete",
    label: "删除",
    icon: "DeleteOutlined",
    tooltip: "删除便签",
    danger: true,
    separator: true, // 在删除功能前添加分隔符
  },
];

// 颜色选项配置
export const COLOR_OPTIONS: ColorOption[] = [
  { name: "yellow", value: "#FFF2CC", label: "黄色" },
  { name: "pink", value: "#FFE6E6", label: "粉色" },
  { name: "blue", value: "#E6F3FF", label: "蓝色" },
  { name: "green", value: "#E6FFE6", label: "绿色" },
  { name: "purple", value: "#F0E6FF", label: "紫色" },
  { name: "orange", value: "#FFE6CC", label: "橙色" },
  { name: "red", value: "#FFD6D6", label: "红色" },
  { name: "gray", value: "#F0F0F0", label: "灰色" },
];

// 工具栏尺寸配置 - 更小巧精致
export const TOOLBAR_CONFIG = {
  WIDTH: 36, // 工具栏宽度
  BUTTON_HEIGHT: 28, // 按钮高度
  PADDING: 4, // 内边距
  GAP: 2, // 按钮间距
  OFFSET_X: 8, // 距离便签右侧的距离
  BORDER_RADIUS: 6, // 圆角半径
  MAX_HEIGHT: 200, // 最大高度
};
