// 🐛 AI调试面板快速验证脚本
// 直接在浏览器控制台粘贴并运行

console.log("🐛 AI调试面板快速验证开始...");

// 简单的验证步骤
function quickVerify() {
  let allGood = true;

  console.log("1️⃣ 检查调试收集器...");
  if (window.aiDebugCollector) {
    console.log("✅ 调试收集器已加载");

    // 创建简单测试
    const testSession = window.aiDebugCollector.startSession({
      noteId: "quick-test",
      prompt: "快速测试",
      model: "test",
    });

    window.aiDebugCollector.updateSessionProvider(testSession, "test-provider");
    window.aiDebugCollector.recordStreamChunk(
      testSession,
      { test: "data" },
      "测试内容",
      "测试思维"
    );
    window.aiDebugCollector.completeSession(testSession, "完整测试内容", {
      generated: true,
      model: "test",
      provider: "test-provider",
      generatedAt: new Date().toISOString(),
      prompt: "快速测试",
      requestId: testSession,
    });

    console.log("✅ 测试会话已创建:", testSession);
  } else {
    console.error("❌ 调试收集器未加载");
    allGood = false;
  }

  console.log("2️⃣ 检查调试面板...");
  if (window.aiDebugStore) {
    console.log("✅ 调试面板store已加载");
    const state = window.aiDebugStore.getState();

    // 打开面板
    if (!state.visible) {
      state.toggleVisible();
      console.log("👁️ 调试面板已打开");
    }

    // 启用实时模式
    if (!state.realTimeMode) {
      state.toggleRealTimeMode();
      console.log("🔄 实时模式已启用");
    }

    // 刷新数据
    state.refreshSessions();
    console.log("🔄 会话数据已刷新，当前会话数:", state.sessions.length);
  } else {
    console.error("❌ 调试面板store未加载");
    allGood = false;
  }

  console.log("3️⃣ 检查AI服务...");
  if (window.aiService) {
    console.log("✅ AI服务已加载");
    console.log("🔧 当前提供商:", window.aiService.getCurrentProvider());
  } else {
    console.error("❌ AI服务未加载");
    allGood = false;
  }

  if (allGood) {
    console.log("🎉 验证完成！调试系统运行正常");
    console.log("💡 现在尝试生成一个AI便签，应该能在调试面板中看到数据");
    console.log("🔍 调试面板位置: 右下角，快捷键 Ctrl+Shift+D");
  } else {
    console.log("⚠️ 验证发现问题，请检查控制台错误信息");
  }

  return allGood;
}

// 立即运行验证
quickVerify();

// 暴露到全局
window.quickVerify = quickVerify;
