# InfinityNote2 AI 功能开发指南

## 1. 背景与目标

本指南面向 InfinityNote2 项目开发者，旨在指导如何高效、低风险地集成 AI 便签生成功能（含思维链），实现 MVP 版本并为后续扩展打下基础。

## 2. 技术选型与兼容性

- **前端框架**：React 19 + TypeScript
- **状态管理**：Zustand
- **富文本编辑器**：TipTap
- **本地存储**：Dexie（IndexedDB）
- **UI 组件**：Ant Design
- **构建工具**：Vite
- **推荐 AI 服务商**：智谱 AI（GLM-4），备选 OpenAI（GPT-3.5/4）

> 现有架构与 AI 功能高度兼容，无需大幅调整。

## 3. 架构设计

### 3.1 目录结构建议

```
src/
  services/
    aiService.ts         # AI API调用与流式处理
    aiConfigService.ts   # AI配置管理
  store/
    aiStore.ts           # AI相关状态管理
    aiConfigStore.ts     # AI配置状态管理
  components/
    AIFeatures/
      AIConfigModal/
      AIGenerateButton/
      AIStreamingDisplay/
      ThinkingChainView/
  utils/
    db.ts                # 扩展Dexie表结构
```

### 3.2 关键模块说明

- **AI 服务层**：负责 AI API 调用、流式响应、错误处理
- **配置管理**：统一管理 API Key、模型、参数等
- **状态管理**：Zustand 扩展，管理 AI 生成状态、历史、配置
- **UI 组件**：AI 入口按钮、配置弹窗、生成过程展示、思维链查看器
- **数据存储**：扩展 Dexie，支持 AI 配置、生成历史、思维链数据

## 4. 数据结构设计

### 4.1 Note 类型扩展

```typescript
export interface Note {
  // ...原有字段...
  aiMetadata?: {
    isAIGenerated: boolean;
    generatedAt?: Date;
    aiModel?: string;
    originalPrompt?: string;
    generationConfig?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    };
  };
  thinkingChain?: {
    id: string;
    prompt: string;
    steps: ThinkingStep[];
    totalThinkingTime: number;
    createdAt: Date;
    showThinking?: boolean;
  };
  hasThinking?: boolean;
}

export interface ThinkingStep {
  id: string;
  content: string;
  stepType: "analysis" | "reasoning" | "conclusion" | "question" | "idea";
  timestamp: Date;
  order: number;
}
```

### 4.2 AI 配置与历史表

```typescript
interface AISettings {
  id: string;
  apiUrl: string;
  apiKey: string;
  aiModel: string;
  enableAI: boolean;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  summaryMode: "full" | "final_answer_only";
  updatedAt: Date;
}

interface AIGeneration {
  id: string;
  noteId: string;
  prompt: string;
  response: string;
  aiModel: string;
  generationTime: number;
  tokensUsed: number;
  cost: number;
  createdAt: Date;
}
```

## 5. 开发流程

### 5.1 阶段划分

1. **基础架构搭建**
   - 新建 AI 服务、配置、状态管理模块
   - 扩展 Dexie 表结构
2. **核心功能开发**
   - AI API 调用与流式响应
   - 便签 AI 生成与思维链解析
   - UI 组件开发与集成
3. **高级特性实现**
   - 思维链展示与导出
   - 配置界面完善
   - 错误与性能优化
4. **集成与测试**
   - 与现有系统深度集成
   - 端到端测试与体验优化

### 5.2 典型开发流程

1. **API Key 配置**：在设置面板填写 AI 服务商 API Key
2. **AI 生成入口**：在画布工具栏/便签右键/编辑器工具栏触发 AI 生成
3. **流式生成体验**：展示 AI 生成进度与思维链
4. **结果采纳**：用户可一键采纳、重新生成或查看思维链详情
5. **历史与统计**：支持 AI 生成历史查询与用量统计

### 5.3 关键接口示例

```typescript
// AI服务调用
const result = await aiService.generateNote({
  prompt: '请生成一份会议纪要',
  config: { temperature: 0.7, maxTokens: 1024 }
});

// 保存AI配置
await aiConfigService.saveSettings({ apiKey, apiUrl, ... });

// 获取思维链
const chain = await aiService.getThinkingChain(noteId);
```

## 6. 测试与上线

- 单元测试：AI 服务、数据处理、状态管理
- 集成测试：API 调用、流式响应、UI 交互
- 端到端测试：完整用户流程、异常场景
- 性能测试：响应速度、内存占用
- 上线前 Checklist：API Key 安全、错误提示、降级方案

## 7. 常见问题与注意事项

- **API Key 安全**：仅保存在本地，不上传云端
- **网络异常处理**：实现重试与降级，提示用户
- **流式响应兼容性**：优先 SSE，必要时支持 WebSocket
- **成本控制**：限制单次最大 tokens，统计用量
- **UI 一致性**：复用 Ant Design 风格，适配移动端
- **数据迁移**：新字段需兼容老数据，建议加版本号

## 8. 参考资料

- 智谱 AI 官方文档：https://open.bigmodel.cn/dev/api
- OpenAI 官方文档：https://platform.openai.com/docs/api-reference
- TipTap 官方文档：https://tiptap.dev/
- Dexie 官方文档：https://dexie.org/

---

如有疑问请联系架构负责人或查阅项目内 AI 功能技术文档。
