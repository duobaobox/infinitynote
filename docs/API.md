# InfinityNote2 API 参考文档

## 📋 目录

1. [核心数据类型](#核心数据类型)
2. [便签API](#便签api)
3. [AI服务API](#ai服务api)
4. [主题API](#主题api)
5. [存储API](#存储api)

## 🏗️ 核心数据类型

### Note 便签类型
```typescript
interface Note {
  id: string;                    // 便签唯一标识
  title: string;                 // 便签标题
  content: string;               // 便签内容
  color: string;                 // 便签颜色
  position: Position;            // 位置坐标
  size: Size;                    // 尺寸信息
  zIndex: number;                // 层级索引
  canvasId: string;              // 画布ID
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  customProperties?: CustomProperties; // 扩展属性
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}
```

### AI相关类型
```typescript
interface AICustomProperties {
  ai?: {
    provider?: string;           // AI提供商
    model?: string;              // 使用的模型
    prompt?: string;             // 原始提示词
    generated?: boolean;         // 是否AI生成
    generatedAt?: Date;          // 生成时间
    thinkingChain?: ThinkingChain; // 思维链数据
  };
}

interface ThinkingChain {
  steps: ThinkingStep[];
  totalTokens?: number;
  startTime: number;
  endTime?: number;
}
```

## 📝 便签API

### useNoteStore Hook
```typescript
const {
  // 状态
  notes,                         // 所有便签
  selectedNoteIds,               // 选中的便签ID
  aiGenerating,                  // AI生成状态
  
  // 操作方法
  addNote,                       // 添加便签
  updateNote,                    // 更新便签
  deleteNote,                    // 删除便签
  moveNote,                      // 移动便签
  resizeNote,                    // 调整便签大小
  selectNote,                    // 选择便签
  
  // AI相关
  startAIGeneration,             // 开始AI生成
  stopAIGeneration,              // 停止AI生成
  updateAIStreamingContent,      // 更新流式内容
} = useNoteStore();
```

### 便签操作示例
```typescript
// 创建新便签
const newNote = await addNote({
  title: "新便签",
  content: "便签内容",
  position: { x: 100, y: 100 },
  size: { width: 300, height: 200 },
  color: "#ffffff"
});

// 更新便签内容
await updateNote(noteId, {
  content: "更新后的内容",
  updatedAt: new Date()
});

// AI生成便签
await startAIGeneration(noteId, {
  provider: "openai",
  model: "gpt-3.5-turbo",
  prompt: "写一首关于春天的诗"
});
```

## 🤖 AI服务API

### AIService 主服务
```typescript
class AIService {
  // 生成内容
  static async generateContent(
    prompt: string,
    options: GenerationOptions
  ): Promise<string>
  
  // 流式生成
  static async generateStream(
    prompt: string,
    options: GenerationOptions
  ): AsyncGenerator<string>
  
  // 停止生成
  static stopGeneration(noteId: string): void
  
  // 获取可用提供商
  static getAvailableProviders(): ProviderInfo[]
  
  // 验证配置
  static validateConfig(config: AIConfig): boolean
}
```

### 使用示例
```typescript
// 基础生成
const content = await AIService.generateContent(
  "写一个技术文档",
  {
    provider: "openai",
    model: "gpt-4",
    maxTokens: 1000
  }
);

// 流式生成
for await (const chunk of AIService.generateStream(prompt, options)) {
  updateNoteContent(noteId, chunk);
}
```

## 🎨 主题API

### useTheme Hook
```typescript
const {
  isDark,                        // 是否暗黑模式
  theme,                         // 当前主题对象
  toggleTheme,                   // 切换主题
  setTheme,                      // 设置主题
} = useTheme();
```

### 主题配置
```typescript
interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  borderRadius: number;
  fontSize: number;
}

// 设置自定义主题
setTheme({
  mode: 'dark',
  primaryColor: '#1890ff',
  borderRadius: 8,
  fontSize: 14
});
```

## 💾 存储API

### useNoteDatabase Hook
```typescript
const {
  // 数据库操作
  saveNote,                      // 保存便签
  loadNotes,                     // 加载便签
  deleteNote,                    // 删除便签
  
  // 批量操作
  batchSave,                     // 批量保存
  batchDelete,                   // 批量删除
  
  // 搜索
  searchNotes,                   // 搜索便签
  
  // 统计
  getStorageStats,               // 获取存储统计
} = useNoteDatabase();
```

### 存储示例
```typescript
// 保存便签到数据库
await saveNote(note);

// 搜索便签
const results = await searchNotes("关键词", {
  limit: 10,
  sortBy: "updatedAt",
  order: "desc"
});

// 获取存储统计
const stats = await getStorageStats();
console.log(`总便签数: ${stats.totalNotes}`);
console.log(`存储大小: ${stats.storageSize}`);
```

## 🔧 工具函数

### 便签工具
```typescript
// 计算便签位置
calculateNotePosition(canvasSize: Size, noteSize: Size): Position

// 格式化便签时间
formatNoteTime(date: Date): string

// 验证便签数据
validateNoteData(note: Partial<Note>): boolean

// 导出便签数据
exportNotes(notes: Note[], format: 'json' | 'markdown'): string
```

### 性能工具
```typescript
// 防抖函数
debounce<T>(func: T, delay: number): T

// 节流函数
throttle<T>(func: T, limit: number): T

// 性能监控
performanceMonitor.start(label: string): void
performanceMonitor.end(label: string): number
```

## 📚 错误处理

### 错误类型
```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  CONFIG_ERROR = 'config_error',
  VALIDATION_ERROR = 'validation_error'
}

interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
}
```

### 错误处理示例
```typescript
try {
  await AIService.generateContent(prompt, options);
} catch (error) {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.API_ERROR:
        showNotification('API调用失败', 'error');
        break;
      case ErrorType.CONFIG_ERROR:
        openSettingsModal();
        break;
    }
  }
}
```
