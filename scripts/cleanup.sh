#!/bin/bash

echo "🧹 开始项目精简..."
echo ""

# 1. 移除未使用的依赖
echo "📦 移除未使用的 npm 依赖..."
npm uninstall prosemirror-markdown react-router-dom leader-line

echo ""

# 2. 删除调试文件
echo "🗑️ 删除调试文件..."
rm -f alibaba-api-test.html
rm -f debug_connection.html
rm -f debug_connection.js
rm -f public/vite.svg

echo ""

# 3. 归档文档
echo "📁 归档开发文档..."
mkdir -p docs/archive/test-reports
mkdir -p docs/archive/development-logs

# 移动测试相关文档
mv AI请求流程健壮性测试指南.md docs/archive/test-reports/ 2>/dev/null
mv 专注模式测试报告.md docs/archive/test-reports/ 2>/dev/null
mv 便签链接功能测试指南.md docs/archive/test-reports/ 2>/dev/null
mv 快速测试示例.md docs/archive/test-reports/ 2>/dev/null
mv 画布中心定位测试指南.md docs/archive/test-reports/ 2>/dev/null

# 移动开发日志
mv AI请求流程健壮性改进总结.md docs/archive/development-logs/ 2>/dev/null
mv CSS_zoom坐标转换修复记录.md docs/archive/development-logs/ 2>/dev/null
mv CSS_zoom实施记录.md docs/archive/development-logs/ 2>/dev/null
mv CSS_zoom方案分析.md docs/archive/development-logs/ 2>/dev/null
mv 拖动问题诊断.md docs/archive/development-logs/ 2>/dev/null
mv 无限画布网格修复说明.md docs/archive/development-logs/ 2>/dev/null
mv 画布坐标系统说明.md docs/archive/development-logs/ 2>/dev/null
mv 画布缩放清晰度行业调研.md docs/archive/development-logs/ 2>/dev/null

echo ""

# 4. 清理构建产物（可选）
echo "🧼 清理构建产物..."
rm -rf dist/
rm -rf src-tauri/target/release/build

echo ""
echo "✅ 精简完成！"
echo ""
echo "📊 精简摘要："
echo "  - 移除依赖: 3个 (prosemirror-markdown, react-router-dom, leader-line)"
echo "  - 删除调试文件: 4个"
echo "  - 归档文档: ~13个"
echo "  - 清理构建产物: dist/ 和 src-tauri/target/release/build/"
echo ""
echo "💡 建议执行以下命令："
echo "  1. git add . && git commit -m 'chore: 项目精简，移除未使用的依赖和文件'"
echo "  2. npm install  # 更新 package-lock.json"
echo "  3. npm run build  # 验证构建"
echo "  4. npm run dev  # 验证开发环境"
echo ""
