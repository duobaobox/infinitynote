# 测试目录结构说明

## 📁 目录结构

```
tests/
├── README.md               # 本说明文件
├── core/                   # 核心功能测试
│   ├── test-ai-functionality.js    # AI功能完整性测试
│   ├── test-integration.js         # 系统集成测试
│   ├── performance-benchmark.js    # 性能基准测试
│   └── test-ai-providers.js        # AI提供商测试
├── ui/                     # 用户界面测试
│   └── ux-validation.js            # 用户体验验证测试
└── utils/                  # 工具和分析
    └── analyze-bundle-size.js      # 包大小分析工具
```

## 🎯 测试分类说明

### 核心功能测试 (core/)
- **test-ai-functionality.js**: 测试AI便签生成功能的完整性和准确性
- **test-integration.js**: 测试各模块间的集成和数据流
- **performance-benchmark.js**: 性能基准测试，监控应用性能指标
- **test-ai-providers.js**: 测试各AI提供商的接口和功能

### 用户界面测试 (ui/)
- **ux-validation.js**: 用户体验验证，测试界面交互和可用性

### 工具和分析 (utils/)
- **analyze-bundle-size.js**: 分析构建包大小，监控代码体积

## 🚀 运行测试

### 在浏览器中运行
```bash
# 启动开发服务器
npm run dev

# 在浏览器控制台中加载测试脚本
# 例如：加载AI功能测试
fetch('/tests/core/test-ai-functionality.js')
  .then(response => response.text())
  .then(code => eval(code));
```

### 使用Node.js运行
```bash
# 运行性能基准测试
node tests/core/performance-benchmark.js

# 运行包大小分析
node tests/utils/analyze-bundle-size.js
```

## 📋 测试清单

在发布新版本前，请确保以下测试通过：

- [ ] AI功能测试 - 验证AI生成功能正常
- [ ] 集成测试 - 验证模块间协作正常
- [ ] 性能测试 - 验证性能指标达标
- [ ] UX测试 - 验证用户体验良好
- [ ] AI提供商测试 - 验证所有AI服务正常

## 🔧 维护说明

1. **添加新测试**: 根据功能类型放入对应目录
2. **删除过时测试**: 定期清理不再需要的测试文件
3. **更新文档**: 添加新测试时更新本README文件
