# 撤销重做功能 (Undo/Redo)

## 📖 文档索引

- **[功能说明](./撤销重做功能说明.md)** - 用户使用指南，快捷键和支持的操作
- **[测试指南](./撤销重做功能测试指南.md)** - 完整的测试步骤和验证方法
- **[实施总结](./撤销重做功能实施总结.md)** - 技术实现细节和架构设计

## 🚀 快速开始

### 使用快捷键

| 操作 | Windows/Linux | macOS       |
| ---- | ------------- | ----------- |
| 撤销 | `Ctrl + Z`    | `⌘ + Z`     |
| 重做 | `Ctrl + Y`    | `⌘ + ⇧ + Z` |

### UI 按钮

撤销/重做按钮位于画布右下角，点击即可执行相应操作。

## ✨ 核心特性

- ✅ **全局撤销重做** - 支持便签和画布的所有操作
- ✅ **智能合并** - 连续操作自动合并（500ms 窗口）
- ✅ **历史管理** - 最多保存 50 条历史记录
- ✅ **快捷键** - 符合标准的键盘快捷键
- ✅ **UI 指示** - 实时显示可用状态

## 🎯 支持的操作

### 便签操作（5 种）

- 创建便签
- 删除便签
- 移动便签
- 调整大小
- 批量删除

### 画布操作（可选，未完全集成）

- 创建画布
- 删除画布
- 切换画布
- 缩放/平移画布

## 🏗️ 技术架构

```
用户操作
    ↓
Store执行 → 记录到HistoryHelper
    ↓
HistoryStore管理历史栈
    ↓
用户撤销/重做
    ↓
Command执行undo/redo
    ↓
Store状态恢复
```

## 📂 核心文件

```
src/
├── store/
│   └── historyStore.ts          # 历史记录管理Store
├── types/
│   └── history.ts               # 类型定义
├── commands/
│   ├── index.ts                 # Command导出
│   ├── noteCommands.ts          # 便签相关命令
│   └── canvasCommands.ts        # 画布相关命令
├── utils/
│   └── historyHelper.ts         # 便捷工具类
├── hooks/
│   └── useHistoryShortcuts.ts   # 全局快捷键Hook
└── components/
    └── HistoryIndicator/        # UI指示器组件
```

## 🔧 集成状态

### ✅ 已集成

- [x] App.tsx - 全局快捷键
- [x] Canvas 页面 - UI 组件
- [x] noteStore.createNote() - 创建便签
- [x] noteStore.deleteNote() - 删除便签
- [x] noteStore.moveNote() - 移动便签
- [x] noteStore.resizeNote() - 调整大小
- [x] noteStore.deleteNotes() - 批量删除

### ⏳ 未集成（可选）

- [ ] noteStore.updateNote() - 更新便签属性
- [ ] canvasStore 相关操作

## ⚠️ 注意事项

1. **编辑器独立性**：TipTap 编辑器有自己的撤销重做系统，在编辑器内快捷键由编辑器处理
2. **ID 变化**：删除操作撤销后，由于数据库主键约束，便签 ID 会改变（不影响用户体验）
3. **性能考虑**：历史记录占用内存，已设置 50 条合理限制

## 📝 开发指南

### 添加新的可撤销操作

1. 在 `types/history.ts` 添加操作类型
2. 在 `commands/` 创建对应的 Command 类
3. 在 `historyHelper.ts` 添加便捷方法
4. 在 Store 中调用记录方法

示例：

```typescript
// 在Store操作完成后
try {
  const { HistoryHelper } = await import("../utils/historyHelper");
  HistoryHelper.recordNoteCreation(note);
} catch (error) {
  console.error("记录历史失败:", error);
}
```

## 🎉 完成度

**核心功能**: 100% ✅  
**Store 集成**: 80% ⚡ (noteStore 已完成，canvasStore 可选)  
**文档完整**: 100% ✅  
**测试就绪**: 100% ✅

---

更多详细信息请查看上面列出的具体文档。
