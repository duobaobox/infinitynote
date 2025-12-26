/// <reference types="vite/client" />

// 扩展 Vite 环境变量类型声明
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_DEBUG?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_BASE_URL?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_ANTHROPIC_BASE_URL?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_DEEPSEEK_BASE_URL?: string;
  readonly VITE_ZHIPU_API_KEY?: string;
  readonly VITE_ZHIPU_BASE_URL?: string;
  readonly VITE_QWEN_API_KEY?: string;
  readonly VITE_QWEN_BASE_URL?: string;
  readonly VITE_KIMI_API_KEY?: string;
  readonly VITE_KIMI_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    process?: {
      env: {
        NODE_ENV: string;
      };
    };
  }
  
  // 声明 import.meta 类型
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// 为 process.env 定义类型
declare var process: {
  env: {
    NODE_ENV: string;
  };
};

export {};

