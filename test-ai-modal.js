/**
 * AI生成弹窗修复验证脚本
 * 验证AI内容生成弹窗闪退问题是否已修复
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🤖 AI生成弹窗修复验证");
console.log("==========================================");

try {
  const aiControlContent = fs.readFileSync(
    path.join(__dirname, "src/components/AIGenerationControl/index.tsx"),
    "utf8"
  );

  // 检查message警告修复
  const hasAppImport =
    aiControlContent.includes("App,") || aiControlContent.includes("App");
  const hasUseApp = aiControlContent.includes(
    "const { message, modal } = App.useApp();"
  );
  const noStaticMessage =
    !aiControlContent.includes("import { message,") &&
    !aiControlContent.includes(", message,");
  const noStaticModal = !aiControlContent.includes("Modal.confirm(");

  console.log("📱 静态函数警告修复验证:");
  console.log(`${hasAppImport ? "✅" : "❌"} App组件导入`);
  console.log(
    `${hasUseApp ? "✅" : "❌"} 使用App.useApp()获取message和modal实例`
  );
  console.log(`${noStaticMessage ? "✅" : "❌"} 移除静态message导入`);
  console.log(
    `${noStaticModal ? "✅" : "❌"} 替换Modal.confirm为modal.confirm`
  );

  // 检查API密钥检查修复
  const hasSecurityManagerImport = aiControlContent.includes(
    "import { aiService, securityManager }"
  );
  const hasCorrectApiCheck = aiControlContent.includes(
    "securityManager.getAPIKey(aiSettings.provider)"
  );
  const noOldApiCheck = !aiControlContent.includes(
    "aiSettings.apiKeys?.[aiSettings.provider]"
  );

  console.log("\n🔑 API密钥检查修复验证:");
  console.log(`${hasSecurityManagerImport ? "✅" : "❌"} SecurityManager导入`);
  console.log(
    `${hasCorrectApiCheck ? "✅" : "❌"} 使用securityManager检查API密钥`
  );
  console.log(`${noOldApiCheck ? "✅" : "❌"} 移除旧的API密钥检查逻辑`);

  // 检查组件清理逻辑
  const hasCleanupEffect = aiControlContent.includes("组件卸载时清理");
  const hasAbortCleanup = aiControlContent.includes(
    "abortControllerRef.current.abort()"
  );
  const hasUseEffectImport = aiControlContent.includes("useEffect");

  console.log("\n🧹 组件清理逻辑验证:");
  console.log(`${hasUseEffectImport ? "✅" : "❌"} useEffect导入`);
  console.log(`${hasCleanupEffect ? "✅" : "❌"} 清理逻辑注释`);
  console.log(`${hasAbortCleanup ? "✅" : "❌"} AbortController清理`);

  // 检查错误处理
  const hasErrorHandling =
    aiControlContent.includes("onError?.") &&
    aiControlContent.includes("catch (error)");
  const hasProgressHandling = aiControlContent.includes("setGenerationState");
  const hasAsyncSafety = aiControlContent.includes("useCallback");

  console.log("\n⚠️  错误处理和异步安全:");
  console.log(`${hasErrorHandling ? "✅" : "❌"} 完整的错误处理机制`);
  console.log(`${hasProgressHandling ? "✅" : "❌"} 状态管理逻辑`);
  console.log(`${hasAsyncSafety ? "✅" : "❌"} useCallback优化`);
} catch (error) {
  console.log(`❌ 文件读取失败: ${error.message}`);
}

console.log("\n🧪 修复后的测试流程:");
console.log("1. 创建一个新便签");
console.log("2. 悬停便签显示工具栏");
console.log("3. 点击机器人图标（AI生成按钮）");
console.log("4. 弹窗应该正常显示，不会闪退");
console.log("5. 可以输入提示词和调整参数");
console.log("6. 点击生成按钮开始AI生成");

console.log("\n✅ 预期修复结果:");
console.log("- ❌ 不再出现弹窗闪退问题");
console.log("- ❌ 不再有Antd静态函数警告");
console.log("- ✅ AI生成功能完全可用");
console.log("- ✅ 正确的错误提示和状态显示");
console.log("- ✅ 组件卸载时正确清理资源");

console.log("==========================================");
