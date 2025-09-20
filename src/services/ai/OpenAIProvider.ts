/**
 * OpenAI提供商实现
 * 继承BaseAIProvider，提供OpenAI特定的实现
 */

import { BaseAIProvider } from "./BaseAIProvider";
import type {
  AIProviderConfig,
  RequestBodyBuilder,
  ResponseParser,
} from "./BaseAIProvider";
import type { AIGenerationOptions } from "../../types/ai";

/**
 * OpenAI请求体构建器
 */
class OpenAIRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    return {
      model: options.model || "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: options.prompt,
        },
      ],
      stream: true,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    };
  }
}

/**
 * OpenAI响应解析器
 */
class OpenAIResponseParser implements ResponseParser {
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
          continue;
        }
      }
      return content;
    } catch (error) {
      console.warn("OpenAI内容提取失败:", error);
      return "";
    }
  }

  extractThinkingFromChunk(chunk: string): string | null {
    // OpenAI不支持思维链
    return null;
  }

  isStreamComplete(chunk: string): boolean {
    return chunk.includes("data: [DONE]");
  }
}

/**
 * OpenAI提供商
 * 继承BaseAIProvider，实现OpenAI特定的功能
 */
export class OpenAIProvider extends BaseAIProvider {
  readonly name = "openai";

  protected readonly config: AIProviderConfig = {
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-3.5-turbo",
    supportedModels: ["gpt-4", "gpt-4o", "gpt-3.5-turbo"],
    supportsStreaming: true,
    supportsThinking: false, // OpenAI不支持思维链显示
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
  };

  protected readonly requestBuilder = new OpenAIRequestBuilder();
  protected readonly responseParser = new OpenAIResponseParser();
}
