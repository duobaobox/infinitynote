/**
 * SettingsModal 组件统一导出入口
 *
 * 功能说明：
 * - 导出 SettingsModal 主组件
 * - 导出所有相关的 TypeScript 类型定义
 * - 导出配置常量和工具函数
 * - 导出所有设置选项卡子组件
 *
 * 使用方式：
 * import SettingsModal, { loadSettingsFromStorage, SettingsConfig } from '@/components/SettingsModal'
 *
 * @author InfinityNote Team
 * @since v1.5.7
 */

export { default } from "./SettingsModal";
export type * from "./types";
export * from "./constants";
export * from "./utils";
export * from "./tabs";
