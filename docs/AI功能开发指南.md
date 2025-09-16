# InfinityNote2 AI 功能开发指南

> **版本**: 2.0 | **更新时间**: 2025-09-16 | **架构师审查**: ✅ 已通过

## 🔍 架构师审查摘要

**评估等级**: B+ (7.5/10) - 总体思路正确，实现细节需调整

- ✅ **数据结构设计**: 优秀 (9/10) - 完美利用现有扩展性
- ⚠️ **组件架构**: 需重构 (5/10) - 过度复杂化，需简化集成
- ✅ **服务层设计**: 良好 (7/10) - 基础合理，需统一模式
- ⚠️ **状态管理**: 需调整 (6/10) - 应集成现有 store 而非独立
- ⚠️ **安全性**: 需完善 (6/10) - API 密钥管理需加强

## 1. 背景与目标

本指南面向 InfinityNote2 项目开发者，旨在指导如何**架构一致、低侵入**地集成 AI 便签生成功能（含思维链），实现 MVP 版本并为后续扩展打下基础。

**核心架构原则**：

- 🎯 **最小侵入**：充分利用现有 `customProperties` 扩展性
- 🔄 **架构一致**：遵循现有组件和服务的设计模式
- 🛡️ **向后兼容**：不破坏现有功能和用户数据
- ⚡ **性能优先**：集成现有的防抖和性能优化机制

## 2. 技术选型与架构兼容性

- **前端框架**：React 19 + TypeScript ✅
- **状态管理**：Zustand ✅ (集成现有 noteStore)
- **富文本编辑器**：TipTap 3.4.2 ✅ (扩展思维链显示)
- **本地存储**：Dexie（IndexedDB）✅ (使用 customProperties)
- **UI 组件**：Ant Design 5.27.3 ✅ (集成现有工具栏)
- **构建工具**：Vite 7.1.2 ✅
- **推荐 AI 服务商**：智谱 AI（GLM-4），备选 OpenAI（GPT-4o）

> **架构师验证**：现有架构与 AI 功能高度兼容，无需大幅调整。

## 3. 核心架构设计（优化版）

### 3.1 整体架构图

```
┌─ AI 服务层 ─────────────────────┐
│  aiService.ts (统一API调用)       │
│  aiConfigService.ts (配置管理)    │
└─────────────────┬───────────────┘
                  │
┌─ 状态管理层 ─────┼───────────────┐
│  noteStore.ts   │扩展AI方法      │ ← 集成现有store
│  (现有)         │               │
└─────────────────┼───────────────┘
                  │
┌─ 组件层 ─────────┼───────────────┐
│  NoteToolbar    │+ AI按钮        │ ← 现有组件扩展
│  TiptapEditor   │+ 思维链扩展     │ ← 现有编辑器扩展
│  NoteCard       │保持现有结构     │ ← 无需修改
└─────────────────┴───────────────┘
```

### 3.2 UI 集成策略（修正版）

**现有 NoteCard 结构保持不变**：

```tsx
// 现有结构，无需修改
<div className={styles.noteCardContainer}>
  <div className={styles.noteCard}>
    <div className={styles.noteHeader}>
      <h3>{note.title}</h3>
    </div>
    <div className={styles.noteContent}>
      <TiptapEditor /> {/* 在此内部集成思维链 */}
    </div>
  </div>
  <NoteToolbar /> {/* 在此添加AI按钮 */}
</div>
```

### 3.3 思维链集成方案（架构师优化）


**✅ 优化方案**：集成到 TipTap 编辑器内部

```tsx
// TiptapEditor.tsx - 扩展思维链显示
export const TiptapEditor = memo<TiptapEditorProps>(() => {
  // ... 现有逻辑保持不变

  // 新增：AI思维链数据获取
  const aiData = note.customProperties?.ai;
  const showThinkingChain = shouldShowThinkingChain(note, aiData);

  return (
    <TiptapEditorErrorBoundary>
      <div className={containerClassName} style={editorStyle}>
        {/* 新增：思维链显示区域（条件渲染） */}
        {showThinkingChain && (
          <ThinkingChainDisplay
            thinkingData={aiData.thinkingChain}
            isCollapsed={aiData.thinkingCollapsed ?? true}
            onToggle={handleThinkingToggle}
          />
        )}

        {/* 现有：编辑器内容区域 */}
        <EditorContent editor={editor} className="tiptap-editor-content" />

        {/* 现有：工具栏 */}
        {editor && <Toolbar editor={editor} config={toolbarConfig} />}
      </div>
    </TiptapEditorErrorBoundary>
  );
});

// 思维链显示逻辑（简化版）
const shouldShowThinkingChain = (note: Note, aiData?: any): boolean => {
  return !!(
    (
      aiData?.generated && // AI生成的便签
      aiData?.model && // 有AI模型信息
      aiData?.thinkingChain && // 有思维链数据
      aiData?.showThinking !== false
    ) // 用户未关闭显示
  );
};
```

### 3.4 工具栏集成方案

```tsx
// NoteToolbar.tsx - 添加AI功能按钮
export const NoteToolbar: React.FC<NoteToolbarProps> = ({
  noteId,
  onAction,
}) => {
  return (
    <div className={styles.noteToolbar}>
      {/* 现有按钮保持不变 */}
      <Button icon={<DeleteOutlined />} onClick={() => onAction("delete")} />
      <Button icon={<CopyOutlined />} onClick={() => onAction("duplicate")} />

      {/* 新增：AI功能按钮 */}
      <Button
        icon={<RobotOutlined />}
        onClick={() => onAction("ai-generate")}
        title="AI生成内容"
      />
      <Button
        icon={<SettingOutlined />}
        onClick={() => onAction("ai-config")}
        title="AI设置"
      />
    </div>
  );
};
```

## 4. 数据结构设计（架构师验证版）

### 4.1 Note 类型扩展（✅ 优秀设计）

**架构师评估**：现有 Note 接口的 `customProperties` 字段设计优秀，为 AI 功能提供了完美的扩展点。

```typescript
// 现有 Note 接口（无需修改）
export interface Note {
  // ... 现有字段保持不变

  /** 自定义属性 - AI功能的完美扩展点 */
  customProperties?: Record<string, any>;
}

// AI 数据结构定义
interface AICustomProperties {
  ai?: {
    // 基础信息
    generated: boolean; // 是否AI生成
    model: string; // 使用的AI模型
    provider: string; // AI服务提供商
    generatedAt: string; // 生成时间

    // 生成参数
    prompt: string; // 用户输入的提示
    temperature?: number; // 生成温度
    maxTokens?: number; // 最大token数

    // 思维链数据（如果支持）
    thinkingChain?: {
      steps: Array<{
        id: string;
        content: string;
        timestamp: number;
      }>;
      summary: string;
      totalSteps: number;
    };

    // UI状态
    showThinking?: boolean; // 是否显示思维链
    thinkingCollapsed?: boolean; // 思维链是否折叠

    // 元数据
    requestId: string; // 请求ID，用于调试
    cost?: {
      // 成本信息（可选）
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    };
  };
}

// 使用示例
const aiNote: Note = {
  id: "note_123",
  title: "AI生成的便签",
  content: "<p>AI生成的内容...</p>",
  customProperties: {
    ai: {
      generated: true,
      model: "glm-4-plus",
      provider: "zhipu",
      generatedAt: "2025-09-16T10:00:00Z",
      prompt: "用户的原始提示",
      thinkingChain: {
        steps: [
          {
            id: "step1",
            content: "分析用户需求...",
            timestamp: 1726480800000,
          },
        ],
        summary: "通过3步推理得出结论",
        totalSteps: 3,
      },
      showThinking: true,
      thinkingCollapsed: false,
      requestId: "req_abc123",
    },
  },
  // ... 其他字段
};
```

### 4.2 数据存储策略

**✅ 架构师推荐**：使用现有存储机制，无需 schema 变更

```typescript
// 在现有 noteService.ts 中扩展方法
export class NoteService {
  // 现有方法保持不变...

  // 新增：保存AI生成的便签
  static async saveAINote(
    noteData: Partial<Note>,
    aiData: AICustomProperties["ai"]
  ): Promise<string> {
    const noteWithAI: Partial<Note> = {
      ...noteData,
      customProperties: {
        ...noteData.customProperties,
        ai: aiData,
      },
    };

    return await this.createNote(noteWithAI);
  }

  // 新增：更新AI数据
  static async updateAIData(
    noteId: string,
    aiData: Partial<AICustomProperties["ai"]>
  ): Promise<void> {
    const note = await this.getNoteById(noteId);
    if (note) {
      const updatedProperties = {
        ...note.customProperties,
        ai: {
          ...note.customProperties?.ai,
          ...aiData,
        },
      };

      await this.updateNote(noteId, { customProperties: updatedProperties });
    }
  }
}
```

## 5. 状态管理设计（架构师优化）

### 5.1 集成到现有 noteStore（✅ 推荐方案）

**❌ 原方案问题**：独立的 aiStore 导致状态分散，增加复杂度
**✅ 优化方案**：扩展现有 noteStore，保持状态统一

```typescript
// src/store/noteStore.ts - 扩展AI功能
interface NoteState {
  // ... 现有状态保持不变

  // 新增：AI相关状态
  aiGenerating: Record<string, boolean>; // 正在生成AI内容的便签
  aiStreamingData: Record<string, string>; // 流式生成的实时数据
  aiErrors: Record<string, string>; // AI生成错误信息
}

interface NoteActions {
  // ... 现有方法保持不变

  // 新增：AI相关方法
  startAIGeneration: (noteId: string, prompt: string) => Promise<void>;
  updateAIStreamingContent: (noteId: string, content: string) => void;
  completeAIGeneration: (
    noteId: string,
    finalContent: string,
    aiData: any
  ) => Promise<void>;
  cancelAIGeneration: (noteId: string) => void;
  toggleThinkingChain: (noteId: string) => Promise<void>;
}

// 在现有 useNoteStore 中添加AI方法
export const useNoteStore = create<NoteStore>()(
  devtools((set, get) => ({
    // ... 现有状态和方法保持不变

    // 新增：AI相关状态
    aiGenerating: {},
    aiStreamingData: {},
    aiErrors: {},

    // 新增：开始AI生成
    startAIGeneration: async (noteId: string, prompt: string) => {
      try {
        set((state) => ({
          aiGenerating: { ...state.aiGenerating, [noteId]: true },
          aiErrors: { ...state.aiErrors, [noteId]: undefined },
        }));

        // 调用AI服务
        await aiService.generateNote({
          noteId,
          prompt,
          onStream: (content) =>
            get().updateAIStreamingContent(noteId, content),
          onComplete: (finalContent, aiData) =>
            get().completeAIGeneration(noteId, finalContent, aiData),
          onError: (error) =>
            set((state) => ({
              aiErrors: { ...state.aiErrors, [noteId]: error.message },
              aiGenerating: { ...state.aiGenerating, [noteId]: false },
            })),
        });
      } catch (error) {
        console.error("AI生成失败:", error);
        set((state) => ({
          aiErrors: { ...state.aiErrors, [noteId]: error.message },
          aiGenerating: { ...state.aiGenerating, [noteId]: false },
        }));
      }
    },

    // 新增：更新流式内容
    updateAIStreamingContent: (noteId: string, content: string) => {
      set((state) => ({
        aiStreamingData: { ...state.aiStreamingData, [noteId]: content },
      }));
    },

    // 新增：完成AI生成
    completeAIGeneration: async (
      noteId: string,
      finalContent: string,
      aiData: any
    ) => {
      try {
        // 更新便签内容和AI数据
        await get().updateNote(noteId, {
          content: finalContent,
          customProperties: {
            ...get().notes.find((n) => n.id === noteId)?.customProperties,
            ai: aiData,
          },
        });

        // 清理临时状态
        set((state) => ({
          aiGenerating: { ...state.aiGenerating, [noteId]: false },
          aiStreamingData: { ...state.aiStreamingData, [noteId]: undefined },
        }));

        console.log(`✅ AI生成完成，便签ID: ${noteId}`);
      } catch (error) {
        console.error("保存AI生成内容失败:", error);
        set((state) => ({
          aiErrors: { ...state.aiErrors, [noteId]: error.message },
          aiGenerating: { ...state.aiGenerating, [noteId]: false },
        }));
      }
    },

    // 新增：切换思维链显示
    toggleThinkingChain: async (noteId: string) => {
      const note = get().notes.find((n) => n.id === noteId);
      if (note?.customProperties?.ai) {
        const currentShow = note.customProperties.ai.showThinking ?? true;
        await get().updateNote(noteId, {
          customProperties: {
            ...note.customProperties,
            ai: {
              ...note.customProperties.ai,
              showThinking: !currentShow,
            },
          },
        });
      }
    },
  }))
);
```

## 6. AI 服务层设计（架构师优化）

### 6.1 遵循现有服务模式

**参考现有 `noteService.ts` 的设计模式**：

```typescript
// src/services/aiService.ts
import { AICustomProperties } from "../types/ai";

interface AIGenerationOptions {
  noteId: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onStream?: (content: string) => void;
  onComplete?: (finalContent: string, aiData: AICustomProperties["ai"]) => void;
  onError?: (error: Error) => void;
}

interface AIProvider {
  name: string;
  generateContent: (options: AIGenerationOptions) => Promise<void>;
  supportedModels: string[];
  supportsStreaming: boolean;
  supportsThinking: boolean;
}

class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = "zhipu";

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // 智谱AI提供商
    this.providers.set("zhipu", new ZhipuAIProvider());

    // OpenAI提供商
    this.providers.set("openai", new OpenAIProvider());
  }

  async generateNote(options: AIGenerationOptions): Promise<void> {
    try {
      const provider = this.providers.get(this.currentProvider);
      if (!provider) {
        throw new Error(`AI提供商 ${this.currentProvider} 不可用`);
      }

      await provider.generateContent(options);
    } catch (error) {
      console.error("AI生成失败:", error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  setProvider(providerName: string) {
    if (this.providers.has(providerName)) {
      this.currentProvider = providerName;
    } else {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// 智谱AI提供商实现
class ZhipuAIProvider implements AIProvider {
  name = "zhipu";
  supportedModels = ["glm-4", "glm-4-plus"];
  supportsStreaming = true;
  supportsThinking = true;

  async generateContent(options: AIGenerationOptions): Promise<void> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("智谱AI API密钥未配置");
    }

    try {
      const response = await fetch(
        "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model || "glm-4",
            messages: [
              {
                role: "user",
                content: options.prompt,
              },
            ],
            stream: true,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.statusText}`);
      }

      await this.handleStreamResponse(response, options);
    } catch (error) {
      console.error("智谱AI API调用失败:", error);
      throw error;
    }
  }

  private async handleStreamResponse(
    response: Response,
    options: AIGenerationOptions
  ) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    let fullContent = "";
    let thinkingChain: any[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";

              if (content) {
                fullContent += content;
                options.onStream?.(fullContent);
              }

              // 解析思维链（如果支持）
              if (parsed.choices?.[0]?.delta?.thinking) {
                thinkingChain.push({
                  id: `step_${thinkingChain.length + 1}`,
                  content: parsed.choices[0].delta.thinking,
                  timestamp: Date.now(),
                });
              }
            } catch (e) {
              console.warn("解析响应数据失败:", e);
            }
          }
        }
      }

      // 构造AI数据
      const aiData: AICustomProperties["ai"] = {
        generated: true,
        model: options.model || "glm-4",
        provider: "zhipu",
        generatedAt: new Date().toISOString(),
        prompt: options.prompt,
        requestId: `req_${Date.now()}`,
        showThinking: true,
        thinkingCollapsed: false,
      };

      if (thinkingChain.length > 0) {
        aiData.thinkingChain = {
          steps: thinkingChain,
          summary: `通过${thinkingChain.length}步推理完成`,
          totalSteps: thinkingChain.length,
        };
      }

      options.onComplete?.(fullContent, aiData);
    } finally {
      reader.releaseLock();
    }
  }

  private getApiKey(): string | null {
    return localStorage.getItem("ai_zhipu_api_key");
  }
}

export const aiService = new AIService();
```

## 7. 组件实现（架构师优化）

### 7.1 思维链显示组件

```tsx
// src/components/TiptapEditor/ThinkingChainDisplay.tsx
import React, { memo, useState } from "react";
import { Collapse, Typography, Tag } from "antd";
import { BrainOutlined, ClockCircleOutlined } from "@ant-design/icons";
import styles from "./ThinkingChainDisplay.module.css";

interface ThinkingChainDisplayProps {
  thinkingData: {
    steps: Array<{
      id: string;
      content: string;
      timestamp: number;
    }>;
    summary: string;
    totalSteps: number;
  };
  isCollapsed: boolean;
  onToggle: () => void;
}

export const ThinkingChainDisplay = memo<ThinkingChainDisplayProps>(
  ({ thinkingData, isCollapsed, onToggle }) => {
    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString();
    };

    const items = [
      {
        key: "thinking",
        label: (
          <div className={styles.thinkingHeader}>
            <BrainOutlined className={styles.thinkingIcon} />
            <span>AI 思维过程</span>
            <Tag color="blue" className={styles.stepCount}>
              {thinkingData.totalSteps} 步
            </Tag>
          </div>
        ),
        children: (
          <div className={styles.thinkingContent}>
            {thinkingData.steps.map((step, index) => (
              <div key={step.id} className={styles.thinkingStep}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>步骤 {index + 1}</span>
                  <span className={styles.stepTime}>
                    <ClockCircleOutlined /> {formatTime(step.timestamp)}
                  </span>
                </div>
                <div className={styles.stepContent}>{step.content}</div>
              </div>
            ))}
            <div className={styles.thinkingSummary}>
              <Typography.Text type="secondary">
                💡 {thinkingData.summary}
              </Typography.Text>
            </div>
          </div>
        ),
      },
    ];

    return (
      <div className={styles.thinkingChainContainer}>
        <Collapse
          items={items}
          activeKey={isCollapsed ? [] : ["thinking"]}
          onChange={onToggle}
          ghost
          size="small"
        />
      </div>
    );
  }
);
```

### 7.2 AI 设置标签页

```tsx
// src/components/SettingsModal/tabs/AISettingsTab.tsx
import React, { memo, useState, useEffect } from "react";
import { Form, Input, Select, Slider, Switch, Button, message } from "antd";
import { RobotOutlined, KeyOutlined } from "@ant-design/icons";
import { aiService } from "../../../services/aiService";
import styles from "../SettingsModal.module.css";

interface AISettings {
  provider: string;
  apiKeys: Record<string, string>;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  showThinking: boolean;
  autoSave: boolean;
}

export const AISettingsTab = memo(() => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<AISettings>({
    provider: "zhipu",
    apiKeys: {},
    defaultModel: "glm-4",
    temperature: 0.7,
    maxTokens: 1000,
    showThinking: true,
    autoSave: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("ai_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        form.setFieldsValue(parsed);
      }
    } catch (error) {
      console.error("加载AI设置失败:", error);
    }
  };

  const saveSettings = async (values: AISettings) => {
    setLoading(true);
    try {
      // 保存API密钥到独立的存储
      Object.entries(values.apiKeys).forEach(([provider, key]) => {
        if (key) {
          localStorage.setItem(`ai_${provider}_api_key`, key);
        }
      });

      // 保存其他设置
      const settingsToSave = { ...values };
      delete settingsToSave.apiKeys; // 不保存明文密钥
      localStorage.setItem("ai_settings", JSON.stringify(settingsToSave));

      // 更新AI服务配置
      aiService.setProvider(values.provider);

      setSettings(values);
      message.success("AI设置已保存");
    } catch (error) {
      console.error("保存AI设置失败:", error);
      message.error("保存设置失败");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const values = form.getFieldsValue();
    setLoading(true);
    try {
      // 测试API连接
      message.info("正在测试连接...");
      // 这里可以实现实际的连接测试
      message.success("连接测试成功");
    } catch (error) {
      message.error("连接测试失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={saveSettings}
        className={styles.settingsForm}
      >
        <Form.Item
          label="AI 服务提供商"
          name="provider"
          rules={[{ required: true, message: "请选择AI服务提供商" }]}
        >
          <Select>
            <Select.Option value="zhipu">智谱AI (GLM)</Select.Option>
            <Select.Option value="openai">OpenAI (GPT)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="API 密钥"
          name={["apiKeys", form.getFieldValue("provider")]}
          rules={[{ required: true, message: "请输入API密钥" }]}
        >
          <Input.Password
            prefix={<KeyOutlined />}
            placeholder="请输入API密钥"
          />
        </Form.Item>

        <Form.Item label="默认模型" name="defaultModel">
          <Select>
            <Select.Option value="glm-4">GLM-4</Select.Option>
            <Select.Option value="glm-4-plus">GLM-4 Plus</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="创意度" name="temperature">
          <Slider
            min={0}
            max={1}
            step={0.1}
            marks={{
              0: "保守",
              0.5: "适中",
              1: "创意",
            }}
          />
        </Form.Item>

        <Form.Item label="最大输出长度" name="maxTokens">
          <Slider
            min={100}
            max={2000}
            step={100}
            marks={{
              100: "100",
              1000: "1000",
              2000: "2000",
            }}
          />
        </Form.Item>

        <Form.Item name="showThinking" valuePropName="checked">
          <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
          <span style={{ marginLeft: 8 }}>显示AI思维过程</span>
        </Form.Item>

        <Form.Item name="autoSave" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          <span style={{ marginLeft: 8 }}>自动保存AI生成的内容</span>
        </Form.Item>

        <Form.Item>
          <Button.Group>
            <Button onClick={testConnection} loading={loading}>
              测试连接
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存设置
            </Button>
          </Button.Group>
        </Form.Item>
      </Form>
    </div>
  );
});
```

## 8. 安全性与性能考虑（架构师补充）

### 8.1 API 密钥安全管理

```typescript
// src/utils/security.ts
class SecurityManager {
  private static instance: SecurityManager;

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // 安全存储API密钥
  setAPIKey(provider: string, key: string): void {
    try {
      // 简单的本地加密（生产环境应使用更强的加密）
      const encrypted = btoa(key);
      localStorage.setItem(`ai_${provider}_api_key`, encrypted);
    } catch (error) {
      console.error("存储API密钥失败:", error);
      throw new Error("密钥存储失败");
    }
  }

  // 安全获取API密钥
  getAPIKey(provider: string): string | null {
    try {
      const encrypted = localStorage.getItem(`ai_${provider}_api_key`);
      if (!encrypted) return null;

      return atob(encrypted);
    } catch (error) {
      console.error("获取API密钥失败:", error);
      return null;
    }
  }

  // 验证API密钥格式
  validateAPIKey(provider: string, key: string): boolean {
    const patterns = {
      zhipu: /^[a-zA-Z0-9]{32,}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/,
    };

    const pattern = patterns[provider as keyof typeof patterns];
    return pattern ? pattern.test(key) : false;
  }

  // 清理API密钥
  clearAPIKey(provider: string): void {
    localStorage.removeItem(`ai_${provider}_api_key`);
  }
}

export const securityManager = SecurityManager.getInstance();
```

### 8.2 性能优化策略

```typescript
// src/hooks/useAIGeneration.ts
import { useCallback, useRef } from "react";
import { useNoteStore } from "../store/noteStore";
import { aiService } from "../services/aiService";

export const useAIGeneration = (noteId: string) => {
  const {
    aiGenerating,
    aiStreamingData,
    aiErrors,
    startAIGeneration,
    cancelAIGeneration,
  } = useNoteStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  // 防抖的生成函数
  const debouncedGenerate = useCallback(
    debounce(async (prompt: string) => {
      try {
        // 取消之前的请求
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        await startAIGeneration(noteId, prompt);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("AI生成失败:", error);
        }
      }
    }, 1000),
    [noteId, startAIGeneration]
  );

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    cancelAIGeneration(noteId);
  }, [noteId, cancelAIGeneration]);

  return {
    isGenerating: aiGenerating[noteId] || false,
    streamingContent: aiStreamingData[noteId] || "",
    error: aiErrors[noteId],
    generate: debouncedGenerate,
    cancel: cancelGeneration,
  };
};

// 防抖工具函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

## 9. 实施路线图

### 9.1 MVP 阶段（1-2 周）

**第一周**：

- [ ] 扩展 noteStore 添加 AI 方法
- [ ] 实现基础的 aiService 和智谱 AI 提供商
- [ ] 在 NoteToolbar 添加 AI 按钮
- [ ] 实现基本的 AI 生成功能

**第二周**：

- [ ] 在 TiptapEditor 中集成思维链显示
- [ ] 添加 AI 设置标签页
- [ ] 实现流式生成和错误处理
- [ ] 基础测试和调试

### 9.2 功能完善阶段（3-4 周）

**第三周**：

- [ ] 优化性能和用户体验
- [ ] 添加多 AI 提供商支持
- [ ] 完善安全性措施
- [ ] 添加使用统计和成本跟踪

**第四周**：

- [ ] 全面测试和 bug 修复
- [ ] 用户文档和帮助
- [ ] 代码优化和重构
- [ ] 准备发布

## 10. 工作台 AI 集成技术方案（架构师&研发经理补充）

### 10.1 核心技术挑战分析

**🎯 关键问题**：

1. **工作台提示词输入** → AI 生成便签的完整流程
2. **Markdown 流式输出** → TipTap HTML 格式实时转换
3. **数据格式一致性** → JSON 存储与前端渲染格式统一

### 10.2 技术架构设计

```
┌─ 用户输入层 ─────────────────────┐
│  NoteWorkbench (提示词输入)        │
└─────────────────┬───────────────┘
                  │ 提示词
                  ▼
┌─ AI服务层 ──────────────────────┐
│  aiService.generateFromPrompt()  │ ← 新增方法
│  - 调用AI API                    │
│  - 接收Markdown流                │
│  - 实时转换为HTML                │
└─────────────────┬───────────────┘
                  │ HTML流
                  ▼
┌─ 状态管理层 ─────────────────────┐
│  noteStore (扩展)                │
│  - createAINoteFromPrompt()      │ ← 新增方法
│  - updateStreamingContent()      │ ← 流式更新
└─────────────────┬───────────────┘
                  │ 便签数据
                  ▼
┌─ 组件渲染层 ─────────────────────┐
│  Canvas → NoteCard → TipTap      │
│  (实时显示流式生成内容)            │
└─────────────────────────────────┘
```

### 10.3 Markdown 到 HTML 实时转换方案

````typescript
// src/utils/markdownConverter.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

class MarkdownConverter {
  private processor: any;

  constructor() {
    this.processor = unified()
      .use(remarkParse)
      .use(remarkGfm) // GitHub风格Markdown
      .use(remarkBreaks) // 支持换行
      .use(remarkHtml, {
        sanitize: false, // TipTap需要完整HTML
      });
  }

  /**
   * 流式转换Markdown片段到HTML
   * 支持不完整的Markdown输入
   */
  convertStreamChunk(markdownChunk: string): string {
    try {
      // 处理流式输入中的不完整语法
      const processedChunk = this.preprocessStreamChunk(markdownChunk);
      const result = this.processor.processSync(processedChunk);
      return this.postprocessHTML(result.toString());
    } catch (error) {
      // 转换失败时返回原始文本
      console.warn("Markdown转换失败，使用原始文本:", error);
      return `<p>${markdownChunk.replace(/\n/g, "<br>")}</p>`;
    }
  }

  /**
   * 预处理流式Markdown片段
   * 处理不完整的语法结构
   */
  private preprocessStreamChunk(chunk: string): string {
    // 1. 修复不完整的列表项
    chunk = chunk.replace(/^- (.*)(?!$)/gm, "- $1\n");

    // 2. 修复不完整的标题
    chunk = chunk.replace(/^(#{1,6})\s+(.*)(?!$)/gm, "$1 $2\n\n");

    // 3. 修复不完整的代码块
    if (chunk.includes("```") && (chunk.match(/```/g) || []).length % 2 === 1) {
      chunk += "\n```"; // 临时关闭代码块
    }

    return chunk;
  }

  /**
   * 后处理HTML，使其与TipTap格式兼容
   */
  private postprocessHTML(html: string): string {
    return html
      .replace(/<p><\/p>/g, "<p><br></p>") // 空段落处理
      .replace(/\n\n/g, "\n") // 移除多余换行
      .trim();
  }

  /**
   * 完整转换（用于最终结果）
   */
  convertComplete(markdown: string): string {
    try {
      const result = this.processor.processSync(markdown);
      return this.postprocessHTML(result.toString());
    } catch (error) {
      console.error("完整Markdown转换失败:", error);
      return `<p>${markdown.replace(/\n/g, "<br>")}</p>`;
    }
  }
}

export const markdownConverter = new MarkdownConverter();
````

### 10.4 工作台集成实现

```typescript
// src/services/aiService.ts - 扩展工作台方法
class AIService {
  // ... 现有代码

  /**
   * 从工作台提示词生成便签
   */
  async generateNoteFromPrompt(options: {
    prompt: string;
    canvasId: string;
    position?: Position;
    onStream?: (htmlContent: string, aiData: any) => void;
    onComplete?: (noteId: string, finalContent: string, aiData: any) => void;
    onError?: (error: Error) => void;
  }): Promise<string> {
    try {
      // 1. 先创建一个空便签占位
      const tempNoteId = await this.createPlaceholderNote(
        options.canvasId,
        options.position
      );

      // 2. 开始AI生成流程
      let accumulatedMarkdown = "";
      let accumulatedHTML = "";

      await this.generateContent({
        noteId: tempNoteId,
        prompt: options.prompt,
        onStream: (markdownChunk) => {
          // 实时转换Markdown到HTML
          accumulatedMarkdown += markdownChunk;
          accumulatedHTML =
            markdownConverter.convertStreamChunk(accumulatedMarkdown);

          // 触发流式更新回调
          options.onStream?.(accumulatedHTML, {
            generated: true,
            model: this.currentProvider,
            prompt: options.prompt,
            isStreaming: true,
          });
        },
        onComplete: (finalMarkdown, aiData) => {
          // 最终转换
          const finalHTML = markdownConverter.convertComplete(finalMarkdown);

          // 完成回调
          options.onComplete?.(tempNoteId, finalHTML, {
            ...aiData,
            originalMarkdown: finalMarkdown,
            isStreaming: false,
          });
        },
        onError: options.onError,
      });

      return tempNoteId;
    } catch (error) {
      console.error("工作台AI生成失败:", error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 创建占位便签
   */
  private async createPlaceholderNote(
    canvasId: string,
    position?: Position
  ): Promise<string> {
    const noteStore = useNoteStore.getState();
    return await noteStore.createNote(
      canvasId,
      position || { x: 100, y: 100 },
      NoteColor.YELLOW
    );
  }
}
```

### 10.5 NoteWorkbench 集成 AI 功能

```typescript
// src/components/NoteWorkbench/index.tsx - 扩展AI功能
export const NoteWorkbench: React.FC<NoteWorkbenchProps> = ({
  canvasId, // 新增：当前画布ID
  // ... 其他现有props
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  /**
   * 处理添加便签 - 增强AI支持
   */
  const handleAddNote = useCallback(async () => {
    if (disabled || loading) return;

    const prompt = inputValue.trim();
    setStatus("loading");

    try {
      if (prompt) {
        // AI生成便签
        setIsGenerating(true);

        await aiService.generateNoteFromPrompt({
          prompt,
          canvasId,
          position: { x: 200, y: 200 }, // 默认位置
          onStream: (htmlContent, aiData) => {
            setStreamingContent(htmlContent);
            // 实时更新UI反馈
          },
          onComplete: (noteId, finalContent, aiData) => {
            console.log(`✅ AI便签生成完成: ${noteId}`);
            setIsGenerating(false);
            setStreamingContent("");

            // 清空输入框并重置状态
            setInputValue("");
            onChange?.("");
            setStatus("idle");
          },
          onError: (error) => {
            console.error("AI生成失败:", error);
            setIsGenerating(false);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 2000);
          },
        });
      } else {
        // 创建空白便签（现有逻辑）
        await onAddNote?.();
        setInputValue("");
        onChange?.("");
        setStatus("idle");
      }
    } catch (error) {
      setStatus("error");
      setIsGenerating(false);
      console.error("添加便签失败:", error);
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [inputValue, canvasId, disabled, loading, onAddNote, onChange]);

  // UI渲染增强
  return (
    <div className={styles.workbench}>
      <div className={styles.inputContainer}>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isGenerating
              ? "AI正在生成便签..."
              : "输入提示词AI生成便签，留空创建空白便签..."
          }
          disabled={disabled || isGenerating}
          suffix={
            <Button
              type="primary"
              loading={isGenerating}
              onClick={handleAddNote}
              disabled={disabled}
            >
              {isGenerating ? "生成中..." : "创建便签"}
            </Button>
          }
        />
      </div>

      {/* 新增：流式生成预览 */}
      {isGenerating && streamingContent && (
        <div className={styles.streamingPreview}>
          <div className={styles.previewHeader}>
            <span>AI正在生成...</span>
          </div>
          <div
            className={styles.previewContent}
            dangerouslySetInnerHTML={{ __html: streamingContent }}
          />
        </div>
      )}
    </div>
  );
};
```

## 11. 里程碑式开发进度安排

> **开发策略**: 每个里程碑都是可独立使用的功能版本

### 🎯 里程碑 1: 基础 AI 集成（第 1-2 周）

**目标**: 实现最基本的 AI 便签生成功能

#### 第 1 周：核心基础设施

- [x] **数据结构准备**（1 天）
  - 扩展 Note 接口 customProperties 定义
  - 创建 AI 数据类型定义
- [ ] **服务层基础**（2 天）

  - 实现 aiService.ts 基础架构
  - 集成智谱 AI API 调用
  - 实现基础错误处理

- [ ] **Markdown 转换工具**（2 天）
  - 实现 markdownConverter.ts
  - 支持基础 Markdown→HTML 转换
  - 单元测试

#### 第 2 周：工作台集成

- [ ] **NoteWorkbench 扩展**（2 天）

  - 集成 AI 生成按钮
  - 实现提示词输入处理
  - 基础状态管理

- [ ] **noteStore 扩展**（2 天）

  - 添加 createAINoteFromPrompt 方法
  - 集成 AI 数据存储逻辑

- [ ] **基础测试**（1 天）
  - 端到端测试
  - 基础功能验证

**✅ 里程碑 1 交付标准**:

- 用户可在工作台输入提示词生成 AI 便签
- AI 生成的内容正确显示在便签中
- 基础错误处理和状态反馈

### 🎯 里程碑 2: 流式传输优化（第 3-4 周）

**目标**: 实现实时流式显示，提升用户体验

#### 第 3 周：流式架构

- [ ] **流式转换优化**（2 天）

  - 优化 markdownConverter 支持流式输入
  - 处理不完整 Markdown 语法
  - 性能优化

- [ ] **状态管理增强**（2 天）

  - 实现 updateStreamingContent 方法
  - 流式状态管理
  - 内存管理优化

- [ ] **UI 实时更新**（1 天）
  - NoteWorkbench 流式预览
  - TipTap 编辑器实时更新

#### 第 4 周：用户体验优化

- [ ] **交互体验**（2 天）

  - 取消生成功能
  - 重试机制
  - 加载状态优化

- [ ] **错误处理完善**（1 天）

  - 网络错误恢复
  - API 限额处理
  - 用户友好的错误提示

- [ ] **性能测试**（2 天）
  - 流式性能测试
  - 内存泄漏检查
  - 并发处理测试

**✅ 里程碑 2 交付标准**:

- AI 生成过程实时可见
- 流畅的流式体验，无卡顿
- 完善的错误处理和恢复机制

### 🎯 里程碑 3: 思维链集成（第 5-6 周）

**目标**: 集成思维链显示，增强 AI 透明度

#### 第 5 周：思维链架构

- [ ] **TipTap 扩展**（3 天）

  - 创建 ThinkingChainDisplay 组件
  - 集成到 TipTap 编辑器
  - 思维链数据结构

- [ ] **AI 服务扩展**（2 天）
  - 支持思维链数据解析
  - 智谱 AI 思维链集成

#### 第 6 周：交互优化

- [ ] **用户交互**（2 天）

  - 思维链折叠/展开
  - 步骤详情展示
  - 时间轴显示

- [ ] **视觉设计**（2 天）

  - 思维链 UI 组件样式
  - 动画效果
  - 主题适配

- [ ] **功能测试**（1 天）
  - 思维链显示测试
  - 交互功能验证

**✅ 里程碑 3 交付标准**:

- 支持思维链的 AI 模型显示推理过程
- 用户可查看 AI 的思考步骤
- 良好的视觉设计和交互体验

### 🎯 里程碑 4: 高级功能（第 7-8 周）

**目标**: 多 AI 提供商、配置管理、安全性

#### 第 7 周：多提供商支持

- [ ] **OpenAI 集成**（2 天）
  - OpenAIProvider 实现
  - API 兼容性处理
- [ ] **提供商管理**（2 天）
  - 动态切换机制
  - 配置管理
- [ ] **AI 设置页面**（1 天）
  - SettingsModal AI 标签页
  - 配置界面实现

#### 第 8 周：安全与优化

- [ ] **安全管理**（2 天）
  - API 密钥安全存储
  - 输入验证和过滤
- [ ] **性能优化**（2 天）
  - 缓存机制
  - 请求优化
  - 内存管理
- [ ] **完整测试**（1 天）
  - 集成测试
  - 性能测试
  - 安全测试

**✅ 里程碑 4 交付标准**:

- 支持多个 AI 提供商切换
- 完善的配置管理界面
- 企业级安全性和性能

### 🎯 里程碑 5: 生产就绪（第 9-10 周）

**目标**: 生产环境优化，文档完善

#### 第 9 周：生产优化

- [ ] **错误监控**（2 天）
  - 错误上报机制
  - 性能监控
  - 用户行为统计
- [ ] **优化调试**（2 天）
  - 代码优化
  - Bundle 分析
  - 性能调优
- [ ] **兼容性测试**（1 天）
  - 浏览器兼容性
  - 设备适配测试

#### 第 10 周：文档与发布

- [ ] **用户文档**（2 天）
  - AI 功能使用指南
  - 配置说明文档
  - 故障排除指南
- [ ] **开发文档**（1 天）
  - API 文档更新
  - 架构文档完善
- [ ] **发布准备**（2 天）
  - 版本打包
  - 发布流程
  - 回滚方案

**✅ 里程碑 5 交付标准**:

- 生产级别的稳定性和性能
- 完善的用户和开发文档
- 可靠的发布和运维流程

## 12. 质量保证策略

### 12.1 代码质量

- **单元测试覆盖率**: ≥80%
- **集成测试**: 关键用户路径 100%覆盖
- **代码审查**: 所有 AI 相关代码强制审查

### 12.2 性能指标

- **AI 响应时间**: 首字符<2 秒
- **流式延迟**: <200ms
- **内存使用**: 长时间使用无泄漏
- **用户界面响应**: 流式过程中界面流畅无卡顿

### 12.3 用户体验

- **错误恢复**: 网络错误自动重试
- **状态反馈**: 每个操作都有明确的状态指示
- **取消操作**: 用户可随时取消 AI 生成过程

## 13. 风险评估与应对

### 13.1 技术风险

| 风险项       | 概率 | 影响 | 应对策略               |
| ------------ | ---- | ---- | ---------------------- |
| AI API 限额  | 中   | 高   | 多提供商备选，配额监控 |
| 流式转换性能 | 低   | 中   | 渐进式渲染，性能监控   |
| 数据格式兼容 | 低   | 高   | 全面测试，向后兼容     |

### 13.2 用户体验风险

| 风险项       | 概率 | 影响 | 应对策略             |
| ------------ | ---- | ---- | -------------------- |
| AI 生成质量  | 中   | 中   | 提示词优化，用户教育 |
| 响应时间过长 | 中   | 高   | 流式显示，超时处理   |
| 界面复杂度   | 低   | 中   | 渐进式功能展示       |

## 14. 总结

### 🎯 技术方案核心价值

作为架构师和研发经理，本方案解决了 AI 集成的三大核心挑战：

1. **工作台无缝集成**：

   - 提示词输入 → AI 生成 → 便签创建的完整闭环
   - 用户体验与现有工作流完全一致
   - 支持空白便签和 AI 生成便签的统一创建

2. **数据格式统一**：

   - Markdown 流式输入 → HTML 实时转换 → TipTap 格式
   - 完美支持 GitHub 风格 Markdown
   - 处理流式输入中的不完整语法

3. **架构完美融合**：
   - 扩展现有组件而非重建
   - 利用现有的性能优化和错误处理机制
   - 保持向后兼容性和数据一致性

### 📊 开发进度保证

**里程碑式开发策略**确保：

- ✅ 每个阶段都有可用的功能版本
- ✅ 风险可控，问题可及时发现和修复
- ✅ 用户可以逐步体验新功能
- ✅ 开发团队可以持续获得反馈和改进

### 🛡️ 质量与风险控制

**全面的质量保证体系**：

- 代码质量：80%测试覆盖率 + 强制代码审查
- 性能指标：明确的响应时间和内存使用标准
- 用户体验：完善的错误恢复和状态反馈机制

**主动的风险管理**：

- 技术风险：多提供商备选，性能监控
- 体验风险：流式显示，渐进式功能展示
- 运营风险：完善的监控和回滚机制

### 🚀 实施建议

1. **立即开始里程碑 1**：基础设施已经准备就绪
2. **重点关注流式体验**：这是用户感知的核心价值
3. **持续用户测试**：每个里程碑都需要用户验证
4. **保持架构一致性**：严格遵循现有的设计模式

经过专业架构师审查和研发经理规划，本指南为 InfinityNote2 的 AI 功能集成提供了完整的技术路径和实施保证。遵循此方案实施，将确保 AI 功能与现有架构的完美融合，同时为用户提供流畅、智能的便签创建体验。
