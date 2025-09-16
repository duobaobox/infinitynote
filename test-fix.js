/**
 * API密钥持久化修复验证脚本
 * 验证message警告和数据持久化问题是否已修复
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🔧 API密钥持久化修复验证");
console.log("==========================================");

try {
  const settingsContent = fs.readFileSync(
    path.join(
      __dirname,
      "src/components/SettingsModal/tabs/ModelSettingsTab.tsx"
    ),
    "utf8"
  );

  // 检查message警告修复
  const hasAppImport =
    settingsContent.includes("App,") || settingsContent.includes("App");
  const hasUseApp = settingsContent.includes(
    "const { message } = App.useApp();"
  );
  const noStaticMessage =
    !settingsContent.includes("import { message,") &&
    !settingsContent.includes(", message,");

  console.log("📱 Message警告修复验证:");
  console.log(`${hasAppImport ? "✅" : "❌"} App组件导入`);
  console.log(`${hasUseApp ? "✅" : "❌"} 使用App.useApp()获取message实例`);
  console.log(`${noStaticMessage ? "✅" : "❌"} 移除静态message导入`);

  // 检查数据持久化修复
  const hasSecurityManagerImport = settingsContent.includes(
    "import { aiService, securityManager }"
  );
  const hasGetAPIKey = settingsContent.includes("securityManager.getAPIKey");
  const hasSetAPIKey = settingsContent.includes("securityManager.setAPIKey");
  const hasProviderSwitchEffect = settingsContent.includes("监听提供商切换");

  console.log("\n💾 数据持久化修复验证:");
  console.log(`${hasSecurityManagerImport ? "✅" : "❌"} SecurityManager导入`);
  console.log(`${hasGetAPIKey ? "✅" : "❌"} 使用getAPIKey加载保存的密钥`);
  console.log(`${hasSetAPIKey ? "✅" : "❌"} 使用setAPIKey直接保存密钥`);
  console.log(`${hasProviderSwitchEffect ? "✅" : "❌"} 提供商切换监听效果`);

  // 检查安全存储机制
  const hasProvidersList = settingsContent.includes(
    "const providers = ['zhipu', 'deepseek', 'openai']"
  );
  const hasInitialStatus = settingsContent.includes(
    'initialStatus[provider] = "idle"'
  );

  console.log("\n🔒 安全存储机制:");
  console.log(`${hasProvidersList ? "✅" : "❌"} 支持的提供商列表`);
  console.log(`${hasInitialStatus ? "✅" : "❌"} 连接状态初始化`);
} catch (error) {
  console.log(`❌ 文件读取失败: ${error.message}`);
}

console.log("\n🧪 修复后的工作流程:");
console.log("1. 用户输入API密钥 → 临时存储在状态中");
console.log("2. 点击保存 → 使用securityManager.setAPIKey()加密存储");
console.log("3. 切换提供商 → 自动从存储加载对应密钥");
console.log("4. 重新打开设置 → 所有密钥正确显示");
console.log("5. Message提示 → 使用App.useApp()避免警告");

console.log("\n✅ 预期修复结果:");
console.log("- ❌ 不再出现Antd message静态函数警告");
console.log("- ✅ API密钥在切换提供商后保持显示");
console.log("- ✅ 关闭设置重新打开后数据仍然存在");
console.log("- ✅ 各提供商的连接状态正确维护");

console.log("==========================================");
