/**
 * DeepSeek支持验证脚本
 * 验证DeepSeek提供商是否正确集成
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🔍 DeepSeek支持验证测试");
console.log("==========================================");

// 验证AI服务文件
try {
  const aiServiceContent = fs.readFileSync(
    path.join(__dirname, "src/services/aiService.ts"),
    "utf8"
  );

  // 检查DeepSeek相关代码
  const hasDeepSeekProvider = aiServiceContent.includes(
    "class DeepSeekProvider"
  );
  const hasDeepSeekRegistration = aiServiceContent.includes(
    'this.providers.set("deepseek", new DeepSeekProvider())'
  );
  const hasDeepSeekValidation = aiServiceContent.includes(
    "deepseek: /^sk-[a-zA-Z0-9]{32,}$/"
  );
  const hasDeepSeekTest = aiServiceContent.includes('case "deepseek"');

  console.log("📁 AI服务层验证:");
  console.log(`${hasDeepSeekProvider ? "✅" : "❌"} DeepSeekProvider类定义`);
  console.log(`${hasDeepSeekRegistration ? "✅" : "❌"} DeepSeek提供商注册`);
  console.log(`${hasDeepSeekValidation ? "✅" : "❌"} DeepSeek API密钥验证`);
  console.log(`${hasDeepSeekTest ? "✅" : "❌"} DeepSeek连接测试支持`);
} catch (error) {
  console.log(`❌ AI服务文件读取失败: ${error.message}`);
}

// 验证设置界面
try {
  const settingsContent = fs.readFileSync(
    path.join(
      __dirname,
      "src/components/SettingsModal/tabs/ModelSettingsTab.tsx"
    ),
    "utf8"
  );

  const hasConnectionStatus = settingsContent.includes("connectionStatus");
  const hasApiKeyInputs = settingsContent.includes("apiKeyInputs");
  const hasSaveFunction = settingsContent.includes("saveApiKey");
  const hasImprovedUI = settingsContent.includes("连接测试成功，模型可以使用");

  console.log("\n🖥️  设置界面验证:");
  console.log(`${hasConnectionStatus ? "✅" : "❌"} 连接状态管理`);
  console.log(`${hasApiKeyInputs ? "✅" : "❌"} API密钥输入管理`);
  console.log(`${hasSaveFunction ? "✅" : "❌"} 保存函数实现`);
  console.log(`${hasImprovedUI ? "✅" : "❌"} 改进的UI反馈`);
} catch (error) {
  console.log(`❌ 设置界面文件读取失败: ${error.message}`);
}

// 验证常量配置
try {
  const constantsContent = fs.readFileSync(
    path.join(__dirname, "src/components/SettingsModal/constants.ts"),
    "utf8"
  );

  const hasDeepSeekInProviders = constantsContent.includes('"deepseek"');
  const hasDeepSeekModels = constantsContent.includes("deepseek: [");

  console.log("\n📋 常量配置验证:");
  console.log(`${hasDeepSeekInProviders ? "✅" : "❌"} DeepSeek提供商选项`);
  console.log(`${hasDeepSeekModels ? "✅" : "❌"} DeepSeek模型配置`);
} catch (error) {
  console.log(`❌ 常量配置文件读取失败: ${error.message}`);
}

console.log("\n🎯 测试指南:");
console.log("1. 打开设置 → 模型服务");
console.log("2. 点击'深度求索'提供商");
console.log("3. 输入DeepSeek API密钥");
console.log("4. 点击'保存'按钮");
console.log("5. 点击'测试连接'按钮");
console.log("6. 应该看到'连接测试成功，模型可以使用'提示");

console.log("\n⚠️  注意事项:");
console.log("- 需要有效的DeepSeek API密钥进行实际测试");
console.log("- API密钥格式应为 sk-开头的字符串");
console.log("- 测试连接需要网络访问DeepSeek API");

console.log("==========================================");
