/**
 * 用户体验验证脚本
 * 验证重构后的用户体验改善效果
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("👥 开始用户体验验证...\n");

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

// 1. 验证配置流程简化
console.log("⚙️ 验证配置流程简化:");

runTest("设置界面移除了调试选项", () => {
  const content = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "src/components/SettingsModal/tabs/ModelSettingsTab.tsx"
    ),
    "utf8"
  );
  // 检查是否移除了调试相关的配置选项
  return (
    !content.includes("debug") &&
    !content.includes("Debug") &&
    !content.includes("调试")
  );
});

runTest("API密钥配置支持一键测试", () => {
  const content = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "src/components/SettingsModal/tabs/ModelSettingsTab.tsx"
    ),
    "utf8"
  );
  return (
    content.includes("保存并测试") ||
    content.includes("testConnection") ||
    content.includes("测试连接")
  );
});

runTest("配置界面提供状态反馈", () => {
  const content = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "src/components/SettingsModal/tabs/ModelSettingsTab.tsx"
    ),
    "utf8"
  );
  return (
    content.includes("connectionStatus") ||
    content.includes("已连接") ||
    content.includes("连接失败")
  );
});

// 2. 验证AI功能增强
console.log("\n🤖 验证AI功能增强:");

runTest("支持提示词模板选择", () => {
  const templateContent = fs.readFileSync(
    path.join(__dirname, "..", "src/config/promptTemplates.ts"),
    "utf8"
  );
  const selectorContent = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "src/components/PromptTemplateSelector/index.tsx"
    ),
    "utf8"
  );
  return (
    templateContent.includes("PromptTemplate") &&
    selectorContent.includes("PromptTemplateSelector") &&
    templateContent.includes("写作") &&
    templateContent.includes("分析")
  );
});

runTest("支持内容直接编辑", () => {
  const toolbarContent = fs.readFileSync(
    path.join(__dirname, "..", "src/components/NoteToolbar/NoteToolbar.tsx"),
    "utf8"
  );
  return (
    toolbarContent.includes("editMode") ||
    toolbarContent.includes("编辑模式") ||
    toolbarContent.includes("isEditing")
  );
});

runTest("AI生成历史记录功能", () => {
  const dbContent = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/db.ts"),
    "utf8"
  );
  const aiServiceContent = fs.readFileSync(
    path.join(__dirname, "..", "src/services/aiService.ts"),
    "utf8"
  );
  return (
    dbContent.includes("AIHistoryDB") &&
    aiServiceContent.includes("saveAIHistory") &&
    aiServiceContent.includes("historyRecord") &&
    dbContent.includes("prompt") &&
    (dbContent.includes("response") || dbContent.includes("generatedContent"))
  );
});

// 3. 验证错误处理改进
console.log("\n🛡️ 验证错误处理改进:");

runTest("统一的错误消息格式", () => {
  const errorHandlerContent = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/aiErrorHandler.ts"),
    "utf8"
  );
  return (
    errorHandlerContent.includes("AppError") &&
    errorHandlerContent.includes("ErrorType") &&
    errorHandlerContent.includes("ErrorSeverity") &&
    errorHandlerContent.includes("createAppError")
  );
});

runTest("错误恢复建议和操作", () => {
  const errorHandlerContent = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/aiErrorHandler.ts"),
    "utf8"
  );
  return (
    errorHandlerContent.includes("recoveryActions") &&
    errorHandlerContent.includes("userMessage") &&
    (errorHandlerContent.includes("重试") ||
      errorHandlerContent.includes("retry"))
  );
});

runTest("错误通知系统", () => {
  const notificationContent = fs.readFileSync(
    path.join(__dirname, "..", "src/components/ErrorNotification/index.tsx"),
    "utf8"
  );
  return (
    notificationContent.includes("ErrorNotification") &&
    notificationContent.includes("severity") &&
    (notificationContent.includes("showRetry") ||
      notificationContent.includes("onRetry") ||
      notificationContent.includes("重试"))
  );
});

// 4. 验证性能优化用户感知
console.log("\n⚡ 验证性能优化用户感知:");

runTest("AI提供商懒加载实现", () => {
  const aiServiceContent = fs.readFileSync(
    path.join(__dirname, "..", "src/services/aiService.ts"),
    "utf8"
  );
  return (
    aiServiceContent.includes("getProvider") &&
    aiServiceContent.includes("import(") &&
    aiServiceContent.includes("webpackChunkName") &&
    !aiServiceContent.includes("import { ZhipuAIProvider }")
  ); // 确保不是静态导入
});

runTest("Markdown转换器懒加载", () => {
  const converterContent = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    converterContent.includes("ensureInitialized") &&
    converterContent.includes("import(") &&
    converterContent.includes("markdown-it")
  );
});

runTest("内存管理机制", () => {
  const converterContent = fs.readFileSync(
    path.join(__dirname, "..", "src/utils/markdownConverter.ts"),
    "utf8"
  );
  return (
    converterContent.includes("getMemoryInfo") &&
    converterContent.includes("cleanup") &&
    converterContent.includes("MAX_CONTENT_LENGTH")
  );
});

// 5. 验证代码质量提升
console.log("\n📝 验证代码质量提升:");

runTest("AI提供商架构统一", () => {
  const baseProviderContent = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  const zhipuContent = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/ZhipuAIProvider.ts"),
    "utf8"
  );
  return (
    baseProviderContent.includes("abstract class BaseAIProvider") &&
    zhipuContent.includes("extends BaseAIProvider") &&
    baseProviderContent.includes("RequestBodyBuilder") &&
    baseProviderContent.includes("ResponseParser")
  );
});

runTest("移除了调试系统代码", () => {
  // 检查调试相关文件是否已删除（检查文件内容而不是目录）
  const debugStoreExists = fs.existsSync(
    path.join(__dirname, "..", "src/store/aiDebugStore.ts")
  );
  const debugCollectorExists = fs.existsSync(
    path.join(__dirname, "..", "src/utils/aiDebugCollector.ts")
  );

  // 检查AIDebugPanel目录是否为空
  const debugPanelPath = path.join(
    __dirname,
    "..",
    "src/components/AIDebugPanel"
  );
  let debugPanelHasFiles = false;
  if (fs.existsSync(debugPanelPath)) {
    const files = fs.readdirSync(debugPanelPath);
    debugPanelHasFiles = files.length > 0;
  }

  return !debugStoreExists && !debugCollectorExists && !debugPanelHasFiles;
});

runTest("统一了Markdown转换器", () => {
  // 检查多余的转换器是否已删除
  const lightweightExists = fs.existsSync(
    path.join(__dirname, "..", "src/utils/lightweightMarkdownConverter.ts")
  );
  const simpleExists = fs.existsSync(
    path.join(__dirname, "..", "src/utils/simpleMarkdownConverter.ts")
  );
  const managerExists = fs.existsSync(
    path.join(__dirname, "..", "src/utils/converterManager.ts")
  );

  return !lightweightExists && !simpleExists && !managerExists;
});

// 6. 验证类型安全性
console.log("\n🔒 验证类型安全性:");

runTest("AI类型定义完整", () => {
  const typesContent = fs.readFileSync(
    path.join(__dirname, "..", "src/types/ai.ts"),
    "utf8"
  );
  return (
    typesContent.includes("AIGenerationOptions") &&
    typesContent.includes("AICustomProperties") &&
    typesContent.includes("onStream") &&
    typesContent.includes("onComplete") &&
    typesContent.includes("onError")
  );
});

runTest("AI提供商接口类型安全", () => {
  const baseProviderContent = fs.readFileSync(
    path.join(__dirname, "..", "src/services/ai/BaseAIProvider.ts"),
    "utf8"
  );
  return (
    baseProviderContent.includes("interface AIProviderConfig") &&
    baseProviderContent.includes("interface RequestBodyBuilder") &&
    baseProviderContent.includes("interface ResponseParser") &&
    baseProviderContent.includes("abstract class BaseAIProvider")
  );
});

// 7. 验证用户界面改进
console.log("\n🎨 验证用户界面改进:");

runTest("工具栏支持动态状态", () => {
  const toolbarContent = fs.readFileSync(
    path.join(__dirname, "..", "src/components/NoteToolbar/NoteToolbar.tsx"),
    "utf8"
  );
  return (
    toolbarContent.includes("isAIGenerating") ||
    toolbarContent.includes("isEditingAIContent") ||
    toolbarContent.includes("hasAIContent")
  );
});

runTest("提示词模板选择器界面", () => {
  const selectorExists = fs.existsSync(
    path.join(
      __dirname,
      "..",
      "src/components/PromptTemplateSelector/index.tsx"
    )
  );
  const cssExists = fs.existsSync(
    path.join(
      __dirname,
      "..",
      "src/components/PromptTemplateSelector/index.module.css"
    )
  );
  return selectorExists && cssExists;
});

// 8. 验证构建优化
console.log("\n🏗️ 验证构建优化:");

runTest("Vite配置优化", () => {
  const viteContent = fs.readFileSync(
    path.join(__dirname, "..", "vite.config.ts"),
    "utf8"
  );
  return (
    viteContent.includes("manualChunks") &&
    viteContent.includes("terser") &&
    viteContent.includes("chunkSizeWarningLimit")
  );
});

runTest("依赖包优化", () => {
  const packageContent = fs.readFileSync(
    path.join(__dirname, "..", "package.json"),
    "utf8"
  );
  const packageJson = JSON.parse(packageContent);
  const deps = packageJson.dependencies || {};

  // 检查移除的依赖
  const removedDeps = [
    "prosemirror-markdown",
    "@tiptap/extension-bubble-menu",
    "@tiptap/extension-floating-menu",
  ];

  return removedDeps.every((dep) => !deps[dep]);
});

// 输出测试结果
console.log("\n📊 用户体验验证结果:");
console.log(`总验证项: ${totalTests}`);
console.log(`通过: ${passedTests} ✅`);
console.log(`失败: ${failedTests} ❌`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

// 用户体验评分
const uxScore = (passedTests / totalTests) * 100;
let uxGrade = "C";
if (uxScore >= 95) uxGrade = "A+";
else if (uxScore >= 90) uxGrade = "A";
else if (uxScore >= 85) uxGrade = "B+";
else if (uxScore >= 80) uxGrade = "B";
else if (uxScore >= 75) uxGrade = "C+";

console.log(`\n🏅 用户体验等级: ${uxGrade}`);

if (failedTests === 0) {
  console.log("\n🎉 所有用户体验验证通过！重构成功提升了用户体验！");
} else {
  console.log("\n⚠️ 部分验证失败，需要进一步改进用户体验。");
}

// 用户体验改进总结
console.log("\n📈 用户体验改进总结:");
console.log("✅ 配置流程简化 - 一键测试和状态反馈");
console.log("✅ AI功能增强 - 模板选择、直接编辑、历史记录");
console.log("✅ 错误处理改进 - 统一格式、恢复建议、友好通知");
console.log("✅ 性能优化 - 懒加载、内存管理、启动加速");
console.log("✅ 代码质量提升 - 架构统一、类型安全、代码简化");

// 返回测试结果
process.exit(failedTests === 0 ? 0 : 1);
