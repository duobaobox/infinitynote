/**
 * TipTap 原生 Markdown 转换工具
 * 基于 prosemirror-markdown 和 TipTap 官方最佳实践
 * 支持流式转换，直接输出 TipTap JSON 格式
 */

import { MarkdownParser } from "prosemirror-markdown";
import type { JSONContent } from "@tiptap/core";

// markdown-it 将通过动态导入加载

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
   * 提取完整的内容（避免在不完整的语法中间转换）
   */
  private extractCompleteContent(content: string): string {
    // 检查代码块是否完整
    const codeBlockMatches = content.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 === 1) {
      // 代码块未闭合，等待更多内容
      return this.lastCompleteContent;
    }

    // 检查列表是否在中间被截断
    const lines = content.split("\n");
    const lastLine = lines[lines.length - 1];

    // 如果最后一行是不完整的列表项，等待更多内容
    if (lastLine.match(/^\s*[\d\-\*]\s*$/)) {
      return this.lastCompleteContent;
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
}

/**
 * TipTap 原生 Markdown 转换器
 * 基于 prosemirror-markdown 实现，确保与 TipTap 完全兼容
 */
class TipTapNativeConverter {
  private markdownIt: any;
  private streamBuffer: StreamingMarkdownBuffer;
  private parser: MarkdownParser | null = null;
  private initialized: boolean = false;

  constructor() {
    this.streamBuffer = new StreamingMarkdownBuffer();
    this.initializeAsync();
  }

  /**
   * 异步初始化 markdown-it
   */
  private async initializeAsync() {
    try {
      // 动态导入 markdown-it
      const MarkdownItModule = await import("markdown-it");
      const MarkdownItConstructor =
        MarkdownItModule.default || MarkdownItModule;

      // 配置 markdown-it 解析器
      this.markdownIt = new MarkdownItConstructor({
        html: true, // 允许 HTML 标签
        breaks: true, // 换行转换为 <br>
        linkify: true, // 自动识别链接
        typographer: true, // 印刷符号替换
      });

      this.initialized = true;
      this.initializeProseMirrorParser();
    } catch (error) {
      console.error("Failed to initialize markdown-it:", error);
      this.initialized = false;
    }
  }

  /**
   * 初始化 ProseMirror 解析器
   */
  private initializeProseMirrorParser(): void {
    try {
      // 暂时禁用 ProseMirror 解析器，直接使用备用方案
      // TODO: 正确配置 ProseMirror 解析器
      this.parser = null;
      console.info("使用 markdown-it 作为主要解析器");
    } catch (error) {
      console.warn("ProseMirror 解析器初始化失败，使用备用方案:", error);
      this.parser = null;
    }
  }

  /**
   * 流式转换 Markdown 片段到 TipTap JSON
   * 支持不完整的 Markdown 输入
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
        html: this.fallbackMarkdownToHtml(bufferResult.content),
        isComplete: false,
      };
    }

    // 如果还未初始化，返回基础HTML
    if (!this.initialized) {
      return {
        json: this.createBasicJSON(bufferResult.content),
        html: this.createBasicHTML(bufferResult.content),
        isComplete: true,
      };
    }

    try {
      // 尝试使用 ProseMirror 解析器
      if (this.parser) {
        const doc = this.parser.parse(bufferResult.content);
        const json = this.proseMirrorToTipTapJSON(doc);
        return {
          json,
          html: this.fallbackMarkdownToHtml(bufferResult.content),
          isComplete: true,
        };
      }
    } catch (error) {
      console.warn("ProseMirror 解析失败，使用备用方案:", error);
    }

    // 备用方案：使用简化的转换
    return {
      json: this.fallbackMarkdownToJSON(bufferResult.content),
      html: this.fallbackMarkdownToHtml(bufferResult.content),
      isComplete: true,
    };
  }

  /**
   * 完整转换 Markdown 到 TipTap JSON
   */
  convertComplete(markdown: string): { json: JSONContent; html: string } {
    this.streamBuffer.reset();

    try {
      if (this.parser) {
        const doc = this.parser.parse(markdown);
        const json = this.proseMirrorToTipTapJSON(doc);
        return {
          json,
          html: this.fallbackMarkdownToHtml(markdown),
        };
      }
    } catch (error) {
      console.warn("ProseMirror 完整解析失败，使用备用方案:", error);
    }

    // 备用方案
    return {
      json: this.fallbackMarkdownToJSON(markdown),
      html: this.fallbackMarkdownToHtml(markdown),
    };
  }

  /**
   * 将 ProseMirror 文档转换为 TipTap JSON
   */
  private proseMirrorToTipTapJSON(doc: any): JSONContent {
    // 递归转换 ProseMirror 节点到 TipTap JSON 格式
    const convertNode = (node: any): JSONContent => {
      const result: JSONContent = {
        type: node.type.name,
      };

      // 添加属性
      if (node.attrs && Object.keys(node.attrs).length > 0) {
        result.attrs = { ...node.attrs };
      }

      // 添加标记
      if (node.marks && node.marks.length > 0) {
        result.marks = node.marks.map((mark: any) => ({
          type: mark.type.name,
          attrs: mark.attrs || {},
        }));
      }

      // 处理文本节点
      if (node.isText) {
        result.text = node.text;
      }

      // 递归处理子节点
      if (node.content && node.content.size > 0) {
        result.content = [];
        node.content.forEach((child: any) => {
          result.content!.push(convertNode(child));
        });
      }

      return result;
    };

    return convertNode(doc);
  }

  /**
   * 备用方案：简化的 Markdown 到 TipTap JSON 转换
   */
  private fallbackMarkdownToJSON(markdown: string): JSONContent {
    // 如果未初始化，返回基础JSON
    if (!this.initialized || !this.markdownIt) {
      return this.createBasicJSON(markdown);
    }

    // 使用 markdown-it 解析，然后转换为 TipTap JSON
    const tokens = this.markdownIt.parse(markdown, {});

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
                content: [{ type: "text", text: markdown }],
              },
            ],
    };
  }

  /**
   * 备用方案：简化的 Markdown 到 HTML 转换
   */
  private fallbackMarkdownToHtml(markdown: string): string {
    try {
      if (this.initialized && this.markdownIt) {
        return this.markdownIt.render(markdown);
      } else {
        // 如果未初始化，使用基础HTML
        return this.createBasicHTML(markdown);
      }
    } catch (error) {
      console.warn("Markdown-it 渲染失败:", error);
      // 最基础的备用方案
      return `<p>${this.escapeHtml(markdown).replace(/\n/g, "<br>")}</p>`;
    }
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
   * 重置转换器状态
   */
  reset(): void {
    this.streamBuffer.reset();
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
   * 使用新的 TipTap 转换器
   */
  convertComplete(markdown: string): string {
    const result = tipTapConverter.convertComplete(markdown);
    return result.html;
  }

  /**
   * 获取 TipTap JSON 格式（新功能）
   */
  getTipTapJSON(markdown: string): JSONContent {
    const result = tipTapConverter.convertComplete(markdown);
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
}

// 创建实例
const markdownConverter = new MarkdownConverter();

// 导出默认实例
export default markdownConverter;

// 同时导出命名实例（向后兼容）
export { markdownConverter, TipTapNativeConverter, tipTapConverter };
