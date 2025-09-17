/**
 * ShortcutsSettingsTab - 快捷键设置选项卡组件
 *
 * 功能说明：
 * 展示应用程序的所有快捷键配置，包括编辑操作和视图操作的快捷键。
 * 当前版本主要用于快捷键的查看和参考，未来将支持自定义快捷键功能。
 *
 * 主要功能：
 *
 * ⌨️ 快捷键展示：
 * - 📝 编辑快捷键：文本编辑、格式化、撤销重做等操作快捷键
 * - 👁️ 视图快捷键：缩放、导航、界面切换等视图操作快捷键
 * - 🔍 快捷键搜索：快速查找特定功能的快捷键（规划中）
 *
 * 📋 快捷键分类：
 * - 编辑操作：复制、粘贴、撤销、重做、格式化等
 * - 视图操作：缩放、平移、全屏、侧边栏切换等
 * - 系统操作：保存、打开、设置、帮助等
 *
 * 未来功能（开发中）：
 * - ✏️ 自定义快捷键：允许用户修改快捷键组合
 * - 🔄 快捷键冲突检测：避免快捷键重复定义
 * - 📤 快捷键导入导出：分享和备份快捷键配置
 * - 🎯 快捷键提示：在界面上显示相关快捷键提示
 *
 * @author InfinityNote Team
 * @since v1.5.7
 * @lastModified 2024-12-13
 */

import React from "react";
import { Typography, Card } from "antd";
import type { ShortcutConfig } from "../types";
import styles from "../index.module.css";

const { Text } = Typography;

export interface ShortcutsSettingsTabProps {
  editShortcuts: ShortcutConfig[];
  viewShortcuts: ShortcutConfig[];
}

const ShortcutsSettingsTab: React.FC<ShortcutsSettingsTabProps> = ({
  editShortcuts,
  viewShortcuts,
}) => {
  return (
    <div className={styles.contentSection}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 编辑快捷键 */}
        <Card size="small" title="编辑快捷键" style={{ flex: "0 0 auto" }}>
          <div className={styles.shortcutList}>
            {editShortcuts.map((shortcut) => (
              <div key={shortcut.name} className={styles.shortcutItem}>
                <Text>{shortcut.description}</Text>
                <div className={styles.shortcut}>{shortcut.keys}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 视图快捷键 */}
        <Card size="small" title="视图快捷键" style={{ flex: 1 }}>
          <div className={styles.shortcutList}>
            {viewShortcuts.map((shortcut) => (
              <div key={shortcut.name} className={styles.shortcutItem}>
                <Text>{shortcut.description}</Text>
                <div className={styles.shortcut}>{shortcut.keys}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShortcutsSettingsTab;
