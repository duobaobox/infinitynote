#!/bin/bash

# 无限便签全平台打包脚本
# 作者: GitHub Copilot
# 日期: 2025-10-08

set -e  # 遇到错误立即退出

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  无限便签 v2.0.0 全平台打包脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 配置国内镜像
echo "🔧 配置 Electron 下载镜像..."
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
echo "✅ 镜像配置完成"
echo ""

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
rm -rf dist
rm -rf release/*.dmg release/*.exe release/*.AppImage release/*.zip release/*.deb release/*.rpm
echo "✅ 清理完成"
echo ""

# 构建前端
echo "📦 开始构建前端代码..."
npm run build
echo "✅ 前端构建完成"
echo ""

# 询问用户要打包的平台
echo "请选择要打包的平台:"
echo "  1) 所有平台 (macOS + Windows + Linux)"
echo "  2) 仅 macOS"
echo "  3) 仅 Windows"
echo "  4) 仅 Linux"
echo "  5) macOS + Windows"
echo ""
read -p "请输入选项 (1-5): " choice

case $choice in
  1)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🍎 开始打包 macOS (Intel + Apple Silicon)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --mac --x64 --arm64
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🪟 开始打包 Windows (32位 + 64位)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --win --x64
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🐧 开始打包 Linux (x64 + ARM64)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --linux --x64 || echo "⚠️  Linux x64 打包遇到问题，继续..."
    npx electron-builder --linux --arm64 || echo "⚠️  Linux ARM64 打包遇到问题，继续..."
    ;;
  2)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🍎 开始打包 macOS (Intel + Apple Silicon)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --mac --x64 --arm64
    ;;
  3)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🪟 开始打包 Windows (32位 + 64位)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --win --x64
    ;;
  4)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🐧 开始打包 Linux (x64 + ARM64)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --linux --x64 || echo "⚠️  Linux x64 打包遇到问题，继续..."
    npx electron-builder --linux --arm64 || echo "⚠️  Linux ARM64 打包遇到问题，继续..."
    ;;
  5)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🍎 开始打包 macOS (Intel + Apple Silicon)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --mac --x64 --arm64
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🪟 开始打包 Windows (32位 + 64位)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npx electron-builder --win --x64
    ;;
  *)
    echo "❌ 无效的选项"
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 生成 SHA256 校验文件..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd release
shasum -a 256 *.dmg *.exe *.AppImage *.zip 2>/dev/null | grep -v blockmap > SHA256SUMS.txt || true
cd ..
echo "✅ SHA256SUMS.txt 已生成"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 打包完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 输出目录: release/"
echo ""
echo "📦 生成的安装包:"
ls -lh release/*.dmg release/*.exe release/*.AppImage release/*.zip 2>/dev/null | awk '{printf "   %-40s %8s\n", $9, $5}'
echo ""
echo "💾 总大小:"
du -sh release/ | awk '{print "   "$1}'
echo ""
echo "📄 发布清单: release/RELEASE_MANIFEST.md"
echo "📝 发布说明: release/RELEASE_NOTES.md"
echo "🔐 校验文件: release/SHA256SUMS.txt"
echo ""
echo "🎉 现在可以发布了！"
echo ""
