/**
 * Tiptap 编辑器工具函数
 */

import { DEFAULT_CONFIG } from "./constants";

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = DEFAULT_CONFIG.DEBOUNCE_DELAY
): (...args: Parameters<T>) => void {
  let timeoutId: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 计算文本统计信息
 */
export function getTextStats(text: string) {
  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.split("\n").length;

  return {
    characterCount,
    wordCount,
    lineCount,
  };
}

/**
 * 清理 HTML 内容
 */
export function cleanHtmlContent(html: string): string {
  if (!html || html === "<p></p>") {
    return "";
  }

  // 移除多余的空段落
  const cleaned = html
    .replace(/<p><\/p>/g, "")
    .replace(/^\s*<p><br><\/p>\s*$/g, "")
    .trim();

  return cleaned;
}

/**
 * 将 HTML 转换为纯文本
 */
export function htmlToText(html: string): string {
  if (!html) return "";

  // 创建临时 DOM 元素来解析 HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // 处理换行
  const text = temp.textContent || temp.innerText || "";
  return text.trim();
}

/**
 * 验证内容长度
 */
export function validateContentLength(
  content: string,
  maxLength: number = DEFAULT_CONFIG.MAX_CHARACTERS
): { isValid: boolean; message?: string } {
  const textContent = htmlToText(content);
  const length = textContent.length;

  if (length > maxLength) {
    return {
      isValid: false,
      message: `内容长度超出限制（${length}/${maxLength}字符）`,
    };
  }

  return { isValid: true };
}

/**
 * 格式化内容用于显示
 */
export function formatContentForDisplay(
  content: string,
  maxLength: number = 100
): string {
  const text = htmlToText(content);

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + "...";
}

/**
 * 检查内容是否为空
 */
export function isContentEmpty(content: string): boolean {
  if (!content) return true;

  const cleanedContent = cleanHtmlContent(content);
  const textContent = htmlToText(cleanedContent);

  return !textContent.trim();
}

/**
 * 生成编辑器的唯一ID
 */
export function generateEditorId(): string {
  return `tiptap-editor-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
}

/**
 * 检查是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * 合并编辑器配置
 */
export function mergeEditorConfig(
  defaultConfig: any,
  userConfig?: Partial<any>
): any {
  if (!userConfig) return defaultConfig;

  return {
    ...defaultConfig,
    ...userConfig,
    // 深度合并嵌套对象
    toolbar: {
      ...defaultConfig.toolbar,
      ...userConfig.toolbar,
    },
    theme: {
      ...defaultConfig.theme,
      ...userConfig.theme,
    },
  };
}
