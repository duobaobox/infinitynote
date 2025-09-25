/**
 * CSS 主题变量配置
 * 
 * 定义明亮和暗黑主题的 CSS 变量
 */

// 导入新的颜色配置系统
import { generateNoteColorThemes, getDefaultNoteColor } from '../config/noteColors';

// CSS 变量定义 - 与 Ant Design 主题保持一致
export const cssVariables = {
  light: {
    // 主色调
    "--color-primary": "#1890ff",
    "--color-primary-hover": "#40a9ff",
    "--color-primary-active": "#096dd9",

    // 功能色
    "--color-success": "#52c41a",
    "--color-warning": "#faad14",
    "--color-error": "#ff4d4f",
    "--color-error-hover": "#ff7875",
    "--color-info": "#1890ff",

    // 背景色
    "--color-bg-base": "#ffffff",
    "--color-bg-container": "#ffffff",
    "--color-bg-elevated": "#ffffff",
    "--color-bg-layout": "#f5f5f5",
    "--color-bg-canvas": "#fafafa",

    // 文本色
    "--color-text": "#262626",
    "--color-text-secondary": "#8c8c8c",
    "--color-text-tertiary": "#bfbfbf",
    "--color-text-quaternary": "#d9d9d9",

    // 边框色
    "--color-border": "#d9d9d9",
    "--color-border-secondary": "#f0f0f0",

    // 填充色（用于背景和交互状态）
    "--color-fill-quaternary": "#f5f5f5",
    "--color-fill-tertiary": "#e8e8e8",
    "--color-fill-secondary": "#d9d9d9",
    "--color-fill-primary": "#bfbfbf",

    // 链接颜色
    "--color-link": "#1890ff",
    "--color-link-hover": "#40a9ff",
    "--color-link-active": "#096dd9",

    // 扩展颜色
    "--color-primary-bg": "#e6f7ff",

    // 阴影
    "--box-shadow": "0 2px 8px rgba(0, 0, 0, 0.08)",
    "--box-shadow-secondary": "0 4px 12px rgba(0, 0, 0, 0.12)",
    "--box-shadow-tertiary": "0 6px 16px rgba(0, 0, 0, 0.16)",

    // 圆角
    "--border-radius": "8px",
    "--border-radius-sm": "4px",
    "--border-radius-lg": "12px",

    // 间距
    "--spacing-xs": "8px",
    "--spacing-sm": "12px",
    "--spacing-md": "16px",
    "--spacing-lg": "24px",
    "--spacing-xl": "32px",

    // 组件特定颜色
    "--background-secondary": "#f5f5f5",
    "--hover-bg-color": "#e6f7ff",
    "--text-color": "#262626",
    "--primary-color": "#1890ff",
    "--border-color": "#d9d9d9",
    "--text-color-secondary": "#8c8c8c",

    // 工具栏和Canvas特定颜色
    "--toolbar-bg": "#ffffff",
    "--toolbar-border": "#e0e0e0",
    "--divider-color": "#e0e0e0",
    "--scale-info-bg": "#f5f5f5",
    "--scale-info-color": "#666666",
    "--grid-color": "#d0d0d0",
    "--selection-border": "#1677ff",
    "--selection-bg": "rgba(22, 119, 255, 0.1)",
  },

  dark: {
    // 主色调
    "--color-primary": "#177ddc",
    "--color-primary-hover": "#3c9ae8",
    "--color-primary-active": "#0c5aa6",

    // 功能色
    "--color-success": "#49aa19",
    "--color-warning": "#d89614",
    "--color-error": "#a61d24",
    "--color-error-hover": "#d32029",
    "--color-info": "#177ddc",

    // 背景色
    "--color-bg-base": "#000000",
    "--color-bg-container": "#141414",
    "--color-bg-elevated": "#1f1f1f",
    "--color-bg-layout": "#000000",
    "--color-bg-canvas": "#0a0a0a",

    // 文本色
    "--color-text": "#ffffff",
    "--color-text-secondary": "#a6a6a6",
    "--color-text-tertiary": "#737373",
    "--color-text-quaternary": "#525252",

    // 边框色
    "--color-border": "#434343",
    "--color-border-secondary": "#303030",

    // 填充色（用于背景和交互状态）
    "--color-fill-quaternary": "#2a2a2a",
    "--color-fill-tertiary": "#3a3a3a",
    "--color-fill-secondary": "#4a4a4a",
    "--color-fill-primary": "#5a5a5a",

    // 链接色
    "--color-link": "#177ddc",
    "--color-link-hover": "#3c9ae8",
    "--color-link-active": "#0c5aa6",

    // 扩展颜色
    "--color-primary-bg": "#112f4a",

    // 阴影
    "--box-shadow": "0 2px 8px rgba(0, 0, 0, 0.3)",
    "--box-shadow-secondary": "0 4px 12px rgba(0, 0, 0, 0.4)",
    "--box-shadow-tertiary": "0 6px 16px rgba(0, 0, 0, 0.5)",

    // 圆角 (与明亮主题相同)
    "--border-radius": "8px",
    "--border-radius-sm": "4px",
    "--border-radius-lg": "12px",

    // 间距 (与明亮主题相同)
    "--spacing-xs": "8px",
    "--spacing-sm": "12px",
    "--spacing-md": "16px",
    "--spacing-lg": "24px",
    "--spacing-xl": "32px",

    // 组件特定颜色
    "--background-secondary": "#141414",
    "--hover-bg-color": "#1f1f1f",
    "--text-color": "#ffffff",
    "--primary-color": "#177ddc",
    "--border-color": "#434343",
    "--text-color-secondary": "#a6a6a6",

    // 工具栏和Canvas特定颜色
    "--toolbar-bg": "#141414",
    "--toolbar-border": "#434343",
    "--divider-color": "#434343",
    "--scale-info-bg": "#1f1f1f",
    "--scale-info-color": "#a6a6a6",
    "--grid-color": "#404040",
    "--selection-border": "#177ddc",
    "--selection-bg": "rgba(23, 125, 220, 0.1)",
  },
};

// 标签颜色定义 - 主题无关
export const tagColors = [
  "#f50",
  "#2db7f5",
  "#87d068",
  "#108ee9",
  "#f5222d",
  "#fa541c",
  "#faad14",
  "#fadb14",
  "#a0d911",
  "#52c41a",
  "#13c2c2",
  "#1890ff",
  "#2f54eb",
  "#722ed1",
  "#eb2f96",
  "#fa8c16",
];

/**
 * 默认便签颜色配置
 * 
 * @deprecated 请使用 src/config/noteColors.ts 中的 getDefaultNoteColor()
 */
export const defaultNoteColor = getDefaultNoteColor().value;

// 应用 CSS 变量到文档根元素
export const applyCSSVariables = (theme: "light" | "dark") => {
  const root = document.documentElement;
  const variables = cssVariables[theme];

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

/**
 * 便签颜色主题配置
 * 
 * @deprecated 请使用 src/config/noteColors.ts 中的 generateNoteColorThemes()
 */
export const noteColorThemes = generateNoteColorThemes();

// 画布网格主题
export const canvasGridThemes = {
  light: {
    backgroundColor: "#f5f5f5",
    gridColor: "#d0d0d0", // 使用原来的点颜色
    gridSize: 20,
    gridOpacity: 0.5,
  },
  dark: {
    backgroundColor: "#1a1a1a",
    gridColor: "#404040", // 暗黑主题下的点颜色
    gridSize: 20,
    gridOpacity: 0.3,
  },
};
