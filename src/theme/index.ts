// 主题系统导出文件
import { useContext } from "react";
import { ThemeContext, type ThemeContextType } from "./context";

export { ThemeProvider, ThemeToggle } from "./ThemeProvider";

// 使用主题的钩子
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme 必须在 ThemeProvider 内部使用");
  }
  return context;
};
export {
  lightTheme,
  darkTheme,
  compactTheme,
  themes,
  getThemeConfig,
} from "./antd";
export {
  cssVariables,
  applyCSSVariables,
  noteColorThemes,
  canvasGridThemes,
} from "./variables";

export type { ThemeType } from "./antd";
