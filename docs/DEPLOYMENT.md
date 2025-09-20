# InfinityNote2 部署指南

## 📋 目录

1. [环境要求](#环境要求)
2. [本地开发](#本地开发)
3. [生产构建](#生产构建)
4. [部署方案](#部署方案)
5. [性能优化](#性能优化)
6. [监控与维护](#监控与维护)

## 🔧 环境要求

### 基础环境
- **Node.js**: >= 20.19.0
- **npm**: >= 10.0.0 (或 yarn >= 1.22.0)
- **浏览器**: 支持 ES2020+ 的现代浏览器

### 推荐配置
- **内存**: >= 4GB
- **存储**: >= 1GB 可用空间
- **网络**: 稳定的互联网连接（用于AI服务）

## 🚀 本地开发

### 1. 克隆项目
```bash
git clone <repository-url>
cd infinitynote2
```

### 2. 安装依赖
```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 4. 开发工具
```bash
# 类型检查
npm run type-check

# 代码规范检查
npm run lint

# 修复代码规范问题
npm run lint:fix
```

## 🏗️ 生产构建

### 1. 构建应用
```bash
npm run build
```

构建产物将生成在 `dist/` 目录中。

### 2. 预览构建结果
```bash
npm run preview
```

### 3. 构建优化
项目已配置以下优化：

- **代码分割**: 按功能模块自动分割
- **Tree Shaking**: 移除未使用的代码
- **压缩**: JavaScript 和 CSS 压缩
- **缓存**: 文件名包含哈希值，支持长期缓存

## 🌐 部署方案

### 静态网站托管

#### Vercel 部署
1. 连接 GitHub 仓库到 Vercel
2. 配置构建命令：`npm run build`
3. 配置输出目录：`dist`
4. 自动部署完成

#### Netlify 部署
1. 连接 GitHub 仓库到 Netlify
2. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
3. 配置重定向规则（`_redirects` 文件）：
```
/*    /index.html   200
```

#### GitHub Pages 部署
```bash
# 安装 gh-pages
npm install --save-dev gh-pages

# 添加部署脚本到 package.json
"scripts": {
  "deploy": "gh-pages -d dist"
}

# 构建并部署
npm run build
npm run deploy
```

### 服务器部署

#### Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/infinitynote2/dist;
    index index.html;

    # 支持 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Docker 部署
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# 构建镜像
docker build -t infinitynote2 .

# 运行容器
docker run -p 80:80 infinitynote2
```

## ⚡ 性能优化

### 1. 构建优化
- 启用代码分割和懒加载
- 配置合适的 chunk 大小
- 使用 CDN 加速静态资源

### 2. 运行时优化
- 实现虚拟化渲染大量便签
- 使用防抖和节流优化用户交互
- 合理使用 React.memo 和 useMemo

### 3. 网络优化
- 配置 HTTP/2 和 HTTPS
- 启用 Gzip 压缩
- 设置合适的缓存策略

### 4. 监控指标
- **首屏加载时间**: < 2s
- **交互响应时间**: < 100ms
- **内存使用**: < 100MB
- **包大小**: < 3MB

## 📊 监控与维护

### 1. 错误监控
集成错误监控服务（如 Sentry）：

```javascript
// 在 main.tsx 中配置
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

### 2. 性能监控
使用 Web Vitals 监控核心性能指标：

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 3. 日志管理
- 配置结构化日志输出
- 设置不同环境的日志级别
- 定期清理和归档日志

### 4. 备份策略
- 用户数据存储在本地 IndexedDB
- 提供数据导出功能
- 建议用户定期备份重要数据

## 🔒 安全考虑

### 1. API 密钥安全
- 密钥仅存储在客户端
- 使用加密存储敏感信息
- 提供密钥清除功能

### 2. 内容安全
- 实施 CSP (Content Security Policy)
- 防止 XSS 攻击
- 验证用户输入

### 3. HTTPS 部署
- 强制使用 HTTPS
- 配置 HSTS 头
- 使用有效的 SSL 证书

## 🔄 更新与维护

### 1. 版本管理
- 使用语义化版本号
- 维护详细的更新日志
- 提供平滑的升级路径

### 2. 依赖更新
```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update

# 安全审计
npm audit
```

### 3. 数据迁移
- 实现数据库版本管理
- 提供数据迁移脚本
- 保持向后兼容性

## 📞 技术支持

如遇到部署问题，请：

1. 检查环境要求是否满足
2. 查看浏览器控制台错误信息
3. 参考项目 Issues 页面
4. 联系技术支持团队
