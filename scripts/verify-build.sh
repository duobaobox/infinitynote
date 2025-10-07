#!/bin/bash

# InfinityNote 2 打包验证脚本

echo "🔍 检查打包文件..."
echo ""

# 检查 release 目录
if [ ! -d "release" ]; then
    echo "❌ release 目录不存在"
    exit 1
fi

echo "📦 已生成的安装包："
echo ""

# 列出所有 DMG 和 ZIP 文件
for file in release/*.dmg release/*.zip; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "✅ $(basename "$file") - $size"
    fi
done

echo ""
echo "🎯 安装建议："
echo ""

# 检测 Mac 芯片类型
arch=$(uname -m)
if [ "$arch" = "arm64" ]; then
    echo "您的 Mac 是 Apple Silicon (M1/M2/M3)"
    echo "推荐安装: InfinityNote 2-2.0.0-arm64.dmg"
    recommended="release/InfinityNote 2-2.0.0-arm64.dmg"
elif [ "$arch" = "x86_64" ]; then
    echo "您的 Mac 是 Intel 芯片"
    echo "推荐安装: InfinityNote 2-2.0.0.dmg"
    recommended="release/InfinityNote 2-2.0.0.dmg"
fi

echo ""
echo "🚀 快速安装命令："
echo ""
echo "  open \"$recommended\""
echo ""
echo "📖 详细安装说明请查看: INSTALL.md"
echo ""

# 检查 leader-line.min.js 是否在 dist 中
if [ -f "dist/leader-line.min.js" ]; then
    echo "✅ leader-line.min.js 已正确复制到 dist"
else
    echo "⚠️  警告: leader-line.min.js 未找到，连接线可能无法显示"
fi

echo ""
echo "✨ 打包完成！"
