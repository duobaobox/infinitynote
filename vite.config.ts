import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Electron 需要使用相对路径
  base: "./",

  // 构建优化配置
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分割代码块，优化加载性能
        manualChunks: {
          // React相关库
          "react-vendor": ["react", "react-dom"],

          // UI组件库
          "ui-vendor": ["antd", "@ant-design/icons"],

          // 编辑器相关
          "editor-vendor": [
            "@tiptap/core",
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-color",
            "@tiptap/extension-text-style",
            "@tiptap/extension-text-align",
            "@tiptap/extension-list-item",
          ],

          // 工具库
          "utils-vendor": ["zustand", "dexie"],

          // 拖拽库
          "dnd-vendor": ["@dnd-kit/core"],

          // Markdown处理（动态导入的会自动分割）
          // 'markdown-vendor': ['markdown-it'] // 已通过动态导入分割
        },

        // 优化chunk文件名
        chunkFileNames: () => {
          return `js/[name]-[hash].js`;
        },

        // 优化入口文件名
        entryFileNames: "js/[name]-[hash].js",

        // 优化资源文件名
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return "assets/[name]-[hash][extname]";

          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },

    // 压缩配置
    minify: "terser",

    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,

    // 启用CSS代码分割
    cssCodeSplit: true,

    // 生成source map（可选，生产环境可关闭）
    sourcemap: false,
  },

  // 开发服务器配置
  server: {
    port: 5173,
    host: true,
    // 代理配置解决CORS问题
    proxy: {
      // 阿里百炼API代理 (OpenAI兼容)
      "/api/alibaba": {
        target: "https://dashscope.aliyuncs.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/alibaba/,
            "/compatible-mode/v1/chat/completions"
          ),
        headers: {
          Origin: "https://dashscope.aliyuncs.com",
        },
      },
      // OpenAI API代理
      "/api/openai": {
        target: "https://api.openai.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/openai/, "/v1/chat/completions"),
        headers: {
          Origin: "https://api.openai.com",
        },
      },
      // Anthropic API代理
      "/api/anthropic": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, "/v1/messages"),
        headers: {
          Origin: "https://api.anthropic.com",
        },
      },
      // SiliconFlow API代理
      "/api/siliconflow": {
        target: "https://api.siliconflow.cn",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/siliconflow/, "/v1/chat/completions"),
        headers: {
          Origin: "https://api.siliconflow.cn",
        },
      },
    },
  },

  // 预构建优化
  optimizeDeps: {
    // 包含需要预构建的依赖
    include: [
      "react",
      "react-dom",
      "antd",
      "@ant-design/icons",
      "zustand",
      "dexie",
    ],

    // 排除不需要预构建的依赖
    exclude: [
      // markdown-it通过动态导入，不需要预构建
      "markdown-it",
    ],
  },
});
