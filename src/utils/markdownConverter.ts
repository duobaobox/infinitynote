/**
 * 简化的 Markdown 转换工具
 * 核心理念：让 TipTap 编辑器自己处理 Markdown，我们只负责流式缓冲和基础清理
 * 避免重复造轮子，专注于核心问题解决
 */

import type { JSONContent } from "@tiptap/core";

/**
 * 流式缓冲器 - 智能处理不完整的 Markdown 内容
 */
class StreamingMarkdownBuffer {
  private lastCompleteContent: string = "";

  /**
   * 处理完整的累积内容
   */
  processFullContent(fullContent: string): {
    shouldConvert: boolean;
    content: string;
    isIncremental: boolean;
  } {
    const completeContent = this.extractCompleteContent(fullContent);

    if (completeContent !== this.lastCompleteContent) {
      const isIncremental = this.lastCompleteContent.length > 0;
      this.lastCompleteContent = completeContent;

      return {
        shouldConvert: true,
        content: completeContent,
        isIncremental,
      };
    }

    return {
      shouldConvert: false,
      content: fullContent,
      isIncremental: false,
    };
  }

  /**
   * 向后兼容方法
   */
  addChunk(chunk: string): {
    shouldConvert: boolean;
    content: string;
    isIncremental: boolean;
  } {
    return this.processFullContent(chunk);
  }

  /**
   * 提取完整的内容 - 减少过于保守的缓冲策略
   */
  private extractCompleteContent(content: string): string {
    // 内存保护
    const MAX_CONTENT_LENGTH = 50000;
    if (content.length > MAX_CONTENT_LENGTH) {
      console.warn("内容过长，截断处理以保护内存");
      content = content.slice(0, MAX_CONTENT_LENGTH);
    }

    // 只检查明显不完整的代码块
    let tripleBacktickCount = 0;
    for (let i = 0; i < content.length - 2; i++) {
      if (
        content[i] === "`" &&
        content[i + 1] === "`" &&
        content[i + 2] === "`"
      ) {
        tripleBacktickCount++;
        i += 2;
      }
    }

    // 只有代码块未闭合且内容较短时才缓冲
    if (tripleBacktickCount % 2 === 1 && content.length < 1000) {
      return this.lastCompleteContent;
    }

    // 只对明显不完整的列表项进行缓冲
    const lastNewlineIndex = content.lastIndexOf("\n");
    if (lastNewlineIndex !== -1) {
      const lastLine = content.slice(lastNewlineIndex + 1).trim();
      if (
        lastLine.length > 0 && lastLine.length <= 5 &&
        (/^[-*+]\s*$/.test(lastLine) || /^\d+\.\s*$/.test(lastLine))
      ) {
        return this.lastCompleteContent;
      }
    }

    return content;
  }

  reset(): void {
    this.lastCompleteContent = "";
  }

  cleanup(): void {
    this.lastCompleteContent = "";
  }

  getMemoryInfo(): { contentLength: number; isLarge: boolean } {
    const length = this.lastCompleteContent.length;
    return {
      contentLength: length,
      isLarge: length > 10000,
    };
  }
}

/**
 * 简化的 Markdown 转换器
 * 核心思路：我们不再手动解析 Markdown，而是输出规范的 HTML，让 TipTap 自己处理
 */
class SimpleMarkdownConverter {
  private markdownIt: any;
  private streamBuffer: StreamingMarkdownBuffer;
  private initialized: boolean = false;

  constructor() {
    this.streamBuffer = new StreamingMarkdownBuffer();
    // 延迟初始化 markdown-it
  }

  /**
   * 懒加载初始化 markdown-it
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const MarkdownItModule = await import("markdown-it");
      const MarkdownItConstructor = MarkdownItModule.default || MarkdownItModule;

      this.markdownIt = new MarkdownItConstructor({
        html: false, // 禁用HTML标签，提升安全性
        breaks: true, // 换行转换为 <br>
        linkify: true, // 启用自动链接识别
        typographer: true, // 启用印刷符号替换
        quotes: '""\'\'', // 智能引号
      });

      this.initialized = true;
      console.info("✅ Markdown转换器初始化完成");
    } catch (error) {
      console.error("Markdown转换器初始化失败:", error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * 流式转换 Markdown 到 HTML
   * 保持同步接口，避免破坏现有代码
   */
  convertStreamChunk(chunk: string): string {
    const bufferResult = this.streamBuffer.processFullContent(chunk);

    if (!bufferResult.shouldConvert) {
      return this.convertToHtmlSync(bufferResult.content);
    }

    return this.convertToHtmlSync(bufferResult.content);
  }

  /**
   * 完整转换 Markdown 到 HTML
   */
  convertComplete(markdown: string): string {
    this.streamBuffer.reset();
    return this.convertToHtmlSync(markdown);
  }

  /**
   * 同步的 Markdown 到 HTML 转换
   */
  private convertToHtmlSync(markdown: string): string {
    try {
      if (this.initialized && this.markdownIt) {
        return this.markdownIt.render(markdown);
      } else {
        // 如果未初始化，触发异步初始化（不等待结果）
        this.ensureInitialized().catch(console.error);
        // 返回基础HTML
        return this.createBasicHTML(markdown);
      }
    } catch (error) {
      console.warn("Markdown转换失败:", error);
      return this.createBasicHTML(markdown);
    }
  }

  /**
   * 获取 TipTap JSON 格式（弃用，让 TipTap 自己处理）
   * @deprecated TipTap 编辑器自己可以解析 HTML，不需要我们转换 JSON
   */
  getTipTapJSON(markdown: string): JSONContent {
    console.warn("getTipTapJSON 已弃用，建议直接让 TipTap 编辑器解析 HTML");
    return this.createBasicJSON(markdown);
  }

  /**
   * 流式获取 TipTap JSON 格式（弃用）
   * @deprecated 同上
   */
  getStreamTipTapJSON(markdownChunk: string): {
    json: JSONContent | null;
    html: string;
    isComplete: boolean;
  } {
    console.warn("getStreamTipTapJSON 已弃用，建议直接使用 convertStreamChunk");
    const html = this.convertStreamChunk(markdownChunk);
    return {
      json: null, // 不再提供 JSON，让 TipTap 自己解析
      html,
      isComplete: true,
    };
  }

  /**
   * 创建基础的 HTML（兜底方案）
   */
  private createBasicHTML(content: string): string {
    if (!content || content.trim() === "") {
      return "<p></p>";
    }

    // 简单的 Markdown 到 HTML 转换
    const lines = content.split("\n");
    const htmlLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine === "") {
        // 空行
        if (htmlLines.length > 0 && !htmlLines[htmlLines.length - 1].includes("</p>")) {
          htmlLines.push("</p>");
        }
        continue;
      }

      // 标题
      if (trimmedLine.startsWith("#")) {
        const level = Math.min(trimmedLine.match(/^#+/)?.[0].length || 1, 6);
        const text = trimmedLine.replace(/^#+\s*/, "");
        htmlLines.push(`<h${level}>${this.escapeHtml(text)}</h${level}>`);
        continue;
      }

      // 代码块
      if (trimmedLine.startsWith("```")) {
        if (htmlLines[htmlLines.length - 1] === "<pre><code>") {
          htmlLines.push("</code></pre>");
        } else {
          htmlLines.push("<pre><code>");
        }
        continue;
      }

      // 列表项
      if (trimmedLine.match(/^[-*+]\s/)) {
        const text = trimmedLine.replace(/^[-*+]\s/, "");
        if (!htmlLines.some(l => l.includes("<ul>"))) {
          htmlLines.push("<ul>");
        }
        htmlLines.push(`<li>${this.escapeHtml(text)}</li>`);
        continue;
      }

      // 有序列表
      if (trimmedLine.match(/^\d+\.\s/)) {
        const text = trimmedLine.replace(/^\d+\.\s/, "");
        if (!htmlLines.some(l => l.includes("<ol>"))) {
          htmlLines.push("<ol>");
        }
        htmlLines.push(`<li>${this.escapeHtml(text)}</li>`);
        continue;
      }

      // 普通段落
      if (!htmlLines.some(l => l.includes("<p>") && !l.includes("</p>"))) {
        htmlLines.push("<p>");
      }
      htmlLines.push(this.escapeHtml(trimmedLine));
    }

    // 闭合未闭合的标签
    if (htmlLines.some(l => l.includes("<p>")) && !htmlLines.some(l => l.includes("</p>"))) {
      htmlLines.push("</p>");
    }
    if (htmlLines.some(l => l.includes("<ul>")) && !htmlLines.some(l => l.includes("</ul>"))) {
      htmlLines.push("</ul>");
    }
    if (htmlLines.some(l => l.includes("<ol>")) && !htmlLines.some(l => l.includes("</ol>"))) {
      htmlLines.push("</ol>");
    }
    if (htmlLines.some(l => l.includes("<pre><code>")) && !htmlLines.some(l => l.includes("</code></pre>"))) {
      htmlLines.push("</code></pre>");
    }

    return htmlLines.join("");
  }

  /**
   * 创建基础的 TipTap JSON（兜底方案）
   */
  private createBasicJSON(content: string): JSONContent {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        },
      ],
    };
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 重置转换器状态
   */
  reset(): void {
    this.streamBuffer.reset();
  }

  /**
   * 清理内存和资源
   */
  cleanup(): void {
    this.streamBuffer.cleanup();
  }

  /**
   * 获取内存使用信息
   */
  getMemoryInfo(): {
    bufferSize: number;
    isInitialized: boolean;
    isLargeContent: boolean;
  } {
    const bufferInfo = this.streamBuffer.getMemoryInfo();
    return {
      bufferSize: bufferInfo.contentLength,
      isInitialized: this.initialized,
      isLargeContent: bufferInfo.isLarge,
    };
  }

  /**
   * 强制垃圾回收
   */
  forceGarbageCollection(): void {
    this.cleanup();
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        (window as any).gc();
      } catch (e) {
        // 忽略错误
      }
    }
  }
}

// 创建全局实例
const simpleConverter = new SimpleMarkdownConverter();

/**
 * 兼容性包装器 - 保持与现有代码的兼容性
 */
class MarkdownConverter {
  /**
   * 流式转换Markdown片段到HTML
   */
  convertStreamChunk(markdownChunk: string): string {
    return simpleConverter.convertStreamChunk(markdownChunk);
  }

  /**
   * 完整转换Markdown到HTML
   */
  convertComplete(markdown: string): string {
    return simpleConverter.convertComplete(markdown);
  }

  /**
   * 获取 TipTap JSON 格式
   * @deprecated 建议直接让 TipTap 编辑器解析 HTML
   */
  getTipTapJSON(markdown: string): JSONContent {
    return simpleConverter.getTipTapJSON(markdown);
  }

  /**
   * 异步获取 TipTap JSON 格式
   * @deprecated 同上
   */
  async getTipTapJSONAsync(markdown: string): Promise<JSONContent> {
    return this.getTipTapJSON(markdown);
  }

  /**
   * 流式获取 TipTap JSON 格式
   * @deprecated 同上
   */
  getStreamTipTapJSON(markdownChunk: string): {
    json: JSONContent | null;
    html: string;
    isComplete: boolean;
  } {
    return simpleConverter.getStreamTipTapJSON(markdownChunk);
  }

  /**
   * 重置转换器状态
   */
  reset(): void {
    simpleConverter.reset();
  }

  /**
   * 清理内存和资源
   */
  cleanup(): void {
    simpleConverter.cleanup();
  }

  /**
   * 获取内存使用信息
   */
  getMemoryInfo(): {
    bufferSize: number;
    isInitialized: boolean;
    isLargeContent: boolean;
  } {
    return simpleConverter.getMemoryInfo();
  }

  /**
   * 强制垃圾回收
   */
  forceGarbageCollection(): void {
    simpleConverter.forceGarbageCollection();
  }
}

// 创建实例
const markdownConverter = new MarkdownConverter();

// 导出默认实例
export default markdownConverter;

// 同时导出命名实例（向后兼容）
export { markdownConverter, SimpleMarkdownConverter, simpleConverter };