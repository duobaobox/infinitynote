/**
 * SettingsModal - 应用设置管理主组件
 *
 * 功能说明：
 * 这是一个完整的设置管理模态框，提供应用程序的所有配置选项管理功能。
 * 采用左侧导航菜单 + 右侧内容区域的布局设计，支持7个设置模块。
 *
 * 核心功能：
 * - 🎛️ 设置数据的实时加载、保存和同步
 * - 📁 设置的导入导出和备份恢复
 * - 🎨 多模块选项卡式界面，支持响应式设计
 * - 🔄 自动触发设置变更事件，通知其他组件
 * - 💾 本地存储集成，数据持久化
 *
 * 设置模块：
 * - 🤖 模型服务：API配置、密钥管理、模型选择
 * - ⚙️ 常规设置：自动保存、会话恢复、语言设置
 * - 🎨 显示设置：主题切换、界面布局、网格显示
 * - 💾 数据管理：导入导出、存储统计、数据清理
 * - ⌨️ 快捷键：编辑和视图快捷键展示
 * - ☁️ 云同步：云端数据同步（开发中）
 * - ℹ️ 关于我们：应用信息、更新检查、测试面板
 *
 * 技术特性：
 * - TypeScript 类型安全
 * - CSS Modules 样式隔离
 * - Ant Design 组件库
 * - 事件驱动的状态管理
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import React, { useState, useEffect } from "react";
import { Modal, Menu, message } from "antd";
import type {
  SettingsModalProps,
  SettingTabKey,
  SettingsConfig,
} from "./types";
import { MENU_ITEMS, EDIT_SHORTCUTS, VIEW_SHORTCUTS } from "./constants";
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
  calculateStorageUsage,
  getDefaultSettings,
} from "./utils";
import {
  clearAllData,
  exportAllData,
  handleFileImport,
  importAllData,
} from "../../utils/export";
import {
  ModelSettingsTab,
  GeneralSettingsTab,
  DisplaySettingsTab,
  DataSettingsTab,
  ShortcutsSettingsTab,
  CloudSettingsTab,
  AboutSettingsTab,
} from "./tabs";
import styles from "./index.module.css";

/**
 * 设置模态框组件
 *
 * @param props - 组件属性
 * @param props.open - 模态框是否可见
 * @param props.onClose - 关闭模态框的回调函数
 * @returns 设置模态框组件
 */
const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  // 当前选中的设置选项卡
  const [selectedKey, setSelectedKey] = useState<SettingTabKey>("model");

  // 设置配置状态
  const [settings, setSettings] = useState<SettingsConfig>(
    getDefaultSettings()
  );

  /**
   * 模态框打开时加载设置数据和存储统计信息
   */
  useEffect(() => {
    if (open) {
      // 从本地存储加载设置
      const loadedSettings = loadSettingsFromStorage();

      // 异步加载数据库统计信息
      const updateStorageStats = async () => {
        try {
          const { dbOperations } = await import("../../utils/db");
          const stats = await dbOperations.getStats();

          // 格式化存储大小
          const formatBytes = (bytes: number): string => {
            if (bytes === 0) return "0 B";
            const k = 1024;
            const sizes = ["B", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return (
              parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
            );
          };

          // 更新设置状态，包含最新的存储统计
          setSettings({
            ...loadedSettings,
            data: {
              ...loadedSettings.data,
              storageUsed: formatBytes(stats.databaseSize),
              noteCount: stats.totalNotes,
              canvasCount: stats.totalCanvases,
              lastBackupTime: stats.lastModified || undefined,
            },
          });
        } catch (error) {
          console.error("获取存储统计失败:", error);
          // 如果获取数据库统计失败，使用原有的计算方法作为备用
          const storageInfo = calculateStorageUsage();
          setSettings({
            ...loadedSettings,
            data: {
              ...loadedSettings.data,
              storageUsed: storageInfo.used,
              noteCount: storageInfo.noteCount,
            },
          });
        }
      };

      updateStorageStats();
    }
  }, [open]);

  const handleSettingChange = <K extends keyof SettingsConfig>(
    section: K,
    key: keyof SettingsConfig[K],
    value: any
  ) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    };
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);

    // 触发自定义事件，通知其他组件设置已更新
    window.dispatchEvent(
      new CustomEvent("settingsChanged", {
        detail: { section, key, value, settings: newSettings },
      })
    );
  };

  const handleExportData = async () => {
    try {
      // 使用新的完整数据导出功能
      await exportAllData();
      message.success("所有数据导出成功");
    } catch (error) {
      console.error("导出失败:", error);
      message.error("导出失败，请重试");
    }
  };

  const handleImportData = async () => {
    try {
      // 使用新的完整数据导入功能
      const file = await handleFileImport();

      // 显示确认对话框
      const userConfirmed = window.confirm(
        "确认导入数据\n\n导入数据将覆盖当前所有数据（包括笔记、画布和设置），此操作不可恢复。确定要继续吗？"
      );

      if (userConfirmed) {
        const loadingMessage = message.loading("正在导入数据，请稍候...", 0);
        try {
          await importAllData(file);
          loadingMessage();
          message.success("数据导入成功，页面即将刷新", 2);
          // importAllData 函数内部会自动刷新页面
        } catch (error) {
          loadingMessage();
          console.error("导入失败:", error);
          message.error(
            error instanceof Error ? error.message : "导入失败，请检查文件格式",
            5
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "未选择文件") {
        console.error("导入失败:", error);
        message.error("导入失败，请重试");
      }
    }
  };

  const handleClearData = () => {
    console.log("🔧 handleClearData 被调用");

    // 使用原生确认对话框作为备选方案
    const userConfirmed = window.confirm(
      "确认清除所有数据\n\n此操作将删除所有本地数据（包括笔记、画布和设置）且不可恢复，确定要继续吗？"
    );

    if (userConfirmed) {
      console.log("🔧 用户确认清除数据");

      const executeClear = async () => {
        const loadingMessage = message.loading(
          "正在清除所有数据，请稍候...",
          0
        );
        try {
          console.log("🔧 开始执行清除函数");
          // 使用新的完整数据清除功能
          await clearAllData();
          loadingMessage();
          message.success("所有数据清除成功，页面即将刷新", 2);
          // clearAllData 函数内部会自动刷新页面
        } catch (error) {
          loadingMessage();
          console.error("清除失败:", error);
          message.error(
            `清除失败: ${error instanceof Error ? error.message : "请重试"}`,
            5
          );
        }
      };

      // 立即执行清除操作
      executeClear();
    } else {
      console.log("🔧 用户取消清除操作");
    }
  };

  const handleCheckUpdate = () => {
    message.info("当前已是最新版本");
  };

  const handleOpenTestPanel = () => {
    message.info("测试面板功能开发中");
  };

  const renderContent = () => {
    const editShortcuts = EDIT_SHORTCUTS;
    const viewShortcuts = VIEW_SHORTCUTS;

    switch (selectedKey) {
      case "model":
        return (
          <ModelSettingsTab
            settings={settings.model}
            onSettingChange={(key, value) =>
              handleSettingChange("model", key, value)
            }
          />
        );
      case "general":
        return (
          <GeneralSettingsTab
            settings={settings.general}
            onSettingChange={(key, value) =>
              handleSettingChange("general", key, value)
            }
          />
        );
      case "display":
        return (
          <DisplaySettingsTab
            settings={settings.display}
            onSettingChange={(key, value) =>
              handleSettingChange("display", key, value)
            }
          />
        );
      case "data":
        return (
          <DataSettingsTab
            settings={settings.data}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onClearData={handleClearData}
          />
        );
      case "shortcuts":
        return (
          <ShortcutsSettingsTab
            editShortcuts={editShortcuts}
            viewShortcuts={viewShortcuts}
          />
        );
      case "cloud":
        return <CloudSettingsTab settings={settings.cloud} />;
      case "about":
        return (
          <AboutSettingsTab
            appInfo={settings.app}
            onCheckUpdate={handleCheckUpdate}
            onOpenTestPanel={handleOpenTestPanel}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onClose}
      footer={null}
      width="80vw"
      className={`${styles.settingsModal} settingsModal`}
      destroyOnHidden
      styles={{
        body: { height: "calc(80vh - 55px)", padding: 0 },
        content: { height: "80vh" },
        mask: { backgroundColor: "rgba(0, 0, 0, 0.45)" },
      }}
    >
      <div className={styles.modalContent}>
        <div className={styles.sidebar}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => setSelectedKey(key as SettingTabKey)}
            className={styles.sidebarMenu}
          >
            {MENU_ITEMS.map((item) => (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </div>
        <div className={styles.content}>{renderContent()}</div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
