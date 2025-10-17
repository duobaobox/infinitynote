/**
 * 思维链智能分段器
 * 将长文本思维链自动分段为多个步骤
 */

export interface ThinkingChainStep {
  id: string;
  content: string;
  timestamp: number;
  type?: "thinking" | "analysis" | "reasoning" | "conclusion";
}

export class ThinkingChainSegmenter {
  /**
   * 将思维链内容分段
   * @param content 完整的思维链内容
   * @returns 分段后的步骤数组
   */
  static segment(content: string): ThinkingChainStep[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    // 策略1: 按双换行符分段（段落）
    let paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    // 策略2: 如果段落太少，按句子分段
    if (paragraphs.length < 2) {
      paragraphs = this.segmentBySentences(content);
    }

    // 策略3: 如果段落太长，进一步细分
    paragraphs = paragraphs.flatMap((p) => {
      if (p.length > 500) {
        return this.segmentBySentences(p);
      }
      return [p];
    });

    // 如果最终还是只有一个段落，保持原样
    if (paragraphs.length === 0) {
      paragraphs = [content.trim()];
    }

    // 生成步骤对象
    return paragraphs.map((paragraph, index) => ({
      id: `thinking_step_${index + 1}`,
      content: paragraph.trim(),
      timestamp: Date.now() + index,
      type: this.inferStepType(paragraph),
    }));
  }

  /**
   * 按句子分段
   */
  private static segmentBySentences(text: string): string[] {
    // 中文和英文句子边界
    const sentences = text
      .split(/([。！？；.!?;]\s*)/)
      .reduce((acc: string[], part, i, arr) => {
        if (i % 2 === 0 && part.trim()) {
          const sentence = part + (arr[i + 1] || "");
          if (sentence.trim().length > 20) {
            acc.push(sentence.trim());
          }
        }
        return acc;
      }, []);

    if (sentences.length === 0) {
      return [text];
    }

    // 合并过短的句子
    const merged: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if (current.length + sentence.length < 200) {
        current += (current ? " " : "") + sentence;
      } else {
        if (current) merged.push(current);
        current = sentence;
      }
    }
    if (current) merged.push(current);

    return merged.length > 0 ? merged : [text];
  }

  /**
   * 推断步骤类型
   */
  private static inferStepType(content: string): ThinkingChainStep["type"] {
    const lowerContent = content.toLowerCase();

    // 分析类关键词
    if (
      lowerContent.match(
        /分析|观察|考虑|注意到|发现|检查|查看|analyze|observe|consider|notice|check/
      )
    ) {
      return "analysis";
    }

    // 推理类关键词
    if (
      lowerContent.match(
        /因此|所以|推断|推理|得出|可以|能够|应该|therefore|thus|deduce|infer|reason|conclude/
      )
    ) {
      return "reasoning";
    }

    // 结论类关键词
    if (
      lowerContent.match(
        /结论|总结|综上|最终|总之|总的来说|conclusion|summary|finally|in summary|overall/
      )
    ) {
      return "conclusion";
    }

    // 默认为思考类型
    return "thinking";
  }
}
