/**
 * 专注模式便签树组件
 * 提供类似思源笔记的树形结构，显示画布和便签的层级关系
 */

import { memo, useMemo } from "react";
import { FolderOpenOutlined, FileTextOutlined } from "@ant-design/icons";
import { Tree } from "antd";
import type { Note } from "../../types";
import type { NoteTreeProps } from "./types";
import styles from "./NoteTree.module.css";

export interface NoteTreeItem {
  key: string;
  title: React.ReactNode;
  icon: React.ReactNode;
  children?: NoteTreeItem[];
  isLeaf?: boolean;
  type: 'canvas' | 'note';
  id?: string;
}

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

    // 构建树形数据结构
    const treeData = useMemo(() => {
      // 首先将过滤后的便签按画布ID分组
      const notesByCanvas: Record<string, Note[]> = {};
      filteredNotes.forEach(note => {
        if (!notesByCanvas[note.canvasId]) {
          notesByCanvas[note.canvasId] = [];
        }
        notesByCanvas[note.canvasId].push(note);
      });

      // 创建树节点
      const treeNodes: NoteTreeItem[] = canvases.map(canvas => {
        // 获取属于当前画布的便签
        const canvasNotes = notesByCanvas[canvas.id] || [];
        
        // 排序：按更新时间倒序
        const sortedCanvasNotes = [...canvasNotes].sort(
          (a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // 创建画布节点的子节点（便签）
        const children: NoteTreeItem[] = sortedCanvasNotes.map(note => ({
          key: note.id,
          title: (
            <span 
              className={styles.noteTitle} 
              title={note.title || "无标题"}
            >
              {note.title || "无标题"}
            </span>
          ),
          icon: <FileTextOutlined style={{ color: note.color }} />,
          isLeaf: true,
          type: 'note',
          id: note.id,
        }));

        return {
          key: `canvas-${canvas.id}`,
          title: (
            <span 
              className={styles.canvasTitle} 
              title={canvas.name}
            >
              {canvas.name}
            </span>
          ),
          icon: <FolderOpenOutlined style={{ color: '#1890ff' }} />,
          children: children.length > 0 ? children : undefined,
          type: 'canvas',
          id: canvas.id,
        };
      });

      // 按画布名称排序
      return treeNodes.sort((a, b) => {
        const titleA = typeof a.title === 'string' ? a.title : '画布';
        const titleB = typeof b.title === 'string' ? b.title : '画布';
        return titleA.localeCompare(titleB);
      });
    }, [canvases, filteredNotes]);

    // 处理树节点点击事件
    const handleTreeSelect = (selectedKeys: React.Key[]) => {
      const key = selectedKeys[0] as string;
      
      if (key.startsWith('canvas-')) {
        // 点击的是画布节点
        const canvasId = key.replace('canvas-', '');
        onCanvasClick?.(canvasId);
      } else {
        // 点击的是便签节点
        onNoteClick(key as string);
      }
    };

    // 获取当前激活的节点路径
    const selectedKeys = useMemo(() => {
      if (activeNoteId) {
        return [activeNoteId];
      }
      if (activeCanvasId) {
        return [`canvas-${activeCanvasId}`];
      }
      return [];
    }, [activeNoteId, activeCanvasId]);

    return (
      <div className={styles.noteTree}>
        {/* 搜索框 */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={`${styles.searchBox} focus-mode-search-input`}
            placeholder="搜索画布或便签... (Ctrl+F)"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* 树形结构 */}
        <div className={styles.treeContainer}>
          {treeData.length > 0 ? (
            <Tree
              className={styles.tree}
              showIcon
              showLine
              defaultExpandAll
              selectedKeys={selectedKeys}
              onSelect={handleTreeSelect}
              treeData={treeData}
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