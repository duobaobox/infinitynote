/**
 * Markdown 到 HTML 转换工具
 * 支持流式转换，处理不完整的 Markdown 输入
 */

/**
 * Markdown 转换器类
 */
class MarkdownConverter {
  /**
   * 流式转换Markdown片段到HTML
   * 支持不完整的Markdown输入
   */
  convertStreamChunk(markdownChunk: string): string {
    try {
      // 处理流式输入中的不完整语法
      const processedChunk = this.preprocessStreamChunk(markdownChunk);
      const html = this.convertToHTML(processedChunk);
      return this.postprocessHTML(html);
    } catch (error) {
      // 转换失败时返回原始文本
      console.warn("Markdown转换失败，使用原始文本:", error);
      return `<p>${this.escapeHtml(markdownChunk).replace(/\n/g, "<br>")}</p>`;
    }
  }

  /**
   * 预处理流式Markdown片段
   * 处理不完整的语法结构
   */
  private preprocessStreamChunk(chunk: string): string {
    let processed = chunk;

    // 1. 修复不完整的列表项
    processed = processed.replace(/^- (.*)(?!$)/gm, "- $1\n");

    // 2. 修复不完整的标题
    processed = processed.replace(/^(#{1,6})\s+(.*)(?!$)/gm, "$1 $2\n\n");

    // 3. 修复不完整的代码块
    const codeBlockCount = (processed.match(/```/g) || []).length;
    if (codeBlockCount % 2 === 1) {
      processed += "\n```"; // 临时关闭代码块
    }

    // 4. 确保段落有适当的换行
    processed = processed.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");

    return processed;
  }

  /**
   * 基础的 Markdown 到 HTML 转换
   * 支持常用的 Markdown 语法
   */
  private convertToHTML(markdown: string): string {
    let html = markdown;

    // 标题转换 (# ## ### ...)
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // 粗体转换 (**text** 或 __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // 斜体转换 (*text* 或 _text_)
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // 内联代码转换 (`code`)
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

    // 代码块转换 (```language ... ```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang || "text"}">${this.escapeHtml(
        code.trim()
      )}</code></pre>`;
    });

    // 链接转换 [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // 无序列表转换
    const listItems = html.match(/^- (.*)$/gm);
    if (listItems) {
      const listContent = listItems
        .map((item) => `<li>${item.replace(/^- /, "")}</li>`)
        .join("\n");
      html = html.replace(/^- .*$/gm, "").replace(/\n+/g, "\n");
      html = `<ul>\n${listContent}\n</ul>\n${html}`;
    }

    // 有序列表转换
    const orderedListItems = html.match(/^\d+\. (.*)$/gm);
    if (orderedListItems) {
      const listContent = orderedListItems
        .map((item) => `<li>${item.replace(/^\d+\. /, "")}</li>`)
        .join("\n");
      html = html.replace(/^\d+\. .*$/gm, "").replace(/\n+/g, "\n");
      html = `<ol>\n${listContent}\n</ol>\n${html}`;
    }

    // 引用转换 (> text)
    html = html.replace(/^> (.*)$/gm, "<blockquote><p>$1</p></blockquote>");

    // 水平线转换 (--- 或 ***)
    html = html.replace(/^---$/gm, "<hr>");
    html = html.replace(/^\*\*\*$/gm, "<hr>");

    // 段落转换（处理换行）
    const paragraphs = html.split(/\n\s*\n/);
    html = paragraphs
      .filter((p) => p.trim())
      .map((p) => {
        const trimmed = p.trim();
        // 如果已经是HTML标签，不用包裹
        if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr)/)) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
      })
      .join("\n");

    return html;
  }

  /**
   * 后处理HTML，使其与TipTap格式兼容
   */
  private postprocessHTML(html: string): string {
    return html
      .replace(/<p><\/p>/g, "<p><br></p>") // 空段落处理
      .replace(/\n\n+/g, "\n") // 移除多余换行
      .trim();
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * 完整转换（用于最终结果）
   */
  convertComplete(markdown: string): string {
    try {
      const html = this.convertToHTML(markdown);
      return this.postprocessHTML(html);
    } catch (error) {
      console.error("完整Markdown转换失败:", error);
      return `<p>${this.escapeHtml(markdown).replace(/\n/g, "<br>")}</p>`;
    }
  }

  /**
   * 检查是否为有效的Markdown内容
   */
  isValidMarkdown(content: string): boolean {
    // 基本检查：包含Markdown语法标记
    const markdownIndicators = [
      /^#{1,6}\s/, // 标题
      /\*\*.*\*\*/, // 粗体
      /\*.*\*/, // 斜体
      /`.*`/, // 内联代码
      /```/, // 代码块
      /^\d+\./, // 有序列表
      /^-/, // 无序列表
      /^>/, // 引用
      /\[.*\]\(.*\)/, // 链接
    ];

    return markdownIndicators.some((pattern) => pattern.test(content));
  }
}

// 导出单例实例
export const markdownConverter = new MarkdownConverter();

// 导出类用于扩展
export { MarkdownConverter };
