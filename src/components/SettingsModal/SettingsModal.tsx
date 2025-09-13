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
  downloadSettingsFile,
  readSettingsFromFile,
  importSettings,
  calculateStorageUsage,
  getDefaultSettings,
} from "./utils";
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

      // 计算当前存储使用情况
      const storageInfo = calculateStorageUsage();

      // 更新设置状态，包含最新的存储统计
      setSettings({
        ...loadedSettings,
        data: {
          ...loadedSettings.data,
          storageUsed: storageInfo.used,
          noteCount: storageInfo.noteCount,
        },
      });
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

  const handleExportData = () => {
    try {
      downloadSettingsFile(settings);
      message.success("设置数据导出成功");
    } catch {
      message.error("导出失败，请重试");
    }
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const exportData = await readSettingsFromFile(file);
        const newSettings = importSettings(exportData, settings);
        setSettings(newSettings);
        saveSettingsToStorage(newSettings);
        message.success("设置数据导入成功");
      } catch {
        message.error("导入失败，请检查文件格式");
      }
    };

    input.click();
  };

  const handleClearData = () => {
    Modal.confirm({
      title: "确认清除所有数据",
      content: "此操作将删除所有本地数据且不可恢复，确定要继续吗？",
      okText: "确认",
      cancelText: "取消",
      okType: "danger",
      onOk: () => {
        try {
          localStorage.clear();
          const defaultSettings = getDefaultSettings();
          setSettings(defaultSettings);
          message.success("数据清除成功");
        } catch {
          message.error("清除失败，请重试");
        }
      },
    });
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
