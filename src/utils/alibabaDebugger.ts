/**
 * 阿里巴巴API调试工具
 * 用于诊断和测试阿里巴巴AI API的连接问题
 */

interface DebugRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface DebugResult {
  success: boolean;
  error?: string;
  responseHeaders?: Record<string, string>;
  contentType?: string;
  streamChunks?: string[];
  totalContent?: string;
  responseTime?: number;
}

export class AlibabaDebugger {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint?: string) {
    this.apiKey = apiKey;
    this.endpoint =
      endpoint ||
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
  }

  /**
   * 调试阿里巴巴API连接
   */
  async debugAPIConnection(model: string = "qwen-turbo"): Promise<DebugResult> {
    const startTime = Date.now();

    const requestBody: DebugRequest = {
      model,
      messages: [
        {
          role: "user",
          content: "你好，请简单介绍一下你自己。",
        },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 100,
    };

    console.log(`🚀 [AlibabaDebugger] 开始调试API连接`);
    console.log(`🚀 [AlibabaDebugger] 端点: ${this.endpoint}`);
    console.log(`🚀 [AlibabaDebugger] 模型: ${model}`);
    console.log(
      `🚀 [AlibabaDebugger] 请求体:`,
      JSON.stringify(requestBody, null, 2)
    );

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        `📡 [AlibabaDebugger] 响应状态: ${response.status} ${response.statusText}`
      );

      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log(`📡 [AlibabaDebugger] 响应头:`, responseHeaders);

      const contentType = response.headers.get("content-type") || "";
      console.log(`📡 [AlibabaDebugger] Content-Type: ${contentType}`);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}. ${errorText}`,
          responseHeaders,
          contentType,
          responseTime: Date.now() - startTime,
        };
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        return {
          success: false,
          error: "无法读取响应流",
          responseHeaders,
          contentType,
          responseTime: Date.now() - startTime,
        };
      }

      const streamChunks: string[] = [];
      let totalContent = "";
      let chunkCount = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(
              `✅ [AlibabaDebugger] 流式响应读取完成，共 ${chunkCount} 个数据块`
            );
            break;
          }

          const chunk = new TextDecoder().decode(value);
          chunkCount++;
          streamChunks.push(chunk);

          console.log(
            `📦 [AlibabaDebugger] 数据块 ${chunkCount}:`,
            chunk.substring(0, 200)
          );

          // 尝试提取内容
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                console.log(`🏁 [AlibabaDebugger] 检测到结束标志`);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  totalContent += parsed.choices[0].delta.content;
                }
              } catch (parseError) {
                console.warn(`⚠️ [AlibabaDebugger] JSON解析失败:`, parseError);
              }
            }
          }

          // 防止无限循环
          if (chunkCount > 100) {
            console.warn(`⚠️ [AlibabaDebugger] 数据块数量超过100，停止读取`);
            break;
          }
        }

        return {
          success: true,
          responseHeaders,
          contentType,
          streamChunks,
          totalContent,
          responseTime: Date.now() - startTime,
        };
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error(`❌ [AlibabaDebugger] API调用失败:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 生成调试报告
   */
  generateDebugReport(result: DebugResult): string {
    let report = `# 阿里巴巴API调试报告\n\n`;

    report += `**状态**: ${result.success ? "✅ 成功" : "❌ 失败"}\n`;
    report += `**响应时间**: ${result.responseTime}ms\n\n`;

    if (result.error) {
      report += `**错误信息**: ${result.error}\n\n`;
    }

    if (result.contentType) {
      report += `**Content-Type**: ${result.contentType}\n\n`;
    }

    if (result.responseHeaders) {
      report += `## 响应头\n\n`;
      Object.entries(result.responseHeaders).forEach(([key, value]) => {
        report += `- **${key}**: ${value}\n`;
      });
      report += `\n`;
    }

    if (result.streamChunks && result.streamChunks.length > 0) {
      report += `## 流式数据块 (${result.streamChunks.length}个)\n\n`;
      result.streamChunks.slice(0, 5).forEach((chunk, index) => {
        report += `### 数据块 ${index + 1}\n\`\`\`\n${chunk}\n\`\`\`\n\n`;
      });

      if (result.streamChunks.length > 5) {
        report += `*还有 ${
          result.streamChunks.length - 5
        } 个数据块未显示...*\n\n`;
      }
    }

    if (result.totalContent) {
      report += `## 提取的内容\n\n${result.totalContent}\n\n`;
    }

    return report;
  }

  /**
   * 快速测试连接
   */
  static async quickTest(apiKey: string, model?: string): Promise<void> {
    const debugInstance = new AlibabaDebugger(apiKey);
    const result = await debugInstance.debugAPIConnection(model);
    const report = debugInstance.generateDebugReport(result);

    console.log(report);

    if (result.success) {
      console.log(`✅ 阿里巴巴API连接测试成功！`);
    } else {
      console.log(`❌ 阿里巴巴API连接测试失败: ${result.error}`);
    }
  }
}

// 在浏览器控制台中使用：
// AlibabaDebugger.quickTest("your-api-key", "qwen-turbo")
(window as any).AlibabaDebugger = AlibabaDebugger;
