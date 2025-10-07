# InfinityNote 2 安装指南

## 📦 打包文件说明

### macOS 应用包

根据你的 Mac 型号选择对应的安装包：

#### Apple Silicon (M1/M2/M3 芯片)

- **推荐**: `InfinityNote 2-2.0.0-arm64.dmg` (117 MB)
- 或者: `InfinityNote 2-2.0.0-arm64-mac.zip` (41 MB)

#### Intel 芯片

- **推荐**: `InfinityNote 2-2.0.0.dmg` (116 MB)
- 或者: `InfinityNote 2-2.0.0-mac.zip` (43 MB)

### 文件类型区别

- **DMG 安装包** - 双击打开，拖拽到应用程序文件夹
- **ZIP 压缩包** - 解压后直接运行，适合便携使用

## 🚀 安装步骤

### 方法 1：使用 DMG 安装包（推荐）

1. **双击** `InfinityNote 2-2.0.0-arm64.dmg`（或对应的 Intel 版本）
2. 等待磁盘镜像挂载
3. 将 `InfinityNote 2` 图标**拖拽**到 `Applications` 文件夹
4. 等待复制完成
5. 打开 `启动台` 或 `应用程序` 文件夹
6. 找到并运行 `InfinityNote 2`

### 方法 2：使用 ZIP 压缩包

1. **双击** ZIP 文件解压
2. 将解压出的 `InfinityNote 2.app` 移动到 `应用程序` 文件夹（可选）
3. 双击运行 `InfinityNote 2.app`

## ⚠️ 首次运行提示

### "无法打开，因为无法验证开发者"

这是正常的！因为应用没有 Apple 代码签名。解决方法：

**方法 1：右键打开（推荐）**

1. 右键点击 `InfinityNote 2.app`
2. 选择 `打开`
3. 在弹出的对话框中点击 `打开`
4. 下次就可以正常双击打开了

**方法 2：在系统设置中允许**

1. 打开 `系统设置` > `隐私与安全性`
2. 找到 "InfinityNote 2 已被阻止" 的提示
3. 点击 `仍要打开`
4. 确认打开应用

**方法 3：使用终端命令（高级）**

```bash
xattr -cr "/Applications/InfinityNote 2.app"
```

### "应用已损坏，无法打开"

如果遇到这个问题，在终端运行：

```bash
sudo xattr -rd com.apple.quarantine "/Applications/InfinityNote 2.app"
```

## 🔧 已修复的问题

本次打包已修复：

- ✅ leader-line 连接线路径问题（改为相对路径）
- ✅ Ant Design `destroyOnClose` 废弃警告
- ✅ Vite 构建路径配置（`base: "./"`）
- ✅ 窗口控制按钮（最小化、最大化、关闭）

## 🧪 测试清单

安装后请测试以下功能：

- [ ] 应用正常启动
- [ ] 创建便签
- [ ] 编辑便签内容
- [ ] 拖动便签
- [ ] **创建便签连接线**（已修复）
- [ ] 保存和加载数据
- [ ] AI 功能（需要配置 API Key）
- [ ] 窗口最小化/最大化/关闭

## 📝 注意事项

1. **数据存储**：应用数据存储在本地 IndexedDB 中
2. **安全警告**：开发环境的 CSP 警告在打包后会消失
3. **代码签名**：如需发布到 App Store，需要注册 Apple Developer 账号
4. **卸载方法**：直接将应用拖到废纸篓即可

## 🐛 问题反馈

如果遇到问题，请检查：

1. macOS 版本（建议 10.15+）
2. 是否选择了正确的芯片架构版本
3. 查看应用的控制台输出（按 `Cmd + Option + I` 打开开发者工具）

---

**版本**: 2.0.0  
**构建日期**: 2025 年 10 月 7 日  
**打包工具**: Electron 38.2.1 + electron-builder
