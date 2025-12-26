#!/bin/bash

# Mac 应用性能优化重新打包脚本
# 使用方法: bash scripts/rebuild-optimized.sh

set -e  # 遇到错误立即退出

echo "🚀 开始优化构建 Mac 应用..."
echo ""

# 1. 清理旧的构建产物
echo "📦 步骤 1/4: 清理旧的构建产物..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "  ✅ 已删除 dist 目录"
fi

if [ -d "release" ]; then
    rm -rf release
    echo "  ✅ 已删除 release 目录"
fi
echo ""

# 2. 安装依赖（如果需要）
echo "📦 步骤 2/4: 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "  ⏳ 正在安装依赖..."
    npm install
else
    echo "  ✅ 依赖已安装"
fi
echo ""

# 3. 构建前端资源
echo "📦 步骤 3/4: 构建前端资源（优化模式）..."
echo "  ⏳ 正在执行 Vite 构建..."
NODE_ENV=production npm run build
echo "  ✅ 前端构建完成"
echo ""

# 4. 打包 Electron 应用
echo "📦 步骤 4/4: 打包 Mac 应用..."
echo "  ⏳ 正在执行 electron-builder..."
npm run electron:build:mac
echo "  ✅ 应用打包完成"
echo ""

# 显示打包结果
echo "🎉 构建完成！"
echo ""
echo "📊 构建产物："
if [ -d "release" ]; then
    ls -lh release/*.dmg release/*.zip 2>/dev/null || echo "  未找到 DMG/ZIP 文件"
fi
echo ""

# 显示应用大小
if [ -f "release/无限便签-2.2.2-mac-arm64.dmg" ]; then
    DMG_SIZE=$(du -h "release/无限便签-2.2.2-mac-arm64.dmg" | cut -f1)
    echo "  📦 DMG 大小: $DMG_SIZE"
fi

if [ -f "release/无限便签-2.2.2-mac-x64.dmg" ]; then
    DMG_SIZE=$(du -h "release/无限便签-2.2.2-mac-x64.dmg" | cut -f1)
    echo "  📦 DMG 大小: $DMG_SIZE"
fi
echo ""

echo "✅ 优化后的应用特性："
echo "  ✅ 沙箱模式启用"
echo "  ✅ 生产环境禁用 DevTools"
echo "  ✅ 移除所有 console 日志"
echo "  ✅ 代码完全压缩"
echo "  ✅ 性能参数优化"
echo ""

echo "🔍 下一步："
echo "  1. 在 release 目录找到 DMG 文件"
echo "  2. 双击安装到应用程序文件夹"
echo "  3. 测试应用性能"
echo ""

echo "💡 性能测试清单："
echo "  - 应用启动速度"
echo "  - 主窗口操作流畅度"
echo "  - 悬浮窗口性能"
echo "  - 内存占用（活动监视器）"
echo "  - CPU 使用率"
echo ""
