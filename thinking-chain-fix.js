// 🔧 DeepSeek思维链修复脚本
// 修复思维链被逐字符分割的问题

console.log("🔧 开始修复DeepSeek思维链处理逻辑...");

// 问题分析
console.log(`
📊 问题分析:
1. DeepSeek Reasoner的reasoning_content是流式传输的
2. 当前代码把每个字符片段都当作独立的思维步骤
3. 导致思维链有300+个步骤，每个只有几个字符

🎯 修复目标:
1. 累积完整的reasoning内容
2. 将完整内容作为一个思维步骤
3. 减少调试数据的冗余

💡 修复方案:
需要在DeepSeek的handleStreamResponse方法中:
1. 添加 fullReasoning 变量累积内容
2. 不要为每个片段创建独立步骤
3. 在完成时将完整内容作为一个步骤
`);

// 检查当前配置
function checkCurrentIssue() {
  console.log("🔍 检查当前思维链问题...");

  if (window.aiDebugCollector) {
    const sessions = window.aiDebugCollector.getAllSessions();
    const deepseekSessions = sessions.filter(
      (s) =>
        s.request.provider === "deepseek" &&
        s.request.model?.includes("reasoner")
    );

    console.log("📋 DeepSeek Reasoner会话:", deepseekSessions.length);

    if (deepseekSessions.length > 0) {
      const latestSession = deepseekSessions[0];
      console.log("🧠 最新思维链分析:", {
        sessionId: latestSession.sessionId.slice(-12),
        stepsCount: latestSession.thinkingChain?.totalSteps || 0,
        chunkCount: latestSession.streaming.chunks.length,
        firstSteps:
          latestSession.thinkingChain?.steps?.slice(0, 5).map((s) => ({
            id: s.id,
            content: s.content.substring(0, 20) + "...",
            length: s.content.length,
          })) || [],
      });

      if (latestSession.thinkingChain?.totalSteps > 50) {
        console.warn(
          "⚠️ 发现问题: 思维链步骤过多 (" +
            latestSession.thinkingChain.totalSteps +
            ")"
        );
        console.log("🔧 这表明thinking内容被错误地分割了");
      }
    }
  }
}

// 临时修复函数（适用于已有数据）
function fixExistingSessions() {
  console.log("🛠️ 尝试修复现有会话数据...");

  if (window.aiDebugCollector) {
    const sessions = window.aiDebugCollector.getAllSessions();

    sessions.forEach((session) => {
      if (
        session.request.provider === "deepseek" &&
        session.request.model?.includes("reasoner") &&
        session.thinkingChain?.steps?.length > 10
      ) {
        // 合并所有thinking片段
        const allThinkingContent = session.thinkingChain.steps
          .map((step) => step.content)
          .join("");

        // 重构为单一步骤
        session.thinkingChain = {
          steps: [
            {
              id: "reasoning_merged",
              content: allThinkingContent,
              timestamp:
                session.thinkingChain.steps[0]?.timestamp || Date.now(),
            },
          ],
          summary: `完整推理过程 (${allThinkingContent.length}字符, 从${session.thinkingChain.steps.length}个片段合并)`,
          totalSteps: 1,
        };

        console.log(
          "🔄 已修复会话:",
          session.sessionId.slice(-12),
          "合并了",
          session.thinkingChain.totalSteps,
          "个步骤"
        );
      }
    });

    // 刷新调试面板
    if (window.aiDebugStore) {
      window.aiDebugStore.getState().refreshSessions();
      console.log("✅ 调试面板数据已刷新");
    }
  }
}

// 显示代码修复建议
function showCodeFix() {
  console.log(`
📝 需要在 src/services/aiService.ts 中进行以下修复:

1. 在 DeepSeek 的 handleStreamResponse 方法中添加变量:
   let fullReasoning = ""; // 在 let fullMarkdown = ""; 后面

2. 修改 reasoning 处理逻辑:
   if (reasoning) {
     fullReasoning += reasoning;  // 累积而不是单独记录
     // 移除 thinkingChain.push() 调用
   }

3. 修改最终构造逻辑:
   if (options.model?.includes("reasoner") && fullReasoning.trim()) {
     aiData.thinkingChain = {
       steps: [{
         id: "reasoning_complete",
         content: fullReasoning.trim(),
         timestamp: Date.now()
       }],
       summary: \`完整推理过程 (\${fullReasoning.length}字符)\`,
       totalSteps: 1,
     };
   }

🔧 这样修复后，每个DeepSeek Reasoner会话只会有1个思维步骤，包含完整内容。
`);
}

// 主函数
function runThinkingChainFix() {
  console.log("🚀 运行思维链修复工具...");

  checkCurrentIssue();
  fixExistingSessions();
  showCodeFix();

  console.log("✅ 修复完成！现有数据已临时修复，新生成需要代码修改。");
}

// 暴露函数
window.checkCurrentIssue = checkCurrentIssue;
window.fixExistingSessions = fixExistingSessions;
window.runThinkingChainFix = runThinkingChainFix;

// 自动运行
runThinkingChainFix();
