# InfinityNote2 数据结构详解

## 📋 概述

InfinityNote2 使用 **IndexedDB** 作为本地数据库，通过 **Dexie.js** 进行操作。主要包含两个核心数据表：`notes`（便签）和 `canvases`（画布）。

## 🗃️ 数据库结构

### 数据库名称
- **数据库名**: `InfinityNoteDB`
- **版本**: `1`
- **存储引擎**: IndexedDB (浏览器本地存储)

### 表结构

#### 1. `notes` 表 - 便签数据

```typescript
interface Note {
  // === 核心字段 ===
  id: string;                    // 主键，格式: "note_" + 时间戳 + 随机字符
  title: string;                 // 便签标题
  content: string;               // 便签内容（支持富文本/Markdown）
  color: string;                 // 便签颜色（十六进制色值）
  position: Position;            // 位置坐标 {x: number, y: number}
  size: Size;                    // 尺寸信息 {width: number, height: number}
  zIndex: number;                // 层级索引（用于重叠时的显示顺序）
  canvasId: string;              // 外键，关联画布ID
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 最后更新时间
  
  // === 可选字段（未来功能） ===
  isSelected?: boolean;          // 是否被选中
  tags?: string[];               // 标签列表
  priority?: number;             // 优先级 1-4
  reminderAt?: Date;             // 提醒时间
  isPinned?: boolean;            // 是否置顶
  isArchived?: boolean;          // 是否归档
  isFavorite?: boolean;          // 是否收藏
  contentType?: string;          // 内容类型
  attachments?: NoteAttachment[]; // 附件列表
  links?: NoteLink[];            // 链接列表
  collaborators?: string[];      // 协作者
  permission?: string;           // 权限设置
  templateId?: string;           // 模板ID
  parentNoteId?: string;         // 父便签ID
  childNoteIds?: string[];       // 子便签ID列表
  lastAccessedAt?: Date;         // 最后访问时间
  version?: number;              // 版本号
  isDeleted?: boolean;           // 软删除标记
  deletedAt?: Date;              // 删除时间
  customProperties?: object;     // 自定义属性
}
```

#### 2. `canvases` 表 - 画布数据

```typescript
interface Canvas {
  // === 核心字段 ===
  id: string;                    // 主键，格式: "canvas_" + 时间戳 + 随机字符
  name: string;                  // 画布名称
  scale: number;                 // 缩放比例（默认1.0）
  offset: Position;              // 偏移位置 {x: number, y: number}
  backgroundColor: string;       // 背景颜色（十六进制色值）
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 最后更新时间
  isDefault?: boolean;           // 是否为默认画布（只能有一个）
}
```

## 📊 数据示例

### 便签数据示例

```json
{
  "id": "note_lm2n3o4p5q",
  "title": "项目会议记录",
  "content": "## 今日会议要点\n\n1. 确定项目时间线\n2. 分配任务责任人\n3. 下次会议时间：周五下午2点",
  "color": "#FFF2CC",
  "position": {
    "x": 150,
    "y": 200
  },
  "size": {
    "width": 250,
    "height": 180
  },
  "zIndex": 3,
  "canvasId": "canvas_default",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:15:00.000Z",
  "isSelected": false,
  "tags": ["工作", "会议"],
  "priority": 3,
  "isPinned": true,
  "contentType": "markdown"
}
```

### 画布数据示例

```json
{
  "id": "canvas_default",
  "name": "默认画布",
  "scale": 1.0,
  "offset": {
    "x": 0,
    "y": 0
  },
  "backgroundColor": "#FFFFFF",
  "createdAt": "2024-01-15T09:00:00.000Z",
  "updatedAt": "2024-01-15T15:30:00.000Z",
  "isDefault": true
}
```

## 🔗 数据关系

### 一对多关系
- **Canvas → Notes**: 一个画布可以包含多个便签
- **关联字段**: `Note.canvasId` → `Canvas.id`

### 索引结构
```typescript
// Dexie 数据库定义
class InfinityNoteDB extends Dexie {
  notes!: Table<NoteDB>;
  canvases!: Table<CanvasDB>;

  constructor() {
    super('InfinityNoteDB');
    this.version(1).stores({
      notes: 'id, canvasId, createdAt, updatedAt, zIndex',     // 主键 + 外键 + 时间索引 + 层级索引
      canvases: 'id, isDefault, createdAt, updatedAt'         // 主键 + 默认标记 + 时间索引
    });
  }
}
```

## 🎨 颜色系统

### 预定义便签颜色
```typescript
enum NoteColor {
  YELLOW = "#FFF2CC",    // 黄色（默认）
  PINK = "#FFE6E6",      // 粉色
  BLUE = "#E6F3FF",      // 蓝色
  GREEN = "#E6FFE6",     // 绿色
  PURPLE = "#F0E6FF",    // 紫色
  ORANGE = "#FFE6CC",    // 橙色
  RED = "#FFD6D6",       // 红色
  GRAY = "#F0F0F0"       // 灰色
}
```

## 📐 坐标系统

### 位置坐标 (Position)
- **原点**: 画布左上角 (0, 0)
- **X轴**: 向右为正方向
- **Y轴**: 向下为正方向
- **单位**: 像素 (px)

### 尺寸规范 (Size)
- **最小尺寸**: 100px × 80px
- **默认尺寸**: 200px × 150px
- **最大尺寸**: 800px × 600px

## 🔄 数据流程

### 创建便签流程
1. **生成ID**: `"note_" + Date.now().toString(36) + Math.random().toString(36).substring(2)`
2. **设置默认值**: 颜色、尺寸、位置、层级
3. **数据库写入**: 通过 `dbOperations.addNote()`
4. **内存更新**: 更新 Zustand store
5. **事件通知**: 发送 `note:created` 事件

### 创建画布流程
1. **生成ID**: `"canvas_" + Date.now().toString(36) + Math.random().toString(36).substring(2)`
2. **默认画布**: 使用固定ID `"canvas_default"`
3. **数据库写入**: 通过 `dbOperations.addCanvas()`
4. **内存更新**: 更新 Zustand store
5. **事件通知**: 发送 `canvas:created` 事件

## 🛠️ 数据操作 API

### 便签操作
```typescript
// 创建便签
const noteId = await dbOperations.addNote(noteData);

// 获取便签
const note = await dbOperations.getNoteById(id);
const notes = await dbOperations.getAllNotes();
const canvasNotes = await dbOperations.getNotesByCanvasId(canvasId);

// 更新便签
await dbOperations.updateNote(id, changes);

// 删除便签
await dbOperations.deleteNote(id);
```

### 画布操作
```typescript
// 创建画布
const canvasId = await dbOperations.addCanvas(canvasData);

// 获取画布
const canvas = await dbOperations.getCanvasById(id);
const canvases = await dbOperations.getAllCanvases();

// 更新画布
await dbOperations.updateCanvas(id, changes);

// 删除画布
await dbOperations.deleteCanvas(id);
```

## 🔒 数据完整性

### 约束规则
1. **主键唯一性**: 所有ID必须唯一
2. **外键完整性**: 便签的 `canvasId` 必须存在对应的画布
3. **默认画布唯一性**: 只能有一个 `isDefault: true` 的画布
4. **软删除**: 使用 `isDeleted` 标记，不直接删除数据

### 数据验证
- **ID格式**: 必须以 `"note_"` 或 `"canvas_"` 开头
- **颜色格式**: 必须是有效的十六进制颜色值
- **坐标范围**: 位置和尺寸必须为正数
- **时间格式**: 使用 ISO 8601 格式的 Date 对象

---

**📝 注意**: 这个数据结构设计考虑了未来的功能扩展，包含了许多可选字段。当前版本主要使用核心字段，可选字段为未来功能预留。
