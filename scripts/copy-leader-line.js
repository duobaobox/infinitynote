#!/usr/bin/env node

/**
 * 构建后处理脚本：复制 leader-line.min.js 到 dist 目录
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, "../public/leader-line.min.js");
const targetFile = path.join(__dirname, "../dist/leader-line.min.js");

try {
  // 确保 dist 目录存在
  const distDir = path.dirname(targetFile);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 复制文件
  fs.copyFileSync(sourceFile, targetFile);
  console.log("✅ leader-line.min.js copied to dist directory");
} catch (error) {
  console.error("❌ Failed to copy leader-line.min.js:", error.message);
  process.exit(1);
}
