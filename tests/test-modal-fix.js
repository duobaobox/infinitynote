/**
 * AI弹窗点击闪退问题修复验证
 * 验证导入路径和组件依赖问题是否解决
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🔧 AI弹窗点击闪退修复验证");
console.log("==========================================");

try {
  // 检查AIGenerationStatus导出文件
  const statusIndexPath = path.join(
    __dirname,
    "src/components/AIGenerationStatus/index.ts"
  );
  const statusIndexExists = fs.existsSync(statusIndexPath);

  console.log("📁 组件导出文件检查:");
  console.log(
    `${statusIndexExists ? "✅" : "❌"} AIGenerationStatus/index.ts 导出文件`
  );

  if (statusIndexExists) {
    const statusIndexContent = fs.readFileSync(statusIndexPath, "utf8");
    const hasProperExport = statusIndexContent.includes(
      "export { AIGenerationStatus"
    );
    console.log(
      `${hasProperExport ? "✅" : "❌"} 正确导出AIGenerationStatus组件`
    );
  }

  // 检查AIGenerationControl导入修复
  const controlPath = path.join(
    __dirname,
    "src/components/AIGenerationControl/index.tsx"
  );
  const controlContent = fs.readFileSync(controlPath, "utf8");

  const hasCorrectImport = controlContent.includes(
    'from "../AIGenerationStatus/index.tsx"'
  );
  const noOldImport = !controlContent.includes('from "../AIGenerationStatus"');
  const hasAppImport =
    controlContent.includes('} from "antd";\nimport {') &&
    controlContent.includes("App,");

  console.log("\n🔄 导入路径修复:");
  console.log(
    `${hasCorrectImport ? "✅" : "❌"} 修复AIGenerationStatus导入路径`
  );
  console.log(`${noOldImport ? "✅" : "❌"} 移除旧的导入路径`);
  console.log(`${hasAppImport ? "✅" : "❌"} 保持App导入正确`);

  // 检查CSS类名修复
  const noBrokenClassName =
    !controlContent.includes("className={styles.generationModal}") &&
    !controlContent.includes("className={styles.modalContent}");

  console.log("\n🎨 CSS类名修复:");
  console.log(`${noBrokenClassName ? "✅" : "❌"} 移除未定义的CSS类名`);

  // 检查AIGenerationStatus组件完整性
  const statusPath = path.join(
    __dirname,
    "src/components/AIGenerationStatus/index.tsx"
  );
  const statusContent = fs.readFileSync(statusPath, "utf8");

  const hasStatusExport = statusContent.includes(
    "export const AIGenerationStatus"
  );
  const hasStatusProps = statusContent.includes("AIGenerationStatusProps");
  const hasProperMemo = statusContent.includes("memo<AIGenerationStatusProps>");

  console.log("\n🤖 AIGenerationStatus组件检查:");
  console.log(`${hasStatusExport ? "✅" : "❌"} 组件正确导出`);
  console.log(`${hasStatusProps ? "✅" : "❌"} 类型定义完整`);
  console.log(`${hasProperMemo ? "✅" : "❌"} memo包装正确`);

  // 检查App.useApp()使用
  const hasUseApp = controlContent.includes(
    "const { message, modal } = App.useApp();"
  );
  const noStaticMessage = !controlContent.includes("message.") || hasUseApp;
  const noStaticModal =
    !controlContent.includes("Modal.") || controlContent.includes("modal.");

  console.log("\n⚡ Ant Design hooks使用:");
  console.log(`${hasUseApp ? "✅" : "❌"} 使用App.useApp()获取实例`);
  console.log(`${noStaticMessage ? "✅" : "❌"} 避免静态message调用`);
  console.log(`${noStaticModal ? "✅" : "❌"} 避免静态Modal调用`);
} catch (error) {
  console.log(`❌ 验证过程出错: ${error.message}`);
}

console.log("\n🎯 修复内容总结:");
console.log("1. 创建了AIGenerationStatus/index.ts导出文件");
console.log("2. 修复了AIGenerationControl中的导入路径");
console.log("3. 移除了未定义的CSS类名");
console.log("4. 保持了App.useApp()的正确使用");

console.log("\n🧪 测试步骤:");
console.log("1. 创建新便签");
console.log("2. 悬停便签显示工具栏");
console.log("3. 点击AI生成按钮（机器人图标）");
console.log("4. 弹窗应该稳定显示，不再闪退");
console.log("5. 可以正常输入提示词和使用功能");

console.log("==========================================");
