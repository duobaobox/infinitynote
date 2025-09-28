/**
 * 键盘事件管理器 - 统一处理全局键盘事件冲突
 *
 * 设计目标：
 * 1. 统一管理全局键盘事件，避免冲突
 * 2. 智能检测编辑上下文，优先级管理
 * 3. 支持自定义快捷键和动态注册
 * 4. 提供调试和监控功能
 */

import type { Editor } from "@tiptap/core";

// ======================== 类型定义 ========================

/**
 * 键盘事件处理器
 */
export interface KeyboardEventHandler {
  /** 处理器ID */
  id: string;
  /** 处理器名称 */
  name: string;
  /** 优先级（数字越大优先级越高） */
  priority: number;
  /** 键盘事件处理函数 */
  handler: (event: KeyboardEvent) => boolean | void;
  /** 是否只在特定上下文中生效 */
  context?: KeyboardContext;
  /** 处理器描述 */
  description?: string;
}

/**
 * 键盘上下文
 */
export interface KeyboardContext {
  /** 上下文类型 */
  type: "global" | "editor" | "canvas" | "modal" | "custom";
  /** 上下文选择器 */
  selector?: string;
  /** 排除的元素选择器 */
  excludeSelectors?: string[];
  /** 自定义上下文检测函数 */
  customCheck?: (event: KeyboardEvent) => boolean;
}

/**
 * 编辑上下文检测结果
 */
export interface EditingContextInfo {
  /** 是否在编辑状态 */
  isEditing: boolean;
  /** 编辑器类型 */
  editorType?: "tiptap" | "input" | "textarea" | "contenteditable" | "other";
  /** 编辑器实例（如果是Tiptap） */
  editor?: Editor;
  /** 目标元素 */
  target: HTMLElement;
  /** 上下文详情 */
  details?: Record<string, any>;
}

/**
 * 键盘事件管理器配置
 */
export interface KeyboardManagerConfig {
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  /** 默认阻止事件的键列表 */
  defaultPreventKeys?: string[];
  /** 全局排除的选择器 */
  globalExcludeSelectors?: string[];
}

// ======================== 键盘事件管理器 ========================

export class KeyboardEventManager {
  private handlers: Map<string, KeyboardEventHandler> = new Map();
  private isListening = false;
  private config: KeyboardManagerConfig;
  private performanceData: Map<string, number[]> = new Map();

  // 常用的编辑元素选择器
  private static readonly EDITING_SELECTORS = [
    "input",
    "textarea",
    '[contenteditable="true"]',
    "[contenteditable]",
    ".tiptap",
    ".tiptap-editor-content",
    ".ProseMirror",
  ];

  // 排除的编辑元素选择器
  private static readonly EXCLUDE_SELECTORS = [
    '[contenteditable="false"]',
    ".tiptap-toolbar",
    ".tiptap-toolbar-button",
    "[disabled]",
    "[readonly]",
  ];

  constructor(config: KeyboardManagerConfig = {}) {
    this.config = {
      debug: false,
      enablePerformanceMonitoring: false,
      defaultPreventKeys: ["Escape"],
      globalExcludeSelectors: [],
      ...config,
    };

    if (this.config.debug) {
      console.log("🎹 KeyboardEventManager initialized", this.config);
    }
  }

  /**
   * 启动键盘事件监听
   */
  public startListening(): void {
    if (this.isListening) {
      this.log("Already listening to keyboard events");
      return;
    }

    document.addEventListener("keydown", this.handleKeyDown, true);
    document.addEventListener("keyup", this.handleKeyUp, true);
    this.isListening = true;

    this.log("Started listening to keyboard events");
  }

  /**
   * 停止键盘事件监听
   */
  public stopListening(): void {
    if (!this.isListening) {
      this.log("Not currently listening to keyboard events");
      return;
    }

    document.removeEventListener("keydown", this.handleKeyDown, true);
    document.removeEventListener("keyup", this.handleKeyUp, true);
    this.isListening = false;

    this.log("Stopped listening to keyboard events");
  }

  /**
   * 注册键盘事件处理器
   */
  public registerHandler(handler: KeyboardEventHandler): void {
    if (this.handlers.has(handler.id)) {
      this.log(`Handler ${handler.id} already exists, updating...`);
    }

    this.handlers.set(handler.id, handler);
    this.log(
      `Registered handler: ${handler.name} (${handler.id}) with priority ${handler.priority}`
    );
  }

  /**
   * 注销键盘事件处理器
   */
  public unregisterHandler(handlerId: string): boolean {
    const removed = this.handlers.delete(handlerId);
    if (removed) {
      this.log(`Unregistered handler: ${handlerId}`);
    } else {
      this.log(`Handler not found: ${handlerId}`);
    }
    return removed;
  }

  /**
   * 获取所有注册的处理器
   */
  public getHandlers(): KeyboardEventHandler[] {
    return Array.from(this.handlers.values()).sort(
      (a, b) => b.priority - a.priority
    );
  }

  /**
   * 检测当前编辑上下文
   */
  public detectEditingContext(event: KeyboardEvent): EditingContextInfo {
    const target = event.target as HTMLElement;

    if (!target) {
      return { isEditing: false, target };
    }

    // 检查是否在排除列表中
    for (const selector of KeyboardEventManager.EXCLUDE_SELECTORS) {
      if (target.matches(selector) || target.closest(selector)) {
        return { isEditing: false, target, editorType: "other" };
      }
    }

    // 检查标准输入元素
    if (target.tagName === "INPUT") {
      return {
        isEditing: true,
        target,
        editorType: "input",
        details: { inputType: (target as HTMLInputElement).type },
      };
    }

    if (target.tagName === "TEXTAREA") {
      return { isEditing: true, target, editorType: "textarea" };
    }

    // 检查 contentEditable 元素
    if (target.contentEditable === "true" || target.isContentEditable) {
      // 检查是否是 Tiptap 编辑器
      const tiptapContainer =
        target.closest(".tiptap") || target.closest(".ProseMirror");
      if (tiptapContainer) {
        return {
          isEditing: true,
          target,
          editorType: "tiptap",
          details: { container: tiptapContainer },
        };
      }

      return { isEditing: true, target, editorType: "contenteditable" };
    }

    // 检查是否在编辑相关的容器内
    for (const selector of KeyboardEventManager.EDITING_SELECTORS) {
      const container = target.closest(selector);
      if (container) {
        const editorType = selector.includes("tiptap") ? "tiptap" : "other";
        return {
          isEditing: true,
          target,
          editorType,
          details: { container },
        };
      }
    }

    return { isEditing: false, target };
  }

  /**
   * 主键盘事件处理器
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const startTime = this.config.enablePerformanceMonitoring
      ? performance.now()
      : 0;

    try {
      // 检测编辑上下文
      const editingContext = this.detectEditingContext(event);

      this.log(
        `KeyDown: ${event.key}, Editing: ${editingContext.isEditing}, Type: ${editingContext.editorType}`
      );

      // 获取按优先级排序的处理器
      const sortedHandlers = this.getHandlers();

      // 依次执行处理器
      for (const handler of sortedHandlers) {
        if (this.shouldExecuteHandler(handler, event, editingContext)) {
          const result = handler.handler(event);

          // 如果处理器返回 true，表示事件已被处理，停止传播
          if (result === true) {
            this.log(`Event handled by: ${handler.name}`);
            event.preventDefault();
            event.stopPropagation();
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error in keyboard event handling:", error);
    } finally {
      if (this.config.enablePerformanceMonitoring) {
        const duration = performance.now() - startTime;
        this.recordPerformance("keydown", duration);
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    // KeyUp 事件处理（如果需要的话）
    this.log(`KeyUp: ${event.key}`);
  };

  /**
   * 判断是否应该执行处理器
   */
  private shouldExecuteHandler(
    handler: KeyboardEventHandler,
    event: KeyboardEvent,
    editingContext: EditingContextInfo
  ): boolean {
    // 检查上下文匹配
    if (handler.context) {
      const { type, selector, excludeSelectors, customCheck } = handler.context;

      // 自定义检测函数优先
      if (customCheck) {
        return customCheck(event);
      }

      // 根据上下文类型判断
      switch (type) {
        case "editor":
          if (!editingContext.isEditing) return false;
          break;
        case "canvas":
        case "global":
          if (editingContext.isEditing) return false;
          break;
        case "modal":
          // 检查是否在模态框中
          if (
            !event.target ||
            !(event.target as HTMLElement).closest(".modal, .ant-modal")
          ) {
            return false;
          }
          break;
      }

      // 检查选择器匹配
      if (selector) {
        const target = event.target as HTMLElement;
        if (!target.matches(selector) && !target.closest(selector)) {
          return false;
        }
      }

      // 检查排除选择器
      if (excludeSelectors) {
        const target = event.target as HTMLElement;
        for (const excludeSelector of excludeSelectors) {
          if (
            target.matches(excludeSelector) ||
            target.closest(excludeSelector)
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * 记录性能数据
   */
  private recordPerformance(operation: string, duration: number): void {
    if (!this.performanceData.has(operation)) {
      this.performanceData.set(operation, []);
    }

    const data = this.performanceData.get(operation)!;
    data.push(duration);

    // 保持最近100条记录
    if (data.length > 100) {
      data.shift();
    }
  }

  /**
   * 获取性能统计
   */
  public getPerformanceStats(): Record<
    string,
    { avg: number; min: number; max: number }
  > {
    const stats: Record<string, { avg: number; min: number; max: number }> = {};

    for (const [operation, data] of this.performanceData) {
      if (data.length > 0) {
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        const min = Math.min(...data);
        const max = Math.max(...data);
        stats[operation] = { avg, min, max };
      }
    }

    return stats;
  }

  /**
   * 调试日志
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`🎹 KeyboardManager: ${message}`, ...args);
    }
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.stopListening();
    this.handlers.clear();
    this.performanceData.clear();
    this.log("KeyboardEventManager destroyed");
  }
}

// ======================== 默认处理器工厂 ========================

/**
 * 创建Tiptap编辑器处理器
 */
export function createTiptapKeyboardHandler(): KeyboardEventHandler {
  return {
    id: "tiptap-editor",
    name: "Tiptap Editor Handler",
    priority: 100,
    context: {
      type: "editor",
    },
    handler: (_event: KeyboardEvent) => {
      // Tiptap编辑器内的键盘事件让编辑器自己处理
      return false;
    },
    description: "Handles keyboard events within Tiptap editor context",
  };
}

/**
 * 创建画布快捷键处理器
 */
export function createCanvasKeyboardHandler(handlers: {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onCreateNote?: () => void;
  onClearSelection?: () => void;
}): KeyboardEventHandler {
  return {
    id: "canvas-shortcuts",
    name: "Canvas Shortcuts",
    priority: 50,
    context: {
      type: "global",
    },
    handler: (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "+":
          case "=":
            handlers.onZoomIn?.();
            return true;
          case "-":
            handlers.onZoomOut?.();
            return true;
          case "0":
            handlers.onResetZoom?.();
            return true;
          case "n":
            handlers.onCreateNote?.();
            return true;
        }
      }

      switch (event.key) {
        case "Escape":
          handlers.onClearSelection?.();
          return true;
      }

      return false;
    },
    description: "Handles global canvas shortcuts",
  };
}

/**
 * 创建应用级快捷键处理器
 */
export function createAppKeyboardHandler(handlers: {
  onToggleDragMode?: () => void;
  onOpenSettings?: () => void;
}): KeyboardEventHandler {
  return {
    id: "app-shortcuts",
    name: "App Shortcuts",
    priority: 30,
    context: {
      type: "global",
    },
    handler: (event: KeyboardEvent) => {
      // 不与修饰键组合的按键
      if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        switch (event.key) {
          case "d":
          case "D":
            handlers.onToggleDragMode?.();
            return true;
        }
      }

      return false;
    },
    description: "Handles global app shortcuts",
  };
}

// ======================== 全局单例 ========================

let globalKeyboardManager: KeyboardEventManager | null = null;

/**
 * 获取全局键盘事件管理器
 */
export function getGlobalKeyboardManager(
  config?: KeyboardManagerConfig
): KeyboardEventManager {
  if (!globalKeyboardManager) {
    globalKeyboardManager = new KeyboardEventManager(config);
  }
  return globalKeyboardManager;
}

/**
 * 销毁全局键盘事件管理器
 */
export function destroyGlobalKeyboardManager(): void {
  if (globalKeyboardManager) {
    globalKeyboardManager.destroy();
    globalKeyboardManager = null;
  }
}
