/**
 * AI提供商配置测试脚本
 * 用于测试和调试AI服务配置问题
 */

// 在浏览器控制台中运行此脚本来调试AI配置问题

console.log("🤖 AI配置调试工具");
console.log("================");

// 1. 检查localStorage中的AI设置
const aiSettings = localStorage.getItem("ai_settings");
console.log(
  "📋 当前AI设置:",
  aiSettings ? JSON.parse(aiSettings) : "未找到设置"
);

// 2. 检查各个提供商的API密钥
const providers = ["zhipu", "deepseek", "openai"];
console.log("\n🔑 API密钥状态:");
providers.forEach((provider) => {
  const key = localStorage.getItem(`ai_${provider}_api_key`);
  console.log(`  ${provider}: ${key ? "已配置" : "未配置"}`);
});

// 3. 测试AI服务当前状态
if (typeof window !== "undefined" && window.aiService) {
  console.log("\n🚀 AI服务状态:");
  console.log("  当前提供商:", window.aiService.getCurrentProvider());
  console.log("  可用提供商:", window.aiService.getAvailableProviders());
  console.log("  当前设置:", window.aiService.getSettings());
} else {
  console.log("\n❌ AI服务未初始化或不可访问");
}

// 4. 提供修复建议
console.log("\n💡 问题排查建议:");
console.log("1. 确保在设置中正确配置了AI提供商和API密钥");
console.log("2. 点击'测试连接'确保API密钥有效");
console.log("3. 保存设置后刷新页面");
console.log("4. 检查浏览器控制台是否有错误信息");

// 5. 手动修复函数
window.debugAI = {
  // 重置AI提供商
  resetProvider: function (providerName) {
    if (window.aiService) {
      window.aiService.setProvider(providerName);
      console.log(`✅ 已切换到: ${providerName}`);
    }
  },

  // 查看当前配置
  getCurrentConfig: function () {
    if (window.aiService) {
      return window.aiService.getSettings();
    }
  },

  // 清理配置
  clearSettings: function () {
    localStorage.removeItem("ai_settings");
    providers.forEach((provider) => {
      localStorage.removeItem(`ai_${provider}_api_key`);
    });
    console.log("✅ 已清理所有AI配置");
  },
};

console.log("\n🛠️ 调试工具已加载到 window.debugAI");
console.log("  - debugAI.resetProvider('deepseek') - 重置提供商");
console.log("  - debugAI.getCurrentConfig() - 查看当前配置");
console.log("  - debugAI.clearSettings() - 清理所有配置");
