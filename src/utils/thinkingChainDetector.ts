/**
 * 思维链检测器 - 统一的思维链内容检测和解析工具
 *
 * 功能特性：
 * - 支持多种AI提供商的思维链格式
 * - 统一的检测接口和数据结构
 * - 智能的误检测过滤
 * - 增量解析和性能优化
 */

export interface ThinkingChainStep {
  id: string;
  content: string;
  timestamp: number;
  type?: "thinking" | "analysis" | "reasoning" | "conclusion";
}

export interface ThinkingChainContent {
  steps: ThinkingChainStep[];
  summary: string;
  totalSteps: number;
  rawContent: string;
  detectedFormat: "xml_tag" | "json_field" | "mixed" | "none";
}

/**
 * 检测结果
 */
export interface DetectionResult {
  hasThinkingChain: boolean;
  thinkingContent: ThinkingChainContent | null;
  cleanContent: string; // 移除思维链后的纯净内容
}

/**
 * 思维链检测器类
 */
export class ThinkingChainDetector {
  /**
   * XML 标签格式检测规则
   * 支持常见的思维链标签格式
   */
  private static readonly XML_PATTERNS = [
    /<thinking>([\s\S]*?)<\/thinking>/gi, // 通用格式 (GPT、Claude等)
    /<think>([\s\S]*?)<\/think>/gi, // DeepSeek R1格式
    /<reasoning>([\s\S]*?)<\/reasoning>/gi, // 推理格式
    /<thought>([\s\S]*?)<\/thought>/gi, // 思考格式
  ] as const;

  /**
   * JSON 字段格式检测规则
   * 支持不同AI提供商的流式响应字段
   */
  private static readonly JSON_FIELD_PATTERNS = [
    "reasoning_content", // DeepSeek reasoning 模型
    "thinking", // 智谱AI think 模型
    "thought_process", // 通用思维过程字段
    "chain_of_thought", // 思维链字段
    "internal_thoughts", // 内部思考字段
  ] as const;

  /**
   * 最小思维链内容长度（过滤误检测）
   */
  private static readonly MIN_THINKING_LENGTH = 20;

  /**
   * 最大检测内容长度（性能保护）
   */
  private static readonly MAX_DETECTION_LENGTH = 100000;

  /**
   * 检测文本内容中是否包含思维链
   * 主要用于检测完整响应中的XML标签格式思维链
   *
   * @param content 要检测的文本内容
   * @returns 检测结果
   */
  static detectFromText(content: string): DetectionResult {
    if (!content || typeof content !== "string") {
      return {
        hasThinkingChain: false,
        thinkingContent: null,
        cleanContent: content || "",
      };
    }

    // 性能保护：限制检测内容长度
    const truncatedContent =
      content.length > this.MAX_DETECTION_LENGTH
        ? content.substring(0, this.MAX_DETECTION_LENGTH)
        : content;

    let cleanContent = truncatedContent;
    let foundThinking: string | null = null;
    let detectedFormat: ThinkingChainContent["detectedFormat"] = "none";

    // 逐个检测XML标签格式
    for (const pattern of this.XML_PATTERNS) {
      pattern.lastIndex = 0; // 重置正则表达式状态
      const match = pattern.exec(truncatedContent);

      if (match && match[1]) {
        const thinkingText = match[1].trim();

        // 过滤太短的内容（可能是误检测）
        if (thinkingText.length >= this.MIN_THINKING_LENGTH) {
          foundThinking = thinkingText;
          detectedFormat = "xml_tag";
          // 从原内容中移除思维链部分
          cleanContent = truncatedContent.replace(pattern, "").trim();
          break;
        }
      }
    }

    if (!foundThinking) {
      return {
        hasThinkingChain: false,
        thinkingContent: null,
        cleanContent,
      };
    }

    // 解析思维链内容
    const thinkingContent = this.parseThinkingContent(
      foundThinking,
      detectedFormat
    );

    return {
      hasThinkingChain: true,
      thinkingContent,
      cleanContent,
    };
  }

  /**
   * 从流式响应的JSON数据中检测思维链内容
   * 主要用于实时流式响应中的字段检测
   *
   * @param chunk 流式响应的数据块
   * @returns 思维链内容字符串，如果没有则返回null
   */
  static detectFromStreamChunk(chunk: any): string | null {
    if (!chunk || typeof chunk !== "object") {
      return null;
    }

    // 检测JSON字段格式
    for (const fieldName of this.JSON_FIELD_PATTERNS) {
      const value = this.getNestedValue(chunk, fieldName);
      if (
        value &&
        typeof value === "string" &&
        value.trim().length >= this.MIN_THINKING_LENGTH
      ) {
        return value.trim();
      }
    }

    return null;
  }

  /**
   * 综合检测方法 - 同时支持文本和流式数据
   *
   * @param textContent 文本内容
   * @param streamChunk 流式数据块
   * @returns 检测结果
   */
  static detectThinkingChain(
    textContent?: string,
    streamChunk?: any
  ): DetectionResult {
    // 首先尝试从流式数据中检测
    if (streamChunk) {
      const streamThinking = this.detectFromStreamChunk(streamChunk);
      if (streamThinking) {
        const thinkingContent = this.parseThinkingContent(
          streamThinking,
          "json_field"
        );
        return {
          hasThinkingChain: true,
          thinkingContent,
          cleanContent: textContent || "",
        };
      }
    }

    // 然后从文本内容中检测
    if (textContent) {
      return this.detectFromText(textContent);
    }

    return {
      hasThinkingChain: false,
      thinkingContent: null,
      cleanContent: textContent || "",
    };
  }

  /**
   * 解析思维链原始内容为结构化数据
   *
   * @param rawContent 原始思维链内容
   * @param format 检测到的格式
   * @returns 结构化的思维链内容
   */
  private static parseThinkingContent(
    rawContent: string,
    format: ThinkingChainContent["detectedFormat"]
  ): ThinkingChainContent {
    const steps = this.parseThinkingSteps(rawContent);

    return {
      steps,
      summary: this.generateSummary(steps),
      totalSteps: steps.length,
      rawContent,
      detectedFormat: format,
    };
  }

  /**
   * 将思维链内容解析为步骤
   *
   * @param content 思维链内容
   * @returns 思维链步骤数组
   */
  private static parseThinkingSteps(content: string): ThinkingChainStep[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    // 按段落分割内容
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // 如果没有段落分割，则作为单个步骤
    if (paragraphs.length === 0) {
      return [
        {
          id: "thinking_step_1",
          content: content.trim(),
          timestamp: Date.now(),
          type: "thinking",
        },
      ];
    }

    // 将每个段落作为一个步骤
    return paragraphs.map((paragraph, index) => ({
      id: `thinking_step_${index + 1}`,
      content: paragraph,
      timestamp: Date.now() + index, // 简单的时间戳递增
      type: this.inferStepType(paragraph),
    }));
  }

  /**
   * 推断思维步骤类型
   *
   * @param content 步骤内容
   * @returns 步骤类型
   */
  private static inferStepType(content: string): ThinkingChainStep["type"] {
    const lowerContent = content.toLowerCase();

    // 分析类关键词
    if (
      lowerContent.includes("分析") ||
      lowerContent.includes("观察") ||
      lowerContent.includes("analyze") ||
      lowerContent.includes("observe")
    ) {
      return "analysis";
    }

    // 推理类关键词
    if (
      lowerContent.includes("推理") ||
      lowerContent.includes("因此") ||
      lowerContent.includes("所以") ||
      lowerContent.includes("therefore") ||
      lowerContent.includes("reasoning")
    ) {
      return "reasoning";
    }

    // 结论类关键词
    if (
      lowerContent.includes("结论") ||
      lowerContent.includes("总结") ||
      lowerContent.includes("conclusion") ||
      lowerContent.includes("summary")
    ) {
      return "conclusion";
    }

    // 默认为思考类型
    return "thinking";
  }

  /**
   * 生成思维链摘要
   *
   * @param steps 思维链步骤
   * @returns 摘要文本
   */
  private static generateSummary(steps: ThinkingChainStep[]): string {
    if (steps.length === 0) {
      return "暂无思维过程";
    }

    if (steps.length === 1) {
      return `完成了1步思考过程`;
    }

    const typeCount = steps.reduce((count, step) => {
      const type = step.type || "thinking";
      count[type] = (count[type] || 0) + 1;
      return count;
    }, {} as Record<string, number>);

    const typeDescriptions = Object.entries(typeCount)
      .map(([type, count]) => {
        const typeName =
          {
            analysis: "分析",
            reasoning: "推理",
            conclusion: "结论",
            thinking: "思考",
          }[type] || "思考";
        return `${count}步${typeName}`;
      })
      .join("、");

    return `通过${steps.length}步推理完成（${typeDescriptions}）`;
  }

  /**
   * 获取嵌套对象的值
   * 支持类似 "choices[0].delta.reasoning_content" 的路径
   *
   * @param obj 目标对象
   * @param path 字段路径
   * @returns 字段值
   */
  private static getNestedValue(obj: any, path: string): any {
    // 简单实现：直接查找字段名
    if (obj.hasOwnProperty(path)) {
      return obj[path];
    }

    // 检查常见的嵌套路径
    const commonPaths = [
      `choices.0.delta.${path}`,
      `choices[0].delta.${path}`,
      `data.${path}`,
      `response.${path}`,
    ];

    for (const commonPath of commonPaths) {
      try {
        const value = commonPath.split(".").reduce((current, key) => {
          if (key.includes("[") && key.includes("]")) {
            const [arrayKey, indexStr] = key.split(/[\[\]]/);
            const index = parseInt(indexStr, 10);
            return current?.[arrayKey]?.[index];
          }
          return current?.[key];
        }, obj);

        if (value !== undefined && value !== null) {
          return value;
        }
      } catch (error) {
        // 忽略路径解析错误
      }
    }

    return undefined;
  }
}

export default ThinkingChainDetector;
