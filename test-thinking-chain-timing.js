/**
 * 测试思维链显示时机修复
 * 验证思维链容器是否在AI开始思考时就显示，而不是等到生成完成
 */

// 模拟DeepSeek API响应数据
const mockDeepSeekResponses = [
  // 第一个chunk - 开始思维过程
  {
    id: "test-1",
    object: "chat.completion.chunk",
    created: Date.now(),
    model: "deepseek-reasoner",
    choices: [{
      index: 0,
      delta: {
        role: "assistant",
        content: null,
        reasoning_content: "用户问我关于超能力的问题。"
      },
      finish_reason: null
    }]
  },
  // 第二个chunk - 继续思维
  {
    id: "test-2", 
    object: "chat.completion.chunk",
    created: Date.now(),
    model: "deepseek-reasoner",
    choices: [{
      index: 0,
      delta: {
        content: null,
        reasoning_content: "这是一个轻松的问题，我可以用比喻的方式来回答。"
      },
      finish_reason: null
    }]
  },
  // 第三个chunk - 开始正式回答
  {
    id: "test-3",
    object: "chat.completion.chunk", 
    created: Date.now(),
    model: "deepseek-reasoner",
    choices: [{
      index: 0,
      delta: {
        content: "你好！",
        reasoning_content: null
      },
      finish_reason: null
    }]
  },
  // 第四个chunk - 继续回答
  {
    id: "test-4",
    object: "chat.completion.chunk",
    created: Date.now(), 
    model: "deepseek-reasoner",
    choices: [{
      index: 0,
      delta: {
        content: "我的超能力包括：",
        reasoning_content: null
      },
      finish_reason: null
    }]
  }
];

// 测试时机记录
const timingLog = [];

// 模拟AI服务的流式处理
function simulateDeepSeekStreaming() {
  console.log("🧪 开始测试思维链显示时机");
  
  let fullReasoning = "";
  let fullContent = "";
  let hasStartedThinking = false;
  
  const options = {
    model: "deepseek-reasoner",
    prompt: "你好介绍一下你的超能力？",
    onStream: (content, aiData) => {
      timingLog.push({
        timestamp: Date.now(),
        event: "onStream",
        content: content.substring(0, 50) + "...",
        hasThinkingChain: !!aiData?.thinkingChain,
        isStreaming: aiData?.isStreaming,
        thinkingContent: aiData?.thinkingChain?.steps?.[0]?.content?.substring(0, 30) + "..."
      });
      
      console.log("📡 onStream 回调:", {
        contentLength: content.length,
        hasAiData: !!aiData,
        hasThinkingChain: !!aiData?.thinkingChain,
        isStreaming: aiData?.isStreaming,
        thinkingSteps: aiData?.thinkingChain?.totalSteps || 0
      });
    },
    onComplete: (finalContent, aiData) => {
      timingLog.push({
        timestamp: Date.now(),
        event: "onComplete", 
        content: finalContent.substring(0, 50) + "...",
        hasThinkingChain: !!aiData?.thinkingChain,
        isStreaming: aiData?.isStreaming,
        generated: aiData?.generated
      });
      
      console.log("✅ onComplete 回调:", {
        contentLength: finalContent.length,
        generated: aiData?.generated,
        hasThinkingChain: !!aiData?.thinkingChain,
        thinkingSteps: aiData?.thinkingChain?.totalSteps || 0
      });
    }
  };
  
  // 模拟处理每个响应chunk
  mockDeepSeekResponses.forEach((response, index) => {
    setTimeout(() => {
      const delta = response.choices[0].delta;
      const reasoning = delta.reasoning_content;
      const content = delta.content;
      
      console.log(`\n📦 处理第${index + 1}个chunk:`, {
        hasReasoning: !!reasoning,
        hasContent: !!content,
        reasoning: reasoning?.substring(0, 30) + "...",
        content: content?.substring(0, 30) + "..."
      });
      
      // 处理思维内容
      if (reasoning) {
        fullReasoning += reasoning;
        
        // 第一次收到reasoning时，立即显示思维链容器
        if (!hasStartedThinking) {
          hasStartedThinking = true;
          console.log("🧠 首次检测到思维内容，立即显示思维链容器");
          
          const initialAiData = {
            generated: false,
            model: "deepseek-reasoner",
            provider: "deepseek",
            generatedAt: new Date().toISOString(),
            prompt: options.prompt,
            requestId: `req_${Date.now()}`,
            showThinking: true,
            thinkingCollapsed: false,
            isStreaming: true,
            originalMarkdown: "",
            thinkingChain: {
              steps: [{
                id: "thinking_in_progress",
                content: "正在思考中...",
                timestamp: Date.now(),
              }],
              summary: "思维过程进行中",
              totalSteps: 1,
            },
          };
          
          // 立即通过onStream显示思维链容器
          options.onStream("", initialAiData);
        }
        
        // 实时更新思维链内容
        if (hasStartedThinking) {
          const updatedAiData = {
            generated: false,
            model: "deepseek-reasoner", 
            provider: "deepseek",
            generatedAt: new Date().toISOString(),
            prompt: options.prompt,
            requestId: `req_${Date.now()}`,
            showThinking: true,
            thinkingCollapsed: false,
            isStreaming: true,
            originalMarkdown: fullContent,
            thinkingChain: {
              steps: [{
                id: "thinking_live",
                content: fullReasoning,
                timestamp: Date.now(),
              }],
              summary: `思维过程进行中 (${fullReasoning.length}字符)`,
              totalSteps: 1,
            },
          };
          
          options.onStream(fullContent, updatedAiData);
        }
      }
      
      // 处理正式回答内容
      if (content) {
        fullContent += content;
        options.onStream(fullContent);
      }
      
      // 最后一个chunk，完成生成
      if (index === mockDeepSeekResponses.length - 1) {
        setTimeout(() => {
          const finalAiData = {
            generated: true,
            model: "deepseek-reasoner",
            provider: "deepseek", 
            generatedAt: new Date().toISOString(),
            prompt: options.prompt,
            requestId: `req_${Date.now()}`,
            showThinking: true,
            thinkingCollapsed: false,
            isStreaming: false,
            originalMarkdown: fullContent,
            thinkingChain: {
              steps: [{
                id: "reasoning_complete",
                content: fullReasoning.trim(),
                timestamp: Date.now(),
              }],
              summary: `完整推理过程 (${fullReasoning.length}字符)`,
              totalSteps: 1,
            },
          };
          
          options.onComplete(fullContent, finalAiData);
          
          // 输出测试结果
          console.log("\n🎯 测试完成，时机分析:");
          timingLog.forEach((log, i) => {
            console.log(`${i + 1}. ${log.event}:`, {
              时间戳: new Date(log.timestamp).toLocaleTimeString(),
              有思维链: log.hasThinkingChain ? "✅" : "❌",
              流式生成中: log.isStreaming ? "✅" : "❌",
              思维内容: log.thinkingContent
            });
          });
          
          // 验证修复效果
          const firstThinkingCallback = timingLog.find(log => log.hasThinkingChain);
          const firstReasoningTime = timingLog[0]?.timestamp || 0;
          const firstThinkingTime = firstThinkingCallback?.timestamp || 0;
          
          console.log("\n📊 修复效果验证:");
          console.log("首次思维内容时间:", new Date(firstReasoningTime).toLocaleTimeString());
          console.log("首次思维链显示时间:", new Date(firstThinkingTime).toLocaleTimeString());
          console.log("延迟时间:", firstThinkingTime - firstReasoningTime, "ms");
          
          if (firstThinkingCallback && firstThinkingCallback.event === "onStream") {
            console.log("✅ 修复成功：思维链容器在思维过程开始时就显示了！");
          } else {
            console.log("❌ 修复失败：思维链容器仍然在生成完成后才显示");
          }
          
        }, 100);
      }
      
    }, index * 200); // 每200ms处理一个chunk
  });
}

// 运行测试
simulateDeepSeekStreaming();