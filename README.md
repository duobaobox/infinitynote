# sticky-notes-app

本项目是一个基于 React + TypeScript + Vite 的便签应用，支持便签管理、标签管理、画布视图等功能。

## 技术栈

- React 19
- TypeScript 5
- Zustand 状态管理
- Dexie 本地数据库
- Ant Design 5
- DnD Kit 拖拽排序
- React Router 7
- Vite 构建工具

## 目录结构

```
src/
  components/                # 可复用的 UI 组件目录
    NoteCard/                # 单个便签卡片组件（展示、操作单条便签）
      index.tsx              # 便签卡片主组件
      ...                    # 可扩展：样式、子组件等
    NoteEditor/              # 便签编辑器组件（新建/编辑便签）
      index.tsx
      ...
    TagManager/              # 标签管理组件（增删改查标签）
      index.tsx
      ...
  pages/                     # 页面级组件（路由页面）
    Dashboard/               # 主面板页面（便签列表、标签筛选等）
      index.tsx
      ...
    Canvas/                  # 画布视图页面（便签自由拖拽布局）
      index.tsx
      ...
  store/                     # 全局状态管理（Zustand）
    noteStore.ts             # 便签相关的状态与操作
    tagStore.ts              # 标签相关的状态与操作
  utils/                     # 工具函数与通用逻辑
    db.ts                    # Dexie 数据库配置与初始化
    export.ts                # 便签/标签的导入导出功能
  types/                     # TypeScript 类型定义
    index.d.ts               # 全局类型声明，可扩展更多类型文件
  App.tsx                    # 应用入口组件，负责路由与全局布局
  main.tsx                   # 应用启动入口，挂载 React 应用
  index.css                  # 全局样式
  App.css                    # App 级样式
  vite-env.d.ts              # Vite 环境类型声明
```

## 启动方式

```bash
pnpm install # 或 npm install
pnpm dev     # 或 npm run dev
```

## 说明

本项目已按 sticky-notes-app 结构初始化，欢迎二次开发。

你也可以安装 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) 和 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) 这两个插件，为 React 相关代码提供更细致的 ESLint 规则校验：

> **说明：**
>
> - `eslint-plugin-react-x` 提供了更丰富的 React/TSX 语法检查和最佳实践规则。
> - `eslint-plugin-react-dom` 针对 React DOM 层面做了专门的代码规范校验。
> - 推荐在团队协作或对代码质量有较高要求时启用。

安装命令（任选其一）：

```bash
pnpm add -D eslint-plugin-react-x eslint-plugin-react-dom
# 或
npm install --save-dev eslint-plugin-react-x eslint-plugin-react-dom
```

配置示例（`eslint.config.js`）：

```js
// 引入两个插件
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]), // 忽略 dist 目录
  {
    files: ["**/*.{ts,tsx}"], // 只对 ts/tsx 文件生效
    extends: [
      // ...其他已有配置

      // 启用 React 相关的推荐规则（支持 TypeScript）
      reactX.configs["recommended-typescript"],
      // 启用 React DOM 相关的推荐规则
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"], // 指定 ts 配置
        tsconfigRootDir: import.meta.dirname, // 根目录
      },
      // 其他可选参数...
    },
  },
]);
```

> **小贴士：**
>
> - 配置完成后，运行 `pnpm lint` 或 `npm run lint` 即可自动检查并提示 React 相关代码问题。
> - 详细规则和自定义方法请参考插件官方文档。

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
