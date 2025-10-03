/**
 * Ant Design 组件动画统一配置
 *
 * 用途：
 * - 统一管理所有 Ant Design 组件的动画配置
 * - 禁用或加快过慢的默认动画效果
 * - 提供一致的用户体验
 *
 * 使用方法：
 * 1. 在 ConfigProvider 中应用全局配置
 * 2. 在单个组件中使用 ...MODAL_CONFIG 等展开运算符应用配置
 *
 * @author InfinityNote Team
 * @since v1.5.7
 */

import type { ModalProps } from "antd";

// ==================== 动画速度配置 ====================

/**
 * 动画模式配置
 * - none: 完全禁用动画（最快，推荐）
 * - fast: 使用快速动画（动画时长 0.15s）
 * - normal: 使用正常动画（动画时长 0.2s，Ant Design 默认）
 */
export type AnimationMode = "none" | "fast" | "normal";

/**
 * 当前动画模式
 * 可以通过修改这个值来切换全局动画模式
 */
export const ANIMATION_MODE: AnimationMode = "none";

/**
 * 动画时长映射
 */
const ANIMATION_DURATION: Record<AnimationMode, number> = {
  none: 0,
  fast: 150,
  normal: 200,
};

/**
 * 获取当前动画时长（毫秒）
 */
export const getAnimationDuration = (mode: AnimationMode = ANIMATION_MODE) =>
  ANIMATION_DURATION[mode];

// ==================== Modal 组件配置 ====================

/**
 * Modal 组件统一配置
 *
 * 功能：
 * - 禁用/加快打开和关闭动画
 * - 禁用/加快遮罩层动画
 * - 统一销毁行为
 * - 统一遮罩样式（半透明 + 模糊效果）
 */
export const MODAL_CONFIG: Partial<ModalProps> = {
  // 动画配置 - 设置为空字符串禁用动画
  transitionName: ANIMATION_MODE === "none" ? "" : "zoom",
  maskTransitionName: ANIMATION_MODE === "none" ? "" : "fade",

  // 关闭时销毁子元素，释放内存
  destroyOnClose: true,

  // 键盘 ESC 关闭
  keyboard: true,

  // 点击遮罩关闭（可根据需要调整）
  maskClosable: true,

  // 统一遮罩样式 - 半透明 + 毛玻璃模糊效果
  styles: {
    mask: {
      backgroundColor: "rgba(0, 0, 0, 0.45)", // 45% 不透明度
      backdropFilter: "blur(8px)", // 8px 高斯模糊
    },
  },
};

/**
 * Modal.confirm / Modal.error 等方法的配置
 * 注意：方法调用使用 maskStyle 而不是 styles.mask
 */
export const MODAL_METHOD_CONFIG = {
  transitionName: ANIMATION_MODE === "none" ? "" : "zoom",
  maskTransitionName: ANIMATION_MODE === "none" ? "" : "fade",
  maskClosable: false, // 确认对话框通常不允许点击遮罩关闭
  keyboard: true,
  // 统一遮罩样式 - 半透明 + 毛玻璃模糊效果
  maskStyle: {
    backgroundColor: "rgba(0, 0, 0, 0.45)", // 45% 不透明度
    backdropFilter: "blur(8px)", // 8px 高斯模糊
  },
};

// ==================== Drawer 组件配置 ====================

/**
 * Drawer 组件统一配置
 * 包含与 Modal 相同的遮罩模糊效果
 */
export const DRAWER_CONFIG = {
  // 动画配置
  rootClassName: ANIMATION_MODE === "none" ? "drawer-no-animation" : "",

  // 关闭时销毁子元素
  destroyOnClose: true,

  // 键盘 ESC 关闭
  keyboard: true,

  // 点击遮罩关闭
  maskClosable: true,

  // 统一遮罩样式 - 半透明 + 毛玻璃模糊效果
  styles: {
    mask: {
      backgroundColor: "rgba(0, 0, 0, 0.45)", // 45% 不透明度
      backdropFilter: "blur(8px)", // 8px 高斯模糊
    },
  },
};

// ==================== Popover 组件配置 ====================

/**
 * Popover 组件统一配置
 */
export const POPOVER_CONFIG = {
  // 动画配置
  transitionName: ANIMATION_MODE === "none" ? "" : "zoom-big",

  // 鼠标移入延迟（毫秒）
  mouseEnterDelay: 0.1,

  // 鼠标移出延迟（毫秒）
  mouseLeaveDelay: 0.1,
};

// ==================== Tooltip 组件配置 ====================

/**
 * Tooltip 组件统一配置
 */
export const TOOLTIP_CONFIG = {
  // 动画配置
  transitionName: ANIMATION_MODE === "none" ? "" : "zoom-big-fast",

  // 鼠标移入延迟（毫秒）
  mouseEnterDelay: 0.1,

  // 鼠标移出延迟（毫秒）
  mouseLeaveDelay: 0,

  // 箭头
  arrow: { pointAtCenter: true },
};

// ==================== Dropdown 组件配置 ====================

/**
 * Dropdown 组件统一配置
 */
export const DROPDOWN_CONFIG = {
  // 动画配置
  transitionName: ANIMATION_MODE === "none" ? "" : "slide-up",

  // 触发方式
  trigger: ["click" as const],
};

// ==================== Message 组件配置 ====================

/**
 * Message 组件统一配置
 * 注意：ConfigProvider 的 message 配置不是这个格式
 * 这个配置用于 message.config() 方法
 */
export const MESSAGE_CONFIG = {
  // 显示时长（秒）
  duration: 2,

  // 最大显示数量
  maxCount: 3,

  // 顶部距离
  top: 24,
};

// ==================== Notification 组件配置 ====================

/**
 * Notification 组件统一配置
 * 注意：ConfigProvider 的 notification 配置不是这个格式
 * 这个配置用于 notification.config() 方法
 */
export const NOTIFICATION_CONFIG = {
  // 显示时长（秒）
  duration: 3,

  // 位置
  placement: "topRight" as const,

  // 顶部距离
  top: 24,

  // 最大显示数量
  maxCount: 5,
};

// ==================== Select 组件配置 ====================

/**
 * Select 组件统一配置
 */
export const SELECT_CONFIG = {
  // 动画配置
  transitionName: ANIMATION_MODE === "none" ? "" : "slide-up",

  // 下拉菜单样式
  dropdownStyle: {
    animation: ANIMATION_MODE === "none" ? "none" : undefined,
  },
};

// ==================== DatePicker 组件配置 ====================

/**
 * DatePicker 组件统一配置
 */
export const DATEPICKER_CONFIG = {
  // 动画配置
  transitionName: ANIMATION_MODE === "none" ? "" : "slide-up",
};

// ==================== ConfigProvider 全局配置 ====================

/**
 * ConfigProvider 组件配置
 * 可以直接传递给 ConfigProvider 的 props
 */
export const CONFIG_PROVIDER_PROPS = {
  // Modal 全局配置
  modal: MODAL_CONFIG,

  // Drawer 全局配置
  drawer: DRAWER_CONFIG,

  // 注意：message 和 notification 需要使用各自的 .config() 方法配置
  // 不能通过 ConfigProvider 传递
};

// ==================== CSS 动画类配置 ====================

/**
 * 如果需要完全禁用动画，可以添加这个 CSS
 * 建议在 global.css 或主题文件中引入
 */
export const NO_ANIMATION_CSS = `
/* Ant Design 组件禁用动画 */
.drawer-no-animation .ant-drawer-content-wrapper {
  transition: none !important;
}

.ant-modal.modal-no-animation {
  animation: none !important;
}

.ant-modal.modal-no-animation .ant-modal-mask {
  animation: none !important;
}

/* 禁用所有 Ant Design 动画（可选，影响范围较大） */
.antd-no-animation * {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
`;

// ==================== 工具函数 ====================

/**
 * 获取快速动画的 CSS transition 样式
 */
export const getFastTransition = (
  properties: string[] = ["all"],
  mode: AnimationMode = ANIMATION_MODE
) => {
  if (mode === "none") return "none";

  const duration = ANIMATION_DURATION[mode];
  return properties
    .map((prop) => `${prop} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`)
    .join(", ");
};

/**
 * 创建自定义动画配置
 *
 * @param mode - 动画模式
 * @returns Modal 配置对象
 */
export const createModalConfig = (
  mode: AnimationMode = ANIMATION_MODE
): Partial<ModalProps> => {
  return {
    transitionName: mode === "none" ? "" : "zoom",
    maskTransitionName: mode === "none" ? "" : "fade",
    destroyOnClose: true,
    keyboard: true,
    maskClosable: true,
    styles: {
      mask: {
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(8px)",
      },
    },
  };
};

// ==================== 导出所有配置 ====================

export default {
  MODAL_CONFIG,
  MODAL_METHOD_CONFIG,
  DRAWER_CONFIG,
  POPOVER_CONFIG,
  TOOLTIP_CONFIG,
  DROPDOWN_CONFIG,
  MESSAGE_CONFIG,
  NOTIFICATION_CONFIG,
  SELECT_CONFIG,
  DATEPICKER_CONFIG,
  CONFIG_PROVIDER_PROPS,
  ANIMATION_MODE,
  getAnimationDuration,
  getFastTransition,
  createModalConfig,
  NO_ANIMATION_CSS,
};
