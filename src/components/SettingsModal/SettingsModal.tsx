/**
 * 设置模态框主组件
 *
 * 功能特性:
 * - 🎛️ 7个功能完整的设置选项卡
 * - 💾 自动本地存储和数据持久化
 * - 📥📤 完整的设置导入导出功能
 * - 🎨 响应式设计和主题支持
 * - 🔧 模块化架构便于扩展
 *
 * @author InfinityNote Team
 * @version 1.0.0
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
    value: SettingsConfig[K][keyof SettingsConfig[K]]
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
