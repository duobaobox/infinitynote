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

# 然后打包 Windows 版本
npx electron-builder --win portable --x64

echo ""
echo "✨ 构建完成！"
echo ""
echo "📁 输出文件位置: release/"
ls -lh release/*.exe 2>/dev/null || echo "未找到 .exe 文件"
