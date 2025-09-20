/**
 * 浏览器端思维链显示验证脚本
 * 在开发者控制台中运行，验证思维链组件是否正确显示累积内容
 */

console.log("🧠 浏览器端思维链显示验证");
console.log("==========================================");

function verifyThinkingChainDisplay() {
  // 检查是否有思维链组件
  const thinkingContainers = document.querySelectorAll(
    '[class*="thinkingChainContainer"]'
  );
  console.log(`📋 找到 ${thinkingContainers.length} 个思维链容器`);

  if (thinkingContainers.length === 0) {
    console.log("⚠️ 未找到思维链容器，请先生成一个AI便签");
    return false;
  }

  thinkingContainers.forEach((container, index) => {
    const header = container.querySelector('[class*="thinkingHeader"]');
    const content = container.querySelector('[class*="thinkingContent"]');
    const textElements = container.querySelectorAll('[class*="thinkingText"]');

    console.log(`\n📝 思维链容器 ${index + 1}:`);
    console.log(`  - 有头部: ${!!header}`);
    console.log(`  - 有内容区: ${!!content}`);
    console.log(`  - 文本元素数量: ${textElements.length}`);

    if (textElements.length > 0) {
      textElements.forEach((text, textIndex) => {
        const textContent = text.textContent || "";
        console.log(
          `  - 文本 ${textIndex + 1}: "${textContent.substring(0, 100)}${
            textContent.length > 100 ? "..." : ""
          }"`
        );
        console.log(`    长度: ${textContent.length} 字符`);

        // 检查是否有换行
        const hasNewlines = textContent.includes("\n");
        console.log(`    包含换行: ${hasNewlines}`);
      });
    }

    // 检查是否可以展开/收起
    const expandIcon = container.querySelector('[class*="expandIcon"]');
    if (expandIcon) {
      console.log(`  - 可折叠: 是`);
      const isExpanded = expandIcon.classList.toString().includes("expanded");
      console.log(`  - 当前状态: ${isExpanded ? "展开" : "收起"}`);
    }
  });

  return true;
}

// 验证思维链内容格式化
function verifyContentFormatting() {
  console.log("\n🎨 验证内容格式化:");

  const thinkingTexts = document.querySelectorAll('[class*="thinkingText"]');
  thinkingTexts.forEach((text, index) => {
    const styles = window.getComputedStyle(text);
    console.log(`\n📄 文本元素 ${index + 1} 的样式:`);
    console.log(`  - white-space: ${styles.whiteSpace}`);
    console.log(`  - word-wrap: ${styles.wordWrap}`);
    console.log(`  - line-height: ${styles.lineHeight}`);
    console.log(`  - font-size: ${styles.fontSize}`);
  });
}

// 运行验证
const hasThinkingChain = verifyThinkingChainDisplay();
if (hasThinkingChain) {
  verifyContentFormatting();
}

console.log("\n💡 使用说明:");
console.log(
  "1. 如果没有找到思维链容器，请先使用DeepSeek reasoning模型生成一个便签"
);
console.log("2. 生成过程中观察思维链是否实时更新");
console.log("3. 生成完成后检查思维链内容是否完整显示");

// 导出验证函数供手动调用
window.verifyThinkingChain = verifyThinkingChainDisplay;
window.verifyThinkingFormat = verifyContentFormatting;

console.log("\n🔧 可手动调用的函数:");
console.log("- verifyThinkingChain() - 验证思维链显示");
console.log("- verifyThinkingFormat() - 验证内容格式化");
