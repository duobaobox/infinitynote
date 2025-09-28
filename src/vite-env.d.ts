/// <reference types="vite/client" />

declare global {
  interface Window {
    process?: {
      env: {
        NODE_ENV: string;
      };
    };
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
