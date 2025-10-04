# AI 请求流程健壮性测试指南

## 概述

本指南用于测试在发送 AI 请求前进行模型切换、提示词修改和插槽重新连接等操作时，系统是否能够正确使用最新的状态。

## 修复内容

### 1. 配置验证增强

- ✅ 在发送 AI 请求时，从 `aiService` 重新获取最新的模型配置
- ✅ 使用 `getActiveConfig()` 确保获取当前活跃的配置
- ✅ 验证配置完整性（包括 API 密钥和模型设置）

### 2. 连接状态同步

- ✅ 从 `connectionStore` 直接读取最新的连接便签状态
- ✅ 不依赖组件 props 传递，避免状态过期
- ✅ 实时获取当前连接的便签列表

### 3. 日志增强

- ✅ 添加详细的请求准备日志
- ✅ 记录模型切换过程
- ✅ 记录插槽连接/断开操作
- ✅ 记录 AI 请求发送时的完整状态

### 4. 用户提示优化

- ✅ 模型切换时显示日志提示
- ✅ 插槽操作时显示详细信息
- ✅ 配置错误时提供友好的错误提示

## 测试场景

### 场景 1: 普通模式 - 模型切换后发送请求

**测试步骤：**

1. 在 NoteWorkbench 输入框输入提示词（如："总结今天的工作"）
2. 工具栏自动显示（CanvasToolbar）
3. 在工具栏中切换到不同的 AI 模型（如：从 DeepSeek 切换到 Qwen）
4. 点击发送按钮

**预期结果：**

- ✅ 控制台显示模型切换日志：`🔄 开始切换模型`
- ✅ 控制台显示切换成功日志：`✅ 已切换模型`
- ✅ 发送请求时日志显示使用新模型：`📌 使用模型: qwen / ...`
- ✅ AI 请求使用新切换的模型

**关键日志示例：**

```
🔄 开始切换模型: {from: "deepseek/deepseek-chat", to: "qwen/qwen-plus"}
✅ 已切换模型: qwen - qwen-plus
💡 提示: 新模型将在下次AI请求时生效
📋 准备发送AI请求: {prompt: "总结今天的工作", isConnectedMode: false, ...}
  🔧 当前使用的模型: {provider: "qwen", model: "qwen-plus"}
🚀 开始AI生成，便签ID: ...
  📌 使用模型: qwen / qwen-plus
```

---

### 场景 2: 连接模式 - 修改提示词和切换模型

**测试步骤：**

1. 在画布上创建 2-3 个便签
2. 点击便签上的连接点，将它们连接到插槽
3. 在 NoteWorkbench 输入框输入提示词（如："汇总"）
4. 在工具栏中切换 AI 模型
5. 修改提示词（如：改为 "详细分析"）
6. 点击发送按钮

**预期结果：**

- ✅ 插槽显示连接的便签数量
- ✅ 模型切换成功
- ✅ 使用最新的提示词："详细分析"
- ✅ 使用最新切换的模型
- ✅ 使用最新的连接便签列表

**关键日志示例：**

```
✅ 添加便签连接: {title: "便签1", index: 1, totalConnections: 1}
✅ 添加便签连接: {title: "便签2", index: 2, totalConnections: 2}
🔄 开始切换模型: {from: "...", to: "..."}
✅ 已切换模型: ...
📋 准备发送AI请求: {
  prompt: "详细分析",
  isConnectedMode: true,
  connectedNotesCount: 2
}
🤖 连接模式 - 汇总便签内容
  📌 提示词: 详细分析
  📌 连接的便签数量: 2
  📌 便签标题: 便签1, 便签2
  🔧 当前使用的模型: {provider: "...", model: "..."}
📝 构建AI提示词...
  📌 最终AI提示词长度: ...
  📌 提示词预览: 请根据以下便签内容进行处理（指令：详细分析）...
```

---

### 场景 3: 连接模式 - 重新连接不同便签

**测试步骤：**

1. 连接便签 A 和 B 到插槽
2. 输入提示词："汇总这些内容"
3. 移除便签 A 的连接，添加便签 C 的连接
4. 切换 AI 模型
5. 点击发送按钮

**预期结果：**

- ✅ 插槽正确显示当前连接的便签（B 和 C）
- ✅ AI 请求使用最新的连接列表（B 和 C，不包含 A）
- ✅ 使用最新切换的模型

**关键日志示例：**

```
✅ 添加便签连接: {title: "便签A", ...}
✅ 添加便签连接: {title: "便签B", ...}
🗑️ 移除便签连接: {title: "便签A", ...}
  📊 剩余连接数: 1
✅ 添加便签连接: {title: "便签C", ...}
🔄 开始切换模型: ...
📋 准备发送AI请求: {connectedNotesCount: 2}
  📌 连接的便签数量: 2
  📌 便签标题: 便签B, 便签C
```

---

### 场景 4: 插槽清空后重新连接

**测试步骤：**

1. 连接多个便签到插槽
2. 点击"清空连接"按钮
3. 重新连接不同的便签
4. 输入新的提示词
5. 切换模型
6. 点击发送按钮

**预期结果：**

- ✅ 清空后插槽索引重新从 1 开始
- ✅ 使用最新连接的便签列表
- ✅ 使用最新的提示词和模型

**关键日志示例：**

```
🧹 清空所有连接，共 3 个
✅ 添加便签连接: {index: 1, totalConnections: 1}
✅ 添加便签连接: {index: 2, totalConnections: 2}
🔄 开始切换模型: ...
📋 准备发送AI请求: {
  prompt: "新的提示词",
  connectedNotesCount: 2
}
```

---

### 场景 5: 连接模式切换（汇总/替换）

**测试步骤：**

1. 连接多个便签
2. 在插槽容器中切换连接模式（汇总 ↔ 替换）
3. 切换 AI 模型
4. 点击发送按钮

**预期结果：**

- ✅ 模式切换成功记录
- ✅ 使用正确的连接模式
- ✅ 使用最新的模型配置

**关键日志示例：**

```
🔄 切换连接模式: 汇总模式
🔄 切换连接模式: 替换模式
🔄 开始切换模型: ...
📋 准备发送AI请求: ...
```

---

## 验证要点

### 1. 状态同步验证

- [ ] 模型切换后，AI 请求使用新模型
- [ ] 插槽连接/断开后，AI 请求使用最新的便签列表
- [ ] 提示词修改后，AI 请求使用最新的提示词

### 2. 日志完整性验证

- [ ] 所有关键操作都有日志记录
- [ ] 日志包含必要的上下文信息
- [ ] 日志格式清晰易读

### 3. 错误处理验证

- [ ] 未配置 API 密钥时显示友好提示
- [ ] 模型切换失败时正确回滚状态
- [ ] 配置错误时提供"打开设置"按钮

### 4. 用户体验验证

- [ ] 操作响应及时
- [ ] 状态提示清晰
- [ ] 不会因为状态问题导致请求失败

---

## 调试技巧

### 1. 查看控制台日志

打开浏览器开发者工具（F12），查看 Console 面板：

- 🔄 表示状态变化
- ✅ 表示操作成功
- ❌ 表示操作失败
- 📋 表示数据准备
- 🚀 表示开始执行

### 2. 使用 React DevTools

安装 React DevTools 浏览器扩展，查看组件状态：

- 查看 `useConnectionStore` 的 `connectedNotes` 状态
- 查看 `CanvasToolbar` 的 `currentProvider` 和 `currentModel` 状态
- 查看 `NoteWorkbench` 的输入框值

### 3. 使用 Zustand DevTools

在开发环境中，Zustand store 已启用 DevTools：

- 可以查看 store 的状态变化历史
- 可以手动触发 actions
- 可以时间旅行调试

---

## 常见问题排查

### Q1: 切换模型后 AI 请求还是用旧模型

**原因：** 可能是配置没有正确保存到 localStorage
**解决：** 检查 `aiService.applyConfiguration()` 是否正确调用

### Q2: 插槽显示的便签和实际使用的不一致

**原因：** 可能是使用了过期的 props 而不是最新的 store 状态
**解决：** 确保使用 `useConnectionStore.getState().connectedNotes` 获取最新状态

### Q3: 提示词修改后没有生效

**原因：** 可能是使用了旧的闭包值
**解决：** 确保 `handleAddNote` 使用的是最新的 `prompt` 参数

---

## 代码关键点

### 1. 获取最新配置

```typescript
// ✅ 正确：发送请求时重新获取
const { aiService } = await import("../../services/aiService");
const currentConfig = aiService.getActiveConfig();
const configStatus = await aiService.isCurrentConfigurationReady();

// ❌ 错误：使用闭包中的旧值
// 不要依赖 useCallback 依赖项中的配置状态
```

### 2. 获取最新连接状态

```typescript
// ✅ 正确：直接从 store 读取
const latestConnectedNotes = useConnectionStore.getState().connectedNotes;

// ❌ 错误：使用 props 或闭包中的值
// const connectedNotes = props.connectedNotes; // 可能过期
```

### 3. 日志记录

```typescript
console.log("📋 准备发送AI请求:", {
  prompt: prompt || "(空)",
  isConnectedMode: actualIsConnectedMode,
  connectedNotesCount: latestConnectedNotes.length,
});
```

---

## 更新记录

- 2025-10-04: 初始版本，添加健壮性增强和测试场景
