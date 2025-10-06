# HTML→Markdown 优化修复说明

## 问题分析（基于 `日志1.m'd`）

### 发现的 Bug

日志显示 prompt 中便签内容变成了 `nullnullnull...`（19 个 null），导致 AI 无法正确处理。

**错误日志片段：**

```json
"content": "请根据以下便签内容进行处理（指令：总结）：\n\n便签1: 什么是羊群效应\nnullnullnullnullnullnullnullnullnullnullnullnullnullnullnullnullnullnullnull\n---"
```

### 根本原因

1. ❌ 之前的 `turndownInstance.addRule` 自定义规则返回了 `null`
2. ❌ 这导致 turndown 认为所有元素都应该被替换为 `null`
3. ❌ 最终输出变成了多个 `null` 拼接的字符串

## 修复方案

### 1. 移除错误的自定义规则

```typescript
// ❌ 删除了这段错误的代码
turndownInstance.addRule("removeAttributes", {
  filter: (node) => node.nodeType === 1,
  replacement: () => null as any, // 这会导致所有内容变 null！
});
```

### 2. 使用预处理方式清理 HTML

```typescript
// ✅ 新增预处理函数
function preprocessHTML(html: string): string {
  // 移除 ProseMirror 相关的 class 属性
  html = html.replace(/\s*class="[^"]*ProseMirror[^"]*"/gi, "");
  // 移除所有 class 属性
  html = html.replace(/\s*class="[^"]*"/gi, "");
  // 移除所有 style 属性
  html = html.replace(/\s*style="[^"]*"/gi, "");
  // 移除 data-* 属性
  html = html.replace(/\s*data-[a-z-]+="[^"]*"/gi, "");

  return html;
}
```

### 3. 在转换前调用预处理

```typescript
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    // 预处理：移除 ProseMirror 属性
    const cleanHTML = preprocessHTML(html);

    const turndown = getTurndownService();
    let markdown = turndown.turndown(cleanHTML);

    // 后处理：清理多余空行
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    return markdown;
  } catch (error) {
    console.error("❌ HTML→Markdown 转换失败:", error);
    // 降级方案：简单移除所有 HTML 标签
    return html.replace(/<[^>]*>/g, "").trim();
  }
}
```

### 4. 增强调试日志（Main.tsx）

```typescript
const connectedNotesContent = latestConnectedNotes
  .map((note, index) => {
    // 调试日志
    console.log(`  📄 处理便签 ${index + 1}:`, {
      title: note.title,
      contentLength: note.content?.length || 0,
      contentPreview: note.content?.substring(0, 100),
    });

    // 转换 HTML 为干净的 Markdown
    const cleanContent = htmlToMarkdown(note.content || "");

    console.log(`  ✅ 转换结果:`, {
      markdownLength: cleanContent.length,
      markdownPreview: cleanContent.substring(0, 100),
    });

    return `便签${index + 1}: ${note.title || "无标题"}\n${cleanContent}\n---`;
  })
  .join("\n");
```

## 测试验证步骤

### 1. 重启开发服务器

```bash
npm run dev
```

### 2. 测试多便签汇总

1. 创建一个包含格式的便签（标题、列表、粗体等）
2. 添加到连接插槽
3. 输入汇总指令（如"总结"）
4. 打开浏览器控制台查看日志

### 3. 检查控制台日志

应该看到类似这样的日志：

```
📝 构建AI提示词...
  📄 处理便签 1: {
    title: "什么是羊群效应",
    contentLength: 5234,
    contentPreview: "<p class=\"ProseMirror-paragraph\"..."
  }
  ✅ 转换结果: {
    markdownLength: 1523,
    markdownPreview: "\"羊群效应\"（Herd Behavior..."
  }
  📌 最终AI提示词长度: 1600
  📌 提示词预览: 请根据以下便签内容进行处理...
```

### 4. 检查新日志文件

查看 `docs/日志.md` 或新生成的日志，验证：

- ✅ `prompt` 中是干净的 Markdown（没有 HTML 标签）
- ✅ 没有 `nullnullnull...` 的错误
- ✅ 保留了内容结构（标题 `##`、列表 `-`、粗体 `**`）
- ✅ prompt 大小显著减少（预期从 12KB → 4-5KB）

## 预期效果对比

### 优化前（有 bug，日志 1）

```
"content": "便签1: 什么是羊群效应\nnullnullnull..."
```

### 优化后（预期）

```
"content": "便签1: 什么是羊群效应\n\"羊群效应\"（Herd Behavior...）\n\n## 核心特征\n1. **放弃独立判断**：...\n---"
```

## Token 节省效果

| 版本                 | Prompt 大小     | Tokens（估算）    | 节省     |
| -------------------- | --------------- | ----------------- | -------- |
| 原始 HTML（日志.md） | 12,274 字节     | ~4,000 tokens     | 基准     |
| Bug 版本（日志 1）   | 347 字节        | ❌ 内容错误       | N/A      |
| **修复后（预期）**   | **~5,000 字节** | **~1,800 tokens** | **55%↓** |

## 文件变更清单

- ✅ `src/utils/htmlToMarkdown.ts` - 移除错误规则，添加预处理函数
- ✅ `src/pages/Main/index.tsx` - 增强调试日志
- 📝 `docs/HTML转Markdown优化修复说明.md` - 本文档

## 下一步

如果测试后仍有问题：

1. 查看浏览器控制台的详细日志
2. 检查 `📄 处理便签` 和 `✅ 转换结果` 的输出
3. 如果 `markdownLength` 为 0，说明转换失败，查看错误信息
4. 如果仍然出现 `null`，可能是 turndown 库本身的问题，需要降级到纯文本方案

## 降级方案（如果 turndown 仍有问题）

如果 turndown 在浏览器环境下仍然不稳定，可以快速切换到简单的 strip-HTML 方案：

```typescript
// 在 htmlToMarkdown 函数中
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // 临时降级：直接移除 HTML 标签
  return html.replace(/<[^>]*>/g, "").trim();
}
```

这样至少能保证内容正确，只是丢失了结构格式。
