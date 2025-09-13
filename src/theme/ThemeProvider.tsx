import React, { createContext, useContext, useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { getThemeConfig, type ThemeType } from "./antd";
import { applyCSSVariables } from "./variables";
import { useLocalStorage } from "../hooks/useLocalStorage";

// 主题上下文类型定义
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者组件属性
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
}

// 主题提供者组件
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "light",
}) => {
  // 从本地存储获取主题设置
  const [theme, setThemeStorage] = useLocalStorage<ThemeType>(
    "infinitynote-theme",
    defaultTheme
  );
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(theme);

  // 计算是否为暗黑主题
  const isDark =
    currentTheme === "dark" ||
    (currentTheme === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // 设置主题
  const setTheme = (newTheme: ThemeType) => {
    setCurrentTheme(newTheme);
    setThemeStorage(newTheme);
  };

  // 切换明暗主题
  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
  };

  // 应用 CSS 变量
  useEffect(() => {
    let actualTheme: "light" | "dark" | "compact" = currentTheme as any;

    // 如果是 auto 模式，根据系统主题决定实际主题
    if (currentTheme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      actualTheme = mediaQuery.matches ? "dark" : "light";
    }

    if (actualTheme === "light" || actualTheme === "dark") {
      applyCSSVariables(actualTheme);
    } else {
      // 紧凑主题默认使用明亮主题的变量
      applyCSSVariables("light");
    }

    // 添加主题类名到 body
    document.body.className = `theme-${actualTheme}`;

    // 设置页面基础背景色
    const themeConfig = getThemeConfig(actualTheme);
    if (themeConfig.token?.colorBgLayout) {
      document.body.style.backgroundColor = themeConfig.token
        .colorBgLayout as string;
    }
  }, [currentTheme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // 只有当用户设置为 auto 模式或没有手动设置主题时才跟随系统
      const savedTheme = localStorage.getItem("infinitynote-theme");
      if (!savedTheme || currentTheme === "auto") {
        // 如果是 auto 模式，需要重新触发渲染以更新 isDark 状态
        if (currentTheme === "auto") {
          setCurrentTheme("auto"); // 强制重新渲染
        } else {
          setTheme(e.matches ? "dark" : "light");
        }
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // 初始化时检查系统主题
    if (!localStorage.getItem("infinitynote-theme")) {
      setTheme(mediaQuery.matches ? "dark" : "light");
    }

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [currentTheme]);

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    setTheme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        theme={getThemeConfig(currentTheme)}
        locale={zhCN}
        componentSize={currentTheme === "compact" ? "small" : "middle"}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

// 使用主题的钩子
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme 必须在 ThemeProvider 内部使用");
  }
  return context;
};

// 主题切换按钮组件
export const ThemeToggle: React.FC<{
  className?: string;
  size?: "small" | "middle" | "large";
}> = ({ className, size = "middle" }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle ${className || ""}`}
      onClick={toggleTheme}
      title={isDark ? "切换到明亮主题" : "切换到暗黑主题"}
      style={{
        border: "none",
        background: "var(--color-bg-container)",
        color: "var(--color-text)",
        borderRadius: "var(--border-radius)",
        padding:
          size === "small"
            ? "4px 8px"
            : size === "large"
            ? "8px 16px"
            : "6px 12px",
        cursor: "pointer",
        fontSize:
          size === "small" ? "12px" : size === "large" ? "16px" : "14px",
        transition: "all 0.2s ease",
        boxShadow: "var(--box-shadow)",
      }}
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
};
