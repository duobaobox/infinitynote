/**
 * 测试思维链交互功能改进
 * 验证新的思维链头部点击、状态显示、默认折叠等功能
 */

console.log("🧪 开始测试思维链交互功能改进...");

// 测试配置
const TEST_CONFIG = {
  testNoteId: null,
  expectedFeatures: [
    "头部可点击展开折叠",
    "思考中状态显示",
    "思考完成状态显示",
    "默认折叠状态",
    "展开折叠图标指示",
    "动画效果",
  ],
};

/**
 * 测试1：检查思维链容器是否正确渲染
 */
function testThinkingChainRendering() {
  console.log("\n📱 测试1：检查思维链容器渲染");

  const containers = document.querySelectorAll(
    '[class*="thinkingChainContainer"]'
  );
  console.log(`找到 ${containers.length} 个思维链容器`);

  if (containers.length === 0) {
    console.warn("⚠️ 未找到思维链容器，请先生成一个AI便签");
    return false;
  }

  containers.forEach((container, index) => {
    const header = container.querySelector('[class*="thinkingHeader"]');
    const headerLeft = container.querySelector('[class*="thinkingHeaderLeft"]');
    const headerRight = container.querySelector(
      '[class*="thinkingHeaderRight"]'
    );
    const expandIcon = container.querySelector('[class*="expandIcon"]');
    const toggleButton = container.querySelector('[class*="toggleButton"]');

    console.log(`容器 ${index + 1}:`);
    console.log(`  - 头部存在: ${!!header}`);
    console.log(`  - 左侧内容存在: ${!!headerLeft}`);
    console.log(`  - 右侧内容存在: ${!!headerRight}`);
    console.log(`  - 展开图标存在: ${!!expandIcon}`);
    console.log(`  - 切换按钮存在: ${!!toggleButton}`);
    console.log(
      `  - 头部可点击: ${header?.style.cursor === "pointer" || header?.onclick}`
    );
  });

  return containers.length > 0;
}

/**
 * 测试2：检查头部点击功能
 */
function testHeaderClickFunctionality() {
  console.log("\n👆 测试2：检查头部点击功能");

  const containers = document.querySelectorAll(
    '[class*="thinkingChainContainer"]'
  );
  if (containers.length === 0) return false;

  const firstContainer = containers[0];
  const header = firstContainer.querySelector('[class*="thinkingHeader"]');
  const content = firstContainer.querySelector('[class*="thinkingContent"]');

  if (!header || !content) {
    console.error("❌ 未找到头部或内容区域");
    return false;
  }

  // 记录初始状态
  const initialDisplay = window.getComputedStyle(content).display;
  const isInitiallyVisible = initialDisplay !== "none";

  console.log(`初始状态: ${isInitiallyVisible ? "展开" : "折叠"}`);

  // 模拟点击头部
  try {
    header.click();

    // 等待状态更新
    setTimeout(() => {
      const newDisplay = window.getComputedStyle(content).display;
      const isNowVisible = newDisplay !== "none";
      const stateChanged = isInitiallyVisible !== isNowVisible;

      console.log(`点击后状态: ${isNowVisible ? "展开" : "折叠"}`);
      console.log(`状态是否改变: ${stateChanged ? "✅ 是" : "❌ 否"}`);

      return stateChanged;
    }, 100);
  } catch (error) {
    console.error("❌ 点击测试失败:", error);
    return false;
  }
}

/**
 * 测试3：检查状态显示逻辑
 */
function testStatusDisplay() {
  console.log("\n🔄 测试3：检查状态显示逻辑");

  const containers = document.querySelectorAll(
    '[class*="thinkingChainContainer"]'
  );
  containers.forEach((container, index) => {
    const titleElement = container.querySelector('[class*="thinkingTitle"]');
    const stepCountElement = container.querySelector('[class*="stepCount"]');
    const expandIcon = container.querySelector('[class*="expandIcon"]');

    if (titleElement) {
      const titleText = titleElement.textContent;
      const isThinking = titleText.includes("思考中");
      const isCompleted = titleText.includes("AI 思维过程");

      console.log(`容器 ${index + 1} 状态:`);
      console.log(`  - 标题文本: "${titleText}"`);
      console.log(`  - 是思考中状态: ${isThinking ? "✅" : "❌"}`);
      console.log(`  - 是完成状态: ${isCompleted ? "✅" : "❌"}`);
      console.log(`  - 有步骤统计: ${!!stepCountElement}`);
      console.log(`  - 展开图标: ${expandIcon?.textContent || "未找到"}`);

      // 检查动画类
      if (isThinking) {
        const hasThinkingClass = titleElement.classList.contains("thinking");
        console.log(`  - 有思考动画类: ${hasThinkingClass ? "✅" : "❌"}`);
      }
    }
  });
}

/**
 * 测试4：检查默认折叠状态
 */
function testDefaultCollapsedState() {
  console.log("\n📦 测试4：检查默认折叠状态");

  // 这个测试需要观察新生成的AI便签
  console.log("💡 这个测试需要生成一个新的AI便签来验证默认折叠状态");
  console.log("请执行以下步骤:");
  console.log("1. 创建一个新便签");
  console.log("2. 使用AI生成内容(确保选择支持思维链的模型如DeepSeek)");
  console.log("3. 观察思维链是否默认处于折叠状态");

  // 检查现有便签的折叠状态
  const containers = document.querySelectorAll(
    '[class*="thinkingChainContainer"]'
  );
  containers.forEach((container, index) => {
    const content = container.querySelector('[class*="thinkingContent"]');
    const expandIcon = container.querySelector('[class*="expandIcon"]');

    if (content && expandIcon) {
      const isVisible = window.getComputedStyle(content).display !== "none";
      const iconText = expandIcon.textContent;
      const expectedIcon = isVisible ? "▼" : "▶";
      const iconCorrect = iconText === expectedIcon;

      console.log(`现有容器 ${index + 1}:`);
      console.log(`  - 内容可见: ${isVisible ? "展开" : "折叠"}`);
      console.log(`  - 图标显示: "${iconText}"`);
      console.log(`  - 图标正确: ${iconCorrect ? "✅" : "❌"}`);
    }
  });
}

/**
 * 测试5：检查样式和动画效果
 */
function testStylesAndAnimations() {
  console.log("\n🎨 测试5：检查样式和动画效果");

  const containers = document.querySelectorAll(
    '[class*="thinkingChainContainer"]'
  );
  containers.forEach((container, index) => {
    const header = container.querySelector('[class*="thinkingHeader"]');
    const thinkingTitle = container.querySelector('[class*="thinking"]');

    if (header) {
      const headerStyles = window.getComputedStyle(header);
      const hasCursor = headerStyles.cursor === "pointer";
      const hasHoverEffect = headerStyles.transition.includes("background");

      console.log(`容器 ${index + 1} 样式:`);
      console.log(`  - 头部指针光标: ${hasCursor ? "✅" : "❌"}`);
      console.log(`  - 头部悬停效果: ${hasHoverEffect ? "✅" : "❌"}`);
    }

    if (thinkingTitle) {
      const titleStyles = window.getComputedStyle(thinkingTitle);
      const hasAnimation = titleStyles.animation !== "none";

      console.log(`  - 思考中动画: ${hasAnimation ? "✅" : "❌"}`);
    }
  });
}

/**
 * 运行完整测试套件
 */
function runCompleteTest() {
  console.log("🚀 运行完整的思维链交互功能测试");

  const testResults = {
    rendering: false,
    clickFunctionality: false,
    statusDisplay: true, // 这个测试总是通过，因为只是检查显示
    defaultCollapsed: true, // 需要手动验证
    stylesAnimations: true, // 样式检查总是通过
  };

  // 按顺序执行测试
  testResults.rendering = testThinkingChainRendering();

  if (testResults.rendering) {
    testResults.clickFunctionality = testHeaderClickFunctionality();
    testStatusDisplay();
    testDefaultCollapsedState();
    testStylesAndAnimations();
  }

  console.log("\n📊 测试结果汇总:");
  console.log(`✅ 容器渲染: ${testResults.rendering ? "通过" : "失败"}`);
  console.log(
    `✅ 头部点击: ${testResults.clickFunctionality ? "通过" : "失败"}`
  );
  console.log(`✅ 状态显示: 需手动验证`);
  console.log(`✅ 默认折叠: 需手动验证新AI便签`);
  console.log(`✅ 样式动画: 需手动验证`);

  console.log("\n🎯 总体评估:");
  if (testResults.rendering && testResults.clickFunctionality) {
    console.log("✅ 基础功能正常，可以进行手动测试验证详细功能");
  } else {
    console.log("❌ 基础功能存在问题，需要检查代码实现");
  }
}

/**
 * 启动测试
 */
setTimeout(() => {
  runCompleteTest();
}, 1000);

// 导出测试函数供手动调用
window.testThinkingChainImprovements = {
  runCompleteTest,
  testThinkingChainRendering,
  testHeaderClickFunctionality,
  testStatusDisplay,
  testDefaultCollapsedState,
  testStylesAndAnimations,
};

console.log("💡 测试函数已挂载到 window.testThinkingChainImprovements");
console.log("你可以手动调用各个测试函数进行验证");
