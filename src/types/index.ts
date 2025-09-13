// 这里用于定义全局 TypeScript 类型

/**
 * 位置坐标接口
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 尺寸接口
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 便签接口
 */
export interface Note {
  /** 唯一标识 */
  id: string;
  /** 便签标题 */
  title: string;
  /** 便签内容 - 支持富文本/Markdown */
  content: string;
  /** 便签颜色 */
  color: string;
  /** 位置信息 */
  position: Position;
  /** 尺寸信息 */
  size: Size;
  /** 层级索引 */
  zIndex: number;
  /** 所属画布ID */
  canvasId: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否被选中 */
  isSelected?: boolean;

  // === 未来功能字段（当前为空，不影响使用） ===

  /** 标签列表 - 便签分类标签 */
  tags?: string[];
  /** 优先级 - 1(低) 2(中) 3(高) 4(紧急) */
  priority?: number;
  /** 提醒时间 - 设置提醒的时间戳 */
  reminderAt?: Date | null;
  /** 是否置顶 - 在列表中置顶显示 */
  isPinned?: boolean;
  /** 是否归档 - 归档的便签不在主界面显示 */
  isArchived?: boolean;
  /** 是否收藏 - 标记为收藏的便签 */
  isFavorite?: boolean;
  /** 内容类型 - 'text' | 'markdown' | 'rich' */
  contentType?: "text" | "markdown" | "rich";
  /** 附件列表 - 图片、文件等附件的引用 */
  attachments?: NoteAttachment[];
  /** 链接列表 - 相关链接 */
  links?: NoteLink[];
  /** 协作者列表 - 多人协作时的用户ID */
  collaborators?: string[];
  /** 权限设置 - 'private' | 'shared' | 'public' */
  permission?: "private" | "shared" | "public";
  /** 模板ID - 如果是从模板创建的便签 */
  templateId?: string | null;
  /** 父便签ID - 支持便签层级关系 */
  parentNoteId?: string | null;
  /** 子便签ID列表 - 子便签引用 */
  childNoteIds?: string[];
  /** 最后访问时间 - 用于最近使用排序 */
  lastAccessedAt?: Date;
  /** 版本号 - 支持版本控制 */
  version?: number;
  /** 是否已删除 - 软删除标记 */
  isDeleted?: boolean;
  /** 删除时间 - 软删除时间，用于回收站功能 */
  deletedAt?: Date | null;
  /** 自定义属性 - 扩展字段，存储JSON格式的自定义数据 */
  customProperties?: Record<string, any>;
}

/**
 * 画布接口
 */
export interface Canvas {
  /** 唯一标识 */
  id: string;
  /** 画布名称 */
  name: string;
  /** 画布缩放比例 */
  scale: number;
  /** 画布偏移位置 */
  offset: Position;
  /** 背景颜色 */
  backgroundColor: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否为默认画布 */
  isDefault?: boolean;
}

/**
 * 拖拽状态接口
 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 拖拽的便签ID */
  draggedNoteId: string | null;
  /** 拖拽开始位置 */
  dragStartPosition: Position | null;
  /** 当前拖拽位置 */
  currentDragPosition: Position | null;
}

/**
 * 画布视口状态接口
 */
export interface CanvasViewport {
  /** 缩放比例 */
  scale: number;
  /** 偏移位置 */
  offset: Position;
  /** 最小缩放比例 */
  minScale: number;
  /** 最大缩放比例 */
  maxScale: number;
}

/**
 * 便签颜色枚举
 */
export enum NoteColor {
  YELLOW = "#FFF2CC",
  PINK = "#FFE6E6",
  BLUE = "#E6F3FF",
  GREEN = "#E6FFE6",
  PURPLE = "#F0E6FF",
  ORANGE = "#FFE6CC",
  RED = "#FFD6D6",
  GRAY = "#F0F0F0",
}

/**
 * 便签附件接口
 */
export interface NoteAttachment {
  /** 附件ID */
  id: string;
  /** 附件名称 */
  name: string;
  /** 附件类型 - 'image' | 'file' | 'audio' | 'video' */
  type: "image" | "file" | "audio" | "video";
  /** 文件大小（字节） */
  size: number;
  /** 文件URL或本地路径 */
  url: string;
  /** 缩略图URL（图片/视频） */
  thumbnailUrl?: string;
  /** 上传时间 */
  uploadedAt: Date;
}

/**
 * 便签链接接口
 */
export interface NoteLink {
  /** 链接ID */
  id: string;
  /** 链接标题 */
  title: string;
  /** 链接URL */
  url: string;
  /** 链接描述 */
  description?: string;
  /** 链接图标URL */
  favicon?: string;
  /** 添加时间 */
  addedAt: Date;
}

/**
 * 便签模板接口
 */
export interface NoteTemplate {
  /** 模板ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description?: string;
  /** 模板内容 */
  content: string;
  /** 模板颜色 */
  color: string;
  /** 模板尺寸 */
  size: Size;
  /** 内容类型 */
  contentType: "text" | "markdown" | "rich";
  /** 是否为系统模板 */
  isSystem?: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 便签优先级枚举
 */
export enum NotePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

/**
 * 便签权限枚举
 */
export enum NotePermission {
  PRIVATE = "private",
  SHARED = "shared",
  PUBLIC = "public",
}

/**
 * 便签内容类型枚举
 */
export enum NoteContentType {
  TEXT = "text",
  MARKDOWN = "markdown",
  RICH = "rich",
}

// 便签尺寸常量
export const NOTE_DEFAULT_SIZE = { width: 200, height: 150 };
export const NOTE_MIN_SIZE = { width: 100, height: 80 };
export const NOTE_MAX_SIZE = { width: 800, height: 600 };
