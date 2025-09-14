/**
 * Tiptap 扩展管理器
 * 提供动态扩展加载和配置管理
 */

import { Extension, Mark, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { ListItem } from "@tiptap/extension-list-item";
import { TextAlign } from "@tiptap/extension-text-align";

// 扩展类型联合
type AnyExtension = Extension<any, any> | Mark<any, any> | Node<any, any>;

// 扩展配置接口
interface ExtensionConfig {
  /** 扩展名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 扩展配置选项 */
  options?: Record<string, any>;
  /** 扩展依赖 */
  dependencies?: string[];
  /** 优先级 */
  priority?: number;
}

// 默认扩展配置
const DEFAULT_EXTENSIONS_CONFIG: ExtensionConfig[] = [
  {
    name: "starterKit",
    enabled: true,
    priority: 1,
    options: {
      // 配置 StarterKit 中的子扩展
      blockquote: {
        HTMLAttributes: {
          class: "tiptap-blockquote",
        },
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
        HTMLAttributes: {
          class: "tiptap-bullet-list",
        },
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
        HTMLAttributes: {
          class: "tiptap-ordered-list",
        },
      },
      listItem: {
        HTMLAttributes: {
          class: "tiptap-list-item",
        },
      },
      codeBlock: {
        HTMLAttributes: {
          class: "tiptap-code-block",
        },
      },
      code: {
        HTMLAttributes: {
          class: "tiptap-code",
        },
      },
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: "tiptap-heading",
        },
      },
      horizontalRule: {
        HTMLAttributes: {
          class: "tiptap-hr",
        },
      },
      paragraph: {
        HTMLAttributes: {
          class: "tiptap-paragraph",
        },
      },
      // 历史记录配置
      undoRedo: {
        depth: 100,
      },
      // 硬换行配置
      hardBreak: {
        keepMarks: false,
        HTMLAttributes: {
          class: "tiptap-hard-break",
        },
      },
      // 拖拽光标
      dropcursor: {
        color: "var(--color-primary, #1677ff)",
        width: 2,
      },
      // 间隙光标
      gapcursor: true,
    },
  },
  {
    name: "textStyle",
    enabled: true,
    priority: 2,
    dependencies: ["starterKit"],
    options: {},
  },
  {
    name: "color",
    enabled: true,
    priority: 3,
    dependencies: ["textStyle"],
    options: {
      types: ["textStyle"],
    },
  },
  {
    name: "textAlign",
    enabled: true,
    priority: 4,
    dependencies: ["starterKit"],
    options: {
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
      defaultAlignment: "left",
    },
  },
];

// 扩展工厂映射
const EXTENSION_FACTORIES: Record<string, (config: ExtensionConfig) => any> = {
  starterKit: (config) => StarterKit.configure(config.options || {}),
  textStyle: (config) => TextStyle.configure(config.options || {}),
  color: (config) =>
    Color.configure({
      types: [TextStyle.name, ListItem.name],
      ...config.options,
    }),
  textAlign: (config) => TextAlign.configure(config.options || {}),
};

/**
 * 扩展管理器类
 */
export class ExtensionManager {
  private configs: ExtensionConfig[];
  private loadedExtensions: Map<string, Extension | Extension[]> = new Map();

  constructor(configs: ExtensionConfig[] = DEFAULT_EXTENSIONS_CONFIG) {
    this.configs = [...configs].sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
  }

  /**
   * 获取所有启用的扩展
   */
  getExtensions(): any[] {
    const extensions: any[] = [];

    for (const config of this.configs) {
      if (!config.enabled) continue;

      try {
        // 检查依赖
        if (config.dependencies) {
          const missingDeps = config.dependencies.filter(
            (dep) => !this.configs.find((c) => c.name === dep && c.enabled)
          );
          if (missingDeps.length > 0) {
            console.warn(
              `Extension ${
                config.name
              } missing dependencies: ${missingDeps.join(", ")}`
            );
            continue;
          }
        }

        // 加载扩展
        const factory = EXTENSION_FACTORIES[config.name];
        if (!factory) {
          console.warn(`Unknown extension: ${config.name}`);
          continue;
        }

        const extension = factory(config);
        this.loadedExtensions.set(config.name, extension);

        if (Array.isArray(extension)) {
          extensions.push(...extension);
        } else {
          extensions.push(extension);
        }
      } catch (error) {
        console.error(`Failed to load extension ${config.name}:`, error);
      }
    }

    return extensions;
  }

  /**
   * 添加扩展配置
   */
  addExtension(config: ExtensionConfig): void {
    const existingIndex = this.configs.findIndex((c) => c.name === config.name);
    if (existingIndex >= 0) {
      this.configs[existingIndex] = config;
    } else {
      this.configs.push(config);
      this.configs.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    }
  }

  /**
   * 移除扩展
   */
  removeExtension(name: string): void {
    this.configs = this.configs.filter((c) => c.name !== name);
    this.loadedExtensions.delete(name);
  }

  /**
   * 启用/禁用扩展
   */
  toggleExtension(name: string, enabled: boolean): void {
    const config = this.configs.find((c) => c.name === name);
    if (config) {
      config.enabled = enabled;
      if (!enabled) {
        this.loadedExtensions.delete(name);
      }
    }
  }

  /**
   * 更新扩展配置
   */
  updateExtensionConfig(name: string, options: Record<string, any>): void {
    const config = this.configs.find((c) => c.name === name);
    if (config) {
      config.options = { ...config.options, ...options };
    }
  }

  /**
   * 获取扩展配置
   */
  getExtensionConfig(name: string): ExtensionConfig | undefined {
    return this.configs.find((c) => c.name === name);
  }

  /**
   * 获取所有配置
   */
  getAllConfigs(): ExtensionConfig[] {
    return [...this.configs];
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.configs = [...DEFAULT_EXTENSIONS_CONFIG];
    this.loadedExtensions.clear();
  }
}

// 默认导出扩展管理器实例
export const defaultExtensionManager = new ExtensionManager();

// 导出扩展相关类型和常量
export type { ExtensionConfig };
export { DEFAULT_EXTENSIONS_CONFIG };
