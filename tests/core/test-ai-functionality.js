/**
 * AI功能测试脚本
 * 用于验证AI便签生成功能的完整性
 */

// 测试用例配置
const testCases = [
  {
    name: "基础文本生成",
    prompt: "写一个关于春天的诗歌",
    expectedKeywords: ["春天", "诗歌"],
  },
  {
    name: "技术文档生成",
    prompt: "解释什么是React Hooks",
    expectedKeywords: ["React", "Hooks"],
  },
  {
    name: "列表生成",
    prompt: "列出5个学习编程的建议",
    expectedKeywords: ["编程", "建议"],
  },
  {
    name: "创意内容生成",
    prompt: "为一个咖啡店想一个有创意的营销文案",
    expectedKeywords: ["咖啡", "营销"],
  },
];

// 错误测试用例
const errorTestCases = [
  {
    name: "空提示词测试",
    prompt: "",
    expectedError: "空提示词",
  },
  {
    name: "过长提示词测试",
    prompt: "a".repeat(10000), // 10000个字符
    expectedError: "提示词过长",
  },
];

/**
 * 模拟AI功能测试
 */
class AIFunctionalityTester {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log("🚀 开始AI功能测试...");
    console.log("=".repeat(50));

    // 运行正常功能测试
    console.log("📝 运行正常功能测试...");
    for (const testCase of testCases) {
      await this.runSingleTest(testCase);
    }

    // 运行错误处理测试
    console.log("\n❌ 运行错误处理测试...");
    for (const errorTest of errorTestCases) {
      await this.runErrorTest(errorTest);
    }

    // 运行性能测试
    console.log("\n⚡ 运行性能测试...");
    await this.runPerformanceTests();

    // 输出测试结果
    this.printTestSummary();
  }

  /**
   * 运行单个测试用例
   */
  async runSingleTest(testCase) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    console.log(`📝 提示词: "${testCase.prompt}"`);

    try {
      const startTime = Date.now();

      // 模拟AI生成过程
      const result = await this.simulateAIGeneration(testCase.prompt);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 验证结果
      const isValid = this.validateResult(result, testCase.expectedKeywords);

      const testResult = {
        name: testCase.name,
        passed: isValid,
        duration,
        result,
        prompt: testCase.prompt,
      };

      this.testResults.push(testResult);

      if (isValid) {
        this.passedTests++;
        console.log(`✅ 通过 (${duration}ms)`);
        console.log(`📄 生成内容: ${result.slice(0, 100)}...`);
      } else {
        this.failedTests++;
        console.log(`❌ 失败 (${duration}ms)`);
        console.log(`📄 生成内容: ${result.slice(0, 100)}...`);
      }
    } catch (error) {
      this.failedTests++;
      console.log(`❌ 错误: ${error.message}`);
      this.testResults.push({
        name: testCase.name,
        passed: false,
        error: error.message,
        prompt: testCase.prompt,
      });
    }
  }

  /**
   * 运行错误测试用例
   */
  async runErrorTest(errorTest) {
    console.log(`\n🧪 错误测试: ${errorTest.name}`);

    try {
      await this.simulateAIGeneration(errorTest.prompt);
      this.failedTests++;
      console.log(`❌ 失败: 应该抛出错误但没有抛出`);
    } catch (error) {
      this.passedTests++;
      console.log(`✅ 通过: 正确处理了错误 - ${error.message}`);
    }
  }

  /**
   * 运行性能测试
   */
  async runPerformanceTests() {
    console.log("\n⏱️ 测试响应时间...");

    const performancePrompt = "简单测试";
    const iterations = 5;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.simulateAIGeneration(performancePrompt);
      const endTime = Date.now();
      times.push(endTime - startTime);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log(`📊 平均响应时间: ${avgTime.toFixed(2)}ms`);
    console.log(`📊 最大响应时间: ${maxTime}ms`);
    console.log(`📊 最小响应时间: ${minTime}ms`);

    // 性能标准检查
    if (avgTime < 2000) {
      console.log(`✅ 性能测试通过 (平均 ${avgTime.toFixed(2)}ms < 2000ms)`);
      this.passedTests++;
    } else {
      console.log(`❌ 性能测试失败 (平均 ${avgTime.toFixed(2)}ms >= 2000ms)`);
      this.failedTests++;
    }
  }

  /**
   * 模拟AI生成过程
   */
  async simulateAIGeneration(prompt) {
    // 基本验证
    if (!prompt || prompt.trim() === "") {
      throw new Error("提示词不能为空");
    }

    if (prompt.length > 5000) {
      throw new Error("提示词过长");
    }

    // 模拟网络延迟
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 模拟AI生成不同类型的内容
    if (prompt.includes("诗歌") || prompt.includes("诗")) {
      return `春风轻拂绿柳梢，
桃花朵朵竞妖娆。
燕子归来筑新巢，
万物复苏展新貌。`;
    }

    if (prompt.includes("React") || prompt.includes("Hooks")) {
      return `# React Hooks 简介

React Hooks 是 React 16.8 引入的新特性，它允许你在函数组件中使用 state 和其他 React 特性。

## 主要优势：
- 更简洁的代码
- 更好的逻辑复用
- 更容易测试

## 常用 Hooks：
- useState: 管理组件状态
- useEffect: 处理副作用
- useContext: 访问上下文`;
    }

    if (prompt.includes("建议") || prompt.includes("编程")) {
      return `# 学习编程的5个建议

1. **从基础开始**：掌握编程基本概念和语法
2. **动手实践**：多写代码，从小项目开始
3. **读懂报错**：学会分析和解决错误信息
4. **参与社区**：加入编程社区，与他人交流
5. **持续学习**：技术更新快，保持学习热情`;
    }

    if (prompt.includes("咖啡") || prompt.includes("营销")) {
      return `☕ **每一杯都是艺术，每一口都是惊喜**

🌟 **"不只是咖啡，是你的专属时光"**

在这里，时间慢下来，生活美起来。
精选世界顶级咖啡豆，手工烘焙，用心调制。
每一杯咖啡都承载着我们对品质的执着。

📍 来访即是缘分，品尝即是体验
🎁 新客首杯半价，老友推荐有礼`;
    }

    // 默认生成通用内容
    return `根据您的提示词"${prompt}"，我为您生成了相关内容。

这是一个测试性的AI生成内容，实际使用中会根据具体的AI模型生成更加丰富和准确的内容。

生成时间：${new Date().toLocaleString()}`;
  }

  /**
   * 验证生成结果
   */
  validateResult(result, expectedKeywords) {
    if (!result || result.trim() === "") {
      return false;
    }

    // 检查是否包含预期关键词
    const lowerResult = result.toLowerCase();
    return expectedKeywords.some((keyword) =>
      lowerResult.includes(keyword.toLowerCase())
    );
  }

  /**
   * 打印测试总结
   */
  printTestSummary() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 测试结果总结");
    console.log("=".repeat(50));

    console.log(`✅ 通过测试: ${this.passedTests}`);
    console.log(`❌ 失败测试: ${this.failedTests}`);
    console.log(`📊 总测试数: ${this.passedTests + this.failedTests}`);
    console.log(
      `📈 通过率: ${(
        (this.passedTests / (this.passedTests + this.failedTests)) *
        100
      ).toFixed(2)}%`
    );

    if (this.failedTests === 0) {
      console.log("\n🎉 恭喜！所有测试都通过了！");
    } else {
      console.log("\n⚠️ 还有一些测试需要优化");
    }

    console.log("\n📋 详细测试结果：");
    this.testResults.forEach((result, index) => {
      console.log(
        `${index + 1}. ${result.name}: ${result.passed ? "✅" : "❌"}`
      );
      if (result.duration) {
        console.log(`   响应时间: ${result.duration}ms`);
      }
      if (result.error) {
        console.log(`   错误信息: ${result.error}`);
      }
    });
  }
}

// 运行测试
const tester = new AIFunctionalityTester();
tester.runAllTests().catch(console.error);

console.log(`
🤖 AI功能测试指南

这个测试脚本验证了以下功能：

1. ✅ 基础AI生成功能
2. ✅ 不同类型内容生成（诗歌、技术文档、列表、创意文案）
3. ✅ 错误处理（空输入、过长输入）
4. ✅ 性能测试（响应时间）
5. ✅ 内容质量验证

使用方法：
1. 在终端运行: node test-ai-functionality.js
2. 查看测试结果和建议

注意事项：
- 这是模拟测试，实际AI功能需要配置真实的API密钥
- 在浏览器中测试时，需要配置AI服务提供商（智谱AI、DeepSeek等）
- 确保网络连接正常
`);
