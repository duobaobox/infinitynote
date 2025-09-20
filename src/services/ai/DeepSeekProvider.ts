/**
 * DeepSeek提供商实现
 * 继承BaseAIProvider，提供DeepSeek特定的实现
 * 支持思维链功能（reasoning模型）
 */

import { BaseAIProvider } from "./BaseAIProvider";
import type {
  AIProviderConfig,
  RequestBodyBuilder,
  ResponseParser,
} from "./BaseAIProvider";
import type { AIGenerationOptions, AICustomProperties } from "../../types/ai";
import { AIGenerationPhase } from "../../types/ai";

/**
 * DeepSeek请求体构建器
 */
class DeepSeekRequestBuilder implements RequestBodyBuilder {
  buildRequestBody(options: AIGenerationOptions): any {
    // 验证和修复模型名称
    let model = options.model || "deepseek-chat";
    const validModels = ["deepseek-chat", "deepseek-reasoner"];

    if (!validModels.includes(model)) {
      console.warn(
        `⚠️ 无效的DeepSeek模型名称: ${model}，自动修复为: deepseek-chat`
      );
      model = "deepseek-chat";
    }

    return {
      model,
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
 * DeepSeek响应解析器
 * 支持reasoning模型的思维链解析
 */
class DeepSeekResponseParser implements ResponseParser {
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
      console.warn("DeepSeek内容提取失败:", error);
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
          // DeepSeek reasoning模型使用reasoning_content字段
          const reasoningContent =
            parsed.choices?.[0]?.delta?.reasoning_content;
          if (reasoningContent) {
            console.log(
              "🧠 DeepSeek思维链内容:",
              reasoningContent.substring(0, 100) + "..."
            );
            return reasoningContent;
          }

          // 调试：检查是否有其他可能的思维链字段
          if (parsed.choices?.[0]?.delta) {
            const delta = parsed.choices[0].delta;
            if (Object.keys(delta).length > 0 && !delta.content) {
              console.log("🔍 DeepSeek响应结构:", Object.keys(delta));
            }
          }
        } catch (parseError) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.warn("DeepSeek思维链提取失败:", error);
      return null;
    }
  }

  isStreamComplete(chunk: string): boolean {
    return chunk.includes("data: [DONE]");
  }
}

/**
 * DeepSeek提供商
 * 继承BaseAIProvider，支持思维链功能
 */
export class DeepSeekProvider extends BaseAIProvider {
  readonly name = "deepseek";

  protected readonly config: AIProviderConfig = {
    apiEndpoint: "https://api.deepseek.com/v1/chat/completions",
    defaultModel: "deepseek-chat",
    supportedModels: ["deepseek-chat", "deepseek-reasoner"],
    supportsStreaming: true,
    supportsThinking: true, // 支持reasoning模型的思维链
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
  };

  protected readonly requestBuilder = new DeepSeekRequestBuilder();
  protected readonly responseParser = new DeepSeekResponseParser();

  /**
   * 重写buildAIData方法以支持DeepSeek特定的思维链处理
   */
  protected buildAIData(
    options: AIGenerationOptions,
    fullMarkdown: string,
    thinkingChain: any[]
  ): AICustomProperties["ai"] {
    const aiData = super.buildAIData(options, fullMarkdown, thinkingChain);

    // DeepSeek特定的配置
    const isReasoningModel = options.model?.includes("reasoner");

    console.log("🔧 DeepSeek AI数据构建:", {
      model: options.model,
      isReasoningModel,
      thinkingChainLength: thinkingChain.length,
      hasThinkingSteps: thinkingChain.length > 0,
      willShowThinking: isReasoningModel && thinkingChain.length > 0,
    });

    // 更新思维链显示设置
    if (aiData) {
      aiData.showThinking = isReasoningModel && thinkingChain.length > 0;
      aiData.thinkingCollapsed = false; // DeepSeek思维链默认展开

      // 添加生成阶段信息
      aiData.generationPhase = AIGenerationPhase.COMPLETED;
      aiData.isThinkingPhase = false;
      aiData.isAnsweringPhase = false;
    }

    return aiData;
  }
}
