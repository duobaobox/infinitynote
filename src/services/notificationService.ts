/**
 * 通知服务
 *
 * 提供一个桥接层，让非 React 组件（如 Zustand store）也能使用 Ant Design 的通知功能
 * 避免直接使用静态方法导致的上下文警告
 */

import type { NotificationInstance } from "antd/es/notification/interface";
import type { MessageInstance } from "antd/es/message/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";

interface NotificationServiceAPI {
  notification: NotificationInstance | null;
  message: MessageInstance | null;
  modal: Omit<ModalStaticFunctions, "warn"> | null;
}

class NotificationService {
  private api: NotificationServiceAPI = {
    notification: null,
    message: null,
    modal: null,
  };

  /**
   * 初始化通知 API（由 React 组件调用）
   */
  initialize(api: NotificationServiceAPI) {
    this.api = api;
  }

  /**
   * 显示成功通知
   */
  success(config: {
    message: string;
    description?: string;
    duration?: number;
  }) {
    if (this.api.notification) {
      this.api.notification.success({
        ...config,
        placement: "topRight",
      });
    } else {
      console.warn("通知服务未初始化", config);
    }
  }

  /**
   * 显示错误通知
   */
  error(config: { message: string; description?: string; duration?: number }) {
    if (this.api.notification) {
      this.api.notification.error({
        ...config,
        placement: "topRight",
      });
    } else {
      console.error("通知服务未初始化", config);
    }
  }

  /**
   * 显示警告通知
   */
  warning(config: {
    message: string;
    description?: string;
    duration?: number;
  }) {
    if (this.api.notification) {
      this.api.notification.warning({
        ...config,
        placement: "topRight",
      });
    } else {
      console.warn("通知服务未初始化", config);
    }
  }

  /**
   * 显示信息通知
   */
  info(config: { message: string; description?: string; duration?: number }) {
    if (this.api.notification) {
      this.api.notification.info({
        ...config,
        placement: "topRight",
      });
    } else {
      console.info("通知服务未初始化", config);
    }
  }

  /**
   * 显示简短消息
   */
  showMessage(
    type: "success" | "error" | "warning" | "info",
    content: string,
    duration = 3
  ) {
    if (this.api.message) {
      this.api.message[type](content, duration);
    } else {
      console.warn("消息服务未初始化", { type, content });
    }
  }
}

// 导出单例
export const notificationService = new NotificationService();
