/**
 * HTML 到 Markdown 转换工具
 * 用于多便签汇总时将 HTML 内容转换为干净的 Markdown 格式
 *
 * 核心功能：
 * 1. 移除 ProseMirror 特有的 class 和 style 属性
 * 2. 保留内容结构（标题、列表、粗体等）
 * 3. 优化 AI prompt 的 token 使用效率
 */

import TurndownService from "turndown";

/**
 * 全局 Turndown 实例（单例模式）
 */
let turndownInstance: TurndownService | null = null;

/**
 * 初始化或获取 Turndown 实例
 */
function getTurndownService(): TurndownService {
  if (turndownInstance) {
    return turndownInstance;
  }

  // 创建 Turndown 实例并配置
  turndownInstance = new TurndownService({
    headingStyle: "atx", // 使用 # 风格的标题
    hr: "---", // 水平线
    bulletListMarker: "-", // 无序列表使用 -
    codeBlockStyle: "fenced", // 代码块使用 ```
    fence: "```", // 代码块围栏
    emDelimiter: "*", // 斜体使用 *
    strongDelimiter: "**", // 粗体使用 **
    linkStyle: "inlined", // 链接使用内联样式
    linkReferenceStyle: "full", // 链接引用样式
  });

  console.log("✅ HTML→Markdown 转换器初始化完成");
  return turndownInstance;
}

/**
 * 预处理 HTML：移除 ProseMirror 特有的 class 和 style 属性
 */
function preprocessHTML(html: string): string {
  // 移除 ProseMirror 相关的 class 属性
  html = html.replace(/\s*class="[^"]*ProseMirror[^"]*"/gi, "");
  // 移除所有 class 属性（可选，更激进）
  html = html.replace(/\s*class="[^"]*"/gi, "");
  // 移除所有 style 属性
  html = html.replace(/\s*style="[^"]*"/gi, "");
  // 移除 data-* 属性
  html = html.replace(/\s*data-[a-z-]+="[^"]*"/gi, "");

  return html;
}

/**
 * 将 HTML 转换为 Markdown
 *
 * @param html - 要转换的 HTML 字符串（可能包含 ProseMirror class/style）
 * @returns 干净的 Markdown 字符串
 *
 * @example
 * ```typescript
 * const html = '<p class="ProseMirror-paragraph" style="text-align: left;">Hello <strong>world</strong>!</p>';
 * const markdown = htmlToMarkdown(html);
 * // 结果: "Hello **world**!"
 * ```
 */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    // 预处理：移除 ProseMirror 属性
    const cleanHTML = preprocessHTML(html);

    const turndown = getTurndownService();
    let markdown = turndown.turndown(cleanHTML);

    // 后处理：清理多余空行
    markdown = markdown
      .replace(/\n{3,}/g, "\n\n") // 将 3+ 个连续换行缩减为 2 个
      .trim(); // 移除首尾空白

    return markdown;
  } catch (error) {
    console.error("❌ HTML→Markdown 转换失败:", error);
    console.error("  原始 HTML:", html.substring(0, 200));
    // 降级方案：简单移除所有 HTML 标签
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

/**
 * 批量转换多个 HTML 片段为 Markdown
 *
 * @param htmlList - HTML 字符串数组
 * @returns Markdown 字符串数组
 */
export function htmlToMarkdownBatch(htmlList: string[]): string[] {
  return htmlList.map((html) => htmlToMarkdown(html));
}

/**
 * 转换 Note 内容为 Markdown（针对便签汇总场景优化）
 *
 * @param note - 便签对象
 * @returns 干净的 Markdown 内容
 */
export function convertNoteContentToMarkdown(note: {
  content: string;
}): string {
  // 转换 HTML 为 Markdown
  return htmlToMarkdown(note.content);
}

/**
 * 清理并重置 Turndown 实例（用于内存管理）
 */
export function cleanupTurndownService(): void {
  turndownInstance = null;
  console.log("🧹 HTML→Markdown 转换器已清理");
}

// 导出默认函数
export default htmlToMarkdown;
