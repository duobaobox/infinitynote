import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// 初始化全局键盘事件管理器
import { getGlobalKeyboardManager } from "./components/TiptapEditor/core/KeyboardEventManager";

// 在应用启动时初始化键盘管理器
const keyboardManager = getGlobalKeyboardManager();
(window as any).globalKeyboardManager = keyboardManager;

console.log("全局键盘事件管理器已初始化");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
