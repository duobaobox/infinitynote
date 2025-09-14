# NoteWorkbench 便签工作台组件

便签工作台是一个位于画布底部的工具栏组件，提供AI生成便签和创建空白便签的功能。

## 功能特性

- 🤖 **AI生成便签**: 用户输入提示词，AI生成便签内容
- 📝 **空白便签**: 留空输入框，创建空白便签
- ⌨️ **快捷键支持**: 支持回车键快速提交
- 🎨 **主题适配**: 自动适配明亮/暗黑主题
- 📱 **响应式设计**: 适配不同屏幕尺寸
- 🔄 **状态反馈**: 加载、成功、错误状态指示
- ♿ **无障碍支持**: 支持键盘导航和屏幕阅读器

## 组件结构

```
src/components/NoteWorkbench/
├── index.tsx           # 主组件文件
├── index.module.css    # 样式文件
├── types.ts           # 类型定义
└── README.md          # 说明文档
```

## 使用方法

### 基础用法

```tsx
import { NoteWorkbench } from "../../components/NoteWorkbench";

function Canvas() {
  const handleAddNote = (prompt?: string) => {
    if (prompt) {
      console.log("AI生成便签:", prompt);
      // TODO: 调用AI API生成便签
    } else {
      console.log("创建空白便签");
      // TODO: 创建空白便签
    }
  };

  return (
    <div>
      {/* 画布内容 */}
      
      {/* 便签工作台 */}
      <NoteWorkbench onAddNote={handleAddNote} />
    </div>
  );
}
```

### 高级用法

```tsx
import { NoteWorkbench } from "../../components/NoteWorkbench";
import { useState } from "react";

function Canvas() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddNote = async (prompt?: string) => {
    setLoading(true);
    try {
      if (prompt) {
        // 调用AI API生成便签
        const result = await generateAINote(prompt);
        console.log("AI生成结果:", result);
      } else {
        // 创建空白便签
        const note = await createBlankNote();
        console.log("创建空白便签:", note);
      }
    } catch (error) {
      console.error("操作失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 画布内容 */}
      
      {/* 便签工作台 */}
      <NoteWorkbench
        value={inputValue}
        onChange={setInputValue}
        onAddNote={handleAddNote}
        loading={loading}
        placeholder="输入您的创意想法..."
      />
    </div>
  );
}
```

## API 参考

### NoteWorkbenchProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | `""` | 输入框的值 |
| `onChange` | `(value: string) => void` | - | 输入框值变化回调 |
| `onAddNote` | `(prompt?: string) => void` | - | 添加便签按钮点击回调 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `placeholder` | `string` | `"输入文本AI生成便签，留空创建空白便签..."` | 输入框占位符 |

### 回调函数说明

#### onAddNote(prompt?: string)

当用户点击添加按钮或按下回车键时触发。

- `prompt`: 用户输入的提示词，如果为空则表示创建空白便签
- 返回值: 可以返回 Promise 以支持异步操作

## 样式定制

组件使用CSS模块化，支持通过CSS变量进行主题定制：

```css
/* 自定义主题变量 */
:root {
  --color-bg-elevated: #ffffff;
  --color-border-secondary: #f0f0f0;
  --color-primary: #1890ff;
  --color-primary-bg: #e6f7ff;
  --border-radius: 8px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

## 快捷键

- `Enter`: 提交输入内容（创建便签）
- `Shift + Enter`: 在输入框中换行（暂未实现多行输入）

## 状态指示

组件支持以下状态：

- **idle**: 空闲状态
- **loading**: 加载中（显示加载动画）
- **success**: 成功状态（短暂显示绿色指示）
- **error**: 错误状态（短暂显示红色指示）

## 响应式设计

组件在不同屏幕尺寸下的表现：

- **桌面端** (>768px): 完整布局，大尺寸按钮和输入框
- **平板端** (≤768px): 中等尺寸，适当减少间距
- **手机端** (≤480px): 紧凑布局，小尺寸按钮

## 无障碍支持

- 支持键盘导航
- 提供适当的ARIA标签
- 支持屏幕阅读器
- 高对比度模式兼容
- 减少动画模式支持

## 注意事项

1. 组件依赖于项目的主题系统，确保已正确配置CSS变量
2. 图标组件依赖于 `iconRegistry`，确保已注册所需图标
3. 建议在父组件中处理错误状态和用户反馈
4. AI生成功能需要后端API支持，目前仅提供UI界面

## 后续扩展计划

- [ ] 支持多行输入
- [ ] 添加更多快捷操作按钮
- [ ] 支持拖拽文件创建便签
- [ ] 添加历史记录功能
- [ ] 支持模板选择
- [ ] 集成语音输入
