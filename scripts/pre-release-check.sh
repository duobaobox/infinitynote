#!/bin/bash

# 发版前检查脚本
# 确保所有配置正确

set -e

echo "🔍 检查发版前的配置..."
echo ""

# 获取当前 git 仓库信息
REMOTE_URL=$(git remote get-url origin)
echo "📍 Git 远程仓库: $REMOTE_URL"

# 提取 owner 和 repo (兼容 macOS)
REPO_OWNER=$(echo "$REMOTE_URL" | sed 's|.*github.com/||' | sed 's|/.*||')
REPO_NAME=$(echo "$REMOTE_URL" | sed 's|.*\/||' | sed 's|\.git||')

echo "   Owner: $REPO_OWNER"
echo "   Repo: $REPO_NAME"
echo ""

# 检查版本号
VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"\([^"]*\)".*/\1/')

# 检查 electron-builder 配置
echo "⚙️  检查 electron-builder.json 配置..."
BUILDER_OWNER=$(grep -A 2 '"provider": "github"' electron-builder.json | grep '"owner"' | sed 's/.*"\([^"]*\)".*/\1/')
BUILDER_REPO=$(grep -A 3 '"provider": "github"' electron-builder.json | grep '"repo"' | sed 's/.*"\([^"]*\)".*/\1/')

echo "   配置的 Owner: $BUILDER_OWNER"
echo "   配置的 Repo: $BUILDER_REPO"
echo ""

# 对比
if [ "$REPO_OWNER" = "$BUILDER_OWNER" ] && [ "$REPO_NAME" = "$BUILDER_REPO" ]; then
    echo "✅ 配置匹配！"
else
    echo "⚠️  配置不匹配！"
    echo ""
    echo "💡 你有两个选择："
    echo ""
    echo "选择 1️⃣ : 更新 electron-builder.json 来匹配当前 git 仓库"
    echo "选择 2️⃣ : 更新 git 仓库地址来匹配 electron-builder.json 配置"
    echo ""
    read -p "请输入选择 (1 或 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo ""
        echo "更新 electron-builder.json..."
        # 使用 sed 更新配置（macOS 兼容）
        sed -i '' "s/\"owner\": \".*\"/\"owner\": \"$REPO_OWNER\"/" electron-builder.json
        sed -i '' "s/\"repo\": \".*\"/\"repo\": \"$REPO_NAME\"/" electron-builder.json
        echo "✅ 已更新 electron-builder.json"
    elif [ "$choice" = "2" ]; then
        echo ""
        echo "⚠️  需要手动更新 git 仓库地址"
        echo "运行命令: git remote set-url origin https://github.com/$BUILDER_OWNER/$BUILDER_REPO.git"
        exit 1
    fi
fi

echo ""
echo "✅ 检查完成！"
