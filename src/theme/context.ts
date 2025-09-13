/**
 * 主题上下文定义
 */

import { createContext } from "react";
import type { ThemeType } from "./antd";

// 主题上下文类型
export interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

// 创建主题上下文
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);
