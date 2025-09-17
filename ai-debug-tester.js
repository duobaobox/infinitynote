// AI调试面板完整测试工具
// 在浏览器开发者控制台中复制粘贴运行此代码

console.log("🐛 AI调试系统完整测试工具启动...");

// 等待模块加载的辅助函数
async function waitForModule(modulePath, maxWait = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    try {
      const module = await import(modulePath);
      return module;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`模块 ${modulePath} 加载超时`);
}

// 全面诊断函数
window.fullDiagnose = async function () {
  console.log("🔬 开始全面诊断...");
  const results = {};

  // 1. 检查调试收集器
  try {
    const { aiDebugCollector } = await waitForModule(
      "./src/utils/aiDebugCollector.ts"
    );
    results.collector = {
      loaded: true,
      sessions: aiDebugCollector.getAllSessions().length,
      config: aiDebugCollector.config,
    };
    console.log("✅ 调试收集器:", results.collector);

    // 暴露到全局方便调试
    window.aiDebugCollector = aiDebugCollector;
  } catch (error) {
    results.collector = { loaded: false, error: error.message };
    console.error("❌ 调试收集器加载失败:", error);
  }

  // 2. 检查调试store
  try {
    const { useAIDebugStore } = await waitForModule(
      "./src/store/aiDebugStore.ts"
    );
    const store = useAIDebugStore.getState();
    results.store = {
      loaded: true,
      visible: store.visible,
      realTimeMode: store.realTimeMode,
      sessions: store.sessions.length,
      activeTab: store.activeTab,
    };
    console.log("✅ 调试store:", results.store);

    // 暴露到全局方便调试
    window.aiDebugStore = useAIDebugStore;

    // 自动初始化
    if (store.initialize) {
      store.initialize();
      console.log("🔄 调试store已初始化");
    }
  } catch (error) {
    results.store = { loaded: false, error: error.message };
    console.error("❌ 调试store加载失败:", error);
  }

  // 3. 检查AI服务
  try {
    const { aiService } = await waitForModule("./src/services/aiService.ts");
    const provider = aiService.getCurrentProvider();
    const configured = await aiService.isProviderConfigured(provider);

    results.aiService = {
      loaded: true,
      currentProvider: provider,
      configured: configured,
      availableProviders: aiService.getAvailableProviders(),
    };
    console.log("✅ AI服务:", results.aiService);

    // 暴露到全局方便调试
    window.aiService = aiService;
  } catch (error) {
    results.aiService = { loaded: false, error: error.message };
    console.error("❌ AI服务加载失败:", error);
  }

  return results;
};

// 创建测试会话函数
window.createTestAISession = async function () {
  console.log("🧪 创建完整的测试AI会话...");

  if (!window.aiDebugCollector) {
    console.error("❌ 调试收集器未加载，请先运行 fullDiagnose()");
    return null;
  }

  const sessionId = `test_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    // 1. 开始会话
    const testOptions = {
      noteId: "debug-test-note-" + Date.now(),
      prompt: "请生成一段测试内容来验证调试面板功能",
      model: "test-model-v1",
      temperature: 0.8,
      maxTokens: 300,
    };

    console.log("🚀 开始会话:", sessionId);
    const debugSessionId = window.aiDebugCollector.startSession(testOptions);

    // 2. 设置提供商
    window.aiDebugCollector.updateSessionProvider(
      debugSessionId,
      "debug-provider"
    );

    // 3. 模拟详细的流式响应
    const streamChunks = [
      {
        content: "🔍 ",
        thinking: "开始分析用户需求，需要生成测试内容",
        raw: {
          choices: [
            {
              delta: {
                content: "🔍 ",
                reasoning_content: "开始分析用户需求，需要生成测试内容",
              },
            },
          ],
        },
      },
      {
        content: "调试面板测试",
        thinking: null,
        raw: { choices: [{ delta: { content: "调试面板测试" } }] },
      },
      {
        content: "正在运行...\n\n",
        thinking: "确保生成的内容格式正确",
        raw: {
          choices: [
            {
              delta: {
                content: "正在运行...\n\n",
                reasoning_content: "确保生成的内容格式正确",
              },
            },
          ],
        },
      },
      {
        content: "**功能验证项目:**\n",
        thinking: null,
        raw: { choices: [{ delta: { content: "**功能验证项目:**\n" } }] },
      },
      {
        content: "1. ✅ 会话创建和跟踪\n",
        thinking: "列出需要测试的各个功能点",
        raw: {
          choices: [
            {
              delta: {
                content: "1. ✅ 会话创建和跟踪\n",
                reasoning_content: "列出需要测试的各个功能点",
              },
            },
          ],
        },
      },
      {
        content: "2. ✅ 流式数据收集\n",
        thinking: null,
        raw: { choices: [{ delta: { content: "2. ✅ 流式数据收集\n" } }] },
      },
      {
        content: "3. ✅ 思维链记录\n",
        thinking: "思维链是重要的调试信息",
        raw: {
          choices: [
            {
              delta: {
                content: "3. ✅ 思维链记录\n",
                reasoning_content: "思维链是重要的调试信息",
              },
            },
          ],
        },
      },
      {
        content: "4. ✅ 性能指标统计\n",
        thinking: null,
        raw: { choices: [{ delta: { content: "4. ✅ 性能指标统计\n" } }] },
      },
      {
        content: "5. ✅ 实时面板更新\n\n",
        thinking: "确保调试面板能实时显示数据",
        raw: {
          choices: [
            {
              delta: {
                content: "5. ✅ 实时面板更新\n\n",
                reasoning_content: "确保调试面板能实时显示数据",
              },
            },
          ],
        },
      },
      {
        content: "🎉 **调试系统测试完成！**",
        thinking: "总结测试结果，确认所有功能正常",
        raw: {
          choices: [
            {
              delta: {
                content: "🎉 **调试系统测试完成！**",
                reasoning_content: "总结测试结果，确认所有功能正常",
              },
            },
          ],
        },
      },
    ];

    let cumulativeContent = "";

    // 按时间顺序发送流式数据
    for (let i = 0; i < streamChunks.length; i++) {
      setTimeout(() => {
        const chunk = streamChunks[i];
        cumulativeContent += chunk.content;

        console.log(
          `📝 流式数据块 ${i + 1}/${streamChunks.length}:`,
          chunk.content.trim()
        );

        window.aiDebugCollector.recordStreamChunk(
          debugSessionId,
          chunk.raw,
          chunk.content,
          chunk.thinking
        );

        // 最后一个数据块时完成会话
        if (i === streamChunks.length - 1) {
          setTimeout(() => {
            console.log("✅ 完成测试会话...");

            const finalAIData = {
              generated: true,
              model: "test-model-v1",
              provider: "debug-provider",
              generatedAt: new Date().toISOString(),
              prompt: testOptions.prompt,
              requestId: debugSessionId,
              showThinking: true,
              thinkingCollapsed: false,
              isStreaming: false,
              originalMarkdown: cumulativeContent,
              thinkingChain: {
                steps: streamChunks
                  .filter((chunk) => chunk.thinking)
                  .map((chunk, idx) => ({
                    id: `thinking_step_${idx + 1}`,
                    content: chunk.thinking,
                    timestamp: Date.now() + idx * 50,
                  })),
                summary: `通过${
                  streamChunks.filter((c) => c.thinking).length
                }步推理完成调试测试`,
                totalSteps: streamChunks.filter((c) => c.thinking).length,
              },
            };

            window.aiDebugCollector.completeSession(
              debugSessionId,
              cumulativeContent,
              finalAIData
            );

            // 验证会话数据
            const session = window.aiDebugCollector.getSession(debugSessionId);
            console.log("🎯 完整测试会话数据:", {
              sessionId: session.sessionId,
              status: session.status,
              chunksCount: session.streaming.chunks.length,
              thinkingSteps: session.thinkingChain?.totalSteps || 0,
              performance: session.performance,
            });

            // 刷新调试面板
            if (window.aiDebugStore) {
              const state = window.aiDebugStore.getState();
              state.refreshSessions();

              // 自动打开面板并选中新会话
              if (!state.visible) {
                state.toggleVisible();
              }
              state.setSelectedSession(debugSessionId);

              console.log("🔄 调试面板已更新并选中测试会话");
            }
          }, 500); // 等待最后一个数据块处理完成
        }
      }, i * 400); // 每400ms发送一个数据块
    }

    return debugSessionId;
  } catch (error) {
    console.error("❌ 创建测试会话失败:", error);
    return null;
  }
};

// 快速修复函数
window.quickFixDebugPanel = async function () {
  console.log("🔧 执行快速修复...");

  try {
    // 1. 确保调试面板可见
    if (window.aiDebugStore) {
      const state = window.aiDebugStore.getState();
      if (!state.visible) {
        state.toggleVisible();
        console.log("👁️ 已打开调试面板");
      }

      // 2. 启用实时模式
      if (!state.realTimeMode) {
        state.toggleRealTimeMode();
        console.log("🔄 已启用实时模式");
      }

      // 3. 强制刷新数据
      state.refreshSessions();
      console.log("🔄 已刷新会话数据");

      // 4. 重新初始化
      if (state.initialize) {
        state.initialize();
        console.log("🔄 已重新初始化调试系统");
      }
    }

    // 5. 检查和修复调试收集器配置
    if (window.aiDebugCollector) {
      window.aiDebugCollector.configure({
        enabled: true,
        maxSessions: 100,
        collectRawData: true,
        collectThinking: true,
        collectPerformance: true,
      });
      console.log("⚙️ 已重新配置调试收集器");
    }

    console.log("✅ 快速修复完成");
  } catch (error) {
    console.error("❌ 快速修复失败:", error);
  }
};

// 显示完整的使用指南
console.log(`
🎮 AI调试系统完整测试套件

🔍 诊断命令:
  fullDiagnose()          - 全面诊断所有组件
  quickFixDebugPanel()    - 快速修复常见问题

🧪 测试命令:
  createTestAISession()   - 创建完整的测试会话
  
🎛️ 手动控制:
  打开面板: Ctrl+Shift+D (Win) / Cmd+Shift+D (Mac)
  或点击右下角🐛按钮

🔧 高级调试:
  aiDebugCollector        - 调试数据收集器
  aiDebugStore           - 调试面板状态
  aiService              - AI服务实例

📋 推荐测试流程:
1. fullDiagnose()       - 确认所有组件加载
2. createTestAISession() - 创建测试数据
3. 观察调试面板是否显示数据

如果没有显示数据，运行: quickFixDebugPanel()
`);

// 自动运行初始诊断
console.log("🚀 正在进行初始诊断...");
fullDiagnose()
  .then(() => {
    console.log("✅ 初始诊断完成，系统就绪！");
  })
  .catch((error) => {
    console.error("❌ 初始诊断失败:", error);
  });
