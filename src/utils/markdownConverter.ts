/**
 * 优化的 Markdown 转换工具
 * 简化转换逻辑，提升性能，专注于核心功能
 * 支持流式转换，直接输出 TipTap JSON 格式
 */

import type { JSONContent } from "@tiptap/core";

// markdown-it 将通过动态导入加载，移除prosemirror-markdown依赖

/**
 * 流式缓冲器 - 智能处理不完整的 Markdown 内容
 */
class StreamingMarkdownBuffer {
  private lastCompleteContent: string = "";

  /**
   * 处理完整的累积内容（而不是增量内容）
   * 这个方法接收的是AI服务已经累积好的完整内容
   */
  processFullContent(fullContent: string): {
    shouldConvert: boolean;
    content: string;
    isIncremental: boolean;
  } {
    // 检查是否有完整的语法结构
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
   * 添加新的内容块（保持向后兼容）
   * @deprecated 使用 processFullContent 替代
   */
  addChunk(chunk: string): {
    shouldConvert: boolean;
    content: string;
    isIncremental: boolean;
  } {
    // 为了向后兼容，假设传入的是完整内容
    return this.processFullContent(chunk);
  }

  /**
   * 提取完整的内容（优化内存使用版本）
   * 避免在不完整的语法中间转换，减少不必要的字符串操作
   */
  private extractCompleteContent(content: string): string {
    // 内存保护：限制内容长度
    const MAX_CONTENT_LENGTH = 50000;
    if (content.length > MAX_CONTENT_LENGTH) {
      console.warn("内容过长，截断处理以保护内存");
      content = content.slice(0, MAX_CONTENT_LENGTH);
    }

    // 优化的代码块检查（避免正则表达式和数组创建）
    let codeBlockCount = 0;
    const contentLength = content.length;

    for (let i = 0; i < contentLength - 2; i++) {
      if (
        content[i] === "`" &&
        content[i + 1] === "`" &&
        content[i + 2] === "`"
      ) {
        codeBlockCount++;
        i += 2; // 跳过已检查的字符
      }
    }

    if (codeBlockCount % 2 === 1) {
      // 代码块未闭合，等待更多内容
      return this.lastCompleteContent;
    }

    // 优化的行尾检查（避免split操作）
    const lastNewlineIndex = content.lastIndexOf("\n");
    if (lastNewlineIndex !== -1) {
      const lastLine = content.slice(lastNewlineIndex + 1);
      // 简化的列表项检查（避免正则表达式）
      const trimmedLastLine = lastLine.trim();
      if (
        trimmedLastLine.length <= 3 &&
        (trimmedLastLine.startsWith("-") ||
          trimmedLastLine.startsWith("*") ||
          /^\d+\.$/.test(trimmedLastLine))
      ) {
        return this.lastCompleteContent;
      }
    }

    return content;
  }

  /**
   * 获取当前缓冲区内容
   * @deprecated 不再使用内部缓冲区
   */
  getCurrentContent(): string {
    return this.lastCompleteContent;
  }

  /**
   * 重置缓冲器
   */
  reset(): void {
    this.lastCompleteContent = "";
  }

  /**
   * 获取当前内容长度（用于内存监控）
   */
  getContentLength(): number {
    return this.lastCompleteContent.length;
  }

  /**
   * 清理内存（手动垃圾回收辅助）
   */
  cleanup(): void {
    this.lastCompleteContent = "";
  }

  /**
   * 检查内存使用情况
   */
  getMemoryInfo(): { contentLength: number; isLarge: boolean } {
    const length = this.lastCompleteContent.length;
    return {
      contentLength: length,
      isLarge: length > 10000, // 超过10KB认为是大内容
    };
  }
}

/**
 * 优化的 Markdown 转换器
 * 移除复杂的 ProseMirror 解析，专注于高性能的直接转换
 */
class TipTapNativeConverter {
  private markdownIt: any;
  private streamBuffer: StreamingMarkdownBuffer;
  private initialized: boolean = false;

  constructor() {
    this.streamBuffer = new StreamingMarkdownBuffer();
    // 延迟初始化，只在需要时才加载markdown-it
    // 这样可以减少应用启动时间
  }

  /**
   * 懒加载初始化 markdown-it
   * 只在第一次使用时才初始化，提升应用启动性能
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 优化的动态导入策略 - 使用webpackChunkName注释优化打包
      const MarkdownItModule = await import(
        /* webpackChunkName: "markdown-it" */ "markdown-it"
      );
      const MarkdownItConstructor =
        MarkdownItModule.default || MarkdownItModule;

      // 最小化配置，只启用必要功能以提升性能
      this.markdownIt = new MarkdownItConstructor({
        html: false, // 禁用HTML标签，提升安全性和性能
        breaks: true, // 换行转换为 <br>
        linkify: false, // 禁用自动链接识别，提升性能
        typographer: false, // 禁用印刷符号替换，提升性能
      });

      this.initialized = true;
      console.info("✅ Markdown转换器懒加载完成");
    } catch (error) {
      console.error("Failed to initialize markdown-it:", error);
      this.initialized = false;
      throw error; // 抛出错误，让调用者知道初始化失败
    }
  }

  /**
   * 流式转换 Markdown 片段到 TipTap JSON
   * 优化版本：懒加载初始化，直接使用markdown-it
   */
  convertStreamChunk(chunk: string): {
    json: JSONContent | null;
    html: string;
    isComplete: boolean;
  } {
    const bufferResult = this.streamBuffer.processFullContent(chunk);

    if (!bufferResult.shouldConvert) {
      return {
        json: null,
        html: this.optimizedMarkdownToHtmlSync(bufferResult.content),
        isComplete: false,
      };
    }

    // 如果还未初始化，返回基础内容
    if (!this.initialized) {
      // 触发懒加载初始化（异步）
      this.ensureInitialized().catch(console.error);
      return {
        json: this.createBasicJSON(bufferResult.content),
        html: this.createBasicHTML(bufferResult.content),
        isComplete: true,
      };
    }

    // 直接使用优化的转换方案
    return {
      json: this.optimizedMarkdownToJSON(bufferResult.content),
      html: this.optimizedMarkdownToHtmlSync(bufferResult.content),
      isComplete: true,
    };
  }

  /**
   * 完整转换 Markdown 到 TipTap JSON
   * 优化版本：懒加载初始化，高性能转换
   */
  async convertComplete(
    markdown: string
  ): Promise<{ json: JSONContent; html: string }> {
    this.streamBuffer.reset();

    // 确保初始化完成
    await this.ensureInitialized();

    // 直接使用优化的转换方案
    return {
      json: this.optimizedMarkdownToJSON(markdown),
      html: this.optimizedMarkdownToHtmlSync(markdown),
    };
  }

  /**
   * 同步版本的完整转换（向后兼容）
   */
  convertCompleteSync(markdown: string): { json: JSONContent; html: string } {
    this.streamBuffer.reset();

    // 如果未初始化，使用基础转换
    if (!this.initialized) {
      // 触发懒加载初始化（异步）
      this.ensureInitialized().catch(console.error);
      return {
        json: this.createBasicJSON(markdown),
        html: this.createBasicHTML(markdown),
      };
    }

    // 直接使用优化的转换方案
    return {
      json: this.optimizedMarkdownToJSON(markdown),
      html: this.optimizedMarkdownToHtmlSync(markdown),
    };
  }

  /**
   * 优化的 Markdown 到 TipTap JSON 转换
   * 直接使用markdown-it tokens，避免复杂的ProseMirror解析
   */
  private optimizedMarkdownToJSON(markdown: string): JSONContent {
    // 如果未初始化，返回基础JSON
    if (!this.initialized || !this.markdownIt) {
      return this.createBasicJSON(markdown);
    }

    try {
      // 使用 markdown-it 解析，然后转换为 TipTap JSON
      const tokens = this.markdownIt.parse(markdown, {});
      return this.tokensToTipTapJSON(tokens);
    } catch (error) {
      console.warn("优化转换失败，使用基础方案:", error);
      return this.createBasicJSON(markdown);
    }
  }

  /**
   * 同步的 Markdown 到 HTML 转换
   * 如果未初始化则返回基础HTML
   */
  private optimizedMarkdownToHtmlSync(markdown: string): string {
    try {
      if (this.initialized && this.markdownIt) {
        return this.markdownIt.render(markdown);
      } else {
        // 如果未初始化，使用基础HTML
        return this.createBasicHTML(markdown);
      }
    } catch (error) {
      console.warn("HTML转换失败:", error);
      // 最基础的备用方案
      return `<p>${this.escapeHtml(markdown).replace(/\n/g, "<br>")}</p>`;
    }
  }

  /**
   * 将 markdown-it tokens 转换为 TipTap JSON
   * 优化版本：高性能的直接转换
   */
  private tokensToTipTapJSON(tokens: any[]): JSONContent {
    const convertTokensToJSON = (tokens: any[]): JSONContent[] => {
      const result: JSONContent[] = [];
      let i = 0;

      while (i < tokens.length) {
        const token = tokens[i];

        switch (token.type) {
          case "paragraph_open":
            const paragraphContent: JSONContent[] = [];
            i++; // 跳过 paragraph_open

            // 处理段落内容直到 paragraph_close
            while (i < tokens.length && tokens[i].type !== "paragraph_close") {
              if (tokens[i].type === "inline") {
                paragraphContent.push(
                  ...this.parseInlineContent(tokens[i].content)
                );
              }
              i++;
            }

            result.push({
              type: "paragraph",
              content: paragraphContent,
            });
            break;

          case "heading_open":
            const level = parseInt(token.tag.slice(1));
            i++; // 跳过 heading_open

            const headingContent: JSONContent[] = [];
            while (i < tokens.length && tokens[i].type !== "heading_close") {
              if (tokens[i].type === "inline") {
                headingContent.push(
                  ...this.parseInlineContent(tokens[i].content)
                );
              }
              i++;
            }

            result.push({
              type: "heading",
              attrs: { level },
              content: headingContent,
            });
            break;

          case "bullet_list_open":
            const listItems: JSONContent[] = [];
            i++; // 跳过 bullet_list_open

            while (
              i < tokens.length &&
              tokens[i].type !== "bullet_list_close"
            ) {
              if (tokens[i].type === "list_item_open") {
                i++; // 跳过 list_item_open
                const itemContent: JSONContent[] = [];

                while (
                  i < tokens.length &&
                  tokens[i].type !== "list_item_close"
                ) {
                  if (tokens[i].type === "paragraph_open") {
                    i++; // 跳过 paragraph_open
                    while (
                      i < tokens.length &&
                      tokens[i].type !== "paragraph_close"
                    ) {
                      if (tokens[i].type === "inline") {
                        itemContent.push(
                          ...this.parseInlineContent(tokens[i].content)
                        );
                      }
                      i++;
                    }
                  }
                  i++;
                }

                listItems.push({
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: itemContent,
                    },
                  ],
                });
              } else {
                i++;
              }
            }

            result.push({
              type: "bulletList",
              content: listItems,
            });
            break;

          default:
            // 跳过未处理的 token
            break;
        }

        i++;
      }

      return result;
    };

    const content = convertTokensToJSON(tokens);

    return {
      type: "doc",
      content:
        content.length > 0
          ? content
          : [
              {
                type: "paragraph",
                content: [{ type: "text", text: "" }],
              },
            ],
    };
  }

  /**
   * 解析内联内容为 TipTap JSON 格式
   */
  private parseInlineContent(content: string): JSONContent[] {
    // 简化的内联解析，处理基本的格式
    const result: JSONContent[] = [];

    // 基础文本处理
    if (!content || content.trim() === "") {
      return result;
    }

    // 简单的文本节点
    result.push({
      type: "text",
      text: content,
    });

    return result;
  }

  /**
   * HTML 转义工具
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 重置转换器状态（优化版本）
   */
  reset(): void {
    this.streamBuffer.reset();
  }

  /**
   * 清理内存和资源
   */
  cleanup(): void {
    this.streamBuffer.cleanup();
    // 清理markdown-it实例（如果需要）
    if (this.markdownIt && typeof this.markdownIt.disable === "function") {
      // 禁用不必要的插件以释放内存
      this.markdownIt.disable(["table", "linkify"]);
    }
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
   * 强制垃圾回收（在支持的环境中）
   */
  forceGarbageCollection(): void {
    this.cleanup();

    // 在支持的环境中触发垃圾回收
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        (window as any).gc();
      } catch (e) {
        // 忽略错误，gc可能不可用
      }
    }
  }

  /**
   * 创建基础的 TipTap JSON（当 markdown-it 未初始化时使用）
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
   * 创建基础的 HTML（当 markdown-it 未初始化时使用）
   */
  private createBasicHTML(content: string): string {
    return `<p>${this.escapeHtml(content).replace(/\n/g, "<br>")}</p>`;
  }
}

// 创建全局实例
const tipTapConverter = new TipTapNativeConverter();

/**
 * 兼容性包装器 - 保持与现有代码的兼容性
 * 逐步迁移到新的 TipTap 原生转换器
 */
class MarkdownConverter {
  /**
   * 流式转换Markdown片段到HTML
   * 使用新的 TipTap 转换器
   */
  convertStreamChunk(markdownChunk: string): string {
    const result = tipTapConverter.convertStreamChunk(markdownChunk);
    return result.html;
  }

  /**
   * 完整转换Markdown到HTML
   * 使用新的 TipTap 转换器（同步版本）
   */
  convertComplete(markdown: string): string {
    const result = tipTapConverter.convertCompleteSync(markdown);
    return result.html;
  }

  /**
   * 获取 TipTap JSON 格式（新功能）
   */
  getTipTapJSON(markdown: string): JSONContent {
    const result = tipTapConverter.convertCompleteSync(markdown);
    return result.json;
  }

  /**
   * 异步获取 TipTap JSON 格式（新功能）
   */
  async getTipTapJSONAsync(markdown: string): Promise<JSONContent> {
    const result = await tipTapConverter.convertComplete(markdown);
    return result.json;
  }

  /**
   * 流式获取 TipTap JSON 格式（新功能）
   */
  getStreamTipTapJSON(markdownChunk: string): {
    json: JSONContent | null;
    html: string;
    isComplete: boolean;
  } {
    return tipTapConverter.convertStreamChunk(markdownChunk);
  }

  /**
   * 重置转换器状态
   */
  reset(): void {
    tipTapConverter.reset();
  }

  /**
   * 清理内存和资源
   */
  cleanup(): void {
    tipTapConverter.cleanup();
  }

  /**
   * 获取内存使用信息
   */
  getMemoryInfo(): {
    bufferSize: number;
    isInitialized: boolean;
    isLargeContent: boolean;
  } {
    return tipTapConverter.getMemoryInfo();
  }

  /**
   * 强制垃圾回收
   */
  forceGarbageCollection(): void {
    tipTapConverter.forceGarbageCollection();
  }
}

// 创建实例
const markdownConverter = new MarkdownConverter();

// 导出默认实例
export default markdownConverter;

// 同时导出命名实例（向后兼容）
export { markdownConverter, TipTapNativeConverter, tipTapConverter };
