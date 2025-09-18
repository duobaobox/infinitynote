// DeepSeek思维链修复代码补丁
// 需要替换 src/services/aiService.ts 中 DeepSeek 的 handleStreamResponse 方法

/*
修复后的 DeepSeek handleStreamResponse 方法应该是这样的:

private async handleStreamResponse(
  response: Response,
  options: AIGenerationOptions,
  abortController: AbortController,
  debugSessionId: string
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");

  let fullContent = "";
  let fullMarkdown = "";
  let fullReasoning = ""; // 🔧 新增: 累积完整的reasoning内容
  let retryCount = 0;
  const maxRetries = 3;

  try {
    while (true) {
      if (abortController.signal.aborted) {
        break;
      }

      try {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (abortController.signal.aborted) {
            return;
          }

          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              const deltaContent = parsed.choices?.[0]?.delta?.content || "";

              if (deltaContent) {
                fullMarkdown += deltaContent;
                fullContent = markdownConverter.convertStreamChunk(fullMarkdown);
                options.onStream?.(fullContent);
              }

              // 🔧 修复: 正确处理reasoning内容
              const delta = parsed.choices?.[0]?.delta;
              let reasoning = null;

              if (delta && options.model?.includes("reasoner")) {
                reasoning =
                  delta.reasoning_content ||
                  delta.reasoning ||
                  delta.thinking ||
                  delta.thought ||
                  delta["reasoning-content"];

                // 🔧 关键修复: 累积reasoning内容，不要创建独立步骤
                if (reasoning) {
                  fullReasoning += reasoning;
                  
                  // 只在第一次收到reasoning时记录调试信息
                  if (fullReasoning.length === reasoning.length) {
                    console.log("🧠 开始收集完整思维链内容");
                  }
                }
              }

              // 记录调试数据 - 只传递reasoning片段给调试收集器
              aiDebugCollector.recordStreamChunk(
                debugSessionId,
                parsed,
                deltaContent,
                reasoning // 这里仍然传递片段，但不在这里创建思维步骤
              );

              retryCount = 0;
            } catch (parseError) {
              console.warn("解析DeepSeek响应数据失败:", parseError);
              retryCount++;
              if (retryCount > maxRetries) {
                throw new Error("连续解析失败，中止生成");
              }
            }
          }
        }
      } catch (readError) {
        if (readError instanceof Error && readError.name === "AbortError") {
          return;
        }
        console.error("读取DeepSeek流数据失败:", readError);
        retryCount++;
        if (retryCount > maxRetries) {
          throw readError;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (!abortController.signal.aborted) {
      const finalHTML = markdownConverter.convertComplete(fullMarkdown);

      const aiData: AICustomProperties["ai"] = {
        generated: true,
        model: options.model || "deepseek-chat",
        provider: "deepseek",
        generatedAt: new Date().toISOString(),
        prompt: options.prompt,
        requestId: `req_${Date.now()}`,
        showThinking: options.model?.includes("reasoner") && fullReasoning.trim(),
        thinkingCollapsed: false,
        isStreaming: false,
        originalMarkdown: fullMarkdown,
      };

      // 🔧 关键修复: 正确构造思维链
      if (options.model?.includes("reasoner") && fullReasoning.trim()) {
        const completeThinkingStep = {
          id: "reasoning_complete",
          content: fullReasoning.trim(),
          timestamp: Date.now()
        };
        
        console.log("🧠 构造完整思维链数据:", {
          model: options.model,
          reasoningLength: fullReasoning.length,
          reasoningPreview: fullReasoning.substring(0, 100) + "...",
        });

        aiData.thinkingChain = {
          steps: [completeThinkingStep],
          summary: `完整推理过程 (${fullReasoning.length}字符)`,
          totalSteps: 1,
        };
      }

      aiDebugCollector.completeSession(debugSessionId, finalHTML, aiData);
      options.onComplete?.(finalHTML, aiData);
    }
  } finally {
    reader.releaseLock();
  }
}

*/

console.log(`
🔧 DeepSeek思维链修复说明:

🚨 发现的问题:
- reasoning_content按字符流式传输
- 每个字符片段被当作独立的思维步骤
- 导致一个简单问题产生300+个思维步骤

✅ 修复方案:
1. 添加 fullReasoning 变量累积完整内容
2. 不为每个reasoning片段创建独立步骤  
3. 在完成时将完整内容作为单一思维步骤
4. 减少调试数据冗余，提高性能

🎯 修复后效果:
- 每个会话只有1个思维步骤
- 包含完整的推理过程
- 调试数据更清晰易读
- 性能大幅提升

请将上面的代码替换到 src/services/aiService.ts 的相应位置。
`);
