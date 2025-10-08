#!/bin/bash

# Windows 应用打包脚本（使用国内镜像）

echo "🔧 配置 Electron 下载镜像..."

# 设置环境变量使用国内镜像
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

echo "✅ 镜像配置完成"
echo ""
echo "📦 开始构建 Windows 应用..."
echo ""

# 先构建前端
npm run build

# 打包所有 Windows 版本（NSIS 安装包 + Portable + Zip）
echo ""
echo "🏗️  构建 Windows 安装包（NSIS）、便携版（Portable）和压缩包（Zip）..."
npx electron-builder --win --x64

echo ""
echo "✨ 构建完成！"
echo ""
echo "📁 输出文件位置: release/"
echo ""
echo "构建的文件列表："
ls -lh release/*.exe 2>/dev/null || true
ls -lh release/*.zip 2>/dev/null || true
echo ""
echo "📝 说明："
echo "   - NSIS 安装包：适合需要完整安装的用户"
echo "   - Portable 版本：绿色便携版，无需安装"
echo "   - Zip 压缩包：手动解压使用"
