/**
 * 阿里百炼提供商实现
 * 继承BaseAIProvider，提供阿里百炼特定的实现
 */

import { BaseAIProvider } from "./BaseAIProvider";
import type {
  AIProviderConfig,
  RequestBodyBuilder,
  ResponseParser,
} from "./BaseAIProvider";
import type { AIGenerationOptions } from "../../types/ai";

/**
 * 阿里百炼请求体构建器
 */
class AlibabaRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    return {
      model: options.model || "qwen-turbo",
      input: {
        messages: [
          {
            role: "user",
            content: options.prompt,
          },
        ],
      },
      parameters: {
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: true,
      },
    };
  }
}

/**
 * 阿里百炼响应解析器
 */
class AlibabaResponseParser implements ResponseParser {
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
          // 阿里百炼的响应格式
          const deltaContent =
            parsed.output?.choices?.[0]?.message?.content ||
            parsed.output?.text;
          if (deltaContent) {
            content += deltaContent;
          }
        } catch (parseError) {
          continue;
        }
      }
      return content;
    } catch (error) {
      console.warn("阿里百炼内容提取失败:", error);
      return "";
    }
  }

  extractThinkingFromChunk(_chunk: string): string | null {
    // 阿里百炼暂时不支持思维链
    return null;
  }

  isStreamComplete(chunk: string): boolean {
    return (
      chunk.includes("data: [DONE]") || chunk.includes('"finish_reason":"stop"')
    );
  }
}

/**
 * 阿里百炼提供商
 * 继承BaseAIProvider，实现阿里百炼特定的功能
 */
export class AlibabaProvider extends BaseAIProvider {
  readonly name = "alibaba";

  protected readonly config: AIProviderConfig = {
    apiEndpoint:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    defaultModel: "qwen-turbo",
    supportedModels: ["qwen-plus", "qwen-turbo", "qwen-max"],
    supportsStreaming: true,
    supportsThinking: false, // 暂时不支持思维链，待官方API更新
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
  };

  protected readonly requestBuilder = new AlibabaRequestBuilder();
  protected readonly responseParser = new AlibabaResponseParser();
}
