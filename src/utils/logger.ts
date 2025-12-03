/**
 * 统一日志系统
 * 
 * 功能特性：
 * - 区分开发/生产环境
 * - 支持日志级别过滤
 * - 支持模块前缀
 * - 支持日志格式化
 * - 生产环境可选上报错误监控
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// 日志配置接口
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableTimestamp: boolean;
  enablePrefix: boolean;
}

// 默认配置
const defaultConfig: LoggerConfig = {
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.ERROR,
  enableConsole: true,
  enableTimestamp: import.meta.env.DEV,
  enablePrefix: true,
};

// 日志去重机制
const loggedMessages = new Set<string>();
const LOG_DEDUP_TIMEOUT = 5000; // 5秒内相同日志不重复打印

/**
 * 统一日志类
 */
class Logger {
  private config: LoggerConfig;
  private prefix: string;

  constructor(prefix: string = '', config: Partial<LoggerConfig> = {}) {
    this.prefix = prefix;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];
    
    if (this.config.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(`[${level}]`);
    
    if (this.config.enablePrefix && this.prefix) {
      parts.push(`[${this.prefix}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  /**
   * 检查是否应该打印（去重逻辑）
   */
  private shouldLog(message: string, ...args: unknown[]): boolean {
    const key = `${message}_${JSON.stringify(args)}`;
    if (loggedMessages.has(key)) {
      return false;
    }
    loggedMessages.add(key);
    setTimeout(() => loggedMessages.delete(key), LOG_DEDUP_TIMEOUT);
    return true;
  }

  /**
   * DEBUG级别日志 - 仅开发环境
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.DEBUG || !this.config.enableConsole) return;
    if (!this.shouldLog(message, ...args)) return;
    
    console.debug(this.formatMessage('DEBUG', message), ...args);
  }

  /**
   * INFO级别日志 - 一般信息
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.INFO || !this.config.enableConsole) return;
    if (!this.shouldLog(message, ...args)) return;
    
    console.log(this.formatMessage('INFO', message), ...args);
  }

  /**
   * WARN级别日志 - 警告信息
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.WARN || !this.config.enableConsole) return;
    
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  /**
   * ERROR级别日志 - 错误信息（总是打印）
   */
  error(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.ERROR || !this.config.enableConsole) return;
    
    console.error(this.formatMessage('ERROR', message), ...args);
    
    // 生产环境可在此处上报到错误监控服务
    // if (!import.meta.env.DEV) {
    //   this.reportError(message, args);
    // }
  }

  /**
   * 成功日志 - 带有✅前缀
   */
  success(message: string, ...args: unknown[]): void {
    this.info(`✅ ${message}`, ...args);
  }

  /**
   * 失败日志 - 带有❌前缀
   */
  fail(message: string, ...args: unknown[]): void {
    this.error(`❌ ${message}`, ...args);
  }

  /**
   * 分组日志开始
   */
  group(label: string): void {
    if (this.config.level > LogLevel.DEBUG || !this.config.enableConsole) return;
    console.group(this.formatMessage('GROUP', label));
  }

  /**
   * 分组日志结束
   */
  groupEnd(): void {
    if (this.config.level > LogLevel.DEBUG || !this.config.enableConsole) return;
    console.groupEnd();
  }

  /**
   * 表格日志
   */
  table(data: unknown): void {
    if (this.config.level > LogLevel.DEBUG || !this.config.enableConsole) return;
    console.table(data);
  }

  /**
   * 计时开始
   */
  time(label: string): void {
    if (this.config.level > LogLevel.DEBUG || !this.config.enableConsole) return;
    console.time(`${this.prefix ? `[${this.prefix}] ` : ''}${label}`);
  }

  /**
   * 计时结束
   */
  timeEnd(label: string): void {
    if (this.config.level > LogLevel.DEBUG || !this.config.enableConsole) return;
    console.timeEnd(`${this.prefix ? `[${this.prefix}] ` : ''}${label}`);
  }

  /**
   * 创建子日志器
   */
  child(prefix: string): Logger {
    const newPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger(newPrefix, this.config);
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// 创建各模块的日志实例
export const logger = new Logger();
export const dbLogger = new Logger('DB');
export const aiLogger = new Logger('AI');
export const storeLogger = new Logger('Store');
export const uiLogger = new Logger('UI');
export const electronLogger = new Logger('Electron');
export const syncLogger = new Logger('Sync');

// 创建自定义日志器的工厂函数
export const createLogger = (prefix: string, config?: Partial<LoggerConfig>): Logger => {
  return new Logger(prefix, config);
};

// 导出类型
export type { LoggerConfig };
export { Logger };
export default logger;
