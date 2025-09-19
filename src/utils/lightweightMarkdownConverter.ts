/**
 * 轻量级Markdown转换器
 * 专为AI生成便签优化，简化转换流程，提升性能
 * 
 * 设计原则：
 * 1. 单一职责：只负责Markdown到HTML的转换
 * 2. 性能优先：最小化转换开销
 * 3. TipTap友好：输出格式完全兼容TipTap编辑器
 * 4. 渐进式替换：与现有系统兼容，支持平滑迁移
 */

import type { JSONContent } from '@tiptap/core';

/**
 * 轻量级Markdown转换器类
 * 核心功能：快速、可靠的Markdown到HTML转换
 */
class LightweightMarkdownConverter {
  private markdownIt: any = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 异步初始化，避免阻塞主线程
    this.initPromise = this.initializeAsync();
  }

  /**
   * 异步初始化markdown-it
   * 使用动态导入减少初始包大小
   */
  private async initializeAsync(): Promise<void> {
    try {
      // 动态导入markdown-it，支持代码分割
      const MarkdownItModule = await import('markdown-it');
      const MarkdownItConstructor = MarkdownItModule.default || MarkdownItModule;
      
      // 配置markdown-it，专为AI生成内容优化
      this.markdownIt = new MarkdownItConstructor({
        html: true,        // 允许HTML标签（AI可能生成HTML）
        breaks: true,      // 换行转换为<br>（提升可读性）
        linkify: true,     // 自动识别链接（AI经常生成URL）
        typographer: true, // 印刷符号替换（提升显示效果）
      });
      
      this.initialized = true;
      console.log('✅ LightweightMarkdownConverter 初始化完成');
    } catch (error) {
      console.error('❌ LightweightMarkdownConverter 初始化失败:', error);
      this.initialized = false;
    }
  }

  /**
   * 等待初始化完成
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  /**
   * 核心转换方法：Markdown → HTML
   * 统一用于流式和完整转换，确保一致性
   * 
   * @param markdown - 输入的Markdown文本
   * @returns HTML字符串，可直接用于TipTap编辑器
   */
  async convert(markdown: string): Promise<string> {
    // 确保转换器已初始化
    await this.ensureInitialized();
    
    if (!this.initialized || !this.markdownIt) {
      // 降级处理：使用基础转换
      console.warn('⚠️ 转换器未初始化，使用基础转换');
      return this.basicMarkdownToHtml(markdown);
    }

    try {
      // 使用markdown-it进行转换
      return this.markdownIt.render(markdown);
    } catch (error) {
      console.warn('⚠️ markdown-it转换失败，使用基础转换:', error);
      return this.basicMarkdownToHtml(markdown);
    }
  }

  /**
   * 同步转换方法（用于兼容现有API）
   * 如果转换器未初始化，使用基础转换
   * 
   * @param markdown - 输入的Markdown文本
   * @returns HTML字符串
   */
  convertSync(markdown: string): string {
    if (!this.initialized || !this.markdownIt) {
      return this.basicMarkdownToHtml(markdown);
    }

    try {
      return this.markdownIt.render(markdown);
    } catch (error) {
      console.warn('⚠️ 同步转换失败，使用基础转换:', error);
      return this.basicMarkdownToHtml(markdown);
    }
  }

  /**
   * 基础Markdown到HTML转换（降级方案）
   * 当markdown-it不可用时使用，确保系统稳定性
   * 
   * @param markdown - 输入的Markdown文本
   * @returns 基础HTML字符串
   */
  private basicMarkdownToHtml(markdown: string): string {
    return markdown
      // 标题转换
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // 文本格式
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      
      // 链接和图片
      .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
      
      // 列表（简化处理）
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      
      // 换行处理
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br />')
      
      // 包装段落
      .replace(/^(.*)$/gim, '<p>$1</p>')
      
      // 清理空段落
      .replace(/<p><\/p>/gim, '');
  }

  /**
   * 检查转换器是否已初始化
   * @returns 是否已初始化
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * 获取转换器状态信息（用于调试）
   * @returns 状态信息对象
   */
  getStatus(): { initialized: boolean; hasMarkdownIt: boolean } {
    return {
      initialized: this.initialized,
      hasMarkdownIt: !!this.markdownIt,
    };
  }
}

/**
 * 兼容性包装器
 * 保持与现有MarkdownConverter API的兼容性
 * 支持渐进式迁移
 */
export class CompatibleMarkdownConverter {
  private lightweight: LightweightMarkdownConverter;

  constructor() {
    this.lightweight = new LightweightMarkdownConverter();
  }

  /**
   * 流式转换Markdown片段到HTML
   * 兼容现有API，内部使用轻量转换器
   */
  convertStreamChunk(markdownChunk: string): string {
    return this.lightweight.convertSync(markdownChunk);
  }

  /**
   * 完整转换Markdown到HTML
   * 兼容现有API，内部使用轻量转换器
   */
  convertComplete(markdown: string): string {
    return this.lightweight.convertSync(markdown);
  }

  /**
   * 异步转换方法（推荐使用）
   * 确保转换器完全初始化后再转换
   */
  async convertAsync(markdown: string): Promise<string> {
    return await this.lightweight.convert(markdown);
  }

  /**
   * 检查转换器是否就绪
   */
  isReady(): boolean {
    return this.lightweight.isReady();
  }

  /**
   * 获取转换器状态（调试用）
   */
  getStatus(): { initialized: boolean; hasMarkdownIt: boolean } {
    return this.lightweight.getStatus();
  }
}

// 创建全局实例
const lightweightConverter = new LightweightMarkdownConverter();
const compatibleConverter = new CompatibleMarkdownConverter();

// 导出实例和类
export { lightweightConverter, compatibleConverter };
export default LightweightMarkdownConverter;

/**
 * 便捷导出：兼容现有代码的转换器实例
 * 可以直接替换现有的markdownConverter导入
 */
export const markdownConverter = compatibleConverter;
