/**
 * 快捷键设置选项卡
 */

import React from "react";
import { Divider, Typography } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import type { ShortcutConfig } from "../types";
import styles from "../index.module.css";

const { Title, Text } = Typography;

export interface ShortcutsSettingsTabProps {
  editShortcuts: ShortcutConfig[];
  viewShortcuts: ShortcutConfig[];
}

const ShortcutsSettingsTab: React.FC<ShortcutsSettingsTabProps> = ({
  editShortcuts,
  viewShortcuts,
}) => {
  const renderShortcutList = (shortcuts: ShortcutConfig[]) => (
    <div className={styles.shortcutList}>
      {shortcuts.map((shortcut) => (
        <div key={shortcut.name} className={styles.shortcutItem}>
          <Text>{shortcut.description}</Text>
          <div className={styles.shortcut}>{shortcut.keys}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.contentSection}>
      <Title level={3}>
        <KeyOutlined /> 快捷键
      </Title>
      <Divider />

      <div className={styles.settingGroup}>
        <Title level={4}>编辑快捷键</Title>
        {renderShortcutList(editShortcuts)}
      </div>

      <div className={styles.settingGroup}>
        <Title level={4}>视图快捷键</Title>
        {renderShortcutList(viewShortcuts)}
      </div>
    </div>
  );
};

export default ShortcutsSettingsTab;
