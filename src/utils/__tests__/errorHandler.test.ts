/**
 * 错误处理工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  createAppError,
  ErrorType,
  ErrorSeverity,
} from '../errorHandler';

describe('ErrorHandler', () => {
  describe('createAppError', () => {
    it('应该创建默认错误对象', () => {
      const error = createAppError('测试错误', ErrorType.UNKNOWN);
      
      expect(error).toBeDefined();
      expect(error.message).toBe('测试错误');
      expect(error.type).toBe(ErrorType.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('应该使用自定义严重程度', () => {
      const error = createAppError(
        '严重错误',
        ErrorType.DATABASE,
        ErrorSeverity.CRITICAL
      );
      
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.type).toBe(ErrorType.DATABASE);
    });

    it('应该包含原始错误', () => {
      const originalError = new Error('原始错误');
      const error = createAppError(
        '包装错误',
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        { cause: originalError }
      );
      
      expect(error.cause).toBe(originalError);
    });

    it('应该包含上下文信息', () => {
      const context = { userId: '123', action: 'save' };
      const error = createAppError(
        '上下文错误',
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        { context }
      );
      
      expect(error.context).toEqual(context);
    });
  });

  describe('ErrorType枚举', () => {
    it('应该包含所有错误类型', () => {
      expect(ErrorType.NETWORK).toBeDefined();
      expect(ErrorType.DATABASE).toBeDefined();
      expect(ErrorType.VALIDATION).toBeDefined();
      expect(ErrorType.UNKNOWN).toBeDefined();
    });
  });

  describe('ErrorSeverity枚举', () => {
    it('应该包含所有严重程度', () => {
      expect(ErrorSeverity.LOW).toBeDefined();
      expect(ErrorSeverity.MEDIUM).toBeDefined();
      expect(ErrorSeverity.HIGH).toBeDefined();
      expect(ErrorSeverity.CRITICAL).toBeDefined();
    });
  });
});
