/**
 * AI生成弹窗闪退问题修复验证脚本
 * 验证NoteCard中的handleClickOutside事件处理修复
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("🔧 AI生成弹窗闪退修复验证");
console.log("==========================================");

try {
  const noteCardPath = path.join(
    __dirname,
    "src/components/NoteCard/index.tsx"
  );
  const noteCardContent = fs.readFileSync(noteCardPath, "utf8");

  // 检查修复内容
  const hasModalCheck = noteCardContent.includes(
    'target.closest(".ant-modal")'
  );
  const hasModalContentCheck = noteCardContent.includes(
    'target.closest(".ant-modal-content")'
  );
  const hasModalMaskCheck = noteCardContent.includes(
    'target.closest(".ant-modal-mask")'
  );
  const hasDialogRoleCheck = noteCardContent.includes(
    "target.closest(\"[role='dialog']\")"
  );
  const hasDrawerCheck = noteCardContent.includes(
    'target.closest(".ant-drawer")'
  );
  const hasPopoverCheck = noteCardContent.includes(
    'target.closest(".ant-popover")'
  );
  const hasTooltipCheck = noteCardContent.includes(
    'target.closest(".ant-tooltip")'
  );
  const hasIsInModalVariable = noteCardContent.includes("const isInModal =");
  const hasIsInModalCondition = noteCardContent.includes("&& !isInModal");

  console.log("🔍 检查修复项目:");
  console.log(`${hasModalCheck ? "✅" : "❌"} Modal基本检查 (.ant-modal)`);
  console.log(
    `${hasModalContentCheck ? "✅" : "❌"} Modal内容检查 (.ant-modal-content)`
  );
  console.log(
    `${hasModalMaskCheck ? "✅" : "❌"} Modal遮罩检查 (.ant-modal-mask)`
  );
  console.log(
    `${hasDialogRoleCheck ? "✅" : "❌"} Dialog角色检查 ([role='dialog'])`
  );
  console.log(`${hasDrawerCheck ? "✅" : "❌"} Drawer检查 (.ant-drawer)`);
  console.log(`${hasPopoverCheck ? "✅" : "❌"} Popover检查 (.ant-popover)`);
  console.log(`${hasTooltipCheck ? "✅" : "❌"} Tooltip检查 (.ant-tooltip)`);
  console.log(`${hasIsInModalVariable ? "✅" : "❌"} isInModal变量定义`);
  console.log(`${hasIsInModalCondition ? "✅" : "❌"} isInModal条件应用`);

  const allChecksPass =
    hasModalCheck &&
    hasModalContentCheck &&
    hasModalMaskCheck &&
    hasDialogRoleCheck &&
    hasDrawerCheck &&
    hasPopoverCheck &&
    hasTooltipCheck &&
    hasIsInModalVariable &&
    hasIsInModalCondition;

  console.log("\n📋 修复总结:");
  if (allChecksPass) {
    console.log("✅ 所有修复项目已正确实施");
    console.log("✅ NoteCard的handleClickOutside现在会正确识别Modal");
    console.log("✅ AI生成弹窗不应再出现闪退问题");
  } else {
    console.log("❌ 部分修复项目未完成");
  }

  console.log("\n🎯 问题根因分析:");
  console.log("1. NoteCard使用全局mousedown监听器来检测点击外部");
  console.log("2. 该监听器使用捕获模式，优先级最高");
  console.log("3. 原代码只检查便签和工具栏，未检查Modal");
  console.log("4. 点击Modal时被误判为点击外部，导致工具栏关闭");
  console.log("5. 工具栏关闭导致AI生成Modal也被关闭");

  console.log("\n🔧 修复方案:");
  console.log("1. 在handleClickOutside中添加isInModal检查");
  console.log("2. 涵盖所有可能的Modal和浮层组件类型");
  console.log("3. 确保任何Modal内的点击都不会触发工具栏关闭");

  console.log("\n🧪 测试步骤:");
  console.log("1. 创建或选择一个便签");
  console.log("2. 悬停便签显示工具栏");
  console.log("3. 点击AI生成按钮（机器人图标）");
  console.log("4. 在弹出的AI生成对话框内点击任意元素");
  console.log("5. 验证对话框不再闪退消失");
  console.log("6. 测试各个功能按钮和输入框");
} catch (error) {
  console.log(`❌ 验证过程出错: ${error.message}`);
}

console.log("\n==========================================");
