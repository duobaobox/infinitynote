/**
 * AI提供商功能测试脚本
 * 验证重构后的AI提供商是否正常工作
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 开始AI提供商功能测试...\n");

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

// 1. 测试AI提供商文件存在性
console.log("📁 测试AI提供商文件结构:");

const providerFiles = [
  "src/services/ai/BaseAIProvider.ts",
  "src/services/ai/ZhipuAIProvider.ts",
  "src/services/ai/DeepSeekProvider.ts",
  "src/services/ai/OpenAIProvider.ts",
  "src/services/ai/AlibabaProvider.ts",
  "src/services/ai/SiliconFlowProvider.ts",
  "src/services/ai/AnthropicProvider.ts",
];

providerFiles.forEach((file) => {
  runTest(`${file} 文件存在`, () => {
    return fs.existsSync(path.join(__dirname, "..", file));
  });
});

// 2. 测试BaseAIProvider基础类
console.log("\n🏗️ 测试BaseAIProvider基础类:");

runTest("BaseAIProvider 导出正确的接口", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  return (
    content.includes("export abstract class BaseAIProvider") &&
    content.includes("interface AIProviderConfig") &&
    content.includes("interface RequestBodyBuilder") &&
    content.includes("interface ResponseParser")
  );
});

runTest("BaseAIProvider 包含核心方法", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  return (
    content.includes("async generateContent") &&
    content.includes("protected async getApiKey") &&
    content.includes("protected async makeRequest") &&
    content.includes("protected async handleStreamResponse")
  );
});

// 3. 测试各个AI提供商实现
console.log("\n🤖 测试AI提供商实现:");

const providers = [
  {
    name: "ZhipuAIProvider",
    file: "ZhipuAIProvider.ts",
    expectedName: "zhipu",
  },
  {
    name: "DeepSeekProvider",
    file: "DeepSeekProvider.ts",
    expectedName: "deepseek",
  },
  { name: "OpenAIProvider", file: "OpenAIProvider.ts", expectedName: "openai" },
  {
    name: "AlibabaProvider",
    file: "AlibabaProvider.ts",
    expectedName: "alibaba",
  },
  {
    name: "SiliconFlowProvider",
    file: "SiliconFlowProvider.ts",
    expectedName: "siliconflow",
  },
  {
    name: "AnthropicProvider",
    file: "AnthropicProvider.ts",
    expectedName: "anthropic",
  },
];

providers.forEach((provider) => {
  runTest(`${provider.name} 继承BaseAIProvider`, () => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", `src/services/ai/${provider.file}`),
      "utf8"
    );
    return (
      content.includes("extends BaseAIProvider") &&
      content.includes(`readonly name = "${provider.expectedName}"`)
    );
  });

  runTest(`${provider.name} 实现必需的属性`, () => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", `src/services/ai/${provider.file}`),
      "utf8"
    );
    return (
      content.includes("protected readonly config: AIProviderConfig") &&
      content.includes("protected readonly requestBuilder") &&
      content.includes("protected readonly responseParser")
    );
  });

  runTest(`${provider.name} 包含RequestBuilder和ResponseParser`, () => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", `src/services/ai/${provider.file}`),
      "utf8"
    );
    // 使用更灵活的匹配，检查是否包含RequestBuilder和ResponseParser类
    return (
      content.includes("RequestBuilder") &&
      content.includes("ResponseParser") &&
      content.includes("implements RequestBodyBuilder") &&
      content.includes("implements ResponseParser")
    );
  });
});

// 4. 测试AI服务集成
console.log("\n🔧 测试AI服务集成:");

runTest("AIService 使用懒加载提供商", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/aiService.ts"),
    "utf8"
  );
  return (
    content.includes("private async getProvider") &&
    content.includes("webpackChunkName") &&
    !content.includes("import { ZhipuAIProvider }")
  ); // 确保不是静态导入
});

runTest("AIService 支持所有提供商", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/services/aiService.ts"),
    "utf8"
  );
  return providers.every((provider) =>
    content.includes(`case "${provider.expectedName}":`)
  );
});

// 5. 测试Markdown转换器优化
console.log("\n📝 测试Markdown转换器优化:");

runTest("markdownConverter 使用懒加载", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    content.includes("private async ensureInitialized") &&
    content.includes('webpackChunkName: "markdown-it"') &&
    content.includes("await import")
  );
});

runTest("markdownConverter 包含内存管理", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    content.includes("getMemoryInfo") &&
    content.includes("cleanup") &&
    content.includes("forceGarbageCollection")
  );
});

runTest("移除了ProseMirror依赖", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  // 检查是否没有实际的ProseMirror导入（排除注释）
  const lines = content.split("\n");
  const importLines = lines.filter(
    (line) =>
      line.trim().startsWith("import") &&
      line.includes("prosemirror") &&
      !line.trim().startsWith("//")
  );
  return importLines.length === 0;
});

// 6. 测试包依赖优化
console.log("\n📦 测试包依赖优化:");

runTest("移除了未使用的依赖", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
  );
  const dependencies = packageJson.dependencies || {};

  // 检查已移除的依赖
  const removedDeps = [
    "prosemirror-markdown",
    "@tiptap/extension-bubble-menu",
    "@tiptap/extension-floating-menu",
  ];

  return removedDeps.every((dep) => !dependencies[dep]);
});

runTest("保留了必要的依赖", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
  );
  const dependencies = packageJson.dependencies || {};

  // 检查保留的依赖
  const requiredDeps = [
    "markdown-it",
    "@tiptap/core",
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-color",
    "@tiptap/extension-text-style",
    "@tiptap/extension-text-align",
    "@tiptap/extension-list-item",
  ];

  return requiredDeps.every((dep) => dependencies[dep]);
});

// 7. 测试构建配置优化
console.log("\n⚙️ 测试构建配置优化:");

runTest("Vite配置包含代码分割", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "vite.config.ts"),
    "utf8"
  );
  return (
    content.includes("manualChunks") &&
    content.includes("react-vendor") &&
    content.includes("ui-vendor") &&
    content.includes("editor-vendor")
  );
});

runTest("Vite配置包含压缩优化", () => {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "vite.config.ts"),
    "utf8"
  );
  return (
    content.includes('minify: "terser"') &&
    content.includes("chunkSizeWarningLimit")
  );
});

// 输出测试结果
console.log("\n📊 测试结果统计:");
console.log(`总测试数: ${totalTests}`);
console.log(`通过: ${passedTests} ✅`);
console.log(`失败: ${failedTests} ❌`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log("\n🎉 所有测试通过！AI提供商重构成功！");
} else {
  console.log("\n⚠️ 部分测试失败，需要检查相关功能。");
}

// 返回测试结果
process.exit(failedTests === 0 ? 0 : 1);
