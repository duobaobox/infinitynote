// 引入React和相关hooks
import { useEffect } from "react";
// 引入主页面组件
import Main from "./pages/Main";
// 引入主题系统
import { ThemeProvider } from "./theme";
// 引入错误边界组件
import ErrorBoundary from "./components/ErrorBoundary";
// 引入Ant Design App组件
import { App as AntdApp } from "antd";
// 引入撤销/重做快捷键
import { useHistoryShortcuts } from "./hooks";
// 引入便签状态管理
import { useNoteStore } from "./store/noteStore";

// 引入全局样式
import "./App.css";
import "./theme/global.css";

/**
 * 应用根组件
 * 这是整个应用的入口组件
 *
 * 当前功能：
 * - 提供 Ant Design 主题支持
 * - 渲染主页面组件
 * - 设置根容器样式确保占满整个视口
 */
/**
 * 应用根组件
 *
 * 功能特性：
 * - 错误边界保护，防止应用崩溃
 * - 主题系统支持
 * - 全屏布局设计
 * - 性能优化配置
 */
function App() {
  // 启用全局撤销/重做快捷键
  useHistoryShortcuts();

  // 获取便签状态更新函数
  const updateNote = useNoteStore((state) => state.updateNote);

  // 监听悬浮便签的更新事件
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      console.log("📝 注册悬浮便签状态同步监听器");

      const removeListener = window.electronAPI.onMenuAction(
        (eventName, data) => {
          // 处理悬浮便签向主窗口的更新
          if (eventName === "floating-note-updated" && data?.noteId) {
            console.log("📝 收到悬浮便签更新:", data);

            const { noteId, updates } = data;
            if (noteId && updates) {
              // 更新 Zustand store 中的便签数据
              updateNote(noteId, updates);
            }
          }

          // 处理悬浮窗口大小变化
          if (eventName === "floating-note-resized" && data?.noteId) {
            console.log("📐 悬浮便签大小变化:", data);
            const { noteId, width, height } = data;
            if (noteId && width && height) {
              updateNote(noteId, { size: { width, height } });
            }
          }
        }
      );

      return () => {
        removeListener?.();
      };
    }
  }, [updateNote]);

  // 初始化错误处理系统
  useEffect(() => {
    // 监听全局未捕获的错误
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("未处理的Promise拒绝:", event.reason);
      // 可以在这里添加错误上报逻辑
    };

    const handleError = (event: ErrorEvent) => {
      console.error("全局错误:", event.error);
      // 可以在这里添加错误上报逻辑
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        {/* 根容器 - 确保应用占满整个浏览器视口 */}
        <div
          style={{
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            position: "fixed",
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
          }}
        >
          {/* 渲染主页面组件 */}
          <ErrorBoundary>
            <AntdApp>
              <Main />
            </AntdApp>
          </ErrorBoundary>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
