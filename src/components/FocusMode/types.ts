/**
 * 专注模式组件类型定义
 */

export interface FocusModeProps {
  /** 是否显示专注模式 */
  visible: boolean;
  /** 当前编辑的便签ID */
  activeNoteId?: string;
  /** 关闭专注模式回调 */
  onClose: () => void;
  /** 切换便签回调 */
  onNoteChange: (noteId: string) => void;
}

export interface NoteListProps {
  /** 当前激活的便签ID */
  activeNoteId?: string;
  /** 点击便签回调 */
  onNoteClick: (noteId: string) => void;
  /** 搜索关键字 */
  searchKeyword?: string;
  /** 搜索关键字变化回调 */
  onSearchChange: (keyword: string) => void;
}

export interface FocusEditorProps {
  /** 当前编辑的便签ID */
  noteId?: string;
  /** 便签内容变化回调 */
  onContentChange: (noteId: string, content: string) => void;
  /** 便签标题变化回调 */
  onTitleChange: (noteId: string, title: string) => void;
}

export interface NoteListItemProps {
  /** 便签ID */
  noteId: string;
  /** 便签标题 */
  title: string;
  /** 便签内容预览 */
  contentPreview: string;
  /** 便签颜色 */
  color: string;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否激活状态 */
  isActive: boolean;
  /** 点击回调 */
  onClick: () => void;
}
