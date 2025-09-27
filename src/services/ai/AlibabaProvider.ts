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
 * 阿里百炼请求体构建器 (OpenAI兼容格式)
 */
class AlibabaRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    // 直接使用用户指定的模型名称，不做校验
    const modelName = options.model || "qwen-turbo";

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

    // 支持思维链模式 - 对于支持thinking的模型
    const thinkingModels = ["qwen-plus", "qwen-max", "qvq-max-2025-05-15"];
    if (
      thinkingModels.some(
        (model) => modelName === model || modelName.startsWith(model + "-")
      )
    ) {
      requestBody.enable_thinking = true;
    }

    console.log(
      `🚀 [Alibaba] 构建请求体:`,
      JSON.stringify(requestBody, null, 2)
    );
    return requestBody;
  }
}

/**
 * 阿里百炼响应解析器 (OpenAI兼容格式)
 */
class AlibabaResponseParser implements ResponseParser {
  /**
   * 重置状态，用于新的生成会话
   */
  resetState(): void {
    // OpenAI兼容格式不需要状态管理
  }

  extractContentFromChunk(chunk: string): string {
    try {
      // OpenAI兼容格式使用SSE，需要找到data:开头的行
      const lines = chunk.split("\n");
      console.log(`📥 [Alibaba] 接收数据块，行数: ${lines.length}`);

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // 去掉"data: "前缀
          if (data === "[DONE]") {
            console.log(`🏁 [Alibaba] 检测到流结束标志`);
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            console.log(`🔍 [Alibaba] 解析响应数据:`, parsed);

            // OpenAI兼容格式：{"choices": [{"delta": {"content": "文本"}}]}
            if (
              parsed.choices &&
              parsed.choices[0] &&
              parsed.choices[0].delta
            ) {
              const content = parsed.choices[0].delta.content;
              if (content) {
                console.log(`✅ [Alibaba] 成功提取内容:`, content);
                return content;
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
        } else if (line.trim()) {
          console.log(`📝 [Alibaba] 非data行:`, line.substring(0, 100));
        }
      }

      return "";
    } catch (error) {
      console.warn("阿里百炼内容提取失败:", error);
      return "";
    }
  }

  extractThinkingFromChunk(chunk: string): string | null {
    try {
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            // 检查是否有思维链字段
            if (parsed.choices && parsed.choices[0]) {
              const choice = parsed.choices[0];

              // 检查delta中的思维链内容
              if (choice.delta) {
                // 阿里巴巴可能在delta中包含thinking字段
                if (choice.delta.thinking) {
                  return choice.delta.thinking;
                }

                // 或者在特殊的字段中
                if (choice.delta.reasoning_content) {
                  return choice.delta.reasoning_content;
                }
              }

              // 检查message中的思维链内容
              if (choice.message) {
                if (choice.message.thinking) {
                  return choice.message.thinking;
                }
                if (choice.message.reasoning_content) {
                  return choice.message.reasoning_content;
                }
              }
            }
          } catch (parseError) {
            // 忽略解析错误
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  isStreamComplete(chunk: string): boolean {
    return (
      chunk.includes("data: [DONE]") ||
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
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    defaultModel: "qwen-turbo",
    supportedModels: [
      "qwen-plus",
      "qwen-turbo",
      "qwen-max",
      "qwen2-72b-instruct",
      "qvq-max-2025-05-15",
    ],
    supportsStreaming: true,
    supportsThinking: true, // 现在支持思维链
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
