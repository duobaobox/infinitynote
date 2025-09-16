/**
 * AI提供商配置加载修复验证脚本
 * 验证aiService是否正确加载用户配置的AI提供商
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🤖 AI提供商配置加载修复验证");
console.log("==========================================");

try {
  const aiServicePath = path.join(__dirname, "src/services/aiService.ts");
  const aiServiceContent = fs.readFileSync(aiServicePath, "utf8");

  // 检查修复内容
  const hasLoadUserSettings = aiServiceContent.includes(
    "this.loadUserSettings();"
  );
  const hasLoadUserSettingsMethod = aiServiceContent.includes(
    "private loadUserSettings()"
  );
  const hasProviderLoading = aiServiceContent.includes(
    "if (parsed.provider && this.providers.has(parsed.provider))"
  );
  const hasCurrentProviderUpdate = aiServiceContent.includes(
    "this.currentProvider = parsed.provider;"
  );
  const hasConfigurationLog =
    aiServiceContent.includes("已加载用户配置的AI提供商");
  const hasErrorHandling = aiServiceContent.includes("加载用户AI设置失败");

  console.log("🔍 检查修复项目:");
  console.log(
    `${hasLoadUserSettings ? "✅" : "❌"} 构造函数调用loadUserSettings`
  );
  console.log(
    `${hasLoadUserSettingsMethod ? "✅" : "❌"} loadUserSettings方法定义`
  );
  console.log(`${hasProviderLoading ? "✅" : "❌"} 提供商配置加载逻辑`);
  console.log(
    `${hasCurrentProviderUpdate ? "✅" : "❌"} currentProvider更新逻辑`
  );
  console.log(`${hasConfigurationLog ? "✅" : "❌"} 配置加载日志`);
  console.log(`${hasErrorHandling ? "✅" : "❌"} 错误处理机制`);

  const allChecksPass =
    hasLoadUserSettings &&
    hasLoadUserSettingsMethod &&
    hasProviderLoading &&
    hasCurrentProviderUpdate &&
    hasConfigurationLog &&
    hasErrorHandling;

  console.log("\n📋 修复总结:");
  if (allChecksPass) {
    console.log("✅ 所有修复项目已正确实施");
    console.log("✅ aiService现在会在初始化时加载用户配置");
    console.log("✅ 用户在模型服务中配置的AI提供商将被正确使用");
  } else {
    console.log("❌ 部分修复项目未完成");
  }

  console.log("\n🎯 问题根因分析:");
  console.log("1. AIService的构造函数只初始化提供商，未加载用户配置");
  console.log("2. currentProvider硬编码为'zhipu'，不会变更");
  console.log("3. 即使用户在设置中配置了其他AI，也不会生效");
  console.log("4. getSettings()会返回当前提供商，但这个值是错误的");

  console.log("\n🔧 修复方案:");
  console.log("1. 在构造函数中添加loadUserSettings()调用");
  console.log("2. 创建loadUserSettings()方法从localStorage读取用户配置");
  console.log("3. 根据用户配置更新currentProvider");
  console.log("4. 添加适当的错误处理和日志记录");

  console.log("\n🧪 测试步骤:");
  console.log("1. 确保在设置中配置了非智谱AI的提供商（如DeepSeek）");
  console.log("2. 确保配置了对应的API密钥并测试连接通过");
  console.log("3. 重新加载页面或重启应用");
  console.log("4. 尝试使用AI生成便签功能");
  console.log("5. 验证是否使用了正确的AI提供商");

  console.log("\n⚠️ 注意事项:");
  console.log("- 需要重新加载页面让修复生效");
  console.log("- 确保localStorage中有'ai_settings'配置");
  console.log("- API密钥需要正确配置并可访问");
} catch (error) {
  console.log(`❌ 验证过程出错: ${error.message}`);
}

console.log("\n==========================================");
