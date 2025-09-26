/**
 * 思维链检测器基础测试 - 简化版
 * 验证核心检测逻辑
 */

console.log("🧪 开始思维链检测器基础测试...\n");

// 简化的检测器实现用于测试
class SimpleThinkingChainDetector {
  static XML_PATTERNS = [
    /<thinking>([\s\S]*?)<\/thinking>/gi,
    /<think>([\s\S]*?)<\/think>/gi,
    /<reasoning>([\s\S]*?)<\/reasoning>/gi,
  ];

  static JSON_FIELD_PATTERNS = [
    "reasoning_content",
    "thinking",
    "thought_process",
  ];

  static MIN_THINKING_LENGTH = 20;

  static detectFromText(content) {
    if (!content || typeof content !== "string") {
      return {
        hasThinkingChain: false,
        thinkingContent: null,
        cleanContent: content || "",
      };
    }

    let cleanContent = content;
    let foundThinking = null;

    for (const pattern of this.XML_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);

      if (match && match[1]) {
        const thinkingText = match[1].trim();

        if (thinkingText.length >= this.MIN_THINKING_LENGTH) {
          foundThinking = thinkingText;
          cleanContent = content.replace(pattern, "").trim();
          break;
        }
      }
    }

    if (!foundThinking) {
      return {
        hasThinkingChain: false,
        thinkingContent: null,
        cleanContent,
      };
    }

    const steps = this.parseThinkingSteps(foundThinking);

    return {
      hasThinkingChain: true,
      thinkingContent: {
        steps,
        summary: `通过${steps.length}步推理完成`,
        totalSteps: steps.length,
        rawContent: foundThinking,
      },
      cleanContent,
    };
  }

  static detectFromStreamChunk(chunk) {
    if (!chunk || typeof chunk !== "object") {
      return null;
    }

    for (const fieldName of this.JSON_FIELD_PATTERNS) {
      const value = this.getNestedValue(chunk, fieldName);
      if (
        value &&
        typeof value === "string" &&
        value.trim().length >= this.MIN_THINKING_LENGTH
      ) {
        return value.trim();
      }
    }

    return null;
  }

  static parseThinkingSteps(content) {
    if (!content || content.trim().length === 0) {
      return [];
    }

    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      return [
        {
          id: "thinking_step_1",
          content: content.trim(),
          timestamp: Date.now(),
        },
      ];
    }

    return paragraphs.map((paragraph, index) => ({
      id: `thinking_step_${index + 1}`,
      content: paragraph,
      timestamp: Date.now() + index,
    }));
  }

  static getNestedValue(obj, path) {
    if (obj.hasOwnProperty(path)) {
      return obj[path];
    }

    const commonPaths = [`choices.0.delta.${path}`, `data.${path}`];

    for (const commonPath of commonPaths) {
      try {
        const value = commonPath.split(".").reduce((current, key) => {
          if (key.includes("[") && key.includes("]")) {
            const [arrayKey, indexStr] = key.split(/[\[\]]/);
            const index = parseInt(indexStr, 10);
            return current?.[arrayKey]?.[index];
          }
          return current?.[key];
        }, obj);

        if (value !== undefined && value !== null) {
          return value;
        }
      } catch (error) {
        // 忽略路径解析错误
      }
    }

    return undefined;
  }
}

// 测试用例
const testCases = [
  {
    name: "标准XML格式思维链",
    content: `
这是一个有思维链的回复。

<thinking>
我需要仔细分析这个问题。

首先，我需要理解用户的需求。

让我思考一下最佳的实现方案。
</thinking>

基于我的分析，我建议采用统一的检测器。
    `,
    expectHasThinking: true,
  },

  {
    name: "无思维链的普通回复",
    content: `
这是一个普通的AI回复，没有任何思维链内容。
希望这个回答对你有帮助。
    `,
    expectHasThinking: false,
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
    expectHasThinking: false,
  },

  {
    name: "DeepSeek格式思维链",
    content: `
<think>
这是一个关于DeepSeek reasoning模型的测试内容。
我需要确保检测器能够正确识别think标签格式。
</think>

根据分析，推荐使用统一检测机制。
    `,
    expectHasThinking: true,
  },
];

// 流式测试用例
const streamTestCases = [
  {
    name: "DeepSeek reasoning_content字段",
    chunk: {
      choices: [
        {
          delta: {
            reasoning_content:
              "这是来自DeepSeek reasoning模型的思维内容，通过reasoning_content字段传递。",
          },
        },
      ],
    },
    expectHasThinking: true,
  },

  {
    name: "智谱AI thinking字段",
    chunk: {
      choices: [
        {
          delta: {
            thinking: "这是来自智谱AI think模型的思维内容。",
          },
        },
      ],
    },
    expectHasThinking: true,
  },

  {
    name: "无思维链的普通响应",
    chunk: {
      choices: [
        {
          delta: {
            content: "这是普通内容，没有思维链字段。",
          },
        },
      ],
    },
    expectHasThinking: false,
  },
];

// 执行文本检测测试
let passedTests = 0;
let totalTests = 0;

console.log("📝 文本检测测试:\n");

testCases.forEach((testCase, index) => {
  totalTests++;
  console.log(`测试 ${index + 1}: ${testCase.name}`);

  const result = SimpleThinkingChainDetector.detectFromText(testCase.content);
  const hasThinking = result.hasThinkingChain;

  console.log(`   检测结果: ${hasThinking ? "✅ 有思维链" : "❌ 无思维链"}`);

  if (hasThinking) {
    console.log(`   步骤数量: ${result.thinkingContent.totalSteps}`);
    console.log(`   摘要: ${result.thinkingContent.summary}`);
  }

  if (hasThinking === testCase.expectHasThinking) {
    console.log("   ✅ 测试通过");
    passedTests++;
  } else {
    console.log("   ❌ 测试失败");
    console.log(
      `   期望: ${testCase.expectHasThinking ? "有思维链" : "无思维链"}`
    );
    console.log(`   实际: ${hasThinking ? "有思维链" : "无思维链"}`);
  }

  console.log("");
});

// 执行流式检测测试
console.log("🔄 流式检测测试:\n");

streamTestCases.forEach((testCase, index) => {
  totalTests++;
  console.log(`流式测试 ${index + 1}: ${testCase.name}`);

  const result = SimpleThinkingChainDetector.detectFromStreamChunk(
    testCase.chunk
  );
  const hasThinking = !!result;

  console.log(`   检测结果: ${hasThinking ? "✅ 有思维链" : "❌ 无思维链"}`);

  if (hasThinking) {
    console.log(`   内容预览: ${result.substring(0, 50)}...`);
  }

  if (hasThinking === testCase.expectHasThinking) {
    console.log("   ✅ 测试通过");
    passedTests++;
  } else {
    console.log("   ❌ 测试失败");
  }

  console.log("");
});

// 边界情况测试
console.log("🔍 边界情况测试:\n");

// 空内容测试
totalTests++;
const emptyResult = SimpleThinkingChainDetector.detectFromText("");
if (!emptyResult.hasThinkingChain) {
  console.log("✅ 空内容测试通过");
  passedTests++;
} else {
  console.log("❌ 空内容测试失败");
}

// null内容测试
totalTests++;
const nullResult = SimpleThinkingChainDetector.detectFromText(null);
if (!nullResult.hasThinkingChain) {
  console.log("✅ null内容测试通过");
  passedTests++;
} else {
  console.log("❌ null内容测试失败");
}

// 输出测试结果
console.log("\n📊 测试结果总览:");
console.log(`总测试数: ${totalTests}`);
console.log(`通过测试: ${passedTests}`);
console.log(`失败测试: ${totalTests - passedTests}`);
console.log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log("\n🎉 所有测试通过！思维链检测机制工作正常。");
  console.log("\n✅ 验证结果:");
  console.log("  - XML标签格式检测 ✅");
  console.log("  - JSON字段格式检测 ✅");
  console.log("  - 短内容过滤 ✅");
  console.log("  - 边界情况处理 ✅");
  console.log("  - 多种AI提供商格式支持 ✅");
} else {
  console.log("\n⚠️ 部分测试失败，需要检查实现。");
}
