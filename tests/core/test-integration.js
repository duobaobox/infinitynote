/**
 * AI功能集成测试脚本
 * 验证完整的AI生成工作流程
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🧪 InfinityNote AI功能集成测试");
console.log("==========================================");

// 测试文件存在性
const testFiles = [
  "src/components/AIFunctionTest/index.tsx",
  "src/components/AIGenerationControl/index.tsx",
  "src/components/AIGenerationStatus/index.tsx",
  "src/components/NoteToolbar/NoteToolbar.tsx",
  "src/services/aiService.ts",
  "src/types/ai.ts",
];

console.log("📁 验证核心文件存在性:");
testFiles.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? "✅" : "❌"} ${file}`);
});

// 测试组件集成
console.log("\n🔗 验证组件集成:");

try {
  // 读取 NoteToolbar 并检查 AI 相关导入
  const toolbarContent = fs.readFileSync(
    path.join(__dirname, "src/components/NoteToolbar/NoteToolbar.tsx"),
    "utf8"
  );
  const hasAIImport = toolbarContent.includes("import { AIGenerationControl }");
  const hasAIButton = toolbarContent.includes("RobotOutlined");
  console.log(`${hasAIImport ? "✅" : "❌"} NoteToolbar AI组件导入`);
  console.log(`${hasAIButton ? "✅" : "❌"} NoteToolbar AI按钮`);

  // 读取 Main 页面并检查 AI 测试组件
  const mainContent = fs.readFileSync(
    path.join(__dirname, "src/pages/Main/index.tsx"),
    "utf8"
  );
  const hasTestComponent = mainContent.includes("AIFunctionTest");
  console.log(`${hasTestComponent ? "✅" : "❌"} Main页面 AI测试组件`);

  // 检查 AI 服务配置
  const aiServiceContent = fs.readFileSync(
    path.join(__dirname, "src/services/aiService.ts"),
    "utf8"
  );
  const hasZhipuProvider = aiServiceContent.includes("ZhipuAIProvider");
  const hasStreamSupport = aiServiceContent.includes("onStream");
  console.log(`${hasZhipuProvider ? "✅" : "❌"} AI服务 智谱AI提供商`);
  console.log(`${hasStreamSupport ? "✅" : "❌"} AI服务 流式生成支持`);
} catch (error) {
  console.log(`❌ 文件读取失败: ${error.message}`);
}

console.log("\n🎯 集成测试要点:");
console.log("1. 在浏览器右上角应该看到 'AI功能测试' 面板");
console.log("2. 创建便签后，悬停便签应显示工具栏");
console.log("3. 点击工具栏的机器人图标应弹出AI生成对话框");
console.log("4. 设置页面应有 'AI模型' 标签页用于配置API密钥");

console.log("\n⚠️  测试前请确保:");
console.log("- 开发服务器正在运行 (npm run dev)");
console.log("- 配置了有效的AI API密钥");
console.log("- 浏览器已打开 http://localhost:5173");

console.log("==========================================");
