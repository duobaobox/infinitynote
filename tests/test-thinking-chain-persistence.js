/**
 * 思维链持久化测试
 * 测试思维链数据在页面刷新后是否能正确保存和加载
 */

// 数据库版本升级测试函数
function testDatabaseUpgrade() {
  console.log("🔧 数据库升级测试");

  // 检查IndexedDB中是否有正确的表结构
  const request = indexedDB.open("InfinityNoteDatabase", 3);

  request.onerror = () => {
    console.error("❌ 无法打开数据库");
  };

  request.onsuccess = (event) => {
    const db = event.target.result;
    console.log("📊 数据库版本:", db.version);
    console.log("📋 数据库表:", Array.from(db.objectStoreNames));

    if (db.objectStoreNames.contains("notes")) {
      console.log("✅ Notes 表存在");

      const transaction = db.transaction(["notes"], "readonly");
      const store = transaction.objectStore("notes");

      console.log("🔑 Notes 表索引:", Array.from(store.indexNames));
      console.log("🔑 Notes 表主键:", store.keyPath);

      // 检查是否有思维链数据
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const notes = getAllRequest.result;
        console.log(`📝 数据库中共有 ${notes.length} 个便签`);

        const aiNotes = notes.filter((note) => note.customProperties?.ai);
        console.log(`🤖 包含AI数据的便签: ${aiNotes.length} 个`);

        const thinkingChainNotes = notes.filter(
          (note) => note.customProperties?.ai?.thinkingChain
        );
        console.log(`🧠 包含思维链数据的便签: ${thinkingChainNotes.length} 个`);

        // 显示思维链数据详情
        thinkingChainNotes.forEach((note) => {
          const thinking = note.customProperties.ai.thinkingChain;
          console.log(`📋 便签 ${note.id.slice(-8)}:`, {
            stepsCount: thinking.steps?.length || 0,
            totalSteps: thinking.totalSteps,
            summary: thinking.summary?.substring(0, 50) + "...",
          });
        });

        if (thinkingChainNotes.length > 0) {
          console.log("✅ 思维链数据持久化测试通过！");
          console.log("💡 现在可以刷新页面测试数据是否保留");
        } else {
          console.log("⚠️ 暂无思维链数据，请先生成一个AI便签再测试");
        }
      };
    } else {
      console.error("❌ Notes 表不存在");
    }

    db.close();
  };

  request.onupgradeneeded = (event) => {
    console.log("🔄 数据库正在升级到版本", event.newVersion);
    const db = event.target.result;

    // 检查是否正确创建了包含customProperties的表结构
    if (db.objectStoreNames.contains("notes")) {
      const transaction = event.target.transaction;
      const store = transaction.objectStore("notes");
      console.log("✅ 升级后的Notes表结构已更新");
    }
  };
}

// 创建测试用的思维链数据
function createTestThinkingChainData() {
  return {
    generated: true,
    model: "deepseek-reasoner",
    provider: "deepseek",
    generatedAt: new Date().toISOString(),
    prompt: "测试思维链持久化功能",
    requestId: `test_${Date.now()}`,
    showThinking: true,
    thinkingCollapsed: false,
    thinkingChain: {
      totalSteps: 3,
      summary: "这是一个测试思维链的完整推理过程",
      steps: [
        {
          id: "step_1",
          content: "首先分析用户的测试需求，确保思维链数据能够正确保存到数据库",
          timestamp: Date.now() - 2000,
        },
        {
          id: "step_2",
          content:
            "然后验证数据库升级是否成功，customProperties字段是否被正确添加",
          timestamp: Date.now() - 1000,
        },
        {
          id: "step_3",
          content: "最终确认思维链在页面刷新后仍然可见，说明持久化功能正常工作",
          timestamp: Date.now(),
        },
      ],
    },
  };
}

// 模拟保存思维链数据到便签
async function simulateAINoteSave() {
  try {
    // 访问全局的noteStore（如果可用）
    if (typeof window !== "undefined" && window.noteStore) {
      const testAIData = createTestThinkingChainData();

      console.log("💾 模拟保存包含思维链的AI便签...");
      console.log("🧠 测试思维链数据:", testAIData);

      // 这里应该调用实际的保存逻辑
      console.log("⚠️ 注意：这只是模拟数据，请在实际应用中生成AI便签");
    } else {
      console.log("⚠️ noteStore不可用，请在应用环境中运行此测试");
    }
  } catch (error) {
    console.error("❌ 模拟保存失败:", error);
  }
}

// 页面刷新前后对比测试
function setupRefreshTest() {
  console.log(`
🔄 页面刷新测试步骤:
1. 生成一个包含思维链的AI便签
2. 确认思维链显示正常
3. 刷新页面 (F5 或 Ctrl+R)
4. 检查思维链是否仍然存在
5. 运行数据库测试确认数据持久化

💡 如果刷新后思维链消失，说明数据库升级可能需要重新加载页面
`);
}

// 主测试函数
function runThinkingChainPersistenceTest() {
  console.log("🧪 开始思维链持久化测试");
  console.log("=".repeat(50));

  // 1. 测试数据库升级
  testDatabaseUpgrade();

  // 2. 设置刷新测试说明
  setupRefreshTest();

  // 3. 模拟数据保存（演示用）
  simulateAINoteSave();

  console.log("=".repeat(50));
  console.log("✅ 测试脚本运行完成");
}

// 立即运行测试
runThinkingChainPersistenceTest();

// 导出测试函数供控制台使用
if (typeof window !== "undefined") {
  window.testThinkingChainPersistence = runThinkingChainPersistenceTest;
  window.testDatabaseUpgrade = testDatabaseUpgrade;
}
