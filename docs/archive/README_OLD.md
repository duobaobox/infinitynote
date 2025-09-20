# InfinityNote 2 - 无限便签 2.0

<div align="center">

一个现代化的便签应用，支持无限画布、智能标签管理和可视化编辑体验。

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![React](https://img.shields.io/badge/React-19.1-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1-green.svg)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5.27-blue.svg)

</div>

## ✨ 项目概述

InfinityNote 2 是一个基于现代前端技术栈构建的便签应用，提供直观的用户界面和强大的功能特性。项目采用组件化架构，支持本地数据存储，旨在为用户提供高效的笔记管理体验。

### 🎯 核心特性

- **🖥️ 现代化界面** - 基于 Ant Design 的精美 UI 设计
- **🎨 无限画布** - 自由拖拽布局，支持可视化便签管理
- **🏷️ 智能标签** - 便签分类和快速筛选功能
- **💾 本地存储** - 基于 IndexedDB 的数据持久化
- **🔄 拖拽排序** - 支持便签和标签的拖拽重排序
- **🎭 响应式设计** - 适配不同屏幕尺寸的设备
- **⚡ 高性能** - Vite 构建工具，快速开发和构建

## 🛠️ 技术栈

### 前端框架

- **React 19** - 最新版本的 React 框架
- **TypeScript 5.8** - 静态类型检查，提升开发体验
- **Vite 7.1** - 下一代前端构建工具

### UI 组件库

- **Ant Design 5.27** - 企业级 UI 设计语言和组件库
- **@ant-design/icons 6.0** - 官方图标库

### 状态管理

- **Zustand 5.0** - 轻量级状态管理库

### 数据存储

- **Dexie 4.2** - IndexedDB 的现代化封装库

### 功能增强

- **@dnd-kit/core 6.3** - 现代化的拖拽功能库
- **React Router DOM 7.8** - React 路由管理

### 开发工具

- **ESLint 9.33** - 代码质量检查
- **TypeScript ESLint 8.39** - TypeScript 专用 ESLint 规则

## 📁 项目结构

```
InfinityNote2/
├── public/                  # 静态资源
│   └── vite.svg            # Vite 图标
├── src/                    # 源代码目录
│   ├── components/         # 可复用组件
│   │   ├── NoteCard/      # 便签卡片组件
│   │   ├── NoteEditor/    # 便签编辑器组件
│   │   └── TagManager/    # 标签管理组件
│   ├── pages/             # 页面级组件
│   │   ├── Main/          # 主页面（已实现）
│   │   │   ├── index.tsx  # 主页面组件
│   │   │   └── index.module.css # 页面样式
│   │   └── Canvas/        # 画布页面
│   ├── store/             # 状态管理
│   │   ├── noteStore.ts   # 便签状态管理
│   │   └── tagStore.ts    # 标签状态管理
│   ├── utils/             # 工具函数
│   │   ├── db.ts          # 数据库配置
│   │   ├── export.ts      # 导入导出功能
│   │   └── iconRegistry.ts # 图标注册表（已实现）
│   ├── types/             # 类型定义
│   │   └── index.d.ts     # 全局类型声明
│   ├── assets/            # 静态资源
│   │   └── react.svg      # React 图标
│   ├── App.tsx            # 应用入口组件（已实现）
│   ├── App.css            # 应用样式
│   ├── main.tsx           # 应用启动入口
│   ├── index.css          # 全局样式
│   └── vite-env.d.ts      # Vite 环境类型
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── tsconfig.app.json      # 应用 TypeScript 配置
├── tsconfig.node.json     # Node.js TypeScript 配置
├── eslint.config.js       # ESLint 配置
└── README.md              # 项目说明文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 pnpm
pnpm dev
```

开发服务器将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
# 使用 npm
npm run build

# 或使用 pnpm
pnpm build
```

### 预览生产构建

```bash
# 使用 npm
npm run preview

# 或使用 pnpm
pnpm preview
```

## 🎮 功能状态

### ✅ 已实现功能

- [x] **项目初始化** - 完整的项目结构和配置文件
- [x] **主界面布局** - 侧边栏和画布区域的响应式布局
- [x] **图标系统** - 基于 Ant Design Icons 的动态图标组件
- [x] **侧边栏功能** - 折叠/展开、画布列表、便签列表
- [x] **视图切换** - 画布模式和工作台模式切换
- [x] **模拟数据展示** - 画布列表和便签列表的界面展示

### 🚧 开发中功能

- [ ] **数据持久化** - Dexie 数据库集成和数据模型设计
- [ ] **状态管理** - Zustand stores 的完整实现
- [ ] **便签组件** - NoteCard 和 NoteEditor 组件开发
- [ ] **标签管理** - TagManager 组件和相关功能
- [ ] **画布页面** - Canvas 页面的交互式画布实现
- [ ] **拖拽功能** - 基于 @dnd-kit 的拖拽排序功能
- [ ] **搜索功能** - 便签内容的全文搜索
- [ ] **导入导出** - 数据的导入导出功能

## 🔧 开发指南

### 代码规范

项目使用 ESLint 进行代码质量检查：

```bash
# 检查代码规范
npm run lint

# 或
pnpm lint
```

### 组件开发

- 使用 TypeScript 进行类型安全的开发
- 采用 CSS Modules 进行样式隔离
- 遵循 React Hooks 最佳实践
- 使用 Ant Design 组件库保持界面一致性

### 状态管理

- 使用 Zustand 进行简洁的状态管理
- 按功能模块拆分不同的 store
- 保持状态的不可变性

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面构建库
- [Ant Design](https://ant.design/) - 企业级 UI 设计语言
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Zustand](https://zustand-demo.pmnd.rs/) - 小巧的状态管理库
- [Dexie](https://dexie.org/) - IndexedDB 的现代化封装

---

<div align="center">
Made with ❤️ by InfinityNote Team
</div>
