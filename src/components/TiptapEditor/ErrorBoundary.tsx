/**
 * Tiptap 编辑器错误边界组件
 */

import React, { Component } from "react";
import type { ReactNode } from "react";
import type { EditorError } from "./types/index";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: EditorError;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: EditorError) => ReactNode;
  onError?: (error: EditorError) => void;
}

/**
 * 编辑器错误边界组件
 */
export class TiptapEditorErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const editorError: EditorError = {
      type: "runtime",
      message: error.message,
      stack: error.stack,
      details: error,
    };

    return {
      hasError: true,
      error: editorError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const editorError: EditorError = {
      type: "runtime",
      message: error.message,
      stack: error.stack,
      details: { error, errorInfo },
    };

    console.error("Tiptap Editor Error:", editorError);

    if (this.props.onError) {
      this.props.onError(editorError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private renderDefaultFallback(error: EditorError): ReactNode {
    return (
      <div className="tiptap-editor-error">
        <div className="tiptap-editor-error-icon">⚠️</div>
        <div className="tiptap-editor-error-content">
          <h3>编辑器发生错误</h3>
          <p>{error.message}</p>
          <button
            className="tiptap-editor-error-retry"
            onClick={this.handleRetry}
            type="button"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      return this.renderDefaultFallback(this.state.error);
    }

    return this.props.children;
  }
}

/**
 * 高阶组件包装器
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <TiptapEditorErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </TiptapEditorErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
