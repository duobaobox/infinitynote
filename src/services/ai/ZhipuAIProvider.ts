/**
 * 智谱AI提供商实现
 * 继承BaseAIProvider，提供智谱AI特定的实现
 */

import { BaseAIProvider } from "./BaseAIProvider";
import type {
  AIProviderConfig,
  RequestBodyBuilder,
  ResponseParser,
} from "./BaseAIProvider";
import type { AIGenerationOptions } from "../../types/ai";

/**
 * 智谱AI请求体构建器
 */
class ZhipuRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    const requestBody: any = {
      model: options.model || "glm-4",
      messages: [
        {
          role: "user",
          content: options.prompt,
        },
      ],
      stream: options.stream ?? true, // 默认启用流式输出
    };
    
    // 只有明确指定了temperature才设置，否则使用API默认值
    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }
    
    // 只有明确指定了maxTokens才设置，否则使用API默认值
    if (options.maxTokens) {
      requestBody.max_tokens = options.maxTokens;
    }
    
    return requestBody;
  }
}

/**
 * 智谱AI响应解析器
 */
class ZhipuResponseParser implements ResponseParser {
  extractContentFromChunk(chunk: string): string {
    try {
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));

      let content = "";
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          if (deltaContent) {
            content += deltaContent;
          }
        } catch (parseError) {
          // 跳过无法解析的数据块
          continue;
        }
      }
      return content;
    } catch (error) {
      console.warn("智谱AI内容提取失败:", error);
      return "";
    }
  }

  extractThinkingFromChunk(chunk: string): string | null {
    try {
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const thinking = parsed.choices?.[0]?.delta?.thinking;
          if (thinking) {
            return thinking;
          }
        } catch (parseError) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.warn("智谱AI思维链提取失败:", error);
      return null;
    }
  }

  isStreamComplete(chunk: string): boolean {
    return chunk.includes("data: [DONE]");
  }
}

/**
 * 智谱AI提供商
 * 继承BaseAIProvider，实现智谱AI特定的功能
 */
export class ZhipuAIProvider extends BaseAIProvider {
  readonly name = "zhipu";

  protected readonly config: AIProviderConfig = {
    apiEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    defaultModel: "glm-4",
    supportedModels: ["glm-4", "glm-4-plus"],
    supportsStreaming: true,
    supportsThinking: true,
  };

  protected readonly requestBuilder = new ZhipuRequestBuilder();
  protected readonly responseParser = new ZhipuResponseParser();
}
