// 引入主页面组件
import Main from "./pages/Main";
// 引入主题系统
import { ThemeProvider } from "./theme";
// 引入错误边界组件
import ErrorBoundary from "./components/ErrorBoundary";
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
            <Main />
          </ErrorBoundary>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
