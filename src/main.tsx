import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

// ============================================================
// 极简入口 - 排除所有缓存清理干扰，直接启动引擎
// ============================================================

// 1. 强制黑色背景（为了你的黑金质感）
if (typeof document !== "undefined") {
  document.documentElement.style.background = "#000";
  document.body.style.background = "#000";
}

// 2. 挂载 React
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}