# InfinityNote2

> 🚀 **现代化无限画布便签应用** - 支持 AI 生成、思维链显示、多主题的智能便签工具

<div align="center">

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo/infinitynote2)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.2-green.svg)](https://vitejs.dev/)

</div>

## ✨ 特性亮点

- 🎨 **无限画布**: 自由拖拽、缩放的便签管理
- 🤖 **AI 智能生成**: 支持多种 AI 提供商（OpenAI、Claude、DeepSeek 等）
- 🧠 **思维链显示**: 可视化 AI 思考过程
- 🌊 **流式生成**: 实时显示 AI 生成内容
- ↩️ **撤销重做**: 全局撤销重做功能，支持所有便签操作
- 🎭 **多主题支持**: 明亮/暗黑主题自由切换
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 💾 **本地存储**: 基于 IndexedDB 的可靠数据存储
- ⚡ **性能优化**: 虚拟化渲染、代码分割、懒加载

## 🛠️ 技术栈

### 核心框架

- **React 19.1.1** - 最新版本的 React 框架
- **TypeScript 5.8.3** - 类型安全的 JavaScript
- **Vite 7.1.2** - 下一代前端构建工具

### UI & 交互

- **Ant Design 5.27.3** - 企业级 UI 组件库
- **TipTap 3.4.2** - 现代化富文本编辑器
- **@dnd-kit** - 拖拽交互库

### 状态管理 & 存储

- **Zustand 5.0.8** - 轻量级状态管理
- **Dexie 4.2.0** - IndexedDB 封装库

### AI 集成

- **多提供商支持** - OpenAI、Anthropic、DeepSeek、智谱 AI 等
- **流式处理** - 实时内容生成和显示
- **思维链** - AI 推理过程可视化

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0
- npm >= 10.0.0

### 安装与运行

```bash
# 克隆项目
git clone <repository-url>
cd infinitynote2

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 配置 AI 服务

1. 打开应用设置
2. 选择 AI 提供商
3. 配置 API 密钥
4. 选择模型并开始使用

## 📁 项目结构

```
src/
├── components/          # UI组件
│   ├── AIInlineControl/ # AI控制组件
│   ├── NoteCard/        # 便签卡片
│   ├── TiptapEditor/    # 富文本编辑器
│   └── ...
├── services/            # 业务服务
│   ├── ai/             # AI提供商服务
│   ├── aiService.ts    # AI服务主入口
│   └── ...
├── store/              # 状态管理
├── theme/              # 主题系统
├── types/              # 类型定义
└── utils/              # 工具函数
```

## 🎯 核心功能

### 便签管理

- 创建、编辑、删除便签
- 自由拖拽和调整大小
- 多种颜色主题
- 标签分类管理

### AI 智能生成

- 支持 6+主流 AI 提供商
- 实时流式内容生成
- 思维链过程展示
- 自定义提示词模板

### 用户体验

- 响应式设计
- 暗黑/明亮主题
- 键盘快捷键（含撤销重做）
- 性能优化

### 撤销重做系统

- 全局撤销重做支持（Ctrl+Z / Ctrl+Y）
- 智能操作合并
- 历史记录管理
- 详见 [撤销重做文档](./docs/undo-redo/)

## 📚 文档

### 核心文档

- [架构设计](./docs/ARCHITECTURE.md)
- [AI 开发指南](./docs/AI_DEVELOPMENT.md)
- [API 参考](./docs/API.md)
- [部署指南](./docs/DEPLOYMENT.md)
- [性能优化](./docs/PERFORMANCE_OPTIMIZATION.md)

### 功能文档

- [撤销重做功能](./docs/undo-redo/) - 完整的撤销重做系统说明

## 🧪 测试

```bash
# 运行测试
npm run test

# 性能基准测试
node tests/core/performance-benchmark.js

# AI功能测试
# 在浏览器控制台运行 tests/core/test-ai-functionality.js
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Ant Design](https://ant.design/) - UI 组件库
- [TipTap](https://tiptap.dev/) - 富文本编辑器
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [Vite](https://vitejs.dev/) - 构建工具

## 📞 支持

如果您遇到问题或有建议，请：

- 查看 [文档](./docs/)
- 提交 [Issue](https://github.com/your-repo/infinitynote2/issues)
- 联系开发团队

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个星标！**

</div>
