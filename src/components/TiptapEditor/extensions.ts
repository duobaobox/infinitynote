/**
 * @deprecated 请使用 ./extensions/index.ts 中的 ExtensionManager
 * 这个文件保留用于向后兼容，建议迁移到新的扩展管理系统
 */

// 重新导出新的扩展管理器
export { ExtensionManager, defaultExtensionManager } from "./extensions/index";
