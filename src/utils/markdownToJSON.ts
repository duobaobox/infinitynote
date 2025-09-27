import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { MarkdownParser } from "prosemirror-markdown";

// 扩展基础 schema 以支持更多格式
const extendedSchema = new Schema({
  nodes: schema.spec.nodes,
  marks: schema.spec.marks,
});

/**
 * 将 Markdown 文本转换为 TipTap JSONContent 格式
 * @param markdown - 要转换的 Markdown 文本
 * @returns TipTap JSONContent 格式的数据
 */
export function markdownToJSON(markdown: string): any {
  try {
    // 创建 Markdown 解析器
    const parser = new MarkdownParser(extendedSchema, extendedSchema.nodes, extendedSchema.marks);
    
    // 解析 Markdown 为 ProseMirror Node
    const node = parser.parse(markdown);
    
    // 将 ProseMirror Node 转换为 JSON
    return node.toJSON();
  } catch (error) {
    console.error("Markdown to JSON conversion failed:", error);
    
    // 如果转换失败，返回基础的 JSONContent 结构
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: markdown,
            },
          ],
        },
      ],
    };
  }
}

/**
 * 将 Markdown 文本安全地转换为 JSONContent 格式
 * @param markdown - 要转换的 Markdown 文本
 * @returns Promise<JSONContent> - 转换后的 JSONContent
 */
export async function markdownToJSONAsync(markdown: string): Promise<any> {
  return new Promise((resolve) => {
    try {
      const result = markdownToJSON(markdown);
      resolve(result);
    } catch (error) {
      console.error("Async Markdown to JSON conversion failed:", error);
      resolve({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: markdown,
              },
            ],
          },
        ],
      });
    }
  });
}