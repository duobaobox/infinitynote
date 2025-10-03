/**
 * SettingsModal 选项卡组件统一导出
 *
 * 功能说明：
 * 统一导出所有设置选项卡子组件及其类型定义。每个选项卡负责一个特定的
 * 设置模块，采用统一的接口设计，便于主组件调用和管理。
 *
 * 选项卡组件：
 * - ModelSettingsTab: 🤖 模型服务设置（API配置、密钥管理）
 * - GeneralSettingsTab: ⚙️ 常规设置（自动保存、语言等）
 * - DisplaySettingsTab: 🎨 显示设置（主题、布局等）
 * - DataSettingsTab: 💾 数据管理（导入导出、存储统计）
 * - ShortcutsSettingsTab: ⌨️ 快捷键设置（快捷键展示）
 * - CloudSettingsTab: ☁️ 云同步设置（开发中）
 * - AboutSettingsTab: ℹ️ 关于我们（应用信息、更新检查）
 *
 * 设计原则：
 * - 统一接口：所有选项卡遵循相同的属性接口规范
 * - 独立性：每个选项卡可独立开发和测试
 * - 可复用性：选项卡组件可在其他地方复用
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

export { default as ModelSettingsTab } from "./ModelSettingsTab";
export { default as GeneralSettingsTab } from "./GeneralSettingsTab";
export { default as DisplaySettingsTab } from "./DisplaySettingsTab";
export { default as DataSettingsTab } from "./DataSettingsTab";
export { default as ShortcutsSettingsTab } from "./ShortcutsSettingsTab";
export { default as PromptTemplatesSettingsTab } from "./PromptTemplatesSettingsTab";
export { default as CloudSettingsTab } from "./CloudSettingsTab";
export { default as AboutSettingsTab } from "./AboutSettingsTab";

export type { ModelSettingsTabProps } from "./ModelSettingsTab";
export type { GeneralSettingsTabProps } from "./GeneralSettingsTab";
export type { DisplaySettingsTabProps } from "./DisplaySettingsTab";
export type { DataSettingsTabProps } from "./DataSettingsTab";
export type { ShortcutsSettingsTabProps } from "./ShortcutsSettingsTab";
export type { CloudSettingsTabProps } from "./CloudSettingsTab";
export type { AboutSettingsTabProps } from "./AboutSettingsTab";
