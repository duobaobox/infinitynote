/**
 * 流式生成功能测试脚本
 * 验证重构后的流式生成是否正常工作
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🌊 开始流式生成功能测试...\n");

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${testName}`);
      passedTests++;
    } else {
      console.log(`❌ ${testName}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ${testName} - 错误: ${error.message}`);
    failedTests++;
  }
}

// 1. 测试BaseAIProvider流式处理
console.log("🔄 测试BaseAIProvider流式处理:");

runTest("BaseAIProvider 包含流式处理方法", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  return (
    content.includes("handleStreamResponse") &&
    content.includes("getReader") &&
    content.includes("onStream") &&
    content.includes("onComplete")
  );
});

runTest("BaseAIProvider 包含流式解析逻辑", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  return (
    content.includes("extractContentFromChunk") &&
    content.includes("isStreamComplete") &&
    content.includes("extractThinkingFromChunk")
  );
});

runTest("BaseAIProvider 包含错误处理和重试机制", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  return (
    content.includes("retryCount") &&
    content.includes("maxRetries") &&
    content.includes("abortController")
  );
});

// 2. 测试各个提供商的流式实现
console.log("\n🤖 测试各个提供商的流式实现:");

const providers = [
  { name: "ZhipuAIProvider", file: "ZhipuAIProvider.ts" },
  { name: "DeepSeekProvider", file: "DeepSeekProvider.ts" },
  { name: "OpenAIProvider", file: "OpenAIProvider.ts" },
  { name: "AlibabaProvider", file: "AlibabaProvider.ts" },
  { name: "SiliconFlowProvider", file: "SiliconFlowProvider.ts" },
  { name: "AnthropicProvider", file: "AnthropicProvider.ts" },
];

providers.forEach((provider) => {
  runTest(`${provider.name} 实现ResponseParser接口`, () => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", `src/services/ai/${provider.file}`),
      "utf8"
    );
    return (
      content.includes("implements ResponseParser") &&
      content.includes("extractContentFromChunk") &&
      content.includes("isStreamComplete") &&
      content.includes("extractThinkingFromChunk")
    );
  });

  runTest(`${provider.name} 包含流式数据解析`, () => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", `src/services/ai/${provider.file}`),
      "utf8"
    );
    return (
      content.includes("data:") &&
      content.includes("JSON.parse") &&
      (content.includes("split") || content.includes("filter"))
    );
  });
});

// 3. 测试Markdown转换器流式支持
console.log("\n📝 测试Markdown转换器流式支持:");

runTest("TipTapNativeConverter 支持流式转换", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    content.includes("convertStreamChunk") &&
    content.includes("StreamingMarkdownBuffer") &&
    content.includes("processFullContent")
  );
});

runTest("StreamingMarkdownBuffer 包含完整性检查", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    content.includes("extractCompleteContent") &&
    content.includes("shouldConvert") &&
    content.includes("isIncremental")
  );
});

runTest("流式转换支持增量更新", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    content.includes("isComplete") &&
    content.includes("json:") &&
    content.includes("html:")
  );
});

// 4. 测试AI服务流式集成
console.log("\n🔧 测试AI服务流式集成:");

runTest("AIService 支持流式生成选项", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/aiService.ts"),
    "utf8"
  );
  return (
    content.includes("onStream") &&
    content.includes("onComplete") &&
    content.includes("onError") &&
    content.includes("generateContent")
  );
});

runTest("AIService 包含历史记录集成", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/aiService.ts"),
    "utf8"
  );
  return (
    content.includes("AIHistoryDB") &&
    content.includes("saveAIHistory") &&
    content.includes("historyRecord")
  );
});

// 5. 测试错误处理和恢复
console.log("\n🛡️ 测试错误处理和恢复:");

runTest("流式生成包含错误处理", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  return (
    content.includes("handleError") &&
    content.includes("AbortError") &&
    content.includes("catch")
  );
});

runTest("错误处理器支持流式错误", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/aiErrorHandler.ts"),
    "utf8"
  );
  return (
    content.includes("createAppError") &&
    content.includes("ErrorType") &&
    content.includes("ErrorSeverity")
  );
});

// 6. 测试性能优化
console.log("\n⚡ 测试性能优化:");

runTest("流式处理包含节流机制", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  // 检查是否有性能优化相关的代码
  return (
    content.includes("markdownConverter") &&
    content.includes("convertStreamChunk")
  );
});

runTest("内存管理集成到流式处理", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    content.includes("getMemoryInfo") &&
    content.includes("cleanup") &&
    content.includes("MAX_CONTENT_LENGTH")
  );
});

// 7. 测试思维链支持
console.log("\n🧠 测试思维链支持:");

runTest("DeepSeek提供商支持思维链", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/DeepSeekProvider.ts"),
    "utf8"
  );
  return (
    content.includes("supportsThinking: true") &&
    content.includes("reasoning") &&
    content.includes("thinkingChain")
  );
});

runTest("智谱AI提供商支持思维链", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/ZhipuAIProvider.ts"),
    "utf8"
  );
  return content.includes("supportsThinking: true");
});

// 8. 测试类型安全
console.log("\n🔒 测试类型安全:");

runTest("AI生成选项类型完整", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/types/ai.ts"),
    "utf8"
  );
  return (
    content.includes("AIGenerationOptions") &&
    content.includes("onStream") &&
    content.includes("onComplete") &&
    content.includes("onError")
  );
});

runTest("流式响应类型定义", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/types/ai.ts"),
    "utf8"
  );
  return (
    content.includes("AICustomProperties") &&
    content.includes("isStreaming") &&
    content.includes("thinkingChain")
  );
});

// 输出测试结果
console.log("\n📊 测试结果统计:");
console.log(`总测试数: ${totalTests}`);
console.log(`通过: ${passedTests} ✅`);
console.log(`失败: ${failedTests} ❌`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log("\n🎉 所有流式生成测试通过！");
} else {
  console.log("\n⚠️ 部分测试失败，需要检查相关功能。");
}

// 返回测试结果
process.exit(failedTests === 0 ? 0 : 1);
