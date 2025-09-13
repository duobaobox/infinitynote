import React, { Component, ErrorInfo, ReactNode } from "react";
import { Result, Button } from "antd";
import { ReloadOutlined, BugOutlined } from "@ant-design/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * 错误边界组件
 * 
 * 功能特性：
 * - 捕获子组件中的JavaScript错误
 * - 显示友好的错误提示界面
 * - 提供重新加载和错误报告功能
 * - 防止整个应用崩溃
 * 
 * 使用场景：
 * - 包裹关键组件防止错误传播
 * - 提供用户友好的错误恢复机制
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 可以在这里添加错误上报逻辑
    this.reportError(error, errorInfo);
  }

  /**
   * 错误上报（可扩展）
   */
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 暂时只在控制台输出，实际项目中可以发送到错误监控服务
    console.error("Error Report:", errorReport);
  };

  /**
   * 重置错误状态
   */
  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  /**
   * 重新加载页面
   */
  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果有自定义的 fallback UI，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认的错误 UI
      return (
        <div style={{ 
          padding: "20px", 
          minHeight: "400px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center" 
        }}>
          <Result
            status="error"
            title="应用出现错误"
            subTitle="抱歉，应用遇到了一个意外错误。您可以尝试重新加载页面或重置应用状态。"
            extra={[
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={this.handleReload}
                key="reload"
              >
                重新加载
              </Button>,
              <Button 
                icon={<BugOutlined />} 
                onClick={this.handleReset}
                key="reset"
              >
                重置状态
              </Button>,
            ]}
          >
            {/* 开发环境下显示详细错误信息 */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div style={{ 
                marginTop: "20px", 
                padding: "16px", 
                backgroundColor: "#f5f5f5", 
                borderRadius: "6px",
                textAlign: "left",
                fontSize: "12px",
                fontFamily: "monospace",
                maxHeight: "200px",
                overflow: "auto"
              }}>
                <strong>错误详情：</strong>
                <pre>{this.state.error.stack}</pre>
                {this.state.errorInfo && (
                  <>
                    <strong>组件堆栈：</strong>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;
