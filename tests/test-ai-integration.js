/**
 * AI服务集成测试
 * 测试真实的AI API集成功能
 */

import { aiService } from "./src/services/aiService.js";
import { markdownConverter } from "./src/utils/markdownConverter.js";

// 测试配置
const testConfig = {
  timeout: 30000, // 30秒超时
  retryCount: 3,
  testPrompts: [
    "写一个简短的待办事项列表",
    "解释JavaScript闭包的概念",
    "创建一个简单的问候语",
  ],
};

class AIIntegrationTester {
  constructor() {
    this.results = [];
    this.failedTests = [];
  }

  async runTests() {
    console.log("🚀 开始AI服务集成测试...");
    console.log("=".repeat(50));

    // 检查AI服务配置
    await this.checkAIServiceConfiguration();

    // 测试基础功能
    await this.testBasicGeneration();

    // 测试流式功能
    await this.testStreamingGeneration();

    // 测试错误处理
    await this.testErrorHandling();

    // 测试Markdown转换
    await this.testMarkdownConversion();

    // 输出结果
    this.printResults();
  }

  async checkAIServiceConfiguration() {
    console.log("\n🔧 检查AI服务配置...");

    try {
      const providers = aiService.getAvailableProviders();
      console.log(`✅ 可用提供商: ${providers.join(", ")}`);

      const currentProvider = aiService.getCurrentProvider();
      console.log(`📍 当前提供商: ${currentProvider}`);

      // 检查当前提供商配置
      const isConfigured = await aiService.isProviderConfigured(
        currentProvider
      );
      if (isConfigured) {
        console.log(`✅ ${currentProvider} 已配置API密钥`);
      } else {
        console.log(`⚠️  ${currentProvider} 未配置API密钥，某些测试可能失败`);
      }
    } catch (error) {
      console.log(`❌ AI服务配置检查失败: ${error.message}`);
    }
  }

  async testBasicGeneration() {
    console.log("\n📝 测试基础AI生成功能...");

    for (const prompt of testConfig.testPrompts) {
      try {
        console.log(`\n🧪 测试提示词: "${prompt}"`);

        const startTime = Date.now();

        // 创建测试用的回调
        let finalContent = "";
        let streamChunks = [];
        let completed = false;
        let error = null;

        const promise = new Promise((resolve, reject) => {
          aiService.generateNote({
            noteId: "test-note-" + Date.now(),
            prompt: prompt,
            onStream: (content) => {
              streamChunks.push(content);
            },
            onComplete: (content, aiData) => {
              finalContent = content;
              completed = true;
              resolve({ content, aiData });
            },
            onError: (err) => {
              error = err;
              reject(err);
            },
          });
        });

        // 添加超时保护
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("超时")), testConfig.timeout);
        });

        const result = await Promise.race([promise, timeoutPromise]);
        const endTime = Date.now();

        console.log(`✅ 生成成功 (${endTime - startTime}ms)`);
        console.log(`📄 内容长度: ${finalContent.length} 字符`);
        console.log(`🌊 流式块数: ${streamChunks.length}`);
        console.log(`📋 内容预览: ${finalContent.slice(0, 100)}...`);

        this.results.push({
          test: "基础生成",
          prompt,
          success: true,
          duration: endTime - startTime,
          contentLength: finalContent.length,
          streamChunks: streamChunks.length,
        });
      } catch (error) {
        console.log(`❌ 生成失败: ${error.message}`);
        this.failedTests.push({
          test: "基础生成",
          prompt,
          error: error.message,
        });
      }
    }
  }

  async testStreamingGeneration() {
    console.log("\n🌊 测试流式生成功能...");

    try {
      const testPrompt = "列出3个编程最佳实践";
      console.log(`🧪 测试流式生成: "${testPrompt}"`);

      let streamCount = 0;
      let lastContent = "";
      const streamingData = [];

      const promise = new Promise((resolve, reject) => {
        aiService.generateNote({
          noteId: "streaming-test-" + Date.now(),
          prompt: testPrompt,
          onStream: (content) => {
            streamCount++;
            streamingData.push({
              chunk: streamCount,
              content: content,
              delta: content.length - lastContent.length,
              timestamp: Date.now(),
            });
            lastContent = content;

            // 实时输出流式进度
            if (streamCount % 5 === 0) {
              console.log(
                `  📡 流式数据块 ${streamCount}: ${content.length} 字符`
              );
            }
          },
          onComplete: (content, aiData) => {
            resolve({ content, aiData, streamingData });
          },
          onError: reject,
        });
      });

      const result = await Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("流式测试超时")),
            testConfig.timeout
          )
        ),
      ]);

      console.log(`✅ 流式生成成功`);
      console.log(`📊 总流式块: ${streamCount}`);
      console.log(`📏 最终内容: ${result.content.length} 字符`);

      // 分析流式性能
      if (streamingData.length > 1) {
        const intervals = [];
        for (let i = 1; i < streamingData.length; i++) {
          intervals.push(
            streamingData[i].timestamp - streamingData[i - 1].timestamp
          );
        }
        const avgInterval =
          intervals.reduce((a, b) => a + b, 0) / intervals.length;
        console.log(`⚡ 平均流式间隔: ${avgInterval.toFixed(2)}ms`);
      }

      this.results.push({
        test: "流式生成",
        success: true,
        streamCount,
        avgInterval:
          streamingData.length > 1
            ? streamingData.reduce(
                (sum, _, i, arr) =>
                  i > 0 ? sum + (arr[i].timestamp - arr[i - 1].timestamp) : sum,
                0
              ) /
              (streamingData.length - 1)
            : 0,
      });
    } catch (error) {
      console.log(`❌ 流式生成测试失败: ${error.message}`);
      this.failedTests.push({
        test: "流式生成",
        error: error.message,
      });
    }
  }

  async testErrorHandling() {
    console.log("\n❌ 测试错误处理...");

    const errorCases = [
      {
        name: "空提示词",
        prompt: "",
        expectedError: "提示词",
      },
      {
        name: "超长提示词",
        prompt: "test ".repeat(2000),
        expectedError: "过长",
      },
    ];

    for (const errorCase of errorCases) {
      try {
        console.log(`🧪 测试 ${errorCase.name}...`);

        let errorOccurred = false;

        const promise = new Promise((resolve, reject) => {
          aiService.generateNote({
            noteId: "error-test-" + Date.now(),
            prompt: errorCase.prompt,
            onStream: () => {},
            onComplete: resolve,
            onError: (error) => {
              errorOccurred = true;
              reject(error);
            },
          });
        });

        await promise;

        // 如果没有抛出错误，测试失败
        console.log(`❌ ${errorCase.name} 测试失败: 应该抛出错误但没有`);
        this.failedTests.push({
          test: errorCase.name,
          error: "应该抛出错误但没有",
        });
      } catch (error) {
        if (
          error.message
            .toLowerCase()
            .includes(errorCase.expectedError.toLowerCase())
        ) {
          console.log(`✅ ${errorCase.name} 测试通过: ${error.message}`);
          this.results.push({
            test: errorCase.name,
            success: true,
            expectedError: errorCase.expectedError,
          });
        } else {
          console.log(
            `❌ ${errorCase.name} 测试失败: 预期包含 "${errorCase.expectedError}"，实际得到 "${error.message}"`
          );
          this.failedTests.push({
            test: errorCase.name,
            error: `预期错误不匹配: ${error.message}`,
          });
        }
      }
    }
  }

  async testMarkdownConversion() {
    console.log("\n📝 测试Markdown转换功能...");

    const testCases = [
      {
        name: "基础Markdown",
        input: "# 标题\n\n**粗体** 和 *斜体*",
        expected: ["<h1>", "<strong>", "<em>"],
      },
      {
        name: "列表转换",
        input: "- 项目1\n- 项目2\n- 项目3",
        expected: ["<ul>", "<li>"],
      },
      {
        name: "代码块转换",
        input: "```javascript\nconst x = 1;\n```",
        expected: ["<pre>", "<code>"],
      },
    ];

    for (const testCase of testCases) {
      try {
        console.log(`🧪 测试 ${testCase.name}...`);

        const result = markdownConverter.convertComplete(testCase.input);

        const allExpectedPresent = testCase.expected.every((expected) =>
          result.includes(expected)
        );

        if (allExpectedPresent) {
          console.log(`✅ ${testCase.name} 转换成功`);
          console.log(`📄 结果: ${result.slice(0, 100)}...`);
          this.results.push({
            test: testCase.name,
            success: true,
            inputLength: testCase.input.length,
            outputLength: result.length,
          });
        } else {
          console.log(`❌ ${testCase.name} 转换失败: 缺少预期元素`);
          console.log(`📄 结果: ${result}`);
          this.failedTests.push({
            test: testCase.name,
            error: "缺少预期HTML元素",
          });
        }
      } catch (error) {
        console.log(`❌ ${testCase.name} 转换出错: ${error.message}`);
        this.failedTests.push({
          test: testCase.name,
          error: error.message,
        });
      }
    }
  }

  printResults() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 AI集成测试结果总结");
    console.log("=".repeat(50));

    const totalTests = this.results.length + this.failedTests.length;
    const passedTests = this.results.length;
    const failedTestsCount = this.failedTests.length;

    console.log(`✅ 通过测试: ${passedTests}`);
    console.log(`❌ 失败测试: ${failedTestsCount}`);
    console.log(`📊 总测试数: ${totalTests}`);

    if (totalTests > 0) {
      const passRate = ((passedTests / totalTests) * 100).toFixed(2);
      console.log(`📈 通过率: ${passRate}%`);
    }

    if (failedTestsCount === 0) {
      console.log("\n🎉 恭喜！所有AI集成测试都通过了！");
    } else {
      console.log("\n⚠️ 失败的测试：");
      this.failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.test}: ${test.error}`);
        if (test.prompt) {
          console.log(`   提示词: ${test.prompt}`);
        }
      });
    }

    console.log("\n📋 测试建议：");
    if (failedTestsCount > 0) {
      console.log("- 检查AI服务API密钥是否正确配置");
      console.log("- 确保网络连接正常");
      console.log("- 检查AI服务商的配额是否充足");
    } else {
      console.log("- AI功能集成完好，可以进行生产环境部署");
      console.log("- 建议进行负载测试和长时间运行测试");
    }
  }
}

// 运行测试（需要在支持ES模块的环境中运行）
console.log("📋 AI集成测试说明：");
console.log("1. 确保已启动开发服务器 (npm run dev)");
console.log("2. 在浏览器中配置AI服务API密钥");
console.log("3. 该测试脚本验证AI服务的完整集成");
console.log("4. 如需运行，请在浏览器控制台中执行相关代码\n");

// 导出测试类供其他模块使用
if (typeof window !== "undefined") {
  window.AIIntegrationTester = AIIntegrationTester;
}
