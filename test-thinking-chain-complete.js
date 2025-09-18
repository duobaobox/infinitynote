/**
 * 思维链持久化完整测试套件
 * 验证页面刷新后思维链数据和显示状态的完整保持
 */

console.log("🔬 开始思维链持久化完整测试");

// 测试配置
const TEST_CONFIG = {
  noteIdToTest: null, // 将在运行时设置
  expectedSteps: 0,
  expectedShowThinking: true,
  testStartTime: Date.now(),
};

/**
 * 第一阶段：检查当前状态
 */
function checkCurrentState() {
  console.log("\n📊 阶段1：检查当前状态");

  if (typeof window === "undefined") {
    console.error("❌ 请在浏览器环境中运行此测试");
    return false;
  }

  // 检查数据库连接
  const dbRequest = indexedDB.open("InfinityNoteDatabase");
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    console.log(`✅ 数据库连接成功，版本: ${db.version}`);

    const transaction = db.transaction(["notes"], "readonly");
    const store = transaction.objectStore("notes");

    store.getAll().onsuccess = (e) => {
      const notes = e.target.result;
      const aiNotes = notes.filter((note) => note.customProperties?.ai);
      const thinkingNotes = aiNotes.filter(
        (note) => note.customProperties.ai.thinkingChain
      );

      console.log(`📝 数据库状态:`);
      console.log(`  - 总便签数: ${notes.length}`);
      console.log(`  - AI便签数: ${aiNotes.length}`);
      console.log(`  - 思维链便签数: ${thinkingNotes.length}`);

      if (thinkingNotes.length > 0) {
        const testNote = thinkingNotes[0];
        TEST_CONFIG.noteIdToTest = testNote.id;
        TEST_CONFIG.expectedSteps =
          testNote.customProperties.ai.thinkingChain.totalSteps ||
          testNote.customProperties.ai.thinkingChain.steps.length;
        TEST_CONFIG.expectedShowThinking =
          testNote.customProperties.ai.showThinking ?? true;

        console.log(`🎯 选择测试便签: ${testNote.id.slice(-8)}`);
        console.log(`  - 期望步骤数: ${TEST_CONFIG.expectedSteps}`);
        console.log(`  - 期望显示状态: ${TEST_CONFIG.expectedShowThinking}`);
        console.log(`  - 思维链数据:`, {
          hasSteps: !!testNote.customProperties.ai.thinkingChain.steps,
          stepsCount: testNote.customProperties.ai.thinkingChain.steps?.length,
          summary:
            testNote.customProperties.ai.thinkingChain.summary?.substring(
              0,
              50
            ) + "...",
        });

        checkUIState();
      } else {
        console.log("⚠️ 没有找到思维链便签，请先生成一个AI便签");
      }
    };

    db.close();
  };

  dbRequest.onerror = () => {
    console.error("❌ 数据库连接失败");
  };
}

/**
 * 第二阶段：检查UI状态
 */
function checkUIState() {
  console.log("\n📱 阶段2：检查UI状态");

  // 等待DOM渲染完成
  setTimeout(() => {
    const thinkingContainers = document.querySelectorAll(
      '[class*="thinkingChainContainer"]'
    );
    const visibleContainers = Array.from(thinkingContainers).filter(
      (el) => el.offsetParent !== null // 检查元素是否可见
    );

    console.log(`🎨 UI状态检查:`);
    console.log(`  - 思维链容器总数: ${thinkingContainers.length}`);
    console.log(`  - 可见容器数: ${visibleContainers.length}`);

    if (visibleContainers.length > 0) {
      visibleContainers.forEach((container, index) => {
        const stepsElements = container.querySelectorAll(
          '[class*="stepContent"]'
        );
        const headerElement = container.querySelector(
          '[class*="thinkingHeader"]'
        );
        const isCollapsed =
          container.querySelector('[class*="thinkingContent"]')?.style
            .display === "none";

        console.log(`  容器${index + 1}:`);
        console.log(`    - 步骤元素数: ${stepsElements.length}`);
        console.log(`    - 是否折叠: ${isCollapsed}`);
        console.log(`    - 头部信息: ${headerElement?.textContent?.trim()}`);
      });

      console.log("✅ UI状态检查完成，思维链正常显示");
      showRefreshInstructions();
    } else {
      console.log("❌ 没有发现可见的思维链容器");
      diagnoseProblem();
    }
  }, 1000);
}

/**
 * 第三阶段：问题诊断
 */
function diagnoseProblem() {
  console.log("\n🔍 阶段3：问题诊断");

  // 检查React组件状态
  if (window.React) {
    console.log("✅ React环境可用");
  } else {
    console.log("❌ React环境不可用");
  }

  // 检查控制台错误
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => {
    errors.push(args);
    originalError.apply(console, args);
  };

  setTimeout(() => {
    console.error = originalError;
    if (errors.length > 0) {
      console.log("🚨 发现控制台错误:");
      errors.forEach((error, index) => {
        console.log(`  错误${index + 1}:`, error);
      });
    } else {
      console.log("✅ 无控制台错误");
    }
  }, 500);

  // 检查DOM结构
  const noteCards = document.querySelectorAll('[class*="noteCard"]');
  console.log(`📋 发现 ${noteCards.length} 个便签卡片`);

  noteCards.forEach((card, index) => {
    const tiptapEditor = card.querySelector('[class*="tiptap-editor"]');
    const thinkingContainer = card.querySelector(
      '[class*="thinkingChainContainer"]'
    );

    console.log(`  便签${index + 1}:`);
    console.log(`    - 有编辑器: ${!!tiptapEditor}`);
    console.log(`    - 有思维链: ${!!thinkingContainer}`);
  });
}

/**
 * 第四阶段：显示刷新说明
 */
function showRefreshInstructions() {
  console.log("\n🔄 阶段4：页面刷新测试");

  const instructions = `
╭─────────────────────────────────────────╮
│           页面刷新测试步骤                │
├─────────────────────────────────────────┤
│ 1. 当前状态已记录                        │
│ 2. 按 F5 或 Ctrl+R 刷新页面              │
│ 3. 页面加载完成后运行以下命令:            │
│                                         │
│    runPostRefreshTest()                 │
│                                         │
│ 4. 对比刷新前后的状态                    │
╰─────────────────────────────────────────╯`;

  console.log(instructions);

  // 保存当前状态到sessionStorage
  sessionStorage.setItem(
    "thinkingChainTestConfig",
    JSON.stringify(TEST_CONFIG)
  );

  // 导出刷新后测试函数
  window.runPostRefreshTest = runPostRefreshTest;
}

/**
 * 刷新后测试函数
 */
function runPostRefreshTest() {
  console.log("🔄 开始刷新后测试");

  const savedConfig = JSON.parse(
    sessionStorage.getItem("thinkingChainTestConfig") || "{}"
  );

  if (!savedConfig.noteIdToTest) {
    console.log("❌ 没有找到测试配置，请重新运行主测试");
    return;
  }

  console.log("📋 刷新前配置:", savedConfig);

  // 重新检查数据库状态
  const dbRequest = indexedDB.open("InfinityNoteDatabase");
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(["notes"], "readonly");
    const store = transaction.objectStore("notes");

    store.get(savedConfig.noteIdToTest).onsuccess = (e) => {
      const note = e.target.result;

      if (!note) {
        console.log("❌ 测试便签不存在");
        return;
      }

      const aiData = note.customProperties?.ai;
      const thinkingChain = aiData?.thinkingChain;

      console.log("📊 刷新后数据状态:");
      console.log(`  - AI数据存在: ${!!aiData}`);
      console.log(`  - 思维链存在: ${!!thinkingChain}`);
      console.log(`  - 步骤数量: ${thinkingChain?.steps?.length || 0}`);
      console.log(`  - 显示状态: ${aiData?.showThinking ?? "undefined"}`);

      // 对比结果
      const dataIntact =
        thinkingChain?.steps?.length === savedConfig.expectedSteps;
      const stateIntact =
        (aiData?.showThinking ?? true) === savedConfig.expectedShowThinking;

      console.log("\n🎯 测试结果对比:");
      console.log(`  数据完整性: ${dataIntact ? "✅ 通过" : "❌ 失败"}`);
      console.log(`  状态一致性: ${stateIntact ? "✅ 通过" : "❌ 失败"}`);

      if (dataIntact && stateIntact) {
        console.log("\n🎉 思维链持久化测试完全通过！");
      } else {
        console.log("\n❌ 思维链持久化测试失败");

        if (!dataIntact) {
          console.log(
            `  期望步骤数: ${savedConfig.expectedSteps}, 实际: ${
              thinkingChain?.steps?.length || 0
            }`
          );
        }
        if (!stateIntact) {
          console.log(
            `  期望显示状态: ${savedConfig.expectedShowThinking}, 实际: ${
              aiData?.showThinking ?? "undefined"
            }`
          );
        }
      }

      // 检查UI显示
      setTimeout(() => {
        const visibleContainers = document.querySelectorAll(
          '[class*="thinkingChainContainer"]:not([style*="display: none"])'
        );
        console.log(
          `\n🎨 UI显示检查: ${
            visibleContainers.length > 0 ? "✅ 可见" : "❌ 不可见"
          }`
        );

        if (visibleContainers.length === 0) {
          console.log("💡 建议检查组件渲染条件和状态初始化逻辑");
        }
      }, 2000);
    };

    db.close();
  };
}

// 立即开始测试
checkCurrentState();

// 导出测试函数
if (typeof window !== "undefined") {
  window.runThinkingChainPersistenceTest = checkCurrentState;
  window.runPostRefreshTest = runPostRefreshTest;
}
