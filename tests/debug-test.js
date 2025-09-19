// AI调试系统测试脚本
// 在浏览器控制台中运行此脚本来测试调试面板是否工作正常

console.log("🐛 开始AI调试系统测试...");

// 检查关键模块是否已加载
const checkModule = (name, object) => {
  if (object) {
    console.log(`✅ ${name}: 已加载`);
    return true;
  } else {
    console.error(`❌ ${name}: 未加载或不可用`);
    return false;
  }
};

// 模拟一个AI生成会话进行测试
const testDebugSystem = async () => {
  try {
    // 导入调试收集器
    const { aiDebugCollector } = await import(
      "./src/utils/aiDebugCollector.ts"
    );

    console.log("🔍 调试收集器状态:", aiDebugCollector);

    // 创建测试会话
    const testOptions = {
      noteId: "test-note-" + Date.now(),
      prompt: "测试调试系统的AI生成",
      model: "test-model",
      temperature: 0.7,
      maxTokens: 100,
    };

    console.log("🚀 开始测试会话...");
    const sessionId = aiDebugCollector.startSession(testOptions);
    console.log("📋 会话ID:", sessionId);

    // 更新provider信息
    aiDebugCollector.updateSessionProvider(sessionId, "test-provider");

    // 模拟流式数据
    setTimeout(() => {
      console.log("📝 模拟流式数据块...");
      aiDebugCollector.recordStreamChunk(
        sessionId,
        { choices: [{ delta: { content: "测试内容片段1" } }] },
        "测试内容片段1",
        "这是测试的思维过程"
      );
    }, 100);

    setTimeout(() => {
      aiDebugCollector.recordStreamChunk(
        sessionId,
        { choices: [{ delta: { content: "测试内容片段2" } }] },
        "测试内容片段2"
      );
    }, 200);

    // 完成会话
    setTimeout(() => {
      console.log("✅ 完成测试会话...");
      aiDebugCollector.completeSession(
        sessionId,
        "测试内容片段1测试内容片段2",
        {
          generated: true,
          model: "test-model",
          provider: "test-provider",
          generatedAt: new Date().toISOString(),
          prompt: testOptions.prompt,
          requestId: "test_" + Date.now(),
          showThinking: true,
          thinkingCollapsed: false,
          isStreaming: false,
          originalMarkdown: "测试内容片段1测试内容片段2",
          thinkingChain: {
            steps: [
              {
                id: "step_1",
                content: "这是测试的思维过程",
                timestamp: Date.now(),
              },
            ],
            summary: "通过1步推理完成",
            totalSteps: 1,
          },
        }
      );

      // 检查会话数据
      const sessions = aiDebugCollector.getAllSessions();
      console.log("📊 所有会话:", sessions);
      console.log("🎯 测试会话:", aiDebugCollector.getSession(sessionId));
    }, 500);
  } catch (error) {
    console.error("❌ 调试系统测试失败:", error);
  }
};

// 检查调试面板状态
const checkDebugPanel = () => {
  try {
    // 检查调试store是否可用
    if (window.aiDebugStore) {
      const state = window.aiDebugStore.getState();
      console.log("🎛️ 调试面板状态:", state);

      // 如果面板不可见，自动打开
      if (!state.visible) {
        console.log("👁️ 打开调试面板...");
        state.toggleVisible();
      }

      return true;
    } else {
      console.warn("⚠️ 调试面板store未在全局暴露");
      return false;
    }
  } catch (error) {
    console.error("❌ 检查调试面板失败:", error);
    return false;
  }
};

// 主测试函数
const runDebugTest = () => {
  console.log("🔧 AI调试系统完整测试开始");

  // 检查调试面板
  const panelOK = checkDebugPanel();

  // 运行调试系统测试
  testDebugSystem();

  // 提供手动控制指令
  console.log(`
🎮 手动控制指令:
- checkDebugPanel() // 检查调试面板状态
- testDebugSystem() // 运行测试会话
- aiDebugStore.getState() // 获取调试面板状态
- aiDebugCollector.getAllSessions() // 获取所有会话
`);

  // 暴露函数到全局
  window.checkDebugPanel = checkDebugPanel;
  window.testDebugSystem = testDebugSystem;
};

// 执行测试
runDebugTest();
