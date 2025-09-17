// 🔧 AI模型信息修复验证脚本
// 在浏览器控制台运行此脚本来验证模型信息是否正确显示

console.log("🔧 开始验证AI模型信息修复...");

async function verifyModelFix() {
  try {
    // 1. 检查AI服务当前设置
    if (window.aiService) {
      const settings = window.aiService.getSettingsSync();
      console.log("📋 当前AI设置:", {
        provider: settings.provider,
        defaultModel: settings.defaultModel,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      });

      const providerInfo = window.aiService.getProviderInfo(settings.provider);
      console.log("🔌 提供商信息:", {
        name: providerInfo?.name,
        supportedModels: providerInfo?.supportedModels,
        supportsThinking: providerInfo?.supportsThinking,
      });
    } else {
      console.error("❌ AI服务未加载");
      return false;
    }

    // 2. 创建一个测试会话来验证模型信息传递
    if (window.aiDebugCollector) {
      console.log("🧪 创建测试会话验证模型信息...");

      const testOptions = {
        noteId: "model-test-" + Date.now(),
        prompt: "测试模型信息传递",
        // 故意不设置model，测试默认值
      };

      const sessionId = window.aiDebugCollector.startSession(testOptions);
      console.log("📋 测试会话已创建:", sessionId);

      // 模拟provider更新
      window.aiDebugCollector.updateSessionProvider(sessionId, "deepseek");

      // 检查会话数据
      const session = window.aiDebugCollector.getSession(sessionId);
      console.log("🔍 会话数据检查:", {
        sessionId: session?.sessionId,
        provider: session?.request.provider,
        model: session?.request.model,
        prompt: session?.request.prompt,
      });

      if (session?.request.model === "unknown") {
        console.warn("⚠️ 模型信息仍然显示为 'unknown'，可能需要进一步检查");
      } else {
        console.log("✅ 模型信息已正确设置:", session?.request.model);
      }

      // 清理测试数据
      setTimeout(() => {
        window.aiDebugCollector.sessions?.delete?.(sessionId);
        console.log("🗑️ 测试会话已清理");
      }, 1000);
    } else {
      console.error("❌ 调试收集器未加载");
      return false;
    }

    // 3. 检查调试面板是否能正确显示模型信息
    if (window.aiDebugStore) {
      const state = window.aiDebugStore.getState();
      if (!state.visible) {
        state.toggleVisible();
        console.log("👁️ 调试面板已打开");
      }

      state.refreshSessions();
      console.log("🔄 调试面板数据已刷新");

      const sessions = state.sessions;
      console.log(
        "📊 当前调试面板会话:",
        sessions.map((s) => ({
          id: s.sessionId.slice(-12),
          provider: s.request.provider,
          model: s.request.model,
          status: s.status,
        }))
      );
    }

    console.log("✅ 模型信息修复验证完成");
    return true;
  } catch (error) {
    console.error("❌ 验证过程中出错:", error);
    return false;
  }
}

// 显示使用说明
console.log(`
🎯 验证AI模型信息修复

问题说明:
- 之前调试面板中模型显示为 "unknown"
- 原因是 generateNote 方法没有传递模型信息给调试收集器

修复内容:
1. ✅ 修改 generateNote 方法，确保包含完整的配置信息
2. ✅ 增强调试收集器的日志，更好地跟踪模型信息
3. ✅ 改进错误检测和调试输出

运行验证: verifyModelFix()

💡 测试建议:
1. 先运行此脚本验证修复效果
2. 然后创建一个新便签并生成AI内容
3. 检查调试面板中是否正确显示模型名称 (如 deepseek-chat)
`);

// 暴露到全局供手动调用
window.verifyModelFix = verifyModelFix;

// 自动运行验证
verifyModelFix();
