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
import type { AIGenerationOptions, AICustomProperties } from "../../types/ai";

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
          const delta = parsed.choices?.[0]?.delta;

          if (!delta) continue;

          // 尝试多种可能的思维链字段名
          const thinking =
            delta.thinking || // 标准字段 (官方文档)
            delta.thought_process || // 备用字段1
            delta.reasoning_content || // 备用字段2 (类似DeepSeek)
            delta.chain_of_thought || // 备用字段3
            null;

          if (thinking) {
            console.log(
              "🧠 智谱AI检测到思维链数据:",
              thinking.substring(0, 100) + "..."
            );
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
    defaultModel: "glm-4.6",
    supportedModels: [
      // GLM-4.6（最新）
      "glm-4.6",
      // GLM-4.5 系列
      "glm-4.5",
      "glm-4.5-flash", //免费的
      "glm-4.5-air",
      "glm-4.5-x",
      "glm-4.5v",
      // GLM-4 系列
      "glm-4-plus",
      "glm-4-alltools",
      "glm-4",
      //免费模型
      "glm-z1-flash",
    ],
    supportsStreaming: true,
    supportsThinking: true, // 智谱AI支持思维链
  };

  protected readonly requestBuilder = new ZhipuRequestBuilder();
  protected readonly responseParser = new ZhipuResponseParser();

  /**
   * 智谱AI思维链支持的模型判断
   * 根据官方文档和实际测试，支持思维链的模型包括：
   * - GLM-4.6 系列：全面支持思维链
   * - GLM-4.5 系列：全面支持思维链
   * - GLM-4-Plus：支持思维链
   * - GLM-4-AllTools：支持思维链
   */
  private isThinkingModel(modelName: string): boolean {
    const normalizedModel = modelName.toLowerCase();

    // 版本号判断（4.5+ 都支持）
    const versionMatch = normalizedModel.match(/glm[-_]?(\d+)\.(\d+)/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      // GLM-4.5 及以上版本全面支持思维链
      if (major === 4 && minor >= 5) {
        return true;
      }
    }

    // 特殊模型判断
    const thinkingKeywords = [
      "plus", // GLM-4-Plus
      "alltools", // GLM-4-AllTools
      "thinking", // 显式的 thinking 模型
    ];

    return thinkingKeywords.some((keyword) =>
      normalizedModel.includes(keyword)
    );
  }

  /**
   * 重写buildAIData方法以支持智谱AI特定的思维链处理
   */
  protected buildAIData(
    options: AIGenerationOptions,
    fullMarkdown: string,
    thinkingChain: any[]
  ): AICustomProperties["ai"] {
    const aiData = super.buildAIData(options, fullMarkdown, thinkingChain);

    // 使用专门的方法检测思维链模型
    const modelName = options.model || "";
    const isThinkingModel = this.isThinkingModel(modelName);

    console.log("🔧 智谱AI AI数据构建:", {
      model: options.model,
      isThinkingModel,
      thinkingChainLength: thinkingChain.length,
      hasThinkingSteps: thinkingChain.length > 0,
      willShowThinking: isThinkingModel && thinkingChain.length > 0,
    });

    // 如果是思维链模型且有思维链数据，确保显示
    if (aiData) {
      if (isThinkingModel && thinkingChain.length > 0) {
        aiData.showThinking = true;
        aiData.thinkingCollapsed = false; // 智谱AI思维链默认展开
        console.log("✅ 智谱AI思维链将显示");
      } else if (isThinkingModel && thinkingChain.length === 0) {
        console.log("ℹ️ 智谱AI模型支持思维链，但本次未返回思维链数据");
      } else if (!isThinkingModel && thinkingChain.length > 0) {
        console.warn("⚠️ 检测到思维链数据，但模型可能不支持:", options.model);
        // 即使模型可能不支持，如果有数据也尝试显示
        aiData.showThinking = true;
      }
    }

    return aiData;
  }
}
