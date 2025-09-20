/**
 * 硅基流动提供商实现
 * 继承BaseAIProvider，提供硅基流动特定的实现
 * 使用OpenAI兼容API
 */

import { BaseAIProvider } from "./BaseAIProvider";
import type {
  AIProviderConfig,
  RequestBodyBuilder,
  ResponseParser,
} from "./BaseAIProvider";
import type { AIGenerationOptions } from "../../types/ai";

/**
 * 硅基流动请求体构建器
 * 使用OpenAI兼容格式
 */
class SiliconFlowRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    return {
      model: options.model || "deepseek-chat",
      messages: [
        {
          role: "user",
          content: options.prompt,
        },
      ],
      stream: true,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
    };
  }
}

/**
 * 硅基流动响应解析器
 * 使用OpenAI兼容格式
 */
class SiliconFlowResponseParser implements ResponseParser {
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
      console.warn("硅基流动内容提取失败:", error);
      return "";
    }
  }

  extractThinkingFromChunk(chunk: string): string | null {
    // 硅基流动作为代理服务，不支持思维链
    return null;
  }

  isStreamComplete(chunk: string): boolean {
    return chunk.includes("data: [DONE]");
  }
}

/**
 * 硅基流动提供商
 * 继承BaseAIProvider，实现硅基流动特定的功能
 */
export class SiliconFlowProvider extends BaseAIProvider {
  readonly name = "siliconflow";

  protected readonly config: AIProviderConfig = {
    apiEndpoint: "https://api.siliconflow.cn/v1/chat/completions",
    defaultModel: "deepseek-chat",
    supportedModels: ["deepseek-chat", "qwen-72b-chat", "internlm2_5-7b-chat"],
    supportsStreaming: true,
    supportsThinking: false, // 作为代理服务，不支持思维链
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
  };

  protected readonly requestBuilder = new SiliconFlowRequestBuilder();
  protected readonly responseParser = new SiliconFlowResponseParser();
}
