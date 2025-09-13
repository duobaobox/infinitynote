/**
 * Store事件通信系统
 * 
 * 用于Store之间的解耦通信，替代直接的全局变量方式
 * 提供类型安全的事件发布订阅机制
 */

// 事件类型定义
export interface StoreEvents {
  // 便签相关事件
  'note:created': { noteId: string; canvasId: string };
  'note:updated': { noteId: string; canvasId: string };
  'note:deleted': { noteId: string; canvasId: string };
  'notes:reload': { canvasId?: string };
  
  // 画布相关事件
  'canvas:created': { canvasId: string };
  'canvas:updated': { canvasId: string };
  'canvas:deleted': { canvasId: string };
  'canvas:switched': { fromCanvasId: string | null; toCanvasId: string };
  'canvases:reload': {};
  
  // 数据同步事件
  'data:sync-required': { type: 'notes' | 'canvases' | 'all' };
  'data:sync-completed': { type: 'notes' | 'canvases' | 'all' };
}

// 事件监听器类型
type EventListener<T = any> = (data: T) => void;

/**
 * 事件总线类
 * 提供发布订阅功能，支持类型安全的事件通信
 */
class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * 订阅事件
   * @param event 事件名称
   * @param listener 事件监听器
   * @returns 取消订阅的函数
   */
  on<K extends keyof StoreEvents>(
    event: K,
    listener: EventListener<StoreEvents[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(listener);
    
    // 返回取消订阅函数
    return () => {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<K extends keyof StoreEvents>(event: K, data: StoreEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ Store事件处理失败 [${event}]:`, error);
        }
      });
    }
  }

  /**
   * 一次性订阅事件
   * @param event 事件名称
   * @param listener 事件监听器
   */
  once<K extends keyof StoreEvents>(
    event: K,
    listener: EventListener<StoreEvents[K]>
  ): void {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      listener(data);
    });
  }

  /**
   * 移除所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取事件监听器数量（用于调试）
   */
  getListenerCount(event?: keyof StoreEvents): number {
    if (event) {
      return this.listeners.get(event)?.size || 0;
    }
    return Array.from(this.listeners.values()).reduce(
      (total, listeners) => total + listeners.size,
      0
    );
  }
}

// 全局事件总线实例
export const storeEventBus = new EventBus();

/**
 * React Hook：订阅Store事件
 * @param event 事件名称
 * @param listener 事件监听器
 * @param deps 依赖数组
 */
import { useEffect } from 'react';

export function useStoreEvent<K extends keyof StoreEvents>(
  event: K,
  listener: EventListener<StoreEvents[K]>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = storeEventBus.on(event, listener);
    return unsubscribe;
  }, deps);
}

/**
 * 便签Store事件辅助函数
 */
export const noteStoreEvents = {
  // 通知便签创建
  notifyNoteCreated: (noteId: string, canvasId: string) => {
    storeEventBus.emit('note:created', { noteId, canvasId });
  },
  
  // 通知便签更新
  notifyNoteUpdated: (noteId: string, canvasId: string) => {
    storeEventBus.emit('note:updated', { noteId, canvasId });
  },
  
  // 通知便签删除
  notifyNoteDeleted: (noteId: string, canvasId: string) => {
    storeEventBus.emit('note:deleted', { noteId, canvasId });
  },
  
  // 请求重新加载便签
  requestNotesReload: (canvasId?: string) => {
    storeEventBus.emit('notes:reload', { canvasId });
  },
};

/**
 * 画布Store事件辅助函数
 */
export const canvasStoreEvents = {
  // 通知画布创建
  notifyCanvasCreated: (canvasId: string) => {
    storeEventBus.emit('canvas:created', { canvasId });
  },
  
  // 通知画布更新
  notifyCanvasUpdated: (canvasId: string) => {
    storeEventBus.emit('canvas:updated', { canvasId });
  },
  
  // 通知画布删除
  notifyCanvasDeleted: (canvasId: string) => {
    storeEventBus.emit('canvas:deleted', { canvasId });
  },
  
  // 通知画布切换
  notifyCanvasSwitched: (fromCanvasId: string | null, toCanvasId: string) => {
    storeEventBus.emit('canvas:switched', { fromCanvasId, toCanvasId });
  },
  
  // 请求重新加载画布
  requestCanvasesReload: () => {
    storeEventBus.emit('canvases:reload', {});
  },
};

/**
 * 数据同步事件辅助函数
 */
export const dataSyncEvents = {
  // 请求数据同步
  requestSync: (type: 'notes' | 'canvases' | 'all') => {
    storeEventBus.emit('data:sync-required', { type });
  },
  
  // 通知同步完成
  notifySyncCompleted: (type: 'notes' | 'canvases' | 'all') => {
    storeEventBus.emit('data:sync-completed', { type });
  },
};
