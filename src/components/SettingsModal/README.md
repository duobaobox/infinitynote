# SettingsModal 组件文档

## 概述

`SettingsModal` 是一个完整的设置管理模态框组件，提供了应用程序的所有配置选项管理功能。

## 项目结构

```
src/components/SettingsModal/
├── index.ts                    # 统一导出文件
├── SettingsModal.tsx          # 主组件
├── types.ts                   # 类型定义
├── constants.ts               # 常量配置
├── utils.ts                   # 工具函数
├── index.module.css           # 样式文件
└── tabs/                      # 选项卡子组件
    ├── index.ts               # 选项卡导出文件
    ├── ModelSettingsTab.tsx   # 模型服务设置
    ├── GeneralSettingsTab.tsx # 常规设置
    ├── DisplaySettingsTab.tsx # 显示设置
    ├── DataSettingsTab.tsx    # 数据设置
    ├── ShortcutsSettingsTab.tsx # 快捷键设置
    ├── CloudSettingsTab.tsx   # 云同步设置
    └── AboutSettingsTab.tsx   # 关于我们
```

## 主要功能

### 1. 设置管理

- ✅ 本地存储设置的加载和保存
- ✅ 设置数据的导入和导出
- ✅ 设置验证和错误处理
- ✅ 默认值管理

### 2. 模块化设计

- ✅ 7 个功能模块的独立组件
- ✅ 清晰的类型定义
- ✅ 统一的常量配置
- ✅ 可复用的工具函数

### 3. 用户界面

- ✅ 响应式设计支持
- ✅ 一致的视觉风格
- ✅ 流畅的交互体验
- ✅ 完整的无障碍支持

## 使用方法

### 基本使用

```tsx
import React, { useState } from "react";
import SettingsModal from "@/components/SettingsModal";

const App = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setSettingsOpen(true)}>打开设置</button>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};
```

### 高级使用 - 监听设置变更

```tsx
import { loadSettingsFromStorage } from "@/components/SettingsModal";

// 监听设置变更
const settings = loadSettingsFromStorage();
console.log("当前设置:", settings);
```

## API 文档

### SettingsModal 属性

| 属性    | 类型       | 必填 | 默认值 | 描述                 |
| ------- | ---------- | ---- | ------ | -------------------- |
| open    | boolean    | ✅   | -      | 模态框是否可见       |
| onClose | () => void | ✅   | -      | 关闭模态框的回调函数 |

### 主要类型定义

#### SettingsConfig

```tsx
interface SettingsConfig {
  model: ModelSettings; // 模型服务设置
  general: GeneralSettings; // 常规设置
  display: DisplaySettings; // 显示设置
  data: DataSettings; // 数据设置
  shortcuts: ShortcutConfig[]; // 快捷键配置
  cloud: CloudSettings; // 云同步设置
  app: AppInfo; // 应用信息
}
```

### 工具函数

#### 设置管理

- `loadSettingsFromStorage()` - 从本地存储加载设置
- `saveSettingsToStorage(settings)` - 保存设置到本地存储
- `getDefaultSettings()` - 获取默认设置配置

#### 导入导出

- `exportSettings(settings)` - 导出设置数据
- `importSettings(exportData, currentSettings)` - 导入设置数据
- `downloadSettingsFile(settings)` - 下载设置文件
- `readSettingsFromFile(file)` - 从文件读取设置

#### 存储统计

- `calculateStorageUsage()` - 计算本地存储使用情况

## 设置模块详解

### 1. 模型服务 (ModelSettings)

- API 提供商选择 (OpenAI, Anthropic, Azure, 本地)
- API 密钥配置和验证
- 默认模型选择
- 自定义端点配置 (Azure)

### 2. 常规设置 (GeneralSettings)

- 自动保存开关
- 启动时恢复会话
- 系统通知开关
- 界面语言选择

### 3. 显示设置 (DisplaySettings)

- 主题模式 (浅色/深色/自动)
- 网格显示开关
- 平滑缩放开关
- 工具栏位置配置
- 缩放控制位置配置

### 4. 数据设置 (DataSettings)

- 数据导出功能
- 数据导入功能
- 数据清除功能
- 存储使用统计

### 5. 快捷键 (ShortcutConfig)

- 编辑快捷键列表
- 视图快捷键列表
- 快捷键自定义 (规划中)

### 6. 云同步 (CloudSettings)

- 同步状态显示
- 云服务配置 (规划中)

### 7. 关于我们 (AppInfo)

- 应用信息展示
- 功能特色介绍
- 更新检查
- 测试面板入口

## 样式规范

### CSS 模块结构

- **模态框样式**: 尺寸、定位、层级管理
- **布局样式**: 侧边栏、内容区域、响应式布局
- **组件样式**: 设置项、分组、交互状态
- **响应式设计**: 移动端适配
- **滚动条样式**: 统一的滚动条外观

### 设计系统集成

- 使用 CSS 变量保持主题一致性
- 遵循现有的间距和色彩规范
- 支持深色/浅色主题切换

## 扩展指南

### 添加新的设置模块

1. **创建类型定义**

```tsx
// types.ts
interface NewModuleSettings {
  option1: boolean;
  option2: string;
}

// 更新 SettingsConfig
interface SettingsConfig {
  // ...existing
  newModule: NewModuleSettings;
}
```

2. **添加默认值**

```tsx
// constants.ts
export const DEFAULT_NEW_MODULE_SETTINGS = {
  option1: true,
  option2: "default",
};
```

3. **创建组件**

```tsx
// tabs/NewModuleTab.tsx
const NewModuleTab: React.FC<NewModuleTabProps> = ({
  settings,
  onSettingChange,
}) => {
  // 组件实现
};
```

4. **添加菜单项**

```tsx
// constants.ts
export const MENU_ITEMS = [
  // ...existing
  { key: "newModule", icon: React.createElement(NewIcon), label: "新模块" },
];
```

5. **更新主组件**

```tsx
// SettingsModal.tsx
case 'newModule':
  return (
    <NewModuleTab
      settings={settings.newModule}
      onSettingChange={(key, value) => handleSettingChange('newModule', key, value)}
    />
  );
```

## 最佳实践

### 开发建议

1. **类型安全**: 充分利用 TypeScript 类型检查
2. **组件拆分**: 保持组件单一职责
3. **状态管理**: 使用统一的设置更新机制
4. **错误处理**: 添加适当的错误边界和用户反馈
5. **性能优化**: 使用 React.memo 和 useCallback 优化渲染

### 维护指南

1. **向后兼容**: 添加新设置时保持旧版本兼容
2. **数据迁移**: 提供设置版本升级机制
3. **测试覆盖**: 为关键功能添加单元测试
4. **文档更新**: 及时更新 API 文档和使用示例

## 注意事项

### 已知限制

- 部分功能 (云同步) 仍在开发中
- 快捷键自定义功能待实现
- 移动端体验仍可优化

### 兼容性

- 支持现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
- 依赖 localStorage API
- 需要 React 18+ 和 Ant Design 5+

## 更新日志

### v1.0.0 (当前版本)

- ✅ 完整的 UI 框架搭建
- ✅ 7 个设置模块实现
- ✅ 数据持久化和导入导出
- ✅ 响应式设计和主题支持
- ✅ 完整的类型定义和工具函数

### 规划中的功能

- 🔲 云同步功能实现
- 🔲 快捷键自定义
- 🔲 设置搜索功能
- 🔲 批量操作支持
- 🔲 更多主题选项
