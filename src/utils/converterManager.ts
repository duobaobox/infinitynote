/**
 * 转换器管理器
 * 支持运行时切换不同的Markdown转换器，实现渐进式迁移
 * 
 * 功能特性：
 * 1. 运行时切换转换器（旧转换器 ↔ 新转换器）
 * 2. 性能监控和对比
 * 3. 错误回退机制
 * 4. A/B测试支持
 */

import { migrationConfig, performanceMonitor, type MigrationConfig, type PerformanceMetrics } from '../config/converterMigration';
import { markdownConverter as oldConverter } from './markdownConverter';
import { compatibleConverter as newConverter } from './lightweightMarkdownConverter';

/**
 * 转换器接口
 * 统一不同转换器的API
 */
interface IMarkdownConverter {
  convertStreamChunk(markdownChunk: string): string;
  convertComplete(markdown: string): string;
  isReady?(): boolean;
  getStatus?(): any;
}

/**
 * 转换器管理器类
 * 负责管理多个转换器，支持动态切换和性能监控
 */
class ConverterManager implements IMarkdownConverter {
  private currentConverter: IMarkdownConverter;
  private config: MigrationConfig;
  
  constructor() {
    this.config = migrationConfig.getConfig();
    this.currentConverter = this.selectConverter();
    
    // 监听配置变更
    migrationConfig.addListener((newConfig) => {
      this.config = newConfig;
      this.currentConverter = this.selectConverter();
      console.log('🔄 转换器已切换:', this.getConverterName());
    });
    
    console.log('🚀 转换器管理器初始化完成，当前使用:', this.getConverterName());
  }

  /**
   * 根据配置选择转换器
   */
  private selectConverter(): IMarkdownConverter {
    if (this.config.useNewConverter) {
      return newConverter;
    } else {
      return oldConverter;
    }
  }

  /**
   * 获取当前转换器名称
   */
  private getConverterName(): string {
    if (this.currentConverter === newConverter) {
      return 'LightweightConverter (新)';
    } else {
      return 'MarkdownConverter (旧)';
    }
  }

  /**
   * 流式转换方法
   * 支持性能监控和错误回退
   */
  convertStreamChunk(markdownChunk: string): string {
    const startTime = performance.now();
    let result: string;
    let success = true;
    let error: string | undefined;

    try {
      result = this.currentConverter.convertStreamChunk(markdownChunk);
      
      // 对比测试（如果启用）
      if (this.config.enableComparisonTest) {
        this.performComparisonTest(markdownChunk, 'stream');
      }
      
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      console.warn('⚠️ 转换器错误，尝试回退:', error);
      
      // 错误回退策略
      result = this.handleError(markdownChunk, 'stream', err as Error);
    }

    // 性能监控
    if (this.config.enablePerformanceMonitoring) {
      const endTime = performance.now();
      const metric: PerformanceMetrics = {
        converterType: this.currentConverter === newConverter ? 'new' : 'old',
        conversionTime: endTime - startTime,
        inputLength: markdownChunk.length,
        outputLength: result.length,
        timestamp: Date.now(),
        success,
        error,
      };
      performanceMonitor.recordMetric(metric);
    }

    return result;
  }

  /**
   * 完整转换方法
   * 支持性能监控和错误回退
   */
  convertComplete(markdown: string): string {
    const startTime = performance.now();
    let result: string;
    let success = true;
    let error: string | undefined;

    try {
      result = this.currentConverter.convertComplete(markdown);
      
      // 对比测试（如果启用）
      if (this.config.enableComparisonTest) {
        this.performComparisonTest(markdown, 'complete');
      }
      
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      console.warn('⚠️ 转换器错误，尝试回退:', error);
      
      // 错误回退策略
      result = this.handleError(markdown, 'complete', err as Error);
    }

    // 性能监控
    if (this.config.enablePerformanceMonitoring) {
      const endTime = performance.now();
      const metric: PerformanceMetrics = {
        converterType: this.currentConverter === newConverter ? 'new' : 'old',
        conversionTime: endTime - startTime,
        inputLength: markdown.length,
        outputLength: result.length,
        timestamp: Date.now(),
        success,
        error,
      };
      performanceMonitor.recordMetric(metric);
    }

    return result;
  }

  /**
   * 错误处理和回退策略
   */
  private handleError(markdown: string, method: 'stream' | 'complete', error: Error): string {
    switch (this.config.fallbackStrategy) {
      case 'old':
        // 回退到旧转换器
        try {
          if (method === 'stream') {
            return oldConverter.convertStreamChunk(markdown);
          } else {
            return oldConverter.convertComplete(markdown);
          }
        } catch (fallbackError) {
          console.error('❌ 旧转换器也失败了:', fallbackError);
          return this.basicFallback(markdown);
        }
        
      case 'basic':
        // 使用基础转换
        return this.basicFallback(markdown);
        
      case 'throw':
        // 抛出错误
        throw error;
        
      default:
        return this.basicFallback(markdown);
    }
  }

  /**
   * 基础回退转换
   * 最简单的Markdown到HTML转换，确保系统不会崩溃
   */
  private basicFallback(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/gim, '<br>')
      .replace(/^(.*)$/gim, '<p>$1</p>')
      .replace(/<p><\/p>/gim, '');
  }

  /**
   * 对比测试
   * 同时使用新旧转换器，对比结果差异
   */
  private performComparisonTest(markdown: string, method: 'stream' | 'complete'): void {
    try {
      const oldResult = method === 'stream' 
        ? oldConverter.convertStreamChunk(markdown)
        : oldConverter.convertComplete(markdown);
        
      const newResult = method === 'stream'
        ? newConverter.convertStreamChunk(markdown)
        : newConverter.convertComplete(markdown);

      // 简单的差异检测
      if (oldResult !== newResult) {
        console.log('🔍 转换器结果差异检测:', {
          method,
          inputLength: markdown.length,
          oldLength: oldResult.length,
          newLength: newResult.length,
          // 只在开发环境显示详细差异
          ...(process.env.NODE_ENV === 'development' && {
            oldResult: oldResult.substring(0, 200),
            newResult: newResult.substring(0, 200),
          }),
        });
      }
    } catch (error) {
      console.warn('⚠️ 对比测试失败:', error);
    }
  }

  /**
   * 检查转换器是否就绪
   */
  isReady(): boolean {
    if (this.currentConverter.isReady) {
      return this.currentConverter.isReady();
    }
    return true; // 假设旧转换器总是就绪的
  }

  /**
   * 获取转换器状态
   */
  getStatus(): any {
    return {
      currentConverter: this.getConverterName(),
      config: this.config,
      isReady: this.isReady(),
      converterStatus: this.currentConverter.getStatus?.() || 'unknown',
    };
  }

  /**
   * 手动切换转换器（用于测试）
   */
  switchConverter(useNew: boolean): void {
    migrationConfig.updateConfig({ useNewConverter: useNew });
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): any {
    return performanceMonitor.getStats();
  }
}

// 创建全局实例
export const converterManager = new ConverterManager();

// 导出兼容的API
export const markdownConverter = {
  convertStreamChunk: (markdown: string) => converterManager.convertStreamChunk(markdown),
  convertComplete: (markdown: string) => converterManager.convertComplete(markdown),
  isReady: () => converterManager.isReady(),
  getStatus: () => converterManager.getStatus(),
  getPerformanceStats: () => converterManager.getPerformanceStats(),
};

// 开发环境调试工具
if (process.env.NODE_ENV === 'development') {
  (window as any).converterManager = converterManager;
  console.log('🛠️ 转换器管理器已暴露到 window.converterManager');
}
