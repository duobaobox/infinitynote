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
    // 直接使用用户指定的模型名称，不做校验
    const modelName = options.model || "deepseek-llm-67b-chat";

    const requestBody: any = {
      model: modelName,
      messages: [
        {
          role: "user",
          content: options.prompt,
        },
      ],
      stream: options.stream ?? true,
    };

    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    if (options.maxTokens) {
      requestBody.max_tokens = options.maxTokens;
    }

    console.log(
      `🚀 [SiliconFlow] 构建请求体:`,
      JSON.stringify(requestBody, null, 2)
    );
    return requestBody;
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
            console.log(
              `📝 [SiliconFlow] 提取到内容:`,
              deltaContent.substring(0, 100)
            );
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

  extractThinkingFromChunk(_chunk: string): string | null {
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
    defaultModel: "deepseek-llm-67b-chat",
    supportedModels: [
      "deepseek-llm-67b-chat",
      "qwen-72b-chat",
      "internlm2_5-7b-chat",
      "yi-large",
    ],
    supportsStreaming: true,
    supportsThinking: false,
  };

  protected readonly requestBuilder = new SiliconFlowRequestBuilder();
  protected readonly responseParser = new SiliconFlowResponseParser();
}
