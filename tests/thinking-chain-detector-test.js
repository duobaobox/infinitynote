/**
 * 思维链检测器测试
 * 验证自动检测机制的准确性和健壮性
 */

import { ThinkingChainDetector } from "../src/utils/thinkingChainDetector";

console.log("🧪 开始思维链检测器测试...\n");

// 测试数据集
const testCases = [
  {
    name: "标准XML格式思维链",
    content: `
这是一个有思维链的回复。

<thinking>
我需要仔细分析这个问题。

首先，我需要理解用户的需求。用户想要了解如何实现自动检测思维链的功能。

让我思考一下最佳的实现方案：
1. 检测XML标签格式
2. 检测JSON字段格式
3. 提供统一的接口

这样可以确保兼容性和扩展性。
</thinking>

基于我的分析，我建议采用统一的检测器来处理不同格式的思维链内容。
    `,
    expectHasThinking: true,
    expectedSteps: 4, // 预期会分割成4个步骤
  },

  {
    name: "DeepSeek格式思维链",
    content: `
用户询问关于技术实现的问题。

<think>
这是一个关于DeepSeek reasoning模型的测试。

我需要确保检测器能够正确识别<think>标签格式的思维链内容。

检测逻辑应该支持多种标签格式。
</think>

根据分析，我推荐使用统一的检测机制。
    `,
    expectHasThinking: true,
    expectedSteps: 3,
  },

  {
    name: "无思维链的普通回复",
    content: `
这是一个普通的AI回复，没有任何思维链内容。

我会直接回答用户的问题，不需要展示思考过程。

希望这个回答对你有帮助。
    `,
    expectHasThinking: false,
    expectedSteps: 0,
  },

  {
    name: "误检测防护 - 代码示例中的thinking标签",
    content: `
这是一个包含代码示例的回复：

\`\`\`html
<div>
  <thinking>这只是示例代码，不是真正的思维链</thinking>
</div>
\`\`\`

真正的思维链应该在这里：

<thinking>
实际的思维过程应该被正确识别。
</thinking>

代码示例不应该被误识别为思维链。
    `,
    expectHasThinking: true,
    expectedSteps: 1,
  },

  {
    name: "很短的思维链内容（应该被过滤）",
    content: `
这是一个测试短内容的例子。

<thinking>
短
</thinking>

这种过短的内容应该被过滤掉。
    `,
    expectHasThinking: false, // 应该被最小长度过滤器过滤
    expectedSteps: 0,
  },

  {
    name: "JSON字段格式测试（模拟流式响应）",
    streamChunk: {
      choices: [
        {
          delta: {
            reasoning_content:
              "这是来自DeepSeek reasoning模型的思维内容，通过reasoning_content字段传递。",
          },
        },
      ],
    },
    expectStreamThinking: true,
  },

  {
    name: "智谱AI thinking字段测试",
    streamChunk: {
      choices: [
        {
          delta: {
            thinking: "这是来自智谱AI think模型的思维内容。",
          },
        },
      ],
    },
    expectStreamThinking: true,
  },

  {
    name: "无思维链的流式响应",
    streamChunk: {
      choices: [
        {
          delta: {
            content: "这是普通的内容，没有思维链字段。",
          },
        },
      ],
    },
    expectStreamThinking: false,
  },
];

// 执行测试
let passedTests = 0;
let totalTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`📝 测试 ${index + 1}: ${testCase.name}`);

  if (testCase.content) {
    // 测试文本内容检测
    totalTests++;
    const result = ThinkingChainDetector.detectFromText(testCase.content);

    const hasThinking = result.hasThinkingChain;
    const stepsCount = result.thinkingContent?.totalSteps || 0;

    console.log(`   检测结果: ${hasThinking ? "✅ 有思维链" : "❌ 无思维链"}`);
    if (hasThinking) {
      console.log(`   步骤数量: ${stepsCount}`);
      console.log(`   摘要: ${result.thinkingContent?.summary}`);
    }

    const expectationMet =
      hasThinking === testCase.expectHasThinking &&
      stepsCount === testCase.expectedSteps;

    if (expectationMet) {
      console.log(`   ✅ 测试通过`);
      passedTests++;
    } else {
      console.log(`   ❌ 测试失败`);
      console.log(
        `   期望: 有思维链=${testCase.expectHasThinking}, 步骤=${testCase.expectedSteps}`
      );
      console.log(`   实际: 有思维链=${hasThinking}, 步骤=${stepsCount}`);
    }
  }

  if (testCase.streamChunk) {
    // 测试流式内容检测
    totalTests++;
    const streamResult = ThinkingChainDetector.detectFromStreamChunk(
      testCase.streamChunk
    );

    const hasStreamThinking = !!streamResult;

    console.log(
      `   流式检测结果: ${hasStreamThinking ? "✅ 有思维链" : "❌ 无思维链"}`
    );
    if (hasStreamThinking) {
      console.log(`   内容预览: ${streamResult.substring(0, 50)}...`);
    }

    const streamExpectationMet =
      hasStreamThinking === testCase.expectStreamThinking;

    if (streamExpectationMet) {
      console.log(`   ✅ 流式测试通过`);
      passedTests++;
    } else {
      console.log(`   ❌ 流式测试失败`);
      console.log(`   期望: ${testCase.expectStreamThinking}`);
      console.log(`   实际: ${hasStreamThinking}`);
    }
  }

  console.log("");
});

// 边界情况测试
console.log("🔍 边界情况测试...\n");

// 测试1: 空内容
totalTests++;
const emptyResult = ThinkingChainDetector.detectFromText("");
if (!emptyResult.hasThinkingChain) {
  console.log("✅ 空内容测试通过");
  passedTests++;
} else {
  console.log("❌ 空内容测试失败");
}

// 测试2: null/undefined处理
totalTests++;
const nullResult = ThinkingChainDetector.detectFromText(null);
if (!nullResult.hasThinkingChain) {
  console.log("✅ null内容测试通过");
  passedTests++;
} else {
  console.log("❌ null内容测试失败");
}

// 测试3: 超长内容性能测试
totalTests++;
const longContent = "a".repeat(200000) + "<thinking>test</thinking>";
const startTime = Date.now();
const longResult = ThinkingChainDetector.detectFromText(longContent);
const endTime = Date.now();

if (endTime - startTime < 1000) {
  // 应该在1秒内完成
  console.log("✅ 性能测试通过 (用时: " + (endTime - startTime) + "ms)");
  passedTests++;
} else {
  console.log("❌ 性能测试失败 (用时: " + (endTime - startTime) + "ms)");
}

// 综合检测测试
console.log("\n🔄 综合检测测试...\n");

totalTests++;
const textWithThinking = `
回答用户问题前先思考一下。

<thinking>
这是文本中的思维链内容。
</thinking>

这是最终的回答内容。
`;

const combinedResult =
  ThinkingChainDetector.detectThinkingChain(textWithThinking);
if (
  combinedResult.hasThinkingChain &&
  combinedResult.cleanContent.includes("这是最终的回答内容")
) {
  console.log("✅ 综合检测测试通过");
  passedTests++;
} else {
  console.log("❌ 综合检测测试失败");
}

// 输出测试结果
console.log("\n📊 测试结果总览:");
console.log(`总测试数: ${totalTests}`);
console.log(`通过测试: ${passedTests}`);
console.log(`失败测试: ${totalTests - passedTests}`);
console.log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log("\n🎉 所有测试通过！思维链检测器工作正常。");
} else {
  console.log("\n⚠️ 部分测试失败，需要检查实现。");
  process.exit(1);
}
