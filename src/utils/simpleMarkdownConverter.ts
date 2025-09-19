/**
 * 简化的Markdown转换器 - 直接使用TipTap内置能力
 * 移除复杂的多层转换，提升性能和可维护性
 */

import { generateHTML } from '@tiptap/html';
import { extensions } from '../config/tiptapConfig';

/**
 * 简化的Markdown转换器
 * 核心理念：让TipTap自己处理内容解析，我们只负责基础的Markdown到HTML转换
 */
class SimpleMarkdownConverter {
  private markdownIt: any = null;
  private initialized = false;

  constructor() {
    this.initializeAsync();
  }

  /**
   * 异步初始化markdown-it（仅用于基础转换）
   */
  private async initializeAsync() {
    try {
      const MarkdownItModule = await import('markdown-it');
      const MarkdownItConstructor = MarkdownItModule.default || MarkdownItModule;
      
      this.markdownIt = new MarkdownItConstructor({
        html: true,        // 允许HTML标签
        breaks: true,      // 换行转换为<br>
        linkify: true,     // 自动识别链接
        typographer: true, // 印刷符号替换
      });
      
      this.initialized = true;
      console.log('✅ SimpleMarkdownConverter 初始化完成');
    } catch (error) {
      console.error('❌ SimpleMarkdownConverter 初始化失败:', error);
      this.initialized = false;
    }
  }

  /**
   * 流式转换：Markdown片段 → HTML
   * 简化版本，只做基础转换，让TipTap处理复杂解析
   */
  convertStreamChunk(markdownChunk: string): string {
    if (!this.initialized || !this.markdownIt) {
      // 未初始化时的基础转换
      return this.basicMarkdownToHtml(markdownChunk);
    }

    try {
      return this.markdownIt.render(markdownChunk);
    } catch (error) {
      console.warn('⚠️ 流式转换失败，使用基础转换:', error);
      return this.basicMarkdownToHtml(markdownChunk);
    }
  }

  /**
   * 完整转换：Markdown → HTML
   * 简化版本，移除复杂的JSON转换逻辑
   */
  convertComplete(markdown: string): string {
    if (!this.initialized || !this.markdownIt) {
      return this.basicMarkdownToHtml(markdown);
    }

    try {
      return this.markdownIt.render(markdown);
    } catch (error) {
      console.warn('⚠️ 完整转换失败，使用基础转换:', error);
      return this.basicMarkdownToHtml(markdown);
    }
  }

  /**
   * 新增：直接生成TipTap可用的JSONContent
   * 使用TipTap官方的generateJSON方法
   */
  markdownToTipTapJSON(markdown: string): any {
    try {
      const html = this.convertComplete(markdown);
      
      // 使用TipTap官方方法直接从HTML生成JSONContent
      // 这比我们自己解析更可靠
      const { generateJSON } = require('@tiptap/html');
      return generateJSON(html, extensions);
    } catch (error) {
      console.warn('⚠️ JSON转换失败，返回基础格式:', error);
      
      // 降级处理：返回基础的段落格式
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: markdown
              }
            ]
          }
        ]
      };
    }
  }

  /**
   * 基础Markdown到HTML转换（降级方案）
   */
  private basicMarkdownToHtml(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n$/gim, '<br />')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/gim, '<br />');
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.initialized;
  }
}

// 创建全局实例
const simpleConverter = new SimpleMarkdownConverter();

/**
 * 兼容性导出 - 保持现有API不变
 */
export class MarkdownConverter {
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
   * 获取TipTap JSON格式
   * 使用TipTap官方方法，更可靠
   */
  getTipTapJSON(markdown: string): any {
    return simpleConverter.markdownToTipTapJSON(markdown);
  }

  /**
   * 检查转换器是否就绪
   */
  isReady(): boolean {
    return simpleConverter.isReady();
  }
}

// 默认导出实例
export const markdownConverter = new MarkdownConverter();

/**
 * 直接导出简化转换器（供高级用户使用）
 */
export { simpleConverter };
