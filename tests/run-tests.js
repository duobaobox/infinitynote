#!/usr/bin/env node

/**
 * 测试运行器
 * 用于执行项目中的各种测试
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 InfinityNote2 测试运行器");
console.log("================================\n");

// 测试配置
const testConfig = {
  core: {
    name: "核心功能测试",
    tests: [
      "test-ai-functionality.js",
      "test-integration.js",
      "performance-benchmark.js",
      "test-ai-providers.js",
    ],
  },
  ui: {
    name: "用户界面测试",
    tests: ["ux-validation.js"],
  },
  utils: {
    name: "工具和分析",
    tests: ["analyze-bundle-size.js"],
  },
};

/**
 * 检查测试文件是否存在
 */
function checkTestFiles() {
  console.log("📋 检查测试文件...\n");

  let allFilesExist = true;

  for (const [category, config] of Object.entries(testConfig)) {
    console.log(`📁 ${config.name}:`);

    for (const testFile of config.tests) {
      const filePath = path.join(__dirname, category, testFile);
      const exists = fs.existsSync(filePath);

      console.log(`  ${exists ? "✅" : "❌"} ${testFile}`);

      if (!exists) {
        allFilesExist = false;
      }
    }
    console.log();
  }

  return allFilesExist;
}

/**
 * 运行Node.js测试
 */
async function runNodeTests() {
  console.log("🚀 运行Node.js测试...\n");

  const nodeTests = [
    "core/performance-benchmark.js",
    "utils/analyze-bundle-size.js",
  ];

  for (const testFile of nodeTests) {
    const filePath = path.join(__dirname, testFile);

    if (fs.existsSync(filePath)) {
      console.log(`▶️  运行 ${testFile}...`);

      try {
        // 动态导入测试文件
        await import(filePath);
        console.log(`✅ ${testFile} 完成\n`);
      } catch (error) {
        console.error(`❌ ${testFile} 失败:`, error.message);
        console.log();
      }
    }
  }
}

/**
 * 显示浏览器测试说明
 */
function showBrowserTestInstructions() {
  console.log("🌐 浏览器测试说明:\n");

  console.log("以下测试需要在浏览器中运行:");
  console.log("1. 启动开发服务器: npm run dev");
  console.log("2. 打开浏览器控制台");
  console.log("3. 运行以下命令:\n");

  const browserTests = [
    "core/test-ai-functionality.js",
    "core/test-integration.js",
    "core/test-ai-providers.js",
    "ui/ux-validation.js",
  ];

  browserTests.forEach((testFile) => {
    console.log(`// 运行 ${testFile}`);
    console.log(`fetch('/tests/${testFile}')`);
    console.log(`  .then(response => response.text())`);
    console.log(`  .then(code => eval(code));\n`);
  });
}

/**
 * 生成测试报告
 */
function generateTestReport() {
  const reportPath = path.join(__dirname, "test-report.md");
  const timestamp = new Date().toISOString();

  const report = `# 测试报告

**生成时间**: ${timestamp}

## 测试环境
- Node.js: ${process.version}
- 平台: ${process.platform}
- 架构: ${process.arch}

## 测试文件状态

${Object.entries(testConfig)
  .map(([category, config]) => {
    return `### ${config.name}
${config.tests
  .map((testFile) => {
    const filePath = path.join(__dirname, category, testFile);
    const exists = fs.existsSync(filePath);
    return `- ${exists ? "✅" : "❌"} ${testFile}`;
  })
  .join("\n")}`;
  })
  .join("\n\n")}

## 运行说明

### Node.js 测试
\`\`\`bash
node tests/run-tests.js
\`\`\`

### 浏览器测试
1. 启动开发服务器: \`npm run dev\`
2. 在浏览器控制台中运行相应的测试脚本

## 测试清单

发布前请确保以下测试通过:
- [ ] AI功能测试
- [ ] 集成测试  
- [ ] 性能基准测试
- [ ] UX验证测试
- [ ] AI提供商测试
- [ ] 包大小分析

---
*报告由测试运行器自动生成*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`📊 测试报告已生成: ${reportPath}\n`);
}

/**
 * 主函数
 */
async function main() {
  try {
    // 检查测试文件
    const allFilesExist = checkTestFiles();

    if (!allFilesExist) {
      console.log("⚠️  部分测试文件缺失，请检查测试目录结构\n");
    }

    // 运行Node.js测试
    await runNodeTests();

    // 显示浏览器测试说明
    showBrowserTestInstructions();

    // 生成测试报告
    generateTestReport();

    console.log("🎉 测试运行器执行完成!");
  } catch (error) {
    console.error("❌ 测试运行器执行失败:", error);
    process.exit(1);
  }
}

// 直接执行主函数
main();

export { testConfig, checkTestFiles, runNodeTests };
