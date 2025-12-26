/**
 * Logger 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel, createLogger } from '../logger';

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础功能', () => {
    it('应该创建Logger实例', () => {
      const logger = new Logger('Test');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('应该使用createLogger工厂函数创建实例', () => {
      const logger = createLogger('Factory');
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('日志级别过滤', () => {
    it('DEBUG级别应该打印所有日志', () => {
      const logger = new Logger('Test', { 
        level: LogLevel.DEBUG,
        enableTimestamp: false,
        enablePrefix: true,
      });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleSpy.debug).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('ERROR级别应该只打印错误日志', () => {
      const logger = new Logger('Test', { 
        level: LogLevel.ERROR,
        enableTimestamp: false,
      });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('NONE级别应该不打印任何日志', () => {
      const logger = new Logger('Test', { level: LogLevel.NONE });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('日志格式化', () => {
    it('应该包含前缀', () => {
      const logger = new Logger('TestModule', { 
        level: LogLevel.DEBUG,
        enableTimestamp: false,
        enablePrefix: true,
      });
      
      logger.info('test message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        // no additional args
      );
    });
  });

  describe('子日志器', () => {
    it('应该创建带有组合前缀的子日志器', () => {
      const parentLogger = new Logger('Parent', {
        level: LogLevel.DEBUG,
        enableTimestamp: false,
        enablePrefix: true,
      });
      
      const childLogger = parentLogger.child('Child');
      childLogger.info('child message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child]'),
      );
    });
  });

  describe('特殊日志方法', () => {
    it('success应该添加✅前缀', () => {
      const logger = new Logger('Test', { 
        level: LogLevel.DEBUG,
        enableTimestamp: false,
      });
      
      logger.success('operation completed');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('✅'),
      );
    });

    it('fail应该添加❌前缀', () => {
      const logger = new Logger('Test', { 
        level: LogLevel.DEBUG,
        enableTimestamp: false,
      });
      
      logger.fail('operation failed');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
      );
    });
  });

  describe('配置更新', () => {
    it('应该能够更新日志级别', () => {
      const logger = new Logger('Test', { level: LogLevel.ERROR });
      
      logger.info('should not log');
      expect(consoleSpy.log).not.toHaveBeenCalled();
      
      logger.setLevel(LogLevel.INFO);
      logger.info('should log now');
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });
});
