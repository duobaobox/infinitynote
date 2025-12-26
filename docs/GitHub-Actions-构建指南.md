# GitHub Actions 自动化构建指南

## 概述

项目已配置 GitHub Actions 来自动化构建和发布流程，支持 macOS、Windows 和 Linux 三个平台。

## 工作流说明

### 1. Build & Release (`.github/workflows/build.yml`)

**触发条件：**
- 推送带有 `v` 前缀的 tag（如 `v2.2.1`）
- 手动触发（在 GitHub Actions 页面）

**功能：**
- 在三个平台上并行构建应用
- 自动创建 GitHub Release
- 上传所有平台的安装包

**产出文件：**
- **macOS**: `.dmg` 和 `.zip` 文件（支持 x64 和 arm64）
- **Windows**: `.exe` 安装包、便携版和 `.zip` 文件
- **Linux**: `.AppImage`、`.deb` 和 `.rpm` 包

### 2. CI (`.github/workflows/ci.yml`)

**触发条件：**
- 推送到 main 或 develop 分支
- 创建针对 main 或 develop 的 PR

**功能：**
- 代码检查（Lint）
- 类型检查
- 运行测试
- 构建验证

## 发布新版本

### 方式一：通过 Tag 触发（推荐）

1. 更新 `package.json` 中的版本号
2. 提交更改并推送
3. 创建并推送 tag：

```bash
# 更新版本号
npm version patch  # 或 minor, major

# Git 会自动创建 tag，推送代码和 tag
git push && git push --tags
```

或手动创建 tag：

```bash
# 创建 tag
git tag v2.2.2

# 推送 tag
git push origin v2.2.2
```

4. GitHub Actions 会自动开始构建
5. 构建完成后，会在 GitHub Releases 页面创建新版本

### 方式二：手动触发

1. 访问项目的 Actions 页面
2. 选择 "Build & Release" 工作流
3. 点击 "Run workflow"
4. 选择分支（可选输入版本号）
5. 点击 "Run workflow" 确认

## 查看构建状态

1. 访问项目的 Actions 页面
2. 查看正在运行或已完成的工作流
3. 点击具体的工作流查看详细日志

## 下载构建产物

### 临时构建（未发布）

1. 在 Actions 页面找到对应的工作流运行
2. 滚动到底部的 "Artifacts" 部分
3. 下载对应平台的构建产物
4. 注意：Artifacts 会在 7 天后自动删除

### 正式发布

1. 访问项目的 Releases 页面
2. 找到对应版本
3. 下载所需平台的安装包

## 注意事项

1. **Node.js 版本**: 工作流使用 Node.js 20.19.0，与项目要求一致
2. **GitHub Token**: 使用自动提供的 `GITHUB_TOKEN`，无需额外配置
3. **构建时间**: 
   - macOS 构建约需 15-20 分钟
   - Windows 构建约需 10-15 分钟
   - Linux 构建约需 8-12 分钟
4. **代码签名**: 当前配置不包含代码签名，如需签名需要额外配置证书

## 配置代码签名（可选）

### macOS 签名

需要在 GitHub 仓库设置中添加以下 Secrets：

- `CSC_LINK`: Base64 编码的证书文件
- `CSC_KEY_PASSWORD`: 证书密码
- `APPLE_ID`: Apple ID
- `APPLE_ID_PASSWORD`: 应用专用密码

然后在工作流中添加：

```yaml
- name: Build Electron app (macOS)
  if: matrix.os == 'macos-latest'
  run: npm run electron:build:mac
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CSC_LINK: ${{ secrets.CSC_LINK }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
```

### Windows 签名

需要添加：

- `CSC_LINK`: Base64 编码的证书文件
- `CSC_KEY_PASSWORD`: 证书密码

## 故障排查

### 构建失败

1. 查看工作流日志找到具体错误
2. 常见问题：
   - 依赖安装失败：检查 package.json
   - 构建脚本错误：本地测试构建命令
   - 内存不足：GitHub Actions 提供 7GB 内存，通常足够

### Release 创建失败

1. 确保 tag 格式正确（以 `v` 开头）
2. 检查 GitHub Token 权限
3. 确保 release 文件存在

## 本地测试构建

在推送到 GitHub 之前，建议先本地测试：

```bash
# 安装依赖
npm ci

# 测试构建
npm run build

# 测试打包（选择对应平台）
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

## 成本说明

GitHub Actions 对公开仓库是完全免费的，提供：
- 无限构建分钟数
- 20GB 存储空间（用于 Artifacts 和 Cache）
- 无并发限制（公开仓库）

对于私有仓库，免费计划提供每月 2000 分钟的构建时间。
