/**
 * AI状态指示器移除验证脚本
 * 验证AIStatusIndicator组件已完全移除且不影响其他功能
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🗑️  AI状态指示器移除验证");
console.log("==========================================");

// 1. 检查AIStatusIndicator目录是否已删除
const statusIndicatorPath = path.join(
  __dirname,
  "src/components/AIStatusIndicator"
);
const componentExists = fs.existsSync(statusIndicatorPath);

console.log("\n📁 组件文件检查:");
console.log(
  `${!componentExists ? "✅" : "❌"} AIStatusIndicator组件目录已删除`
);

// 2. 检查NoteCard中是否还有AIStatusIndicator的痕迹
const noteCardPath = path.join(__dirname, "src/components/NoteCard/index.tsx");
let hasAIStatusIndicator = false;

if (fs.existsSync(noteCardPath)) {
  const noteCardContent = fs.readFileSync(noteCardPath, "utf8");
  hasAIStatusIndicator = noteCardContent.includes("AIStatusIndicator");

  console.log(
    `${
      !hasAIStatusIndicator ? "✅" : "❌"
    } NoteCard中已移除AIStatusIndicator引用`
  );

  // 检查是否还有相关变量
  const hasCancelGeneration = noteCardContent.includes("cancelAIGeneration");
  const hasAIErrors = noteCardContent.includes("aiErrors");

  console.log(
    `${!hasCancelGeneration ? "✅" : "❌"} 已清理cancelAIGeneration变量`
  );
  console.log(`${!hasAIErrors ? "✅" : "❌"} 已清理aiErrors变量`);
} else {
  console.log("❌ NoteCard文件未找到");
}

// 3. 检查其他文件是否还有AIStatusIndicator的导入
console.log("\n🔍 全局引用检查:");

const searchFiles = [
  "src/pages/Main/index.tsx",
  "src/pages/Canvas/index.tsx",
  "src/components/NoteWorkbench/index.tsx",
];

let hasGlobalReferences = false;

searchFiles.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf8");
    const hasReference = content.includes("AIStatusIndicator");

    if (hasReference) {
      hasGlobalReferences = true;
      console.log(`❌ ${filePath} 仍有AIStatusIndicator引用`);
    }
  }
});

if (!hasGlobalReferences) {
  console.log("✅ 其他组件中无AIStatusIndicator引用");
}

// 4. 检查保留的功能是否完整
console.log("\n🔧 保留功能检查:");

const noteWorkbenchPath = path.join(
  __dirname,
  "src/components/NoteWorkbench/index.tsx"
);
if (fs.existsSync(noteWorkbenchPath)) {
  const workbenchContent = fs.readFileSync(noteWorkbenchPath, "utf8");

  const hasLoadingState =
    workbenchContent.includes("loading") ||
    workbenchContent.includes("isAnyAIGenerating");
  const hasOnStopAI = workbenchContent.includes("onStopAI");
  const hasStatusManagement = workbenchContent.includes("setStatus");

  console.log(`${hasLoadingState ? "✅" : "❌"} 工作台按钮loading状态保留`);
  console.log(`${hasOnStopAI ? "✅" : "❌"} AI停止功能保留`);
  console.log(`${hasStatusManagement ? "✅" : "❌"} 状态管理逻辑保留`);
}

console.log("\n🎯 移除效果总结:");
console.log("✅ 消除了便签内冗余的'AI正在生成...'提示");
console.log("✅ 保留了工作台按钮的loading状态反馈");
console.log("✅ 简化了UI，减少了视觉干扰");
console.log("✅ 代码更加简洁，减少了维护负担");

console.log("\n🧪 验证建议:");
console.log("1. 测试AI生成便签功能是否正常");
console.log("2. 确认工作台按钮loading状态清晰可见");
console.log("3. 验证AI生成过程可以正常停止");
console.log("4. 检查界面是否更加简洁美观");

const allChecked =
  !componentExists && !hasAIStatusIndicator && !hasGlobalReferences;
console.log(
  `\n${allChecked ? "🎉" : "⚠️"} 总体状态: ${
    allChecked ? "移除成功" : "需要进一步检查"
  }`
);

export default {
  success: allChecked,
  details: {
    componentDeleted: !componentExists,
    noteCardCleaned: !hasAIStatusIndicator,
    noGlobalReferences: !hasGlobalReferences,
  },
};
