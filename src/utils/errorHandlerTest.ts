/**
 * 错误处理系统测试工具
 * 用于验证错误处理功能是否正常工作
 */

import { createAppError, ErrorType, ErrorSeverity } from './errorHandler';
import { AIErrorHandler } from './aiErrorHandler';
import { errorNotification } from '../components/ErrorNotification';

/**
 * 测试错误处理系统
 */
export class ErrorHandlerTester {
  private aiErrorHandler: AIErrorHandler;

  constructor() {
    this.aiErrorHandler = AIErrorHandler.getInstance();
  }

  /**
   * 测试基础错误创建
   */
  testBasicErrorCreation(): void {
    console.log('🧪 测试基础错误创建...');
    
    const error = createAppError(
      '这是一个测试错误',
      ErrorType.VALIDATION,
      ErrorSeverity.MEDIUM,
      {
        code: 'TEST_001',
        context: { testData: 'test' },
        userMessage: '用户友好的错误消息',
      }
    );

    console.log('✅ 错误创建成功:', {
      message: error.message,
      type: error.type,
      severity: error.severity,
      code: error.code,
      userMessage: error.userMessage,
    });
  }

  /**
   * 测试AI错误处理
   */
  testAIErrorHandling(): void {
    console.log('🧪 测试AI错误处理...');
    
    const testErrors = [
      'API密钥未配置',
      'API密钥无效',
      '网络连接失败',
      'API额度不足',
      '模型不可用',
      '提示词格式错误',
      '生成失败',
      '未知错误',
    ];

    testErrors.forEach((errorMessage, index) => {
      const errorInfo = this.aiErrorHandler.parseError(errorMessage, {
        retryFn: () => console.log(`重试操作 ${index + 1}`),
      });

      console.log(`✅ AI错误 ${index + 1} 解析成功:`, {
        type: errorInfo.type,
        severity: errorInfo.severity,
        userMessage: errorInfo.userMessage,
        recoveryActionsCount: errorInfo.recoveryActions.length,
      });
    });
  }

  /**
   * 测试错误通知系统
   */
  testErrorNotifications(): void {
    console.log('🧪 测试错误通知系统...');
    
    // 测试成功通知
    errorNotification.success('测试成功通知', '这是一个成功通知的测试');
    
    // 测试信息通知
    errorNotification.info('测试信息通知', '这是一个信息通知的测试');
    
    // 测试警告通知
    errorNotification.warning('测试警告通知', '这是一个警告通知的测试');
    
    // 测试错误通知
    const testError = createAppError(
      '测试错误通知',
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      {
        code: 'TEST_NOTIFICATION',
        userMessage: '这是一个错误通知的测试',
      }
    );

    errorNotification.show({
      error: testError,
      showRetry: true,
      showSettings: true,
      onRetry: () => console.log('用户点击了重试'),
      onSettings: () => console.log('用户点击了设置'),
    });

    console.log('✅ 错误通知测试完成');
  }

  /**
   * 测试AI错误通知
   */
  testAIErrorNotifications(): void {
    console.log('🧪 测试AI错误通知...');
    
    // 测试API密钥错误
    this.aiErrorHandler.showErrorNotification('API密钥未配置', {
      retryFn: () => console.log('重试API密钥配置'),
    });

    // 测试网络错误
    setTimeout(() => {
      this.aiErrorHandler.showErrorNotification('网络连接失败', {
        retryFn: () => console.log('重试网络连接'),
      });
    }, 1000);

    // 测试生成错误
    setTimeout(() => {
      this.aiErrorHandler.showErrorNotification('AI生成失败', {
        retryFn: () => console.log('重试AI生成'),
      });
    }, 2000);

    console.log('✅ AI错误通知测试完成');
  }

  /**
   * 运行所有测试
   */
  runAllTests(): void {
    console.log('🚀 开始错误处理系统测试...');
    
    try {
      this.testBasicErrorCreation();
      this.testAIErrorHandling();
      this.testErrorNotifications();
      this.testAIErrorNotifications();
      
      console.log('🎉 所有错误处理测试完成！');
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    }
  }

  /**
   * 模拟真实的AI错误场景
   */
  simulateRealAIErrors(): void {
    console.log('🎭 模拟真实AI错误场景...');
    
    // 模拟API密钥缺失
    setTimeout(() => {
      console.log('模拟: API密钥缺失错误');
      this.aiErrorHandler.showErrorNotification('API密钥未配置', {
        retryFn: () => {
          console.log('用户尝试重新配置API密钥');
          errorNotification.info('配置提示', '请在设置中配置您的API密钥');
        },
      });
    }, 500);

    // 模拟网络错误
    setTimeout(() => {
      console.log('模拟: 网络连接错误');
      this.aiErrorHandler.showErrorNotification('网络连接超时', {
        retryFn: () => {
          console.log('用户尝试重新连接');
          errorNotification.info('重试中', '正在重新尝试连接...');
        },
      });
    }, 1500);

    // 模拟API额度不足
    setTimeout(() => {
      console.log('模拟: API额度不足错误');
      this.aiErrorHandler.showErrorNotification('API额度不足', {
        retryFn: () => {
          console.log('用户查看额度解决方案');
          errorNotification.warning('额度不足', '请检查您的API额度或切换到其他提供商');
        },
      });
    }, 2500);

    console.log('✅ 真实错误场景模拟完成');
  }
}

// 导出测试实例
export const errorHandlerTester = new ErrorHandlerTester();

// 在开发环境下自动暴露到全局
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).errorHandlerTester = errorHandlerTester;
  console.log('🔧 错误处理测试工具已暴露到全局: window.errorHandlerTester');
  console.log('💡 使用方法:');
  console.log('  - errorHandlerTester.runAllTests() - 运行所有测试');
  console.log('  - errorHandlerTester.simulateRealAIErrors() - 模拟真实错误');
  console.log('  - errorHandlerTester.testErrorNotifications() - 测试通知');
}

export default ErrorHandlerTester;
