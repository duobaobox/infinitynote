# AI提供商扩展指南

本指南介绍如何在InfinityNote中添加新的AI提供商，基于新的注册中心架构。

## 🏗️ 架构概览

新的AI提供商架构采用以下设计模式：

1. **注册中心模式** - 统一管理所有提供商元数据
2. **策略模式** - 每个提供商独立实现
3. **组合模式** - RequestBuilder + ResponseParser 分离关注点
4. **懒加载** - 按需动态导入提供商实现

## 📋 添加新提供商的步骤

### 1. 创建提供商实现

```typescript
// src/services/ai/NewProvider.ts
import { BaseAIProvider, type AIProviderConfig } from "./BaseAIProvider";

/**
 * 请求体构建器
 */
class NewProviderRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    return {
      model: options.model,
      messages: [{ role: "user", content: options.prompt }],
      stream: true,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
    };
  }
}

/**
 * 响应解析器
 */
class NewProviderResponseParser implements ResponseParser {
  parseStreamChunk(chunk: string): { content: string; thinking?: string } | null {
    try {
      const data = JSON.parse(chunk.replace(/^data: /, ""));
      return {
        content: data.choices?.[0]?.delta?.content || "",
        thinking: data.choices?.[0]?.delta?.thinking,
      };
    } catch {
      return null;
    }
  }

  isStreamComplete(chunk: string): boolean {
    return chunk.includes("data: [DONE]");
  }
}

/**
 * 新提供商实现
 */
export class NewProvider extends BaseAIProvider {
  readonly name = "newprovider";

  protected readonly config: AIProviderConfig = {
    apiEndpoint: "https://api.newprovider.com/v1/chat/completions",
    defaultModel: "new-model-v1",
    supportedModels: ["new-model-v1", "new-model-v2"],
    supportsStreaming: true,
    supportsThinking: false,
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
  };

  protected readonly requestBuilder = new NewProviderRequestBuilder();
  protected readonly responseParser = new NewProviderResponseParser();
}
```

### 2. 注册到提供商注册中心

```typescript
// src/services/ai/ProviderRegistry.ts
const PROVIDER_REGISTRY: Record<ProviderId, ProviderMetadata> = {
  // ... 现有提供商
  
  newprovider: {
    id: "newprovider",
    name: "新提供商",
    description: "新的AI服务提供商",
    website: "https://newprovider.com",
    supportedModels: ["new-model-v1", "new-model-v2"] as const,
    defaultModel: "new-model-v1",
    supportsStreaming: true,
    supportsThinking: false,
    apiKeyPattern: /^np-[a-zA-Z0-9]{32}$/,
    colors: {
      light: "#00b96b",
      dark: "#52c41a",
    },
    loader: () => import("./NewProvider").then(m => m.NewProvider),
  },
};

// 更新类型定义
export type ProviderId = 
  | "zhipu" 
  | "deepseek" 
  | "openai" 
  | "alibaba" 
  | "siliconflow" 
  | "anthropic"
  | "newprovider"; // 添加新提供商
```

### 3. 测试新提供商

```typescript
// tests/newprovider.test.ts
import { NewProvider } from "../src/services/ai/NewProvider";
import { providerRegistry } from "../src/services/ai/ProviderRegistry";

describe("NewProvider", () => {
  test("应该正确注册", () => {
    expect(providerRegistry.isValidProviderId("newprovider")).toBe(true);
  });

  test("应该验证API密钥格式", () => {
    expect(providerRegistry.validateApiKey("newprovider", "np-abc123")).toBe(true);
    expect(providerRegistry.validateApiKey("newprovider", "invalid")).toBe(false);
  });

  test("应该返回正确的元数据", () => {
    const metadata = providerRegistry.getProviderMetadata("newprovider");
    expect(metadata.name).toBe("新提供商");
    expect(metadata.defaultModel).toBe("new-model-v1");
  });
});
```

## 🔧 高级功能

### 支持思维链

如果新提供商支持思维链，需要：

1. 设置 `supportsThinking: true`
2. 在ResponseParser中解析thinking字段
3. 在请求中启用思维链模式

```typescript
class ThinkingProviderResponseParser implements ResponseParser {
  parseStreamChunk(chunk: string): { content: string; thinking?: string } | null {
    try {
      const data = JSON.parse(chunk.replace(/^data: /, ""));
      return {
        content: data.choices?.[0]?.delta?.content || "",
        thinking: data.choices?.[0]?.delta?.thinking, // 解析思维链
      };
    } catch {
      return null;
    }
  }

  extractThinkingChain(chunk: string): any | null {
    // 提取完整的思维链数据
    try {
      const data = JSON.parse(chunk.replace(/^data: /, ""));
      return data.thinking_chain;
    } catch {
      return null;
    }
  }
}
```

### 自定义错误处理

```typescript
export class NewProvider extends BaseAIProvider {
  protected async handleErrorResponse(response: Response): Promise<void> {
    const errorData = await response.json();
    
    // 提供商特定的错误处理
    if (errorData.error?.code === "RATE_LIMIT") {
      throw new Error("请求频率过高，请稍后重试");
    }
    
    // 调用基类的通用错误处理
    await super.handleErrorResponse(response);
  }
}
```

### 自定义请求头

```typescript
export class NewProvider extends BaseAIProvider {
  protected async makeRequest(
    apiKey: string,
    requestBody: any,
    abortController: AbortController
  ): Promise<Response> {
    return fetch(this.config.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Custom-Header": "custom-value", // 自定义请求头
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });
  }
}
```

## 📝 最佳实践

### 1. 命名规范
- 提供商ID使用小写字母和连字符
- 类名使用PascalCase + Provider后缀
- 文件名与类名保持一致

### 2. 错误处理
- 继承BaseAIProvider的错误处理机制
- 提供用户友好的错误信息
- 支持重试和恢复操作

### 3. 性能优化
- 使用懒加载减少初始包大小
- 合理设置Webpack代码分割
- 缓存提供商实例

### 4. 测试覆盖
- 单元测试：验证请求构建和响应解析
- 集成测试：测试完整的生成流程
- 错误测试：验证各种错误场景

### 5. 文档维护
- 更新API文档
- 添加使用示例
- 记录已知限制

## 🚀 部署注意事项

1. **环境变量** - 如果需要特殊配置，添加到环境变量
2. **API限制** - 了解提供商的速率限制和配额
3. **监控** - 添加必要的日志和监控
4. **回退策略** - 确保在新提供商不可用时有备选方案

## 📚 参考资源

- [BaseAIProvider API文档](./BaseAIProvider.md)
- [提供商注册中心文档](./ProviderRegistry.md)
- [错误处理指南](./ErrorHandling.md)
- [测试指南](./Testing.md)
