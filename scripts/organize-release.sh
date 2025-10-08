#!/bin/bash

# 清理 release 目录脚本
# 保留必要的发布文件，删除临时和中间文件

echo "🧹 开始清理 release 目录..."
echo ""

cd "$(dirname "$0")/../release" || exit 1

# 创建备份目录
echo "📁 创建分类目录..."
mkdir -p essential       # 必需文件
mkdir -p optional        # 可选文件  
mkdir -p technical       # 技术文件（blockmap等）
mkdir -p unpacked        # 未打包的目录（可删除）

echo ""
echo "📦 整理文件..."
echo ""

# 必需文件（推荐发布）
echo "✅ 必需文件（推荐发布）:"
for file in \
    "无限便签-2.0.0.dmg" \
    "无限便签-2.0.0-arm64.dmg" \
    "无限便签-2.0.0-win.exe" \
    "无限便签-2.0.0.AppImage" \
    "SHA256SUMS.txt"
do
    if [ -f "$file" ]; then
        echo "   → $file"
        cp "$file" essential/ 2>/dev/null || true
    fi
done

echo ""
echo "⭕ 可选文件（高级用户）:"
for file in \
    "无限便签-2.0.0-mac.zip" \
    "无限便签-2.0.0-arm64-mac.zip" \
    "无限便签-2.0.0-win-x64.exe" \
    "无限便签-2.0.0-win-ia32.exe" \
    "无限便签-2.0.0-portable.exe" \
    "无限便签-2.0.0-win-x64.zip" \
    "无限便签-2.0.0-arm64.AppImage"
do
    if [ -f "$file" ]; then
        echo "   → $file"
        cp "$file" optional/ 2>/dev/null || true
    fi
done

echo ""
echo "📋 文档文件:"
for file in \
    "RELEASE_MANIFEST.md" \
    "RELEASE_NOTES.md" \
    "DOWNLOAD_GUIDE.md"
do
    if [ -f "$file" ]; then
        echo "   → $file"
        cp "$file" essential/ 2>/dev/null || true
    fi
done

echo ""
echo "🔧 技术文件（blockmap 等）:"
mv *.blockmap technical/ 2>/dev/null || true
mv *.yml *.yaml technical/ 2>/dev/null || true
ls technical/ 2>/dev/null | head -5

echo ""
echo "📦 未打包目录（可删除）:"
for dir in win-unpacked win-ia32-unpacked mac mac-arm64 linux-unpacked linux-arm64-unpacked
do
    if [ -d "$dir" ]; then
        echo "   → $dir/ ($(du -sh $dir 2>/dev/null | awk '{print $1}'))"
        mv "$dir" unpacked/ 2>/dev/null || true
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 整理完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 文件分类："
echo ""
echo "   essential/     - 必需文件（推荐发布的 5 个文件）"
du -sh essential/ 2>/dev/null
echo ""
echo "   optional/      - 可选文件（高级用户需要的文件）"
du -sh optional/ 2>/dev/null
echo ""
echo "   technical/     - 技术文件（blockmap、yml 等）"
du -sh technical/ 2>/dev/null
echo ""
echo "   unpacked/      - 未打包目录（可安全删除）"
du -sh unpacked/ 2>/dev/null
echo ""
echo "💡 建议："
echo "   - 发布时上传 essential/ 中的文件"
echo "   - 可选择上传 optional/ 中的文件"
echo "   - technical/ 和 unpacked/ 可以删除"
echo ""
echo "🗑️  删除未打包目录？"
echo "   如需删除，请运行: rm -rf release/unpacked/"
echo ""
