# 🎨 Ant Design 主题系统

## 概述

我们的 InfinityNote2 项目现在已经集成了完整的 Ant Design 主题系统，支持明亮主题、暗黑主题和紧凑主题。

## 🌟 功能特性

### 1. 多主题支持

- **明亮主题 (Light)**: 默认主题，适合大多数使用场景
- **暗黑主题 (Dark)**: 护眼暗黑模式，适合低光环境
- **紧凑主题 (Compact)**: 适合小屏幕设备

### 2. 主题自动切换

- 跟随系统主题设置
- 用户手动切换覆盖系统设置
- 主题设置本地存储，下次访问自动恢复

### 3. 组件级主题适配

- Ant Design 组件完全适配
- 自定义组件（便签卡片、画布工具栏）主题支持
- CSS 变量系统支持动态主题切换

## 🛠️ 使用方法

### 基础用法

```tsx
import { useTheme, ThemeToggle } from "../theme";

function MyComponent() {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  return (
    <div>
      <p>当前主题: {theme}</p>
      <p>是否暗黑模式: {isDark ? "是" : "否"}</p>

      {/* 主题切换按钮 */}
      <ThemeToggle size="middle" />

      {/* 手动切换主题 */}
      <button onClick={() => setTheme("dark")}>暗黑主题</button>
      <button onClick={() => setTheme("light")}>明亮主题</button>
      <button onClick={() => setTheme("compact")}>紧凑主题</button>
    </div>
  );
}
```

### 便签颜色主题

```tsx
import { noteColorThemes } from "../theme";

function NoteCard({ note, isDark }) {
  const themeColors = isDark ? noteColorThemes.dark : noteColorThemes.light;
  const backgroundColor = themeColors[note.color] || themeColors.yellow;

  return <div style={{ backgroundColor }}>{note.content}</div>;
}
```

### 画布网格主题

```tsx
import { canvasGridThemes } from "../theme";

function Canvas({ isDark }) {
  const gridTheme = isDark ? canvasGridThemes.dark : canvasGridThemes.light;

  return (
    <div
      className="canvas-grid"
      style={{
        "--grid-color": gridTheme.gridColor,
        "--grid-size": `${gridTheme.gridSize}px`,
        "--grid-opacity": gridTheme.gridOpacity,
      }}
    >
      {/* 画布内容 */}
    </div>
  );
}
```

## 📁 目录结构

```
src/theme/
├── index.ts              # 主题系统统一导出
├── ThemeProvider.tsx     # 主题提供者组件
├── antd.ts              # Ant Design 主题配置
├── variables.ts         # CSS 变量和颜色主题
└── global.css           # 全局主题样式
```

## 🎨 颜色系统

### 明亮主题颜色

- 主色: #1890ff
- 成功色: #52c41a
- 警告色: #faad14
- 错误色: #ff4d4f
- 背景色: #ffffff
- 文本色: #262626

### 暗黑主题颜色

- 主色: #177ddc
- 成功色: #49aa19
- 警告色: #d89614
- 错误色: #a61d24
- 背景色: #000000 / #141414
- 文本色: #ffffff

## 🔧 自定义配置

### 修改主题配置

编辑 `src/theme/antd.ts` 文件：

```tsx
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: "#1890ff", // 修改主色
    borderRadius: 8, // 修改圆角
    // 其他配置...
  },
  components: {
    Button: {
      borderRadius: 6, // 按钮圆角
      // 其他组件配置...
    },
  },
};
```

### 添加新的便签颜色

编辑 `src/theme/variables.ts` 文件：

```tsx
export const noteColorThemes = {
  light: {
    yellow: "#FFF2CC",
    // 添加新颜色
    mint: "#E6FFFA",
  },
  dark: {
    yellow: "#3D3B00",
    // 对应的暗黑主题颜色
    mint: "#1A3D35",
  },
};
```

## 🚀 最佳实践

1. **使用 CSS 变量**: 优先使用 `var(--color-primary)` 等 CSS 变量
2. **响应式设计**: 利用主题系统的响应式断点
3. **性能优化**: 主题切换使用 CSS 变量，避免重新渲染
4. **用户体验**: 提供明显的主题切换入口
5. **测试覆盖**: 确保所有主题下组件显示正常

## 📱 主题切换体验

- 画布工具栏右侧有主题切换按钮 (🌙/☀️)
- 支持键盘快捷键切换主题
- 主题切换动画流畅自然
- 所有组件实时响应主题变化

## 🎯 未来扩展

1. **更多主题变体**: 高对比度主题、护眼主题等
2. **主题编辑器**: 用户自定义主题颜色
3. **季节主题**: 根据时间自动切换主题
4. **无障碍支持**: 更好的可访问性主题选项
