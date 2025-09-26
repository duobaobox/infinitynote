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
    // 直接使用用户指定的模型名称，不做校验
    const modelName = options.model || "qwen-turbo";

    const parameters: any = {
      stream: options.stream ?? true,
    };

    if (options.temperature !== undefined) {
      parameters.temperature = options.temperature;
    }

    if (options.maxTokens) {
      parameters.max_tokens = options.maxTokens;
    }

    const requestBody = {
      model: modelName,
      input: {
        messages: [
          {
            role: "user",
            content: options.prompt,
          },
        ],
      },
      parameters,
    };

    console.log(
      `🚀 [Alibaba] 构建请求体:`,
      JSON.stringify(requestBody, null, 2)
    );
    return requestBody;
  }
}

/**
 * 阿里百炼响应解析器
 */
class AlibabaResponseParser implements ResponseParser {
  private lastText = ""; // 保存上一次的完整文本，用于计算增量

  /**
   * 重置状态，用于新的生成会话
   */
  resetState(): void {
    this.lastText = "";
  }

  extractContentFromChunk(chunk: string): string {
    try {
      // 阿里百炼使用SSE格式，需要找到data:开头的行（注意没有空格）
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const data = line.slice(5); // 去掉"data:"前缀
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            console.log(`🔍 [Alibaba] 解析响应数据:`, parsed);

            // 阿里百炼的响应格式是 {"output": {"text": "完整文本"}}
            if (parsed.output && parsed.output.text) {
              const currentText = parsed.output.text;

              // 计算增量内容 - 新文本减去之前已处理的文本
              const deltaContent = currentText.slice(this.lastText.length);
              this.lastText = currentText;

              if (deltaContent) {
                console.log(`✅ [Alibaba] 成功提取增量内容:`, deltaContent);
                return deltaContent;
              }
            }
          } catch (parseError) {
            console.warn(
              `⚠️ [Alibaba] JSON解析失败:`,
              parseError,
              "data:",
              data
            );
            continue;
          }
        }
      }

      return "";
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
      chunk.includes("data:[DONE]") ||
      chunk.includes('"finish_reason":"stop"') ||
      chunk.includes('"finish_reason": "stop"')
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
    supportedModels: [
      "qwen-plus",
      "qwen-turbo",
      "qwen-max",
      "qwen2-72b-instruct",
    ],
    supportsStreaming: true,
    supportsThinking: false,
  };

  protected readonly requestBuilder = new AlibabaRequestBuilder();
  protected readonly responseParser = new AlibabaResponseParser();

  /**
   * 重写生成内容方法，在开始前重置解析器状态
   */
  async generateContent(options: AIGenerationOptions): Promise<void> {
    // 重置解析器状态
    (this.responseParser as AlibabaResponseParser).resetState();
    // 调用父类方法
    return super.generateContent(options);
  }

  /**
   * 重写请求头构建方法
   * 阿里百炼使用 Authorization: Bearer 格式
   */
  protected buildHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
  }
}
