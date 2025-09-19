/**
 * 转换器迁移配置
 * 支持渐进式迁移，运行时切换转换器
 * 确保迁移过程安全可控
 */

/**
 * 迁移配置接口
 */
interface MigrationConfig {
  /** 是否启用新转换器 */
  useNewConverter: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring: boolean;
  /** 是否启用对比测试 */
  enableComparisonTest: boolean;
  /** 错误回退策略 */
  fallbackStrategy: 'old' | 'basic' | 'throw';
  /** 迁移阶段 */
  migrationPhase: 'testing' | 'partial' | 'full' | 'complete';
}

/**
 * 默认迁移配置
 * 初始阶段：保守策略，确保系统稳定
 */
const defaultMigrationConfig: MigrationConfig = {
  useNewConverter: false,           // 默认不启用新转换器
  enablePerformanceMonitoring: true, // 启用性能监控
  enableComparisonTest: false,      // 默认不启用对比测试
  fallbackStrategy: 'old',          // 错误时回退到旧转换器
  migrationPhase: 'testing',        // 初始阶段：测试
};

/**
 * 迁移配置管理器
 * 支持运行时配置切换，便于A/B测试
 */
class MigrationConfigManager {
  private config: MigrationConfig;
  private listeners: Array<(config: MigrationConfig) => void> = [];

  constructor(initialConfig: MigrationConfig = defaultMigrationConfig) {
    this.config = { ...initialConfig };
    
    // 从localStorage加载用户配置（开发环境）
    if (process.env.NODE_ENV === 'development') {
      this.loadFromLocalStorage();
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): MigrationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<MigrationConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    
    // 保存到localStorage（开发环境）
    if (process.env.NODE_ENV === 'development') {
      this.saveToLocalStorage();
    }
    
    // 通知监听器
    this.notifyListeners();
    
    console.log('🔄 转换器配置已更新:', {
      from: oldConfig,
      to: this.config,
    });
  }

  /**
   * 设置迁移阶段
   */
  setMigrationPhase(phase: MigrationConfig['migrationPhase']): void {
    const phaseConfigs: Record<MigrationConfig['migrationPhase'], Partial<MigrationConfig>> = {
      testing: {
        useNewConverter: false,
        enablePerformanceMonitoring: true,
        enableComparisonTest: true,
        fallbackStrategy: 'old',
      },
      partial: {
        useNewConverter: true,
        enablePerformanceMonitoring: true,
        enableComparisonTest: true,
        fallbackStrategy: 'old',
      },
      full: {
        useNewConverter: true,
        enablePerformanceMonitoring: true,
        enableComparisonTest: false,
        fallbackStrategy: 'basic',
      },
      complete: {
        useNewConverter: true,
        enablePerformanceMonitoring: false,
        enableComparisonTest: false,
        fallbackStrategy: 'throw',
      },
    };

    this.updateConfig({
      migrationPhase: phase,
      ...phaseConfigs[phase],
    });
  }

  /**
   * 添加配置变更监听器
   */
  addListener(listener: (config: MigrationConfig) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除配置变更监听器
   */
  removeListener(listener: (config: MigrationConfig) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('配置监听器执行失败:', error);
      }
    });
  }

  /**
   * 从localStorage加载配置
   */
  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('converterMigrationConfig');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        this.config = { ...this.config, ...savedConfig };
        console.log('📥 从localStorage加载转换器配置:', this.config);
      }
    } catch (error) {
      console.warn('⚠️ 加载转换器配置失败:', error);
    }
  }

  /**
   * 保存配置到localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('converterMigrationConfig', JSON.stringify(this.config));
    } catch (error) {
      console.warn('⚠️ 保存转换器配置失败:', error);
    }
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...defaultMigrationConfig };
    
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('converterMigrationConfig');
    }
    
    this.notifyListeners();
    console.log('🔄 转换器配置已重置为默认值');
  }
}

/**
 * 性能监控数据接口
 */
interface PerformanceMetrics {
  converterType: 'old' | 'new' | 'basic';
  conversionTime: number;
  inputLength: number;
  outputLength: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

/**
 * 性能监控管理器
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // 最多保存1000条记录

  /**
   * 记录性能指标
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // 保持数组大小在限制内
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // 开发环境下打印详细信息
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 转换器性能指标:', metric);
    }
  }

  /**
   * 获取性能统计
   */
  getStats(): {
    totalConversions: number;
    averageTime: number;
    successRate: number;
    byConverter: Record<string, { count: number; averageTime: number; successRate: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalConversions: 0,
        averageTime: 0,
        successRate: 0,
        byConverter: {},
      };
    }

    const totalConversions = this.metrics.length;
    const successfulConversions = this.metrics.filter(m => m.success).length;
    const averageTime = this.metrics.reduce((sum, m) => sum + m.conversionTime, 0) / totalConversions;
    const successRate = successfulConversions / totalConversions;

    // 按转换器类型分组统计
    const byConverter: Record<string, { count: number; averageTime: number; successRate: number }> = {};
    
    ['old', 'new', 'basic'].forEach(type => {
      const typeMetrics = this.metrics.filter(m => m.converterType === type);
      if (typeMetrics.length > 0) {
        const typeSuccessful = typeMetrics.filter(m => m.success).length;
        byConverter[type] = {
          count: typeMetrics.length,
          averageTime: typeMetrics.reduce((sum, m) => sum + m.conversionTime, 0) / typeMetrics.length,
          successRate: typeSuccessful / typeMetrics.length,
        };
      }
    });

    return {
      totalConversions,
      averageTime,
      successRate,
      byConverter,
    };
  }

  /**
   * 清空性能数据
   */
  clear(): void {
    this.metrics = [];
    console.log('🧹 性能监控数据已清空');
  }

  /**
   * 导出性能数据（用于分析）
   */
  exportData(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// 创建全局实例
export const migrationConfig = new MigrationConfigManager();
export const performanceMonitor = new PerformanceMonitor();

// 导出类型和默认配置
export type { MigrationConfig, PerformanceMetrics };
export { defaultMigrationConfig };

// 便捷方法
export const getCurrentConfig = () => migrationConfig.getConfig();
export const setMigrationPhase = (phase: MigrationConfig['migrationPhase']) => 
  migrationConfig.setMigrationPhase(phase);

/**
 * 开发环境下的调试工具
 */
if (process.env.NODE_ENV === 'development') {
  // 将配置管理器暴露到全局，便于调试
  (window as any).converterMigration = {
    config: migrationConfig,
    monitor: performanceMonitor,
    setPhase: setMigrationPhase,
    getStats: () => performanceMonitor.getStats(),
  };
  
  console.log('🛠️ 转换器迁移调试工具已加载到 window.converterMigration');
}
