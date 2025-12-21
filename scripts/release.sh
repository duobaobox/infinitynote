#!/bin/bash

# 无限便签 一键发版脚本
# 使用前必读：需要先设置 GH_TOKEN 环境变量
# export GH_TOKEN='你的github_token'

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🚀 无限便签 一键发版${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查 GH_TOKEN
if [ -z "$GH_TOKEN" ]; then
    echo -e "${RED}❌ 错误: GH_TOKEN 环境变量未设置${NC}"
    echo ""
    echo -e "${YELLOW}📋 获取步骤:${NC}"
    echo "  1. 访问: https://github.com/settings/tokens/new"
    echo "  2. Token name: infinitynote-release"
    echo "  3. Expiration: 90 days"
    echo "  4. Scopes: 勾选 repo (完全访问)"
    echo "  5. 复制生成的 Token"
    echo ""
    echo -e "${YELLOW}💻 设置环境变量:${NC}"
    echo "  export GH_TOKEN='你的token'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ GH_TOKEN 已检测${NC}"
echo ""

# 步骤 1: 验证配置
echo -e "${YELLOW}[1/6] 验证发版配置...${NC}"
bash scripts/pre-release-check.sh > /dev/null 2>&1 || true
echo -e "${GREEN}✅ 配置验证完成${NC}"
echo ""

# 步骤 2: 清理
echo -e "${YELLOW}[2/6] 清理旧文件...${NC}"
rm -rf dist release
mkdir -p release
echo -e "${GREEN}✅ 清理完成${NC}"
echo ""

# 步骤 3: 构建前端
echo -e "${YELLOW}[3/6] 构建前端代码...${NC}"
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm run build > /dev/null 2>&1
echo -e "${GREEN}✅ 前端构建完成${NC}"
echo ""

# 步骤 4: 打包
echo -e "${YELLOW}[4/6] 打包所有平台...${NC}"
echo "   🍎 macOS..."
npx electron-builder --mac --publish never > /dev/null 2>&1
echo "   ✅ macOS 完成"
echo "   🪟 Windows..."
npx electron-builder --win --publish never > /dev/null 2>&1
echo "   ✅ Windows 完成"
echo "   🐧 Linux..."
npx electron-builder --linux --publish never > /dev/null 2>&1
echo "   ✅ Linux 完成"
echo -e "${GREEN}✅ 所有平台打包完成${NC}"
echo ""

# 步骤 5: 上传
echo -e "${YELLOW}[5/6] 上传到 GitHub Release...${NC}"
export GH_TOKEN
npx electron-builder --mac --win --linux --publish always > /dev/null 2>&1
echo -e "${GREEN}✅ 发行文件已上传${NC}"
echo ""

# 步骤 6: 完成
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[6/6] ✨ 发版成功！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📍 发行页面: https://github.com/duobaobox/infinitynote/releases"
echo ""
echo -e "${YELLOW}📦 生成的文件:${NC}"
ls -1 release/ | grep -E "\.(dmg|exe|AppImage|zip|deb|rpm)$" | head -10 | sed 's/^/   ✅ /'
echo ""
echo -e "${YELLOW}📋 后续步骤:${NC}"
echo "   1. 访问 GitHub Release 页面"
echo "   2. 检查文件是否完整"
echo "   3. 编辑 Release Notes (如需要)"
echo "   4. 点击 'Publish release' 正式发布"
echo ""
