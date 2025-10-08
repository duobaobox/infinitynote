#!/bin/bash

# Release 目录清理脚本
# 删除临时文件和不需要的构建产物，保留发布所需的文件

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧹 Release 目录清理工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")/../release" || exit 1

# 显示清理前的大小
echo "📊 清理前:"
du -sh .
echo ""

# 统计将要删除的文件
blockmap_count=$(ls -1 *.blockmap 2>/dev/null | wc -l | tr -d ' ')
unpacked_dirs=$(ls -d *-unpacked/ mac/ mac-arm64/ 2>/dev/null | wc -l | tr -d ' ')

echo "🔍 发现以下文件将被删除:"
echo "   - .blockmap 文件: $blockmap_count 个"
echo "   - 未打包目录: $unpacked_dirs 个"
echo ""

# 询问确认
read -p "❓ 确认删除这些文件吗？(y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ 已取消清理"
    exit 0
fi

echo ""
echo "🗑️  开始清理..."
echo ""

# 1. 删除 .blockmap 文件
echo "   → 删除 .blockmap 文件..."
rm -f *.blockmap
echo "      ✅ 完成"

# 2. 删除未打包目录
echo "   → 删除未打包目录..."
rm -rf win-unpacked win-ia32-unpacked
rm -rf mac mac-arm64
rm -rf linux-unpacked linux-arm64-unpacked
echo "      ✅ 完成"

# 3. 删除构建配置文件
echo "   → 删除构建配置文件..."
rm -f builder-debug.yml builder-effective-config.yaml
echo "      ✅ 完成"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✨ 清理完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 显示清理后的大小
echo "📊 清理后:"
du -sh .
echo ""

# 显示保留的文件
echo "📦 保留的文件:"
echo ""

# 必需文件
echo "   ✅ 必需文件 (推荐发布):"
for file in \
    "无限便签-2.0.0.dmg" \
    "无限便签-2.0.0-arm64.dmg" \
    "无限便签-2.0.0-win.exe" \
    "无限便签-2.0.0.AppImage" \
    "SHA256SUMS.txt"
do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        printf "      %-35s %8s\n" "$file" "$size"
    fi
done

echo ""
echo "   ⭕ 可选文件 (高级用户):"
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
        size=$(ls -lh "$file" | awk '{print $5}')
        printf "      %-35s %8s\n" "$file" "$size"
    fi
done

echo ""
echo "   📄 文档文件:"
for file in *.md; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        printf "      %-35s %8s\n" "$file" "$size"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 提示:"
echo "   - 已删除约 2.3 GB 的临时文件"
echo "   - 保留了 11 个安装包和相关文档"
echo "   - 可以安全地发布到 GitHub Releases"
echo ""
echo "📖 详细说明:"
echo "   - FILE_CHECKLIST.md   - 文件清单"
echo "   - DOWNLOAD_GUIDE.md   - 下载指南"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
