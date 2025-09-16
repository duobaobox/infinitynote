/**
 * 便签工作台组件类型定义
 */

/**
 * 便签工作台组件属性接口
 */
export interface NoteWorkbenchProps {
  /** 输入框的值 */
  value?: string;
  /** 输入框值变化回调 */
  onChange?: (value: string) => void;
  /** 添加便签按钮点击回调 */
  onAddNote?: (prompt?: string) => Promise<void> | void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义占位符文本 */
  placeholder?: string;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** AI生成状态 */
  aiGenerating?: Record<string, boolean>;
  /** AI流式数据 */
  aiStreamingData?: Record<string, string | undefined>;
  /** AI错误信息 */
  aiErrors?: Record<string, string | undefined>;
  /** 是否显示AI生成预览 */
  showAIPreview?: boolean;
}

/**
 * AI生成便签的配置选项
 */
export interface AIGenerateOptions {
  /** 提示词 */
  prompt: string;
  /** 生成的便签数量 */
  count?: number;
  /** 便签颜色 */
  color?: string;
  /** 便签大小 */
  size?: {
    width: number;
    height: number;
  };
  /** 生成位置 */
  position?: {
    x: number;
    y: number;
  };
}

/**
 * 便签创建结果
 */
export interface NoteCreationResult {
  /** 是否成功 */
  success: boolean;
  /** 创建的便签ID列表 */
  noteIds?: string[];
  /** 错误信息 */
  error?: string;
}

/**
 * 工作台状态
 */
export type WorkbenchStatus = "idle" | "loading" | "success" | "error";

/**
 * 工作台事件类型
 */
export interface WorkbenchEvents {
  /** 创建空白便签 */
  onCreateBlankNote?: () => Promise<NoteCreationResult> | NoteCreationResult;
  /** AI生成便签 */
  onGenerateAINote?: (
    options: AIGenerateOptions
  ) => Promise<NoteCreationResult> | NoteCreationResult;
  /** 输入框焦点事件 */
  onInputFocus?: () => void;
  /** 输入框失焦事件 */
  onInputBlur?: () => void;
  /** 快捷键事件 */
  onShortcut?: (key: string) => void;
}
