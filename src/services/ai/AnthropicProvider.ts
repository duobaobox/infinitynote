/**
 * Anthropic提供商实现
 * 继承BaseAIProvider，提供Anthropic特定的实现
 */

import { BaseAIProvider } from "./BaseAIProvider";
import type {
  AIProviderConfig,
  RequestBodyBuilder,
  ResponseParser,
} from "./BaseAIProvider";
import type { AIGenerationOptions } from "../../types/ai";

/**
 * Anthropic请求体构建器
 */
class AnthropicRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    const requestBody: any = {
      model: options.model || "claude-3-sonnet",
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
 * Anthropic响应解析器
 */
class AnthropicResponseParser implements ResponseParser {
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
          // Anthropic的响应格式
          const deltaContent =
            parsed.delta?.text || parsed.choices?.[0]?.delta?.content;
          if (deltaContent) {
            content += deltaContent;
          }
        } catch (parseError) {
          continue;
        }
      }
      return content;
    } catch (error) {
      console.warn("Anthropic内容提取失败:", error);
      return "";
    }
  }

  extractThinkingFromChunk(_chunk: string): string | null {
    // Anthropic暂时不支持思维链
    return null;
  }

  isStreamComplete(chunk: string): boolean {
    return (
      chunk.includes("data: [DONE]") || chunk.includes('"type":"message_stop"')
    );
  }
}

/**
 * Anthropic提供商
 * 继承BaseAIProvider，实现Anthropic特定的功能
 */
export class AnthropicProvider extends BaseAIProvider {
  readonly name = "anthropic";

  protected readonly config: AIProviderConfig = {
    apiEndpoint: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-3-sonnet",
    supportedModels: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    supportsStreaming: true,
    supportsThinking: false, // Claude暂时不支持思维链
  };

  protected readonly requestBuilder = new AnthropicRequestBuilder();
  protected readonly responseParser = new AnthropicResponseParser();

  /**
   * 重写buildHeaders方法以支持Anthropic特定的请求头
   */
  protected buildHeaders(apiKey: string): Record<string, string> {
    return {
      "x-api-key": apiKey, // Anthropic使用x-api-key而不是Authorization
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    };
  }
}
