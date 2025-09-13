import type { ThemeConfig } from "antd";
import { theme } from "antd";

// 公共的设计令牌
const commonTokens = {
  // 布局
  borderRadius: 8,
  wireframe: false,

  // 字体
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
  fontSize: 14,

  // 动画
  motion: true,
  motionUnit: 0.1,
  motionBase: 0.2,

  // 阴影
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  boxShadowSecondary: "0 4px 12px rgba(0, 0, 0, 0.12)",

  // 间距
  marginXS: 8,
  marginSM: 12,
  margin: 16,
  marginMD: 20,
  marginLG: 24,
  marginXL: 32,
};

// 明亮主题配置
export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...commonTokens,
    // 颜色配置
    colorPrimary: "#1890ff",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorInfo: "#1890ff",

    // 背景色
    colorBgBase: "#ffffff",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBgLayout: "#f5f5f5",
    colorBgSpotlight: "#ffffff",

    // 文本颜色
    colorText: "#262626",
    colorTextSecondary: "#8c8c8c",
    colorTextTertiary: "#bfbfbf",
    colorTextQuaternary: "#d9d9d9",

    // 边框颜色
    colorBorder: "#d9d9d9",
    colorBorderSecondary: "#f0f0f0",

    // 链接颜色
    colorLink: "#1890ff",
    colorLinkHover: "#40a9ff",
    colorLinkActive: "#096dd9",
  },
  components: {
    // 按钮组件主题
    Button: {
      borderRadius: 6,
      controlHeight: 32,
      paddingContentHorizontal: 15,
    },

    // 输入框组件主题
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      paddingContentHorizontal: 11,
    },

    // 卡片组件主题
    Card: {
      borderRadius: 8,
      paddingLG: 24,
    },

    // 模态框组件主题
    Modal: {
      borderRadius: 8,
      paddingContentHorizontal: 24,
    },

    // 工具提示组件主题
    Tooltip: {
      borderRadius: 6,
    },

    // 下拉菜单组件主题
    Dropdown: {
      borderRadius: 8,
    },

    // 消息提示组件主题
    Message: {
      borderRadius: 8,
    },

    // 通知组件主题
    Notification: {
      borderRadius: 8,
    },
  },
};

// 暗黑主题配置
export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...commonTokens,
    // 颜色配置
    colorPrimary: "#177ddc",
    colorSuccess: "#49aa19",
    colorWarning: "#d89614",
    colorError: "#a61d24",
    colorInfo: "#177ddc",

    // 背景色
    colorBgBase: "#000000",
    colorBgContainer: "#141414",
    colorBgElevated: "#1f1f1f",
    colorBgLayout: "#000000",
    colorBgSpotlight: "#424242",

    // 文本颜色
    colorText: "#ffffff",
    colorTextSecondary: "#a6a6a6",
    colorTextTertiary: "#737373",
    colorTextQuaternary: "#525252",

    // 边框颜色
    colorBorder: "#434343",
    colorBorderSecondary: "#303030",

    // 链接颜色
    colorLink: "#177ddc",
    colorLinkHover: "#3c9ae8",
    colorLinkActive: "#0c5aa6",
  },
  components: {
    // 继承明亮主题的组件配置
    ...lightTheme.components,
  },
};

// 紧凑主题配置（适用于小屏幕）
export const compactTheme: ThemeConfig = {
  algorithm: theme.compactAlgorithm,
  token: {
    ...lightTheme.token,
    // 减少间距和尺寸
    controlHeight: 28,
    fontSize: 13,
    marginXS: 6,
    marginSM: 10,
    margin: 14,
    marginMD: 18,
    marginLG: 20,
    marginXL: 28,
  },
  components: {
    Button: {
      borderRadius: 4,
      controlHeight: 28,
      paddingContentHorizontal: 12,
    },
    Input: {
      borderRadius: 4,
      controlHeight: 28,
      paddingContentHorizontal: 8,
    },
    Card: {
      borderRadius: 6,
      paddingLG: 16,
    },
  },
};

// 主题类型定义
export type ThemeType = "light" | "dark" | "compact";

// 主题映射
export const themes: Record<ThemeType, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
  compact: compactTheme,
};

// 获取主题配置
export const getThemeConfig = (themeType: ThemeType): ThemeConfig => {
  return themes[themeType] || lightTheme;
};
