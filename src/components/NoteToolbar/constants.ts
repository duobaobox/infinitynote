/**
 * 便签工具栏常量配置
 *
 * 定义工具栏按钮和颜色选项的配置
 * @author InfinityNote2 Team
 */

import type { ToolbarButton, ColorOption } from "./types";
import { NoteColorConfig } from "../../config/noteColors";

// 基础工具栏按钮配置
export const BASE_TOOLBAR_BUTTONS: ToolbarButton[] = [
  {
    id: "focus-mode",
    label: "专注模式",
    icon: "EyeOutlined",
    tooltip: "进入专注模式编辑",
    separator: true, // 在专注模式前添加分隔符
  },
  {
    id: "color",
    label: "更改颜色",
    icon: "BgColorsOutlined",
    tooltip: "更改便签颜色",
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

// AI相关按钮配置
export const AI_TOOLBAR_BUTTONS: ToolbarButton[] = [
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
    separator: true, // 在AI设置前添加分隔符
  },
];

// 工具栏按钮配置 - 兼容性保持
export const TOOLBAR_BUTTONS: ToolbarButton[] = [
  ...AI_TOOLBAR_BUTTONS,
  ...BASE_TOOLBAR_BUTTONS,
];

/**
 * 颜色选项配置
 *
 * 从统一的颜色配置系统获取工具栏颜色选项
 * 修改颜色请编辑 src/config/noteColors.ts
 */
export const COLOR_OPTIONS: ColorOption[] =
  NoteColorConfig.getToolbarColorOptions();

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
