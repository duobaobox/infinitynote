/**
 * 专注模式文件树组件
 * 使用 Ant Design Menu 组件重构，实现清晰的画布-便签两级导航结构
 */

import { memo, useMemo, useState, useEffect } from "react";
import { FolderOpenOutlined, FileTextOutlined, SearchOutlined, MoreOutlined } from "@ant-design/icons";
import { Menu, Dropdown, Button } from "antd";
import type { MenuProps } from "antd";
import type { Note } from "../../types";
import type { NoteTreeProps } from "./types";
import styles from "./NoteTree.module.css";

export const NoteTree = memo<NoteTreeProps>(
  ({ 
    notes, 
    canvases, 
    activeNoteId, 
    activeCanvasId,
    searchKeyword, 
    onNoteClick, 
    onCanvasClick, 
    onSearchChange 
  }) => {
    // 根据搜索关键字过滤便签
    const filteredNotes = useMemo(() => {
      if (!searchKeyword.trim()) return notes;

      const keyword = searchKeyword.toLowerCase();
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
      );
    }, [notes, searchKeyword]);

    // 构建菜单结构：画布为子菜单，便签为菜单项
    const menuItems = useMemo(() => {
      // 将所有便签按画布ID分组
      const notesByCanvas: Record<string, Note[]> = {};
      filteredNotes.forEach(note => {
        if (!notesByCanvas[note.canvasId]) {
          notesByCanvas[note.canvasId] = [];
        }
        notesByCanvas[note.canvasId].push(note);
      });

      // 构建菜单项
      return canvases.map(canvas => {
        // 获取属于当前画布的便签
        const canvasNotes = notesByCanvas[canvas.id] || [];
        
        // 按创建时间排序便签（在专注模式中不按更新时间排序）
        const sortedNotes = [...canvasNotes].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // 创建子菜单项（便签）
        const children = sortedNotes.map(note => {
          // 便签右侧的操作菜单
          const noteMenuItems: MenuProps['items'] = [
            {
              key: 'edit',
              label: '编辑',
            },
            {
              key: 'duplicate',
              label: '复制',
            },
            {
              key: 'delete',
              label: '删除',
              danger: true,
            },
          ];

          const handleNoteMenuClick: MenuProps['onClick'] = (e) => {
            console.log('Note menu click', e.key, note.id);
            // 这里可以处理便签的右键菜单操作
          };

          return {
            key: note.id,
            label: (
              <div className={styles.noteItem}>
                <span 
                  className={styles.noteTitle} 
                  title={note.title || "无标题"}
                >
                  {note.title || "无标题"}
                </span>
                <Dropdown
                  menu={{ items: noteMenuItems, onClick: handleNoteMenuClick }}
                  placement="bottomRight"
                  trigger={['contextMenu']} // 右键点击触发
                >
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<MoreOutlined />}
                    className={styles.noteActions}
                    onClick={(e) => e.preventDefault()} // 防止菜单项点击事件冒泡
                  />
                </Dropdown>
              </div>
            ),
            icon: <FileTextOutlined style={{ color: note.color }} />,
          };
        });

        // 画布右侧的操作菜单
        const canvasMenuItems: MenuProps['items'] = [
          {
            key: 'rename',
            label: '重命名',
          },
          {
            key: 'add-note',
            label: '添加便签',
          },
          {
            key: 'export',
            label: '导出',
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
          },
        ];

        const handleCanvasMenuClick: MenuProps['onClick'] = (e) => {
          console.log('Canvas menu click', e.key, canvas.id);
          // 这里可以处理画布的右键菜单操作
        };

        // 返回画布菜单项（可展开的子菜单）
        return {
          key: `canvas-${canvas.id}`,
          label: (
            <div className={styles.canvasItem}>
              <span 
                className={styles.canvasTitle} 
                title={canvas.name}
              >
                {canvas.name}
              </span>
              <Dropdown
                menu={{ items: canvasMenuItems, onClick: handleCanvasMenuClick }}
                placement="bottomRight"
                trigger={['contextMenu']} // 右键点击触发
              >
                <Button 
                  type="text" 
                  size="small" 
                  icon={<MoreOutlined />}
                  className={styles.canvasActions}
                  onClick={(e) => e.preventDefault()} // 防止菜单项点击事件冒泡
                />
              </Dropdown>
            </div>
          ),
          icon: <FolderOpenOutlined style={{ color: '#1890ff' }} />,
          children: children.length > 0 ? children : undefined, // 如果没有子项则设置为 undefined
        };
      });
    }, [canvases, filteredNotes]);

    // 处理菜单展开/收起
    const [openKeys, setOpenKeys] = useState<string[]>(() => {
      // 初始化时根据活动项设置展开的键
      if (activeNoteId) {
        const note = notes.find(note => note.id === activeNoteId);
        if (note) {
          return [`canvas-${note.canvasId}`];
        }
      }
      if (activeCanvasId) {
        return [`canvas-${activeCanvasId}`];
      }
      return [];
    });

    // 监听活动项变化，更新展开状态
    useEffect(() => {
      if (activeNoteId) {
        const note = notes.find(note => note.id === activeNoteId);
        if (note) {
          setOpenKeys(prev => [...new Set([...prev, `canvas-${note.canvasId}`])]);
        }
      } else if (activeCanvasId) {
        setOpenKeys(prev => [...new Set([...prev, `canvas-${activeCanvasId}`])]);
      }
    }, [activeNoteId, activeCanvasId, notes]);

    // 处理菜单点击事件
    const handleMenuClick: MenuProps['onClick'] = (e) => {
      if (e.key.startsWith('canvas-')) {
        // 点击的是画布菜单项
        const canvasId = e.key.replace('canvas-', '');
        onCanvasClick?.(canvasId);
      } else {
        // 点击的是便签菜单项
        onNoteClick(e.key as string);
      }
    };

    // 处理展开/收起事件
    const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
      // 过滤出画布相关的键（以 'canvas-' 开头的）
      const canvasKeys = keys.filter(key => key.startsWith('canvas-'));
      setOpenKeys(canvasKeys);
    };

    return (
      <div className={styles.noteTree}>
        {/* 搜索框和操作栏 */}
        <div className={styles.searchContainer}>
          <div className={styles.searchBoxWrapper}>
            <SearchOutlined className={styles.searchIcon} />
            <input
              type="text"
              className={`${styles.searchBox} focus-mode-search-input`}
              placeholder="搜索画布或便签... (Ctrl+F)"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          

        </div>

        {/* 菜单结构 */}
        <div className={styles.menuContainer}>
          {menuItems.length > 0 ? (
            <Menu
              className={styles.menu}
              mode="inline"
              openKeys={openKeys}
              selectedKeys={activeNoteId ? [activeNoteId] : activeCanvasId ? [`canvas-${activeCanvasId}`] : []}
              onClick={handleMenuClick}
              onOpenChange={handleOpenChange}
              items={menuItems}
              inlineIndent={20} // 设置子菜单缩进
            />
          ) : (
            <div className={styles.emptyState}>
              <FileTextOutlined className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>
                {searchKeyword ? "未找到匹配的项目" : "还没有画布或便签"}
              </div>
              <div className={styles.emptyDescription}>
                {searchKeyword
                  ? "尝试调整搜索关键字"
                  : "创建画布和便签开始组织内容"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

NoteTree.displayName = "NoteTree";