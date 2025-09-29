/**
 * 专注模式键盘快捷键帮助组件
 */

import { memo } from "react";
import { Modal } from "antd";
import styles from "./KeyboardShortcuts.module.css";

interface KeyboardShortcutsProps {
  visible: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  { key: "Esc", description: "关闭专注模式", category: "基本操作" },
  { key: "Ctrl+F / Cmd+F", description: "聚焦搜索框", category: "基本操作" },
  { key: "↑ / ↓", description: "便签列表导航", category: "便签操作" },
  { key: "Enter", description: "选择便签", category: "便签操作" },
  { key: "Ctrl+N / Cmd+N", description: "新建便签", category: "便签操作" },
  { key: "Ctrl+S / Cmd+S", description: "保存便签", category: "编辑操作" },
  { key: "Ctrl+Z / Cmd+Z", description: "撤销", category: "编辑操作" },
  { key: "Ctrl+Y / Cmd+Y", description: "重做", category: "编辑操作" },
];

const KeyboardShortcuts = memo<KeyboardShortcutsProps>(
  ({ visible, onClose }) => {
    const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
      return groups;
    }, {} as Record<string, ShortcutItem[]>);

    return (
      <Modal
        title="键盘快捷键"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={500}
        className={styles.shortcutsModal}
      >
        <div className={styles.shortcutsContainer}>
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category} className={styles.categoryGroup}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              <div className={styles.shortcutsList}>
                {items.map((item, index) => (
                  <div key={index} className={styles.shortcutItem}>
                    <kbd className={styles.shortcutKey}>{item.key}</kbd>
                    <span className={styles.shortcutDescription}>
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.tip}>
          💡 提示：按 <kbd>?</kbd> 随时查看此帮助
        </div>
      </Modal>
    );
  }
);

KeyboardShortcuts.displayName = "KeyboardShortcuts";

export default KeyboardShortcuts;
